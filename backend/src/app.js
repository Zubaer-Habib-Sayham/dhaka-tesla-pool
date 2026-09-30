import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import databaseRoutes from "./routes/database.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import zoneRoutes from "./routes/zone.routes.js";
import rideRoutes from "./routes/ride.routes.js";
import driverRoutes from "./routes/driver.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/health/database", databaseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/driver", driverRoutes);

app.use(errorHandler);

export default app;
