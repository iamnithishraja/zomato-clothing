import express from 'express';
import { 
  createProduct, 
  getMerchantProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  getAllProducts,
  getProductsBySubcategory,
  getProductsByStore
} from '../controllers/productController';
import { isAuthenticated } from '../middleware/auth';
import { requireMerchant, requireAnyRole } from '../middleware/roleAuth';
import { requireApprovedVerification } from '../middleware/verificationAuth';

const router = express.Router();

// Public routes (no authentication required)
router.get('/all', getAllProducts);
router.get('/subcategory', getProductsBySubcategory);
router.get('/store/:storeId', getProductsByStore);

// Product CRUD operations - require merchant role for create/update/delete
router.post('/create', isAuthenticated, requireMerchant, requireApprovedVerification, createProduct);
router.get('/merchant', isAuthenticated, requireMerchant, requireApprovedVerification, getMerchantProducts);
router.get('/:productId', isAuthenticated, requireAnyRole, getProductById);
router.put('/:productId', isAuthenticated, requireMerchant, requireApprovedVerification, updateProduct);
router.delete('/:productId', isAuthenticated, requireMerchant, requireApprovedVerification, deleteProduct);

export default router;
