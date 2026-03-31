import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import * as userValidator from "../validations/user.validate.js";
import { validate } from "../middlewares/validate.middleware.js";
import { auth, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/login",
  validate(userValidator.loginUserSchema),
  userController.loginUser,
);

router.use(auth);

router.get("/me", userController.getCurrentUser);
router.post("/logout", userController.userLogout);

router.use(restrictTo("ADMIN"));

router.post(
  "/register",
  validate(userValidator.registerUserSchema),
  userController.registerUser,
);
router.get(
  "/",
  validate(userValidator.getAllUsersSchema),
  userController.getAllUsers,
);
router.put(
  "/:id",
  validate(userValidator.updateUserSchema),
  userController.updateUser,
);
router.patch(
  "/:id/deactivate",
  validate(userValidator.deactivateUserSchema),
  userController.deactivateUser,
);

export default router;
