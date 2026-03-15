import type { Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import AdminModel from "./admin.model";
import type { CustomRequest } from "../types";
import type { Admin } from "../types/admin";

export async function isAdminAuthenticated(
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
      process.env.JWT_ADMIN_SECRET!
    ) as JwtPayload;
    
    if (!decoded || !decoded.adminId || decoded.type !== "admin") {
      res.status(401).json({ success: false, message: "Invalid admin token" });
      return;
    }
    
    const admin: Admin | null = await AdminModel.findById(decoded.adminId);
    
    if (!admin) {
      res.status(401).json({ success: false, message: "Admin not found" });
      return;
    }

    // Check if admin is active
    if (!admin.isActive) {
      res.status(401).json({
        success: false,
        message: "Admin account is deactivated",
      });
      return;
    }
    
    // Remove sensitive data from request object
    const adminResponse = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.otp;
    
    req.admin = adminResponse;
    next();
  } catch (error) {
    console.error("Admin authentication error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, message: "Invalid token" });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: "Token expired" });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error" });
    return;
  }
}
