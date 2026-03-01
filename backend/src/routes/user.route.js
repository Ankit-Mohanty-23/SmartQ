import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import * as userValidator from "../validations/user.validate.js";
import { validate } from "../middlewares/validate.middleware.js";
import auth from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route   POST /api/v1/user/register
 * @desc    Register hospital staff
 * @access  Public (Can restrict to ADMIN later)
 */
router.post(
  "/register",
  validate(userValidator.registerUserSchema),
  userController.registerUser,
);

/**
 * @route   POST /api/v1/user/login
 * @desc    Login hospital staff
 * @access  Public
 */
router.post(
  "/login",
  validate(userValidator.loginUserSchema),
  userController.loginUser,
);

/**
 * @route   GET /api/v1/user/me
 * @desc    Get current logged-in user
 * @access  Private
 */
router.get("/me", auth, userController.getCurrentUser);

export default router;
