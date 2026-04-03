import Redis from "ioredis";
import logger from "../utils/logger.js";

/**
 * Configure Redis client with professional retry strategy
 */
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) {
      logger.error(
        "[REDIS] Max connection retries exceeded | Mode: Fallback to DB",
      );
      return null; // Stop retrying and return null to signal error
    }
    const delay = Math.min(times * 100, 2000);
    logger.warn(
      `[REDIS] Connection attempt ${times} failed | Retrying in ${delay}ms`,
    );
    return delay;
  },
  reconnectOnError(err) {
    const targetErrors = ["READONLY"]; // Recover from cluster failovers
    if (targetErrors.some((e) => err.message.includes(e))) return true;
    return false;
  },
});

redis.on("connect", () => {
  logger.info("[REDIS] Client established | Status: Connected");
});

redis.on("error", (err) => {
  logger.error(`[REDIS] Connection error | Details: ${err.message}`);
});

redis.on("reconnecting", () => {
  logger.warn("[REDIS] Connection lost | Status: Reconnecting");
});

export default redis;
