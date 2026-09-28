import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import {
  getMe,
  goOnline,
  goOffline,
  getRequests,
} from "../controllers/driver.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorizeRoles("DRIVER"));

router.get("/me", getMe);
router.post("/online", goOnline);
router.post("/offline", goOffline);
router.get("/requests", getRequests);

export default router;
