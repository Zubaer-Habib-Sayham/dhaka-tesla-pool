import { Router } from "express";
import { getDatabaseHealth } from "../controllers/database.controller.js";

const router = Router();

router.get("/", getDatabaseHealth);

export default router;
