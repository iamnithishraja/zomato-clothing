import express from "express";
import {
  rateStore,
  getStoreRatings,
  getStoreReviews,
  getPendingStoreReviews,
} from "../controllers/storeRatingController";
import { isAuthenticated } from "../middleware/auth";
import { requireRole } from "../middleware/roleAuth";

const router = express.Router();

// Rate a store (only customers can rate)
router.post("/rate", isAuthenticated, requireRole(["User"]), rateStore);

// Pending store reviews for the logged-in customer (must be before /:storeId routes)
router.get("/pending-reviews", isAuthenticated, requireRole(["User"]), getPendingStoreReviews);

// Paginated store review list
router.get("/:storeId/reviews", getStoreReviews);

// Aggregate store rating summary
router.get("/:storeId/ratings", getStoreRatings);

export default router;
