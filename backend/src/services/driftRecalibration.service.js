import prisma from '../db/index.js';
import { emit } from '../services/websocketService.js';

async function recalibrateAfterDrift(completedToken) {
  const { id, doctorId, appointmentDate, tokenNumber, estimatedEndTime, actualEndTime } = completedToken;

  const delayMs = new Date(actualEndTime).getTime() - new Date(estimatedEndTime).getTime();
  const delayMinutes = delayMs / 60000;

  if (delayMinutes <= 0) {
    await prisma.queue.update({
      where: { id },
      data: { isDrifting: false },
    });
    return;
  }

  const waitingTokens = await prisma.queue.findMany({
    where: {
      doctorId,
      appointmentDate,
      status: 'WAITING',
      tokenNumber: { gt: tokenNumber },
    },
    select: { id: true, tokenNumber: true, estimatedStartTime: true, estimatedEndTime: true },
    orderBy: { tokenNumber: 'asc' },
  });

  await prisma.$transaction([
    ...waitingTokens.map((t) =>
      prisma.queue.update({
        where: { id: t.id },
        data: {
          estimatedStartTime: new Date(t.estimatedStartTime.getTime() + delayMs),
          estimatedEndTime: new Date(t.estimatedEndTime.getTime() + delayMs),
        },
      })
    ),
    prisma.queue.update({
      where: { id },
      data: { isDrifting: false },
    }),
  ]);

  emit('drift_resolved', {
    doctorId,
    appointmentDate,
    delayMinutes: Math.round(delayMinutes),
    affectedTokens: waitingTokens.map((t) => ({
      tokenId: t.id,
      tokenNumber: t.tokenNumber,
      newEstimatedStart: new Date(t.estimatedStartTime.getTime() + delayMs),
      newEstimatedEnd: new Date(t.estimatedEndTime.getTime() + delayMs),
    })),
  });
}

export { recalibrateAfterDrift };