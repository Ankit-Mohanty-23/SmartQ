import express from "express";
import * as doctorController from "../controllers/doctor.controller.js";
import { updateDoctorSchema } from "../validations/doctor.validate.js";
import { validate } from "../middlewares/validate.middleware.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", auth, doctorController.getAllDoctors);

router.get("/:doctorProfileId", auth, doctorController.getDoctorById);

router.put(
  "/:doctorProfileId",
  validate(updateDoctorSchema),
  doctorController.updateDoctor,
);

export default router;
