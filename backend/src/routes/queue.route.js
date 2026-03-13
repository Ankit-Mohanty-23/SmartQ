import { Router } from "express";
import * as queueController from "../controllers/queue.controller.js";
import auth from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createQueueSchema,
  updateQueueStatusSchema,
  trackQueueSchema,
} from "../validations/queue.validate.js";

const router = Router();

/**
 * Staff Protected Routes
 */
router.post(
  "/",
  auth,
  validate(createQueueSchema),
  queueController.createQueue,
);

router.patch("/:id/ongoing", auth, queueController.markQueueInProgress);

router.patch("/:id/complete", auth, queueController.markQueueCompleted);

router.get("/:doctorId/track", auth, queueController.getDoctorQueue);

router.patch("/:id/cancel", auth, queueController.cancelQueue);

/**
 * Public Route
 */

router.get("/:tokenId/patient", auth, queueController.getPatientView);

export default router;
