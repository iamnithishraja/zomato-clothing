import express from 'express';
import { generateUploadUrl, generateMultipleUploadUrls } from '../controllers/uploadController';
import { isAuthenticated } from '../middleware/auth';

const uploadRoute = express.Router();

// All upload routes require authentication
uploadRoute.use(isAuthenticated);

// Generate upload URL for single file upload
uploadRoute.post('/url', generateUploadUrl);

// Generate multiple upload URLs for batch uploads
uploadRoute.post('/urls', generateMultipleUploadUrls);

export default uploadRoute;
