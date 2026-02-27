import app from "./src/app.js";
import { env } from "./src/config/env.js";
import logger from "./src/utils/logger.js";
import connectDB from "./src/config/db.js";

const PORT = env.PORT || 5000;

async function startServer(){
    try{
        connectDB();

        app.listen(PORT, () => {
            logger.info(`Server running in port: ${PORT}`);
        });
        
    }catch(error){
        logger.error(`❌ Database connection failed: ${error?.message ?? String(error)}`);
        if (error?.stack) logger.error(error.stack);
    }
}

startServer();