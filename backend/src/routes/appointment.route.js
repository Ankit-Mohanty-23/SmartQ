import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createAppointmentSchema,
  listAppointmentsSchema,
  assignAndConvertSchema,
} from "../validations/appointment.validate.js";
import * as appointmentController from "../controllers/appointment.controller.js";

const router = Router();

router.post(
  "/",
  validate(createAppointmentSchema),
  appointmentController.createAppointment,
);

router.get(
  "/",
  auth,
  validate(listAppointmentsSchema),
  appointmentController.listAppointment,
);

router.get("/", auth, appointmentController.appointmentInfo);

router.put(
  "/convert",
  auth,
  validate(assignAndConvertSchema),
  appointmentController.handleConvertToToken,
);

router.patch(
  "/:appointmentId/reject",
  auth,
  appointmentController.handleRejectAppointment,
);

router.patch(
  "/:appointmentId/cancel",
  auth,
  appointmentController.handleCancelAppointment,
);

export default router;
