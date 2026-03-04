import { predictConsultationDuration } from "../services/ml.service.js";
import * as queueService from "../services/queue.service.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * @desc    Create Queue
 * @route   GET /api/v1/patient
 * @access  Private
 */

export const createQueue = asyncHandler(async (req, res) => {
  const { patientId, doctorId, visitDate } = req.body;

  let predictedDuration = null;

  if (process.env.ENABLE_ML === "true") {
    predictedDuration = await predictConsultationDuration({
      doctorId,
      visitDate,
    });
  }

  const queue = await queueService.createQueueService({
    patientId,
    doctorId,
    visitDate,
    predictedDuration,
  });

  res.status(201).json({
    success: true,
    data: queue,
  });
});

/**
 * @desc    Get Queue By ID
 * @route   GET /api/v1/patient/:id
 * @access  Private
 */

export const getQueueById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const queue = await queueService.getQueueByIdService(id);

  res.status(200).json({
    success: true,
    data: queue,
  });
});

/**
 * @desc    Get Doctor Queue By Date
 * @route   GET /api/v1/queue/:doctorId
 * @access  Private
 */

export const getDoctorQueue = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  if (!date) {
    throw new AppError("Date query param required", 400);
  }

  const queues = await getDoctorQueueService(doctorId, date);

  res.status(200).json({
    status: "success",
    results: queues.length,
    data: queues,
  });
});

/**
 * @desc    Update Queue Status
 * @route   GET /api/v1/queue/:id/status
 * @access  Private
 */

export const updateQueueStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const updated = await updateQueueStatusService(id, status);

  res.status(200).json({
    status: "success",
    data: updated,
  });
});

/**
 * @desc    Track Queue
 * @route   GET /api/v1/queue/track
 * @access  Public
 */

export const trackQueue = asyncHandler(async (req, res) => {
  const { doctorId, tokenNumber, visitDate } = req.query;

  const result = await trackQueueService({
    doctorId,
    tokenNumber: Number(tokenNumber),
    visitDate,
  });

  res.status(200).json({
    status: "success",
    data: result,
  });
});

/**
 * @desc    Cancel Queue
 * @route   GET /api/v1/queue/:id/cancel
 * @access  Private
 */

export const cancelQueue = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const cancelled = await cancelQueueService(id);

  res.status(200).json({
    status: "success",
    data: cancelled,
  });
});
