import app from "./src/app.js";
import { env } from "./src/config/env.js";
import logger from "./src/utils/logger.js";
import connectDB from "./src/config/db.js";
import { registerDriftDetectorJob } from "./src/jobs/driftDetector.job.js";
import { healthCheck } from "./src/services/ml.service.js";

const PORT = env.PORT || 5000;

async function startServer(){
    try{
        connectDB();

        app.listen(PORT, () => {
            logger.info(`[SERVER] Startup successful | Environment: ${env.NODE_ENV} | Port: ${PORT}`);
            registerDriftDetectorJob();
            healthCheck();
            logger.info("[JOB] Drift Detector Job registered successfully");
        });
        
    }catch(error){
        logger.error(`[SERVER] Startup failure | Error: ${error?.message ?? String(error)}`);
        if (error?.stack) logger.error(error.stack);
    }
}

startServer();