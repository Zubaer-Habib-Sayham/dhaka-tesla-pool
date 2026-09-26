import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  estimateFare,
  createRideRequest,
} from "../controllers/ride.controller.js";

const router = Router();

router.post("/estimate", estimateFare);
router.post("/", authenticate, createRideRequest);

export default router;
