import express from 'express';
import { 
  addToFavorites, 
  removeFromFavorites, 
  getUserFavorites, 
  checkFavoriteStatus,
  getMultipleFavoriteStatus 
} from '../controllers/favoriteController';
import { isAuthenticated } from '../middleware/auth';

const favoriteRoute = express.Router();

// All routes require authentication
favoriteRoute.use(isAuthenticated);

// Add product to favorites
favoriteRoute.post('/add', addToFavorites);

// Remove product from favorites
favoriteRoute.delete('/remove/:productId', removeFromFavorites);

// Get user's favorites
favoriteRoute.get('/user', getUserFavorites);

// Check if product is in favorites
favoriteRoute.get('/status/:productId', checkFavoriteStatus);

// Get multiple products' favorite status
favoriteRoute.post('/status/multiple', getMultipleFavoriteStatus);

export default favoriteRoute;
