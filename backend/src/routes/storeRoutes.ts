import express from 'express';
import { createStore, updateStore, getStoreDetails, deleteStoreDetails } from '../controllers/storeController';
import { isAuthenticated } from '../middleware/auth';
import { requireMerchant } from '../middleware/roleAuth';

const storeRoute = express.Router();

// All store routes require merchant authentication
storeRoute.post('/create', isAuthenticated, requireMerchant, createStore);
storeRoute.put('/update', isAuthenticated, requireMerchant, updateStore);
storeRoute.get('/details', isAuthenticated, requireMerchant, getStoreDetails);
storeRoute.delete('/delete', isAuthenticated, requireMerchant, deleteStoreDetails);

export default storeRoute;
