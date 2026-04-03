import redis from "../config/redis.js";
import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";

/**
 * Key Generators for Redis
 */
const getQueueKey = (doctorId, date) => `queue:active:${doctorId}:${date}`;
const getTokenKey = (tokenId) => `token:${tokenId}`;
const getServingKey = (doctorId, date) => `serving:${doctorId}:${date}`;

/**
 * Get TTL (Midnight + 6 hours)
 */
function getExpireAt(dateStr) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(6, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

/**
 * Push a token to Redis (ZSET + HASH)
 */
export async function pushToken(token) {
  const qKey = getQueueKey(
    token.doctorProfileId,
    token.appointmentDate.toISOString().split("T")[0],
  );
  const tKey = getTokenKey(token.id);
  const expireAt = getExpireAt(
    token.appointmentDate.toISOString().split("T")[0],
  );

  const pipeline = redis.pipeline();

  // Add to Sorted Set (Score = Token Number)
  pipeline.zadd(qKey, token.tokenNumber, token.id);

  // Store metadata in Hash
  const hashData = {
    id: token.id,
    tokenNumber: token.tokenNumber.toString(),
    status: token.status,
    estimatedStartTime: token.estimatedStartTime.toISOString(),
    estimatedEndTime: token.estimatedEndTime.toISOString(),
    predictedDurationMinutes: token.predictedDurationMinutes.toString(),
    patientName: token.patientName,
    patientPhone: token.patientPhone,
    visitType: token.visitType,
    doctorProfileId: token.doctorProfileId,
    appointmentDate: token.appointmentDate.toISOString().split("T")[0],
  };

  pipeline.hset(tKey, hashData);

  // Set Expiration
  pipeline.expireat(qKey, expireAt);
  pipeline.expireat(tKey, expireAt);

  await pipeline.exec();
}

/**
 * Remove a token (Complete/Cancel)
 */
export async function removeToken(doctorId, date, tokenId) {
  const qKey = getQueueKey(doctorId, date);
  const tKey = getTokenKey(tokenId);

  const pipeline = redis.pipeline();
  pipeline.zrem(qKey, tokenId);
  pipeline.del(tKey);
  await pipeline.exec();
}

/**
 * Set current IN_PROGRESS token
 */
export async function setServing(doctorId, date, tokenNumber) {
  const sKey = getServingKey(doctorId, date);
  const expireAt = getExpireAt(date);
  await redis.set(sKey, tokenNumber, "EXPIREAT", expireAt);
}

/**
 * Clear serving token
 */
export async function clearServing(doctorId, date) {
  await redis.del(getServingKey(doctorId, date));
}

/**
 * Recompute the entire queue cascade in Redis
 * This is the professional "Secret Sauce" for performance
 */
export async function recomputeCascade(doctorId, date, startFromTime) {
  const qKey = getQueueKey(doctorId, date);
  const tokenIds = await redis.zrange(qKey, 0, -1);

  let runningTime = new Date(startFromTime);
  const pipeline = redis.pipeline();
  const dbUpdates = [];

  for (const tokenId of tokenIds) {
    const tKey = getTokenKey(tokenId);
    const token = await redis.hgetall(tKey);

    if (!token || Object.keys(token).length === 0) continue;

    // Skip updating times for IN_PROGRESS tokens, but advance runningTime
    if (token.status === "IN_PROGRESS") {
      runningTime = new Date(token.estimatedEndTime);
      continue;
    }

    const newStart = new Date(runningTime);
    const durationMs = parseFloat(token.predictedDurationMinutes) * 60000;
    const newEnd = new Date(newStart.getTime() + durationMs);

    // Update Redis
    pipeline.hset(tKey, {
      estimatedStartTime: newStart.toISOString(),
      estimatedEndTime: newEnd.toISOString(),
    });

    // Prepare for background DB sync
    dbUpdates.push({
      id: tokenId,
      estimatedStartTime: newStart,
      estimatedEndTime: newEnd,
    });

    runningTime = newEnd;
  }

  await pipeline.exec();

  // Background DB Sync (Non-blocking)
  if (dbUpdates.length > 0) {
    syncToDB(dbUpdates).catch((err) =>
      logger.warn(
        `[REDIS] Background sync failed | Action: syncToDB | Error: ${err.message}`,
      ),
    );
  }
}

/**
 * Background DB Sync
 */
async function syncToDB(updates) {
  await prisma.$transaction(
    updates.map((u) =>
      prisma.queue.update({
        where: { id: u.id },
        data: {
          estimatedStartTime: u.estimatedStartTime,
          estimatedEndTime: u.estimatedEndTime,
        },
      }),
    ),
  );
}

/**
 * Hydrate Redis from DB (Cold start recovery)
 */
export async function hydrateFromDB(doctorId, date) {
  const tokens = await prisma.queue.findMany({
    where: {
      doctorProfileId: doctorId,
      appointmentDate: new Date(date),
      status: { in: ["WAITING", "IN_PROGRESS"] },
    },
    orderBy: { tokenNumber: "asc" },
  });

  if (tokens.length === 0) return [];

  for (const token of tokens) {
    await pushToken(token);
    if (token.status === "IN_PROGRESS") {
      await setServing(doctorId, date, token.tokenNumber);
    }
  }

  logger.info(
    `[REDIS] Hydrated tokens | Doctor: ${doctorId} | Count: ${tokens.length} | Date: ${date}`,
  );
  return tokens;
}

/**
 * Get Live Queue from Redis
 */
export async function getLiveQueue(doctorId, date) {
  const qKey = getQueueKey(doctorId, date);
  const tokenIds = await redis.zrange(qKey, 0, -1);

  if (tokenIds.length === 0) return null;

  const pipeline = redis.pipeline();
  tokenIds.forEach((id) => pipeline.hgetall(getTokenKey(id)));
  const results = await pipeline.exec();

  return results
    .map(([err, data]) => data)
    .filter((d) => d && Object.keys(d).length > 0);
}

/**
 * Get Token Data
 */
export async function getTokenData(tokenId) {
  const data = await redis.hgetall(getTokenKey(tokenId));
  return Object.keys(data).length > 0 ? data : null;
}
