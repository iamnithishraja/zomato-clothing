import express from 'express';
import { createStore, updateStore, getStoreDetails, deleteStoreDetails, getAllStores, getBestSellerStores, getStoreById } from '../controllers/storeController';
import { isAuthenticated } from '../middleware/auth';
import { requireMerchant } from '../middleware/roleAuth';

const storeRoute = express.Router();

// Public routes (no authentication required)
storeRoute.get('/all', getAllStores);
storeRoute.get('/bestsellers', getBestSellerStores);
storeRoute.get('/:id', getStoreById);

// Merchant-only routes (require authentication and merchant role)
storeRoute.post('/create', isAuthenticated, requireMerchant, createStore);
storeRoute.put('/update', isAuthenticated, requireMerchant, updateStore);
storeRoute.get('/details', isAuthenticated, requireMerchant, getStoreDetails);
storeRoute.delete('/delete', isAuthenticated, requireMerchant, deleteStoreDetails);

export default storeRoute;
