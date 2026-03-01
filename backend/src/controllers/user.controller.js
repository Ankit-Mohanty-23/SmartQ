import * as userService from "../services/user.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @desc    Register hospital staff
 * @route   POST /api/v1/auth/register
 * @access  Public (or ADMIN controlled later)
 */

export const registerUser = asyncHandler(async (req, res) => {
  const user = await userService.registerUserService(req.body);

  res.status(201).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Login hospital staff
 * @route   POST /api/v1/auth/login
 * @access  Public
 */

export const loginUser = asyncHandler(async (req, res) => {
  const result = await userService.loginUserService(req.body);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @desc    Get logged-in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */

export const getCurrentUser = async (req, res, next) => {
  const user = await userService.getCurrentUserService(req.user?.id);

  res.status(200).json({
    success: true,
    data: user,
  });
};
