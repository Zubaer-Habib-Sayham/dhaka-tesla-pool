import { Router } from "express";
import { getZones } from "../controllers/zone.controller.js";

const router = Router();

router.get("/", getZones);

export default router;
