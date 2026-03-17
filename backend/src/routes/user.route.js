import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import * as userValidator from "../validations/user.validate.js";
import { validate } from "../middlewares/validate.middleware.js";
import auth from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/register",
  validate(userValidator.registerUserSchema),
  userController.registerUser,
);
router.post(
  "/login",
  validate(userValidator.loginUserSchema),
  userController.loginUser,
);
router.get("/me", auth, userController.getCurrentUser);
router.get("/logout", auth, userController.userLogout);
router.get(
  "/",
  auth,
  validate(userValidator.getAllUsersSchema),
  userController.getAllUsers,
);
router.put(
  "/:id",
  auth,
  validate(userValidator.updateUserSchema),
  userController.updateUser,
);
router.patch(
  "/:id/deactivate",
  auth,
  validate(userValidator.deactivateUserSchema),
  userController.deactivateUser,
);

export default router;
