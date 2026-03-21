import { Router } from "express";
import {
  getSettingsHandler,
  updateSettingsHandler,
  addHolidayHandler,
  removeHolidayHandler,
} from "../controllers/settingsController.js";
import { restrictTo, auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);
router.use(restrictTo("ADMIN"));

router.get("/", getSettingsHandler);
router.put("/", updateSettingsHandler);
router.post("/holidays", addHolidayHandler);
router.delete("/holidays/:date", removeHolidayHandler);

export default router;
