import * as userService from "../services/user.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @desc    Register hospital staff
 * @route   POST /api/v1/users/register
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
 * @route   POST /api/v1/users/login
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
 * @route   GET /api/v1/users/me
 * @access  Private
 */

export const getCurrentUser = async (req, res) => {
  const user = await userService.getCurrentUserService(req.user?.id);

  res.status(200).json({
    success: true,
    data: user,
  });
};


/**
 * @desc    User logout
 * @route   POST /api/v1/users/logout
 * @access  Public
 */

export const userLogout = asyncHandler(async(req, res) => {
  const logout = await userLogoutService();

  res.clearCookie("token");

  res.status(200).json({
    success: logout.success,
    message: logout.message
  });
});

/**
 * @desc    Get All Users Service
 * @route   POST /api/v1/users
 * @access  Public
 */

export const getAllUsers = asyncHandler( async(req, res) => {
  const users = await userService.getAllUsersService(req.query);

  res.status(200).json({
    success: true,
    data: users
  });
});

/**
 * @desc    Update User Service
 * @route   POST /api/v1/users/:id
 * @access  Public
 */

export const updateUser = asyncHandler( async(req, res) => {
  const user = await userService.updateUserService(req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Deactivate User Service
 * @route   POST /api/v1/users/:id/deactivate
 * @access  Public
 */

export const deactivateUser = asyncHandler( async(req, res) => {
  const userId = req.params.id;
  const user = await userService.deactivateUserService(userId);

  res.status(200).json({
    success: true,
    data: user,
  });
})
