import { Router } from "express";
import * as patientController from "../controllers/patient.controller.js";
import * as patientValidator from "../validations/patient.validate.js";
import { validate } from "../middlewares/validate.middleware.js";
import auth from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/",
  auth,
  validate(patientValidator.createPatientSchema),
  patientController.registerPatients,
);

router.get("/", auth, patientController.getAllPatient);

router.get("/:id", auth, patientController.getPatientById);

router.put(
  "/:id",
  auth,
  validate(patientValidator.updatePatientSchema),
  patientController.updatePatient,
);

export default router;
