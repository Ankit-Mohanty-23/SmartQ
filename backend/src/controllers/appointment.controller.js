import * as appointmentService from "../services/appointment.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @desc    Create Appointment
 * @route   POST /api/v1/appointments
 * @access  Public
 */

export const createAppointment = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    patientAge,
    patientGender,
    problem,
    visitType,
    preferredDate,
  } = req.body;

  const appointment = await appointmentService.createAppointmentService({
    name,
    phone,
    problem,
    visitType,
    patientAge,
    patientGender,
    preferredDate,
  });

  res.status(201).json({
    success: true,
    data: appointment,
  });
});

/**
 * @desc    List all Appointments
 * @route   GET /api/appointments?
 *              status=PENDING&
 *              preferredDate=2026-03-15&
 *              assignedDoctorId=uuid-here
 * @access  Private
 */

export const listAppointment = asyncHandler(async (req, res) => {
  const { status, preferredDate, assignedDoctorId } = req.query;

  const appointments = await appointmentService.listAppointmentService({
    status,
    preferredDate,
    assignedDoctorId,
  });

  res.status(200).json({
    success: true,
    data: appointments,
  });
});

/**
 * @desc    Get Appointment Detail
 * @route   PATCH /api/appointments/:appointmentId/info
 * @access  Private
 */

export const appointmentInfo = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment =
    await appointmentService.appointmentInfoService(appointmentId);

  res.status(200).json({
    success: true,
    data: appointment,
  });
});

/**
 * @desc    Convert appointment to token
 * @route   PUT /api/v1/appointments/convert
 * @access  Private
 */

export const handleConvertToToken = asyncHandler(async (req, res) => {
  const { doctorProfileId, appointmentId } = req.body;

  const result = await appointmentService.convertAppointmentService(
    req.user.id,
    appointmentId,
    doctorProfileId,
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @desc    Reject Appointment request
 * @route   PATCH /api/v1/appointments/:appointmentId/reject
 * @access  Private
 */

export const handleRejectAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment =
    await appointmentService.rejectAppointmentService(appointmentId);

  res.status(200).json({
    success: true,
    data: appointment,
  });
});

/**
 * @desc    Cancel Appointment request
 * @route   PATCH /api/v1/appointments/:appointmentId/cancel
 * @access  Private
 */

export const handleCancelAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await appointmentService.cancelAppointment(appointmentId);

  res.status(200).json({
    success: true,
    data: appointment,
  });
});
