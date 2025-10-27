import StoreModel from "../Models/storeModel";
import UserModel from "../Models/userModel";
import ProductModel from "../Models/productModel";

import type { Response, Request } from "express";
import { 
  validateMerchantRole, 
  validateStoreData, 
  sendErrorResponse 
} from "../utils/validation";

// Create store details
async function createStore(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    // Check if user is a merchant
    if (!validateMerchantRole(user, res)) return;
    
    // Get store data from request body
    const {
      storeName,
      storeDescription,
      storeImages,
      address,
      mapLink,
      contact,
      workingDays,
      isActive
    } = req.body;
    
    // Validate store data
    const validationError = validateStoreData(req.body);
    if (validationError) {
      return sendErrorResponse(res, 400, validationError);
    }
    
    // Prepare store data
    const storeData = {
      storeName: storeName.trim(),
      description: storeDescription ? storeDescription.trim() : '',
      storeImages: storeImages || [],
      address: address.trim(),
      mapLink: mapLink.trim(),
      contact: contact || {},
      workingDays: workingDays || {}
    };
    
    // Check if store already exists for this user
    const existingStore = await StoreModel.findOne({ merchantId: user._id });
    
    if (existingStore) {
      return sendErrorResponse(res, 409, "Store already exists. Use PUT /update to modify store details.");
    }
    
    // Create new store
    const store = await StoreModel.create({
      merchantId: user._id,
      ...storeData
    });
    
    if (!store) {
      return sendErrorResponse(res, 500, "Failed to save store details");
    }
    
    // Update user's profile completion status to true
    await UserModel.findByIdAndUpdate(
      user._id,
      { isProfileComplete: true, updatedAt: new Date() }
    );
    
    return res.status(201).json({
      success: true,
      message: "Store created successfully",
      store: {
        _id: store._id,
        storeName: store.storeName,
        description: store.description,
        storeImages: store.storeImages,
        address: store.address,
        mapLink: store.mapLink,
        contact: store.contact,
        workingDays: store.workingDays,
        isActive: store.isActive,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt
      }
    });
    
  } catch (error) {
    console.error("Error creating store:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
}

// Update store details
async function updateStore(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    // Check if user is a merchant
    if (user.role !== 'Merchant') {
      return res.status(403).json({
        success: false,
        message: "Only merchants can update store details"
      });
    }
    
    // Get store data from request body
    const {
      storeName,
      storeDescription,
      storeImages,
      address,
      mapLink,
      contact,
      workingDays,
      isActive
    } = req.body;
    
    // Basic validation - check required fields
    if (storeName && storeName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Store name must be at least 2 characters long"
      });
    }
    
    if (address && address.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Address must be at least 5 characters long"
      });
    }
    
    if (mapLink && mapLink.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Map link is required"
      });
    }
    
    // Validate contact information if provided
    if (contact) {
      if (contact.phone && (contact.phone.length < 10 || contact.phone.length > 12)) {
        return res.status(400).json({
          success: false,
          message: "Phone number must be between 10-12 digits"
        });
      }
      
      if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address"
        });
      }
      
      if (contact.website && !/^https?:\/\/.+/.test(contact.website)) {
        return res.status(400).json({
          success: false,
          message: "Website must be a valid URL starting with http:// or https://"
        });
      }
    }
    
    // Validate working days if provided
    if (workingDays) {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const providedDays = Object.keys(workingDays);
      
      // Check if all provided days are valid
      const invalidDays = providedDays.filter(day => !validDays.includes(day));
      if (invalidDays.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid working days: ${invalidDays.join(', ')}`
        });
      }
      
      // Check if at least one day is selected
      const hasWorkingDays = Object.values(workingDays).some(day => day === true);
      if (!hasWorkingDays) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one working day"
        });
      }
    }
    
    // Check if store exists
    const existingStore = await StoreModel.findOne({ merchantId: user._id });
    
    if (!existingStore) {
      return res.status(404).json({
        success: false,
        message: "Store not found. Create a store first."
      });
    }
    
    // Prepare update data (only include provided fields)
    const updateData: any = { updatedAt: new Date() };
    
    if (storeName !== undefined) updateData.storeName = storeName.trim();
    if (storeDescription !== undefined) updateData.description = storeDescription ? storeDescription.trim() : '';
    if (storeImages !== undefined) updateData.storeImages = storeImages || [];
    if (address !== undefined) updateData.address = address.trim();
    if (mapLink !== undefined) updateData.mapLink = mapLink.trim();
    if (contact !== undefined) updateData.contact = contact || {};
    if (workingDays !== undefined) updateData.workingDays = workingDays || {};
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    
    // Update store
    const updatedStore = await StoreModel.findByIdAndUpdate(
      existingStore._id,
      updateData,
      { new: true }
    );
    
    if (!updatedStore) {
      return res.status(500).json({
        success: false,
        message: "Failed to update store details"
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Store updated successfully",
      store: {
        _id: updatedStore._id,
        storeName: updatedStore.storeName,
        description: updatedStore.description,
        storeImages: updatedStore.storeImages,
        address: updatedStore.address,
        mapLink: updatedStore.mapLink,
        contact: updatedStore.contact,
        workingDays: updatedStore.workingDays,
        isActive: updatedStore.isActive,
        createdAt: updatedStore.createdAt,
        updatedAt: updatedStore.updatedAt
      }
    });
    
  } catch (error) {
    console.error("Error updating store:", error);
    
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Get store details
async function getStoreDetails(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    // Check if user is a merchant
    if (user.role !== 'Merchant') {
      return res.status(403).json({
        success: false,
        message: "Only merchants can access store details"
      });
    }
    
    const store = await StoreModel.findOne({ merchantId: user._id });
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store details not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Store details retrieved successfully",
      store: {
        _id: store._id,
        storeName: store.storeName,
        description: store.description,
        storeImages: store.storeImages,
        address: store.address,
        mapLink: store.mapLink,
        contact: store.contact,
        workingDays: store.workingDays,
        rating: store.rating,
        isActive: store.isActive,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt
      }
    });
    
  } catch (error) {
    console.error("Error getting store details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Delete store details
async function deleteStoreDetails(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    // Check if user is a merchant
    if (user.role !== 'Merchant') {
      return res.status(403).json({
        success: false,
        message: "Only merchants can delete store details"
      });
    }
    
    const store = await StoreModel.findOneAndDelete({ merchantId: user._id });
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store details not found"
      });
    }
    
    // Update user's profile completion status to false
    await UserModel.findByIdAndUpdate(
      user._id,
      { isProfileComplete: false, updatedAt: new Date() }
    );
    
    return res.status(200).json({
      success: true,
      message: "Store details deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting store details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Get all stores for customers (public endpoint)
async function getAllStores(req: Request, res: Response) {
  try {
    // Get query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const location = req.query.location as string;

    // Build filter object
    const filter: any = { isActive: true };
    
    if (search) {
      filter.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    if (location) {
      filter.address = { $regex: location, $options: 'i' };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get stores with pagination
    const stores = await StoreModel.find(filter)
      .populate('merchantId', 'name email')
      .sort({ 'rating.average': -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalStores = await StoreModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Stores retrieved successfully",
      stores,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalStores / limit),
        totalStores,
        hasNextPage: page < Math.ceil(totalStores / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error getting all stores:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Get best seller stores (top rated stores)
async function getBestSellerStores(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 4;

    // Get top rated stores
    const stores = await StoreModel.find({ isActive: true })
      .populate('merchantId', 'name email')
      .sort({ 'rating.average': -1, 'rating.totalReviews': -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "Best seller stores retrieved successfully",
      stores
    });

  } catch (error) {
    console.error("Error getting best seller stores:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Get store by ID (public endpoint)
async function getStoreById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Store ID is required"
      });
    }

    const store = await StoreModel.findById(id)
      .populate('merchantId', 'name email');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Store retrieved successfully",
      store: {
        _id: store._id,
        storeName: store.storeName,
        description: store.description,
        storeImages: store.storeImages,
        address: store.address,
        mapLink: store.mapLink,
        contact: store.contact,
        workingDays: store.workingDays,
        rating: store.rating,
        isActive: store.isActive,
        merchantId: store.merchantId,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt
      }
    });

  } catch (error) {
    console.error("Error getting store by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Search stores based on product query and rank by relevance and rating (public endpoint)
async function searchStoresByProductQuery(req: Request, res: Response) {
  try {
    const q = (req.query.q as string) || (req.query.search as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // If no query provided, fallback to top rated stores
    if (!q.trim()) {
      const skip = (page - 1) * limit;
      const stores = await StoreModel.find({ isActive: true })
        .sort({ 'rating.average': -1, 'rating.totalReviews': -1 })
        .skip(skip)
        .limit(limit);
      const totalStores = await StoreModel.countDocuments({ isActive: true });
      return res.status(200).json({
        success: true,
        message: "Stores retrieved successfully",
        stores: stores.map(s => ({ store: s, matchedSubcategory: undefined })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalStores / limit),
          totalStores,
          hasNextPage: page < Math.ceil(totalStores / limit),
          hasPrevPage: page > 1
        }
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    // Aggregate products matching the query to find relevant stores (no pagination here)
    const productAgg: any[] = [
      { $match: {
          isActive: true,
          $or: [
            { name: { $regex: searchRegex } },
            { description: { $regex: searchRegex } },
            { category: { $regex: searchRegex } },
            { subcategory: { $regex: searchRegex } },
            { 'specifications.material': { $regex: searchRegex } },
            { 'specifications.fit': { $regex: searchRegex } },
            { 'specifications.pattern': { $regex: searchRegex } },
          ]
        }
      },
      // Group by store and collect subcategories
      { $group: {
          _id: "$storeId",
          matchCount: { $sum: 1 },
          subcategories: { $push: "$subcategory" }
        }
      },
      // Join store details
      { $lookup: {
          from: "stores",
          localField: "_id",
          foreignField: "_id",
          as: "store"
        }
      },
      { $unwind: "$store" },
      { $match: { "store.isActive": true } },
      // Compute a simple score combining matches and rating
      { $addFields: {
          ratingAvg: "$store.rating.average",
          score: { $add: [ { $multiply: ["$matchCount", 2] }, { $ifNull: ["$store.rating.average", 0] } ] }
        }
      },
      { $sort: { score: -1, ratingAvg: -1, "store.createdAt": -1 } },
      // Shape output
      { $project: {
          _id: 0,
          store: "$store",
          matchCount: 1,
          subcategories: 1,
          score: 1,
          ratingAvg: 1
        }
      }
    ];

    const productResults = await ProductModel.aggregate(productAgg);

    // Determine matched subcategory per store by frequency and keep initial score
    const productRanked = productResults.map((r: any) => {
      const freq: Record<string, number> = {};
      (r.subcategories || []).forEach((s: string) => {
        if (!s) return;
        freq[s] = (freq[s] || 0) + 1;
      });
      let matchedSubcategory: string | undefined = undefined;
      let max = 0;
      Object.keys(freq).forEach(k => {
        const val = freq[k] ?? 0;
        if (val > max) {
          max = val;
          matchedSubcategory = k;
        }
      });
      return { store: r.store, matchedSubcategory, score: r.score, ratingAvg: r.ratingAvg };
    });

    // Also match stores directly by their fields
    const storeFieldMatches = await StoreModel.find({
      isActive: true,
      $or: [
        { storeName: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { address: { $regex: searchRegex } }
      ]
    });

    // Merge product-driven and store-field matches, dedupe by store._id
    const byId: Record<string, { store: any; matchedSubcategory?: string; score: number; ratingAvg: number } > = {};
    productRanked.forEach((p) => {
      const id = String(p.store._id);
      byId[id] = { store: p.store, matchedSubcategory: p.matchedSubcategory, score: p.score, ratingAvg: p.ratingAvg ?? (p.store?.rating?.average || 0) };
    });
    storeFieldMatches.forEach((s: any) => {
      const id = String(s._id);
      const ratingAvg = s?.rating?.average || 0;
      // base score for store match; small boost
      const baseScore = ratingAvg + 1;
      if (!byId[id]) {
        byId[id] = { store: s, matchedSubcategory: undefined, score: baseScore, ratingAvg };
      } else {
        // If already present from product matches, keep the higher score
        byId[id].score = Math.max(byId[id].score, baseScore);
        byId[id].ratingAvg = Math.max(byId[id].ratingAvg, ratingAvg);
      }
    });

    // Rank and paginate
    const mergedList = Object.values(byId).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.ratingAvg !== a.ratingAvg) return b.ratingAvg - a.ratingAvg;
      const aTime = new Date(a.store?.createdAt || 0).getTime();
      const bTime = new Date(b.store?.createdAt || 0).getTime();
      return bTime - aTime;
    });
    const totalStores = mergedList.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paged = mergedList.slice(start, end).map(({ store, matchedSubcategory }) => ({ store, matchedSubcategory }));

    return res.status(200).json({
      success: true,
      message: "Stores ranked for query",
      stores: paged,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalStores / limit),
        totalStores,
        hasNextPage: page < Math.ceil(totalStores / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error searching stores by product query:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export { createStore, updateStore, getStoreDetails, deleteStoreDetails, getAllStores, getBestSellerStores, getStoreById, searchStoresByProductQuery };