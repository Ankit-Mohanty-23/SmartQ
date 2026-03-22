import cron from "node-cron";
import createDailyLoadStubs from "./daillyLoadRegister.js";
import logger from "../utils/logger.js";

export default function startDailyLoadStubJob() {
  cron.schedule("1 0 * * *", async () => {
    logger.info("[dailyLoadStubJob] Creating DailyLoadHistory stubs for today");

    try {
      await createDailyLoadStubs();
      logger.info("[dailyLoadStubJob] Done");
    } catch (err) {
      logger.error("[dailyLoadStubJob] Failed:", err);
    }
  });
}
