import express from 'express';
import { createStore, updateStore, getStoreDetails, deleteStoreDetails, getAllStores, getBestSellerStores, getStoreById, searchStoresByProductQuery } from '../controllers/storeController';
import { isAuthenticated } from '../middleware/auth';
import { requireMerchant } from '../middleware/roleAuth';

const storeRoute = express.Router();

// Merchant-only routes (require authentication and merchant role)
// IMPORTANT: These specific routes must come BEFORE the parametric route /:id
storeRoute.post('/create', isAuthenticated, requireMerchant, createStore);
storeRoute.put('/update', isAuthenticated, requireMerchant, updateStore);
storeRoute.get('/details', isAuthenticated, requireMerchant, getStoreDetails);
storeRoute.delete('/delete', isAuthenticated, requireMerchant, deleteStoreDetails);

// Public routes (no authentication required)
storeRoute.get('/all', getAllStores);
storeRoute.get('/bestsellers', getBestSellerStores);
storeRoute.get('/search', searchStoresByProductQuery);
storeRoute.get('/:id', getStoreById);

export default storeRoute;
