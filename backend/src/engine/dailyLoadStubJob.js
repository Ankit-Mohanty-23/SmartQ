import cron from "node-cron";
import createDailyLoadStubs from "./daillyLoadRegister.js";
import logger from "../utils/logger.js";

export default function startDailyLoadStubJob() {
  cron.schedule("1 0 * * *", async () => {
    logger.info("[ENGINE] DailyLoadHistory cycle started | Task: Create stubs");

    try {
      await createDailyLoadStubs();
      logger.info(
        "[ENGINE] DailyLoadHistory cycle completed | Task: Create stubs",
      );
    } catch (err) {
      logger.error(
        `[ENGINE] DailyLoadHistory cycle failure | Task: Create stubs | Error: ${err.message}`,
      );
    }
  });
}
