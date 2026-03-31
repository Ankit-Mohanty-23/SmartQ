import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  WEATHER_API_KEY: process.env.WEATHER_API_KEY,
  HOSPITAL_CITY: process.env.HOSPITAL_CITY || "Bhubaneswar",
};
