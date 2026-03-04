import { Router } from "express";
import * as queueController from "../controllers/queue.controller.js";
import auth from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createQueueSchema,
  updateQueueStatusSchema,
  trackQueueSchema,
} from "../validations/queue.validate.js";

const router = Router;

/**
 * Staff Protected Routes
 */
router.post(
  "/",
  auth,
  validate(createQueueSchema),
  queueController.createQueue,
);

router.get("/:id", auth, queueController.getQueueById);

router.get("/doctor/:doctorId", auth, queueController.getDoctorQueue);

router.patch(
  "/:id/status",
  auth,
  validate(updateQueueStatusSchema),
  queueController.updateQueueStatus,
);

router.patch("/:id/cancel", auth, queueController.cancelQueue);

/**
 * Public Route
 */
router.get("/track", validate(trackQueueSchema), queueController.trackQueue);

export default router;
