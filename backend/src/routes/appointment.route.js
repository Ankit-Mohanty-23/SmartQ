import { Router } from "express";
import { auth, restrictTo } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as appointmentController from "../controllers/appointment.controller.js";
import * as appointmentValidation from "../validations/appointment.validate.js";

const router = Router();

// public
router.post(
  "/",
  validate(appointmentValidation.createAppointmentSchema),
  appointmentController.createAppointment,
);
router.patch("/:id/cancel", appointmentController.handleCancelAppointment);

router.use(auth);
router.use(restrictTo("ADMIN", "RECEPTIONIST"));

router.get(
  "/",
  validate(appointmentValidation.listAppointmentsSchema),
  appointmentController.listAppointment,
);
router.patch("/:id/assign", appointmentController.appointmentInfo);
router.put(
  "/convert",
  validate(appointmentValidation.assignAndConvertSchema),
  appointmentController.handleConvertToToken,
);
router.patch("/:id/reject", appointmentController.handleRejectAppointment);

export default router;
