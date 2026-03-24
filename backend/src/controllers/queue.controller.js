import { predictDuration } from "../services/ml.service.js";
import * as queueService from "../services/queue.service.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @desc    Create Queue
 * @route   GET /api/v1/patient
 * @access  Private
 */

export const createQueue = asyncHandler(async (req, res) => {
  const {
    doctorId,
    appointmentDate,
    patientName,
    patientAgeGroup,
    visitType,
    patientPhone,
    patientAge,
    patientGender,
    weatherCondition,
  } = req.body;

  const queue = await queueService.bookTokenService({
    doctorId,
    appointmentDate,
    patientName,
    patientAgeGroup,
    visitType,
    patientPhone,
    patientAge,
    patientGender,
    weatherCondition: weatherCondition ?? "UNKNOWN",
  });

  res.status(201).json({
    success: true,
    data: queue,
  });
});

/**
 * @desc    mark Queue In Progress 
 * @route   GET /api/v1/queue/:id
 * @access  Private
 */

export const markQueueInProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const queue = await queueService.markInProgressService(id);

  res.status(200).json({
    success: true,
    data: queue,
  });
});

/**
 * @desc    mark Queue Completed 
 * @route   GET /api/v1/queue/:id
 * @access  Private
 */

export const markQueueCompleted = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const queue = await queueService.markCompleteService(id);

  res.status(200).json({
    success: true,
    data: queue,
  });
});

/**
 * @desc    Get Doctor Queue By Date
 * @route   GET /api/v1/queue/:doctorId/track
 * @access  Private
 */

export const getDoctorQueue = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  if (!date) {
    throw new AppError("Date query param required", 400);
  }

  const queues = await queueService.getQueueService(doctorId, date);

  res.status(200).json({
    status: "success",
    results: queues.length,
    data: queues,
  });
});

/**
 * @desc    Get patient data
 * @route   GET /api/v1/queue/:tokenId
 * @access  Public
 */

export const getPatientView = asyncHandler(async (req, res) => {
  const { tokenId } = req.params;

  const result = await queueService.getPatientViewService({ tokenId });

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
  const phone = req.body;

  const cancelled = await queueService.cancelQueueService(id, phone);

  res.status(200).json({
    status: "success",
    data: cancelled,
  });
});
