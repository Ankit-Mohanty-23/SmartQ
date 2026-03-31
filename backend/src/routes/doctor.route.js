import express from "express";
import * as doctorController from "../controllers/doctor.controller.js";
import { updateDoctorSchema } from "../validations/doctor.validate.js";
import { validate } from "../middlewares/validate.middleware.js";
import { auth, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(auth);

router.get("/:doctorProfileId", doctorController.getDoctorById);
router.get(
  "/",
  restrictTo("ADMIN", "RECEPTIONIST"),
  doctorController.getAllDoctors,
);
router.put(
  "/:doctorProfileId",
  restrictTo("ADMIN"),
  validate(updateDoctorSchema),
  doctorController.updateDoctor,
);

export default router;
