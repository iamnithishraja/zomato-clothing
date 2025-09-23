import StoreModel from "../Models/storeModel";
import UserModel from "../Models/userModel";
import type { Response, Request } from "express";

// Create or update store details
async function createOrUpdateStore(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    // Check if user is a merchant
    if (user.role !== 'merchant') {
      return res.status(403).json({
        success: false,
        message: "Only merchants can create store details"
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
      workingDays
    } = req.body;
    
    // Basic validation - check required fields
    if (!storeName || storeName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Store name is required and must be at least 2 characters long"
      });
    }
    
    if (!address || address.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Address is required and must be at least 5 characters long"
      });
    }
    
    if (!mapLink || mapLink.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Map link is required"
      });
    }
    
    // Prepare store data
    const storeData = {
      storeName: storeName.trim(),
      storeDescription: storeDescription ? storeDescription.trim() : '',
      storeImages: storeImages || [],
      address: address.trim(),
      mapLink: mapLink.trim(),
      contact: contact || {},
      workingDays: workingDays || {}
    };
    
    // Check if store already exists for this user
    let store = await StoreModel.findOne({ userId: user._id });
    
    if (store) {
      // Update existing store
      store = await StoreModel.findByIdAndUpdate(
        store._id,
        { ...storeData, updatedAt: new Date() },
        { new: true }
      );
    } else {
      // Create new store
      store = await StoreModel.create({
        userId: user._id,
        ...storeData
      });
    }
    
    if (!store) {
      return res.status(500).json({
        success: false,
        message: "Failed to save store details"
      });
    }
    
    // Update user's profile completion status to true
    await UserModel.findByIdAndUpdate(
      user._id,
      { isProfileComplete: true, updatedAt: new Date() }
    );
    
    return res.status(200).json({
      success: true,
      message: "Store details saved successfully",
      store: {
        _id: store._id,
        storeName: store.storeName,
        storeDescription: store.storeDescription,
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
    console.error("Error creating/updating store:", error);
    
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
    if (user.role !== 'merchant') {
      return res.status(403).json({
        success: false,
        message: "Only merchants can access store details"
      });
    }
    
    const store = await StoreModel.findOne({ userId: user._id });
    
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
        storeDescription: store.storeDescription,
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
    if (user.role !== 'merchant') {
      return res.status(403).json({
        success: false,
        message: "Only merchants can delete store details"
      });
    }
    
    const store = await StoreModel.findOneAndDelete({ userId: user._id });
    
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

export { createOrUpdateStore, getStoreDetails, deleteStoreDetails };