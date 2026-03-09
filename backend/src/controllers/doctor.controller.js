import * as doctorService from "../services/doctor.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @desc    Get All Doctors
 * @route   GET /api/v1/doctors
 * @access  Public
 */

export const getAllDoctors = asyncHandler(async (req, res) => {
  const doctors = await doctorService.getAllDoctorService();

  res.status(200).json({
    success: true,
    data: doctors,
  });
});

/**
 * @desc    Get Doctor Details by Id
 * @route   GET /api/v1/doctors/:id
 * @access  Public
 */

export const getDoctorById = asyncHandler(async (req, res) => {
  const { doctorProfileId } = req.params;

  const doctor = await doctorService.getDoctorByIdService(doctorProfileId);

  res.status(200).json({
    success: true,
    data: doctor,
  });
});

/**
 * @desc    Update Doctor Details by Id
 * @route   PUT /api/v1/doctors/:id
 * @access  Public
 */

export const updateDoctor = asyncHandler(async (req, res) => {
  const { doctorProfileId } = req.params;

  const doctor = await doctorService.updateDoctorService(
    doctorProfileId,
    req.body,
  );

  res.status(200).json({
    success: true,
    data: doctor,
  });
});
