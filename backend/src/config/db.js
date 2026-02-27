import prisma from "./prisma.js";
import logger from "../utils/logger.js";

export default async function connectDB(){
    try{
        await prisma.$connect();
        logger.info("Database is connected via prisma.")
    }catch(error){
        logger.error("❌ Database connection failed:", error.message);
        process.exit(1);
    }
}
