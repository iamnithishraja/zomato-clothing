import { Router } from 'express';
import { geocode } from '../controllers/geocodeController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Geocode address to coordinates
// POST /api/v1/geocode
// Body: { address: string }
router.post('/geocode', isAuthenticated, geocode);

export default router;

