import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";

import { authorizeRoles } from "../middleware/role.middleware.js";

import {
  getMe,
  goOnline,
  goOffline,
  getRequests,
  accept,
  arrive,
  start,
  complete,
  getRides,
} from "../controllers/driver.controller.js";

const router = Router();

router.use(authenticate);

router.use(authorizeRoles("DRIVER"));

router.param("id", (req, res, next, value) => {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) {
    return res.status(400).json({ error: { code: "INVALID_RIDE_ID", message: "Invalid ride ID." } });
  }
  next();
});

router.get("/me", getMe);

router.post("/online", goOnline);

router.post("/offline", goOffline);

router.get("/requests", getRequests);

router.get("/rides", getRides);

router.post("/rides/:id/accept", accept);

router.post("/rides/:id/arrive", arrive);

router.post("/rides/:id/start", start);

router.post("/rides/:id/complete", complete);

export default router;
