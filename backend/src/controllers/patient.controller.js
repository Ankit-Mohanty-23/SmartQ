import * as patientService from "../services/patient.service.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const registerPatients = asyncHandler(async (req, res) => {
    const patient = await patientService.createPatientService(req.body);

    res.status(201).json({
        success: true,
        data: patient,
    });
});

export const getAllPatient = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await patientService.getAllPatientsService(page, limit);

    res.status(200).json({
        success: true,
        data: result,
    });
});

export const getPatientById = asyncHandler(async(req, res) =>{
    const patient = await patientService.getPatientByIdService(req.params.id);

    if(!patient){
        throw new AppError("Patient not found", 404);
    }

    res.status(200).json({
        success: true,
        data: patient,
    });
});

export const updatePatient = asyncHandler(async(req, res) => {
    const patient = await patientService.updatePatientService(
        req.params,
        req.body,
    );

    res.status(200).json({
        status: "success",
        data: patient,
      });
})