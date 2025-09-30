import FavoriteModel from "../Models/favoriteModel";
import ProductModel from "../Models/productModel";
import type { Response, Request } from "express";

// Add product to favorites
async function addToFavorites(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    // Check if product exists
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check if already in favorites
    const existingFavorite = await FavoriteModel.findOne({
      user: user._id,
      product: productId
    });

    if (existingFavorite) {
      return res.status(409).json({
        success: false,
        message: "Product already in favorites"
      });
    }

    // Add to favorites
    const favorite = await FavoriteModel.create({
      user: user._id,
      product: productId
    });

    return res.status(201).json({
      success: true,
      message: "Product added to favorites",
      favorite: {
        _id: favorite._id,
        productId: favorite.product,
        createdAt: favorite.createdAt
      }
    });

  } catch (error) {
    console.error("Error adding to favorites:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Remove product from favorites
async function removeFromFavorites(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    // Remove from favorites
    const favorite = await FavoriteModel.findOneAndDelete({
      user: user._id,
      product: productId
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Product not found in favorites"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product removed from favorites"
    });

  } catch (error) {
    console.error("Error removing from favorites:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Get user's favorites
async function getUserFavorites(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get favorites with populated product data
    const favorites = await FavoriteModel.find({ user: user._id })
      .populate({
        path: 'product',
        populate: {
          path: 'storeId',
          select: 'storeName storeImages address'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalFavorites = await FavoriteModel.countDocuments({ user: user._id });

    return res.status(200).json({
      success: true,
      message: "Favorites retrieved successfully",
      favorites: favorites.map(fav => ({
        _id: fav._id,
        product: fav.product,
        createdAt: fav.createdAt
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFavorites / limit),
        totalFavorites,
        hasNextPage: page < Math.ceil(totalFavorites / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error getting favorites:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Check if product is in favorites
async function checkFavoriteStatus(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const favorite = await FavoriteModel.findOne({
      user: user._id,
      product: productId
    });

    return res.status(200).json({
      success: true,
      message: "Favorite status retrieved successfully",
      isFavorite: !!favorite,
      favoriteId: favorite?._id || null
    });

  } catch (error) {
    console.error("Error checking favorite status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Get multiple products' favorite status
async function getMultipleFavoriteStatus(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: "Product IDs array is required"
      });
    }

    const favorites = await FavoriteModel.find({
      user: user._id,
      product: { $in: productIds }
    });

    const favoriteMap: { [key: string]: boolean } = {};
    favorites.forEach(fav => {
      favoriteMap[fav.product.toString()] = true;
    });

    const result = productIds.map((productId: string) => ({
      productId,
      isFavorite: !!favoriteMap[productId]
    }));

    return res.status(200).json({
      success: true,
      message: "Favorite status retrieved successfully",
      favorites: result
    });

  } catch (error) {
    console.error("Error getting multiple favorite status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

export { 
  addToFavorites, 
  removeFromFavorites, 
  getUserFavorites, 
  checkFavoriteStatus,
  getMultipleFavoriteStatus 
};
