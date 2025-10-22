import express from "express";
import {
  markCodCollected,
  submitCodToStore,
  getCodSummary
} from "../controllers/codController";
import { isAuthenticated } from "../middleware/auth";
import { requireRole } from "../middleware/roleAuth";

const router = express.Router();

// All routes require delivery role
router.use(isAuthenticated, requireRole(['Delivery']));

// Mark COD as collected after delivery
router.post("/:orderId/collect", markCodCollected);

// Submit collected COD to store/admin
router.post("/submit", submitCodToStore);

// Get COD collection summary
router.get("/summary", getCodSummary);

export default router;

