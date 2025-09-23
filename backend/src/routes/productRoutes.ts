import express from 'express';
import { 
  createProduct, 
  getMerchantProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct
} from '../controllers/productController';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();

// All product routes require authentication
router.use(isAuthenticated);

// Product CRUD operations
router.post('/create', createProduct);
router.get('/merchant', getMerchantProducts);
router.get('/:productId', getProductById);
router.put('/:productId', updateProduct);
router.delete('/:productId', deleteProduct);

export default router;
