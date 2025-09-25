import express from 'express';
import { 
  createProduct, 
  getMerchantProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  getAllProducts,
  getProductsByStore
} from '../controllers/productController';
import { isAuthenticated } from '../middleware/auth';
import { requireMerchant, requireAnyRole } from '../middleware/roleAuth';

const router = express.Router();

// Public routes (no authentication required)
router.get('/all', getAllProducts);
router.get('/store/:storeId', getProductsByStore);

// Product CRUD operations - require merchant role for create/update/delete
router.post('/create', isAuthenticated, requireMerchant, createProduct);
router.get('/merchant', isAuthenticated, requireMerchant, getMerchantProducts);
router.get('/:productId', isAuthenticated, requireAnyRole, getProductById);
router.put('/:productId', isAuthenticated, requireMerchant, updateProduct);
router.delete('/:productId', isAuthenticated, requireMerchant, deleteProduct);

export default router;
