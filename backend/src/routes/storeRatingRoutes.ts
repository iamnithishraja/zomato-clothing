import express from "express";
import { rateStore, getStoreRatings } from "../controllers/storeRatingController";
import { isAuthenticated } from "../middleware/auth";
import { requireRole } from "../middleware/roleAuth";

const router = express.Router();

// Rate a store (only customers can rate)
router.post("/rate", isAuthenticated, requireRole(['User']), rateStore);

// Get store ratings
router.get("/:storeId/ratings", getStoreRatings);

export default router;

