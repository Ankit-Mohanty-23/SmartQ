import express from "express";
import morgan from "morgan";
import cors from "cors";
import globalErrorHandler from "../src/middlewares/error.middleware.js";
import logger from "./utils/logger.js";
import userRoutes from "./routes/user.route.js";
import doctorRoutes from "./routes/doctor.route.js";
import queueRoutes from "./routes/queue.route.js";

const app = express();

app.use(cors());
//app.use(helmet());
app.use(
  morgan("dev", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }),
);
app.use(express.json());

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/doctors", doctorRoutes);
app.use("/api/v1/queue", queueRoutes);

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SmartQ API running",
  });
});

app.use(globalErrorHandler);

export default app;
