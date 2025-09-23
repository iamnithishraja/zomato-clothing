import express from 'express';
import { 
  createProduct, 
  getMerchantProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct
} from '../controllers/productController';
import { isAuthenticated } from '../middleware/auth';
import { requireMerchant, requireAnyRole } from '../middleware/roleAuth';

const router = express.Router();

// Product CRUD operations - require merchant role for create/update/delete
router.post('/create', isAuthenticated, requireMerchant, createProduct);
router.get('/merchant', isAuthenticated, requireMerchant, getMerchantProducts);
router.get('/:productId', isAuthenticated, requireAnyRole, getProductById);
router.put('/:productId', isAuthenticated, requireMerchant, updateProduct);
router.delete('/:productId', isAuthenticated, requireMerchant, deleteProduct);

export default router;
