import * as settingService from "../services/setting.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { z } from "zod";

const updateSettingsSchema = z.object({
  driftThreshold: z.coerce.number().min(0.05).max(1).optional(),
  outlierMultiplier: z.coerce.number().min(1).max(10).optional(),
  earlyWarningMinutes: z.coerce.number().int().min(1).max(120).optional(),
  driftCorrectionThreshold: z.coerce.number().int().min(1).max(60).optional(),
  earlyWarningSmsTemplate: z.string().min(10).optional(),
  driftSmsTemplate: z.string().min(10).optional(),
  mlTimeout: z.coerce.number().int().min(100).max(5000).optional(),
});

const holidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

async function getSettingsHandler(req, res) {
  const settings = await settingService.getSettingValuesService();
  res.json(settings ?? {});
}

async function updateSettingsHandler(req, res) {
  const parsed = updateSettingsSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  if (Object.keys(parsed.data).length === 0)
    return res.status(422).json({ error: "No valid fields provided" });

  const settings = await settingService.updateSettingsService(parsed.data);
  res.json(settings);
}

export const addHolidayHandler = asyncHandler(async (req, res) => {
  const parsed = holidaySchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(422).json({
      errors: parsed.error.flatten().fieldErrors,
    });
  try {
    const settings = await settingService.addHolidayService(parsed.data.date);
    res.status(201).json({
      holidays: settings.holidays,
    });
  } catch (err) {
    if (err.code === "HOLIDAY_EXISTS") {
      throw new AppError("Holiday already exists for this date", 409);
    }
    throw err;
  }
});

export const removeHolidayHandler = asyncHandler(async (req, res) => {
  const { date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(422).json({ error: "Date must be YYYY-MM-DD" });

  try {
    const settings = await settingService.removeHolidayService(date);
    res.json({ holidays: settings.holidays });
  } catch (err) {
    if (err.code === "HOLIDAY_NOT_FOUND")
      return res.status(404).json({ error: "Holiday not found" });
    throw err;
  }
});
