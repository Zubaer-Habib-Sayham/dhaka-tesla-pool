import { Router } from "express";
import { estimateFare } from "../controllers/ride.controller.js";

const router = Router();

router.post("/estimate", estimateFare);

export default router;
