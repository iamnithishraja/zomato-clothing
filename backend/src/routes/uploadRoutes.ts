import express from 'express';
import { getUploadUrl, deleteFile } from '../controllers/uploadController';
import { isAuthenticated } from '../middleware/auth';

const uploadRoute = express.Router();

// All upload routes require authentication
uploadRoute.use(isAuthenticated);

// Unified upload endpoint that handles both single and multiple uploads
uploadRoute.post('/url', getUploadUrl);

// Delete file endpoint
uploadRoute.delete('/file', deleteFile);

export default uploadRoute;
