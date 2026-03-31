import { Router } from "express";
import * as queueController from "../controllers/queue.controller.js";
import { auth, restrictTo } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as queueValidatation from "../validations/queue.validate.js";

const router = Router();

router.get(
  "/:tokenId/patient",
  validate(queueValidatation.trackQueueSchema),
  queueController.getPatientView,
);
router.patch(
  "/:id/cancel",
  queueController.cancelQueue,
);

router.use(auth);

router.get(
  "/:doctorId/track",
  restrictTo("ADMIN", "RECEPTIONIST", "DOCTOR"),
  queueController.getDoctorQueue,
);
router.post(
  "/",
  restrictTo("ADMIN", "RECEPTIONIST"),
  validate(queueValidatation.createQueueSchema),
  queueController.createQueue,
);
router.patch(
  "/:id/ongoing",
  restrictTo("ADMIN", "DOCTOR"),
  queueController.markQueueInProgress,
);
router.patch(
  "/:id/complete",
  restrictTo("ADMIN", "DOCTOR"),
  queueController.markQueueCompleted,
);

export default router;
