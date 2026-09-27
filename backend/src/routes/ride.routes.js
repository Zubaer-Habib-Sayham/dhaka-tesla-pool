import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  estimateFare,
  createRideRequest,
  getMyRides,
  getMyRide,
  cancelRide,
} from "../controllers/ride.controller.js";

const router = Router();

router.post("/estimate", estimateFare);

router.post("/", authenticate, createRideRequest);

router.get("/", authenticate, getMyRides);

router.get("/:id", authenticate, getMyRide);

router.post("/:id/cancel", authenticate, cancelRide);

export default router;
