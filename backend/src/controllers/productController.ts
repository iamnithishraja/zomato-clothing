import ProductModel from "../Models/productModel";
import StoreModel from "../Models/storeModel";
import type { Response, Request } from "express";
import { 
  validateMerchantRole, 
  validateProductData, 
  sendErrorResponse,
} from "../utils/validation";

// Create a new product
async function createProduct(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    // Check if user is a merchant
    if (!validateMerchantRole(user, res)) return;

    // Get product data from request body
    const {
      name,
      description,
      category,
      subcategory,
      images,
      price,
      discountPercentage,
      isOnSale,
      sizes,
      availableQuantity,
      specifications,
      season,
      isNewArrival,
      isBestSeller
    } = req.body;

    // Validate product data
    const validationError = validateProductData(req.body);
    if (validationError) {
      return sendErrorResponse(res, 400, validationError);
    }

    // Check if merchant has a store
    const store = await StoreModel.findOne({ merchantId: user._id });
    if (!store) {
      return sendErrorResponse(res, 400, "You must create a store before adding products");
    }

    // Calculate final price based on discount
    let finalPrice = price;
    let finalDiscountPercentage = discountPercentage || 0;
    let finalIsOnSale = isOnSale || false;

    // If either isOnSale is true OR discountPercentage is provided, calculate discount
    if (isOnSale || (discountPercentage && discountPercentage > 0)) {
      const discountAmount = (price * discountPercentage) / 100;
      finalPrice = price - discountAmount;
      finalDiscountPercentage = discountPercentage;
      finalIsOnSale = true;
    }

    // Create product
    const product = await ProductModel.create({
      merchantId: user._id,
      storeId: store._id,
      name: name.trim(),
      description: description ? description.trim() : '',
      category,
      subcategory,
      images,
      price: finalPrice,
      discountPercentage: finalDiscountPercentage,
      isOnSale: finalIsOnSale,
      sizes: sizes || [],
      availableQuantity,
      specifications: specifications || undefined,
      season: season || undefined,
      isNewArrival: isNewArrival || false,
      isBestSeller: isBestSeller || false
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: {
        _id: product._id,
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        images: product.images,
        price: product.price,
        sizes: product.sizes,
        availableQuantity: product.availableQuantity,
        specifications: product.specifications,
        season: product.season,
        isNewArrival: product.isNewArrival,
        isBestSeller: product.isBestSeller,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }
    });

  } catch (error) {
    console.error("Error creating product:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

// Get all products for a merchant
async function getMerchantProducts(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    // Check if user is a merchant
    if (!validateMerchantRole(user, res)) return;

    // Get query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const subcategory = req.query.subcategory as string;
    const season = req.query.season as string;
    const isActive = req.query.isActive as string;

    // Build filter object
    const filter: any = { merchantId: user._id };
    
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (season) filter.season = season;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get products with pagination
    const products = await ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('storeId', 'storeName storeImages');

    // Get total count for pagination
    const totalProducts = await ProductModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        hasNextPage: page < Math.ceil(totalProducts / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error getting merchant products:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

// Get a single product by ID
async function getProductById(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    const { productId } = req.params;

    // Get product
    const product = await ProductModel.findById(productId)
      .populate('merchantId', 'name email')
      .populate('storeId', 'storeName address storeImages');

    if (!product) {
      return sendErrorResponse(res, 404, "Product not found");
    }

    // For merchants, allow viewing their own products
    // For customers and delivery partners, allow viewing all products
    // This can be modified based on business requirements
    if (user.role === 'Merchant' && product.merchantId.toString() !== user._id.toString()) {
      // For now, allow merchants to view all products
      // You can change this to restrict access if needed
    }

    return res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      product
    });

  } catch (error) {
    console.error("Error getting product:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

// Update a product
async function updateProduct(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    // Check if user is a merchant
    if (!validateMerchantRole(user, res)) return;

    const { productId } = req.params;
    const updateData = req.body;

    // Check if product exists and belongs to the merchant
    const existingProduct = await ProductModel.findOne({
      _id: productId,
      merchantId: user._id
    });

    if (!existingProduct) {
      return sendErrorResponse(res, 404, "Product not found or you don't have permission to update it");
    }

    // Validate update data
    if (updateData.name && updateData.name.trim().length < 2) {
      return sendErrorResponse(res, 400, "Product name must be at least 2 characters long");
    }

    if (updateData.price && updateData.price <= 0) {
      return sendErrorResponse(res, 400, "Price must be greater than 0");
    }

    if (updateData.availableQuantity && updateData.availableQuantity < 0) {
      return sendErrorResponse(res, 400, "Available quantity cannot be negative");
    }

    // Validate discount fields
    if (updateData.discountPercentage !== undefined && (updateData.discountPercentage < 0 || updateData.discountPercentage > 100)) {
      return sendErrorResponse(res, 400, "Discount percentage must be between 0 and 100");
    }

    // Handle discount calculation if price or discount fields are being updated
    if (updateData.price !== undefined || updateData.discountPercentage !== undefined || updateData.isOnSale !== undefined) {
      // Get current product to use as base for calculation
      const currentProduct = await ProductModel.findById(productId);
      if (!currentProduct) {
        return sendErrorResponse(res, 404, "Product not found");
      }

      // Use updated values or current values
      const originalPrice = updateData.price !== undefined ? updateData.price : currentProduct.price;
      const discountPercentage = updateData.discountPercentage !== undefined ? updateData.discountPercentage : currentProduct.discountPercentage;
      const isOnSale = updateData.isOnSale !== undefined ? updateData.isOnSale : currentProduct.isOnSale;

      // Calculate final price based on discount
      let finalPrice = originalPrice;
      let finalDiscountPercentage = discountPercentage || 0;
      let finalIsOnSale = isOnSale || false;

      // If either isOnSale is true OR discountPercentage is provided, calculate discount
      if (isOnSale || (discountPercentage && discountPercentage > 0)) {
        const discountAmount = (originalPrice * discountPercentage) / 100;
        finalPrice = originalPrice - discountAmount;
        finalDiscountPercentage = discountPercentage;
        finalIsOnSale = true;
      }

      // Update the price and discount fields
      updateData.price = finalPrice;
      updateData.discountPercentage = finalDiscountPercentage;
      updateData.isOnSale = finalIsOnSale;
    }

    // Update product
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).populate('storeId', 'storeName storeImages');

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    });

  } catch (error) {
    console.error("Error updating product:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

// Delete a product
async function deleteProduct(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    // Check if user is a merchant
    if (!validateMerchantRole(user, res)) return;

    const { productId } = req.params;

    // Check if product exists and belongs to the merchant
    const product = await ProductModel.findOne({
      _id: productId,
      merchantId: user._id
    });

    if (!product) {
      return sendErrorResponse(res, 404, "Product not found or you don't have permission to delete it");
    }

    // Delete product
    await ProductModel.findByIdAndDelete(productId);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting product:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}


// Get all products for customers (public endpoint)
async function getAllProducts(req: Request, res: Response) {
  try {
    console.log("🚀 GET /api/v1/product/all");
    console.log("Query params:", req.query);
    
    // Get query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const subcategory = req.query.subcategory as string;
    const search = req.query.search as string;
    const minPrice = parseFloat(req.query.minPrice as string);
    const maxPrice = parseFloat(req.query.maxPrice as string);
    const isBestSeller = req.query.isBestSeller === 'true';
    const isNewArrival = req.query.isNewArrival === 'true';

    // Build filter object
    const filter: any = { isActive: true };
    
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (isBestSeller) filter.isBestSeller = true;
    if (isNewArrival) filter.isNewArrival = true;
    
    // Search in name and description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Price filtering
    if (minPrice !== undefined && !isNaN(minPrice)) {
      filter.price = { $gte: minPrice };
    }
    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      filter.price = { ...filter.price, $lte: maxPrice };
    }

    console.log("Filter object:", filter);

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get products with pagination
    const products = await ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalProducts = await ProductModel.countDocuments(filter);

    console.log(`Found ${products.length} products out of ${totalProducts} total`);

    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        hasNextPage: page < Math.ceil(totalProducts / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error: any) {
    console.error("Error getting all products:", error);
    console.error("Error details:", error.message);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

// Get products by subcategory
async function getProductsBySubcategory(req: Request, res: Response) {
  try {
    console.log("🚀 GET /api/v1/product/subcategory");
    console.log("Query params:", req.query);
    
    // Get query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const subcategory = req.query.subcategory as string;
    const search = req.query.search as string;
    const minPrice = parseFloat(req.query.minPrice as string);
    const maxPrice = parseFloat(req.query.maxPrice as string);
    const isBestSeller = req.query.isBestSeller === 'true';
    const isNewArrival = req.query.isNewArrival === 'true';

    // Validate subcategory parameter
    if (!subcategory) {
      return sendErrorResponse(res, 400, "Subcategory parameter is required");
    }

    // Build filter object
    const filter: any = { 
      isActive: true,
      subcategory: subcategory 
    };
    
    if (isBestSeller) filter.isBestSeller = true;
    if (isNewArrival) filter.isNewArrival = true;
    
    // Search in name and description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Price filtering
    if (minPrice !== undefined && !isNaN(minPrice)) {
      filter.price = { $gte: minPrice };
    }
    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      filter.price = { ...filter.price, $lte: maxPrice };
    }

    console.log("Filter object:", filter);

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get products with pagination
    const products = await ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('storeId', 'storeName storeImages');

    // Get total count for pagination
    const totalProducts = await ProductModel.countDocuments(filter);

    console.log(`Found ${products.length} products in subcategory '${subcategory}' out of ${totalProducts} total`);

    return res.status(200).json({
      success: true,
      message: `Products retrieved successfully for subcategory: ${subcategory}`,
      products,
      subcategory,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        hasNextPage: page < Math.ceil(totalProducts / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error: any) {
    console.error("Error getting products by subcategory:", error);
    console.error("Error details:", error.message);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

// Get products by store ID
async function getProductsByStore(req: Request, res: Response) {
  try {
    const { storeId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const subcategory = req.query.subcategory as string;

    // Build filter object
    const filter: any = { storeId, isActive: true };
    
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get products with pagination
    const products = await ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('storeId', 'storeName storeImages');

    // Get total count for pagination
    const totalProducts = await ProductModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Store products retrieved successfully",
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        hasNextPage: page < Math.ceil(totalProducts / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error getting store products:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

export { 
  createProduct, 
  getMerchantProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  getAllProducts,
  getProductsBySubcategory,
  getProductsByStore
};
