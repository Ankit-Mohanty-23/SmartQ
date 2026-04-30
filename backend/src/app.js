import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import globalErrorHandler from "../src/middlewares/error.middleware.js";
import logger from "./utils/logger.js";
import userRoutes from "./routes/user.route.js";
import doctorRoutes from "./routes/doctor.route.js";
import queueRoutes from "./routes/queue.route.js";
import queueAppointment from "./routes/appointment.route.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:5000"];
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(
  morgan("dev", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/doctors", doctorRoutes);
app.use("/api/v1/queue", queueRoutes);
app.use("/api/v1/appointments", queueAppointment);

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SmartQ API running",
  });
});

app.use(globalErrorHandler);

export default app;
