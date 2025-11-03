import { Router } from 'express';
import { getDirections } from '../controllers/directionsController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Get directions between two points
// Query params: origin (lat,lng), destination (lat,lng)
router.get('/directions', isAuthenticated, getDirections);

export default router;

