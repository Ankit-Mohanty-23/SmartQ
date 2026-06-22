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
    let fallback = null;

    for (const name of Object.keys(interfaces)) {
        // Skip virtual interfaces (WSL, Hyper-V, VirtualBox, VMware, etc.)
        const isVirtual = name.toLowerCase().includes("wsl") || 
                          name.toLowerCase().includes("vethernet") || 
                          name.toLowerCase().includes("virtual") || 
                          name.toLowerCase().includes("vmware") || 
                          name.toLowerCase().includes("virtualbox") || 
                          name.toLowerCase().includes("vbox");

        if (isVirtual) continue;

        for (const iface of interfaces[name]) {
            if (iface.family !== "IPv4" || iface.internal) continue;

            const ip = iface.address;
            // Skip known VPN/tunnel subnets (Cloudflare WARP, Tailscale, etc.)
            const isVPN = ip.startsWith("10.2.") || ip.startsWith("100.");

            if (!isVPN) {
                return ip; // Return first real LAN IP found
            }

            if (!fallback) fallback = ip; // Keep VPN as last resort
        }
    }

    return fallback || "localhost";
};

async function startServer(){
    try{
        connectDB();

        const server = app.listen(PORT, "0.0.0.0", () => {
            const localIP = getLocalIP();
            logger.info(`[SERVER] Startup successful | Environment: ${env.NODE_ENV}`);
            logger.info(`[SERVER] Local Access: http://localhost:${PORT}/api/v1/health`);
            logger.info(`[SERVER] LAN Access: http://${localIP}:${PORT}/api/v1/health`);
            
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