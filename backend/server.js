import os from "os";
import app from "./src/app.js";
import { env } from "./src/config/env.js";
import logger from "./src/utils/logger.js";
import connectDB from "./src/config/db.js";
import { registerDriftDetectorJob } from "./src/jobs/driftDetector.job.js";
import { healthCheck } from "./src/services/ml.service.js";

const PORT = env.PORT || 5000;

/**
 * Get Local IP Address for LAN exposure
 */
const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "localhost";
};

async function startServer(){
    try{
        connectDB();

        const server = app.listen(PORT, "0.0.0.0", () => {
            const localIP = getLocalIP();
            logger.info(`[SERVER] Startup successful | Environment: ${env.NODE_ENV}`);
            logger.info(`[SERVER] Local Access: http://localhost:${PORT}/api/v1/health`);
            logger.info(`[SERVER] LAN Access:   http://${localIP}:${PORT}/api/v1/health`);
            
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