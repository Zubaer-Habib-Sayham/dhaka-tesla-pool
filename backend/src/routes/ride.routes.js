import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import {
  estimateFare,
  createRideRequest,
  getMyRides,
  getMyRide,
  cancelRide,
} from "../controllers/ride.controller.js";

const router = Router();

router.post("/estimate", estimateFare);

router.post("/", authenticate, authorizeRoles("PASSENGER"), createRideRequest);

router.get("/", authenticate, authorizeRoles("PASSENGER"), getMyRides);

router.get("/:id", authenticate, authorizeRoles("PASSENGER"), getMyRide);

router.post("/:id/cancel", authenticate, authorizeRoles("PASSENGER"), cancelRide);

export default router;
