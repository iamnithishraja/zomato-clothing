import express from 'express';
import { createOrUpdateStore, getStoreDetails, deleteStoreDetails } from '../controllers/storeController';
import { isAuthenticated } from '../middleware/auth';

const storeRoute = express.Router();

// All store routes require authentication
storeRoute.post('/create', isAuthenticated, createOrUpdateStore);
storeRoute.put('/update', isAuthenticated, createOrUpdateStore);
storeRoute.get('/details', isAuthenticated, getStoreDetails);
storeRoute.delete('/delete', isAuthenticated, deleteStoreDetails);

export default storeRoute;
