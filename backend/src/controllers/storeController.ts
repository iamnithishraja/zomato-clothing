import StoreModel from "../Models/storeModel";
import UserModel from "../Models/userModel";
import type { Response, Request } from "express";

// Create store details
async function createStore(req: Request, res: Response) {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    // Check if user is a merchant
    if (user.role !== 'Merchant') {
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
      return res.status(409).json({
        success: false,
        message: "Store already exists. Use PUT /update to modify store details."
      });
    }
    
    // Create new store
    const store = await StoreModel.create({
      merchantId: user._id,
      ...storeData
    });
    
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
    
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
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
      workingDays
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

export { createStore, updateStore, getStoreDetails, deleteStoreDetails };