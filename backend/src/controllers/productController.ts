import ProductModel from "../Models/productModel";
import StoreModel from "../Models/storeModel";
import UserModel from "../Models/userModel";
import type { Response, Request } from "express";

// Create a new product
async function createProduct(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    // Check if user is a merchant
    if (user.role !== 'Merchant') {
      return res.status(403).json({
        success: false,
        message: "Only merchants can create products"
      });
    }

    // Get product data from request body
    const {
      name,
      description,
      category,
      subcategory,
      images,
      price,
      sizes,
      availableQuantity,
      specifications,
      season,
      isNewArrival,
      isBestSeller
    } = req.body;

    // Basic validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Product name is required and must be at least 2 characters long"
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required"
      });
    }

    // Validate category enum
    const validCategories = ["Men", "Women", "Kids", "Unisex"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    if (!subcategory) {
      return res.status(400).json({
        success: false,
        message: "Subcategory is required"
      });
    }

    // Validate subcategory enum
    const validSubcategories = [
      "Shirts", "T-Shirts", "Pants", "Jeans", "Shorts", "Jackets", "Suits",
      "Dresses", "Tops", "Sarees", "Kurtas", "Skirts", "Leggings",
      "Hoodies", "Sweatshirts", "Sweaters", "Cardigans", "Blazers", "Coats",
      "Underwear", "Sleepwear", "Activewear", "Swimwear", "Ethnic Wear"
    ];
    if (!validSubcategories.includes(subcategory)) {
      return res.status(400).json({
        success: false,
        message: `Subcategory must be one of: ${validSubcategories.join(', ')}`
      });
    }

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid price is required"
      });
    }

    if (availableQuantity === undefined || availableQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid available quantity is required"
      });
    }

    if (!images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required"
      });
    }

    // Check if merchant has a store
    const store = await StoreModel.findOne({ merchantId: user._id });
    if (!store) {
      return res.status(400).json({
        success: false,
        message: "You must create a store before adding products"
      });
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
      price,
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
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Get all products for a merchant
async function getMerchantProducts(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    // Check if user is a merchant
    if (user.role !== 'Merchant') {
      return res.status(403).json({
        success: false,
        message: "Only merchants can access their products"
      });
    }

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
      .populate('storeId', 'storeName');

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
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
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
      .populate('storeId', 'storeName address');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
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
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Update a product
async function updateProduct(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    // Check if user is a merchant
    if (user.role !== 'Merchant') {
      return res.status(403).json({
        success: false,
        message: "Only merchants can update products"
      });
    }

    const { productId } = req.params;
    const updateData = req.body;

    // Check if product exists and belongs to the merchant
    const existingProduct = await ProductModel.findOne({
      _id: productId,
      merchantId: user._id
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found or you don't have permission to update it"
      });
    }

    // Validate update data
    if (updateData.name && updateData.name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Product name must be at least 2 characters long"
      });
    }

    if (updateData.price && updateData.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0"
      });
    }

    if (updateData.availableQuantity && updateData.availableQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Available quantity cannot be negative"
      });
    }

    // Update product
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).populate('storeId', 'storeName');

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    });

  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Delete a product
async function deleteProduct(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    // Check if user is a merchant
    if (user.role !== 'Merchant') {
      return res.status(403).json({
        success: false,
        message: "Only merchants can delete products"
      });
    }

    const { productId } = req.params;

    // Check if product exists and belongs to the merchant
    const product = await ProductModel.findOne({
      _id: productId,
      merchantId: user._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or you don't have permission to delete it"
      });
    }

    // Delete product
    await ProductModel.findByIdAndDelete(productId);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}


// Get all products for customers (public endpoint)
async function getAllProducts(req: Request, res: Response) {
  try {
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
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subcategory: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get products with pagination
    const products = await ProductModel.find(filter)
      .populate('merchantId', 'name email')
      .populate('storeId', 'storeName address storeImages')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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
    console.error("Error getting all products:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
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
      .populate('merchantId', 'name email')
      .populate('storeId', 'storeName address storeImages')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

export { 
  createProduct, 
  getMerchantProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  getAllProducts,
  getProductsByStore
};
