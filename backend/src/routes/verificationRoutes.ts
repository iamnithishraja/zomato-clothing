import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import {
  getVerificationStatus,
  submitVerificationDocuments,
} from '../controllers/verificationController';

const verificationRoute = express.Router();

verificationRoute.get('/status', isAuthenticated, getVerificationStatus);
verificationRoute.post('/submit', isAuthenticated, submitVerificationDocuments);

export default verificationRoute;
