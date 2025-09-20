import type { Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import UserModel from "../Models/userModel";
import type { CustomRequest } from "../types";

import type { User } from "../types/user";

export async function isAuthenticated(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
       res
        .status(401)
        .json({ success: false, message: "No token provided" });
        return;
    }

    // Ensure the token starts with 'Bearer'
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
       res
        .status(401)
        .json({ success: false, message: "Token is missing or invalid" });
        return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;
    
    if (!decoded || !decoded.userId) {
       res.status(401).json({ success: false, message: "Invalid token" });
       return;
    }
    const user: User | null = await UserModel.findById(decoded.userId);
    
    if (!user) {
       res.status(401).json({ success: false, message: "User not found" });
       return;
    }

    if (!user.isPhoneVerified) {
       res.status(401).json({
        success: false,
        message: "Phone number not verified",
      });
      return;
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
    return;
  }
}

export async function isProfileCompleted(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "User not authenticated" });
      return;
    }

    // Check if user has completed their profile (has phone)
    if (!req.user.phone) {
      res.status(403).json({ 
        success: false, 
        message: "Profile not completed",
        requiresProfileUpdate: true
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Profile completion check error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
    return;
  }
}
