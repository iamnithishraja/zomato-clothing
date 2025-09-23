import type { Response, NextFunction } from "express";
import type { CustomRequest } from "../types";
import type { UserRole } from "../types/user";

/**
 * Middleware to check if user has required role
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export function requireRole(allowedRoles: UserRole[]) {
    return (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
                });
            }

            next();
        } catch (error) {
            console.error("Role authorization error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    };
}

/**
 * Middleware specifically for merchant-only routes
 */
export const requireMerchant = requireRole(['Merchant']);

/**
 * Middleware specifically for delivery-only routes
 */
export const requireDelivery = requireRole(['Delivery']);

/**
 * Middleware for both merchant and delivery roles
 */
export const requireMerchantOrDelivery = requireRole(['Merchant', 'Delivery']);

/**
 * Middleware for all authenticated users (User, Merchant, Delivery)
 */
export const requireAnyRole = requireRole(['User', 'Merchant', 'Delivery']);

/**
 * Middleware to check if user is a merchant and owns the resource
 * This should be used after requireMerchant middleware
 */
export function requireMerchantOwnership(resourceField: string = 'merchantId') {
    return (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            if (req.user.role !== 'Merchant') {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Merchant role required"
                });
            }

            // Check if the resource belongs to the merchant
            const resourceId = req.params.id || req.body[resourceField] || req.query[resourceField];
            
            if (!resourceId) {
                return res.status(400).json({
                    success: false,
                    message: `Resource ID not provided in ${resourceField}`
                });
            }

            // Store the merchant ID for use in controllers
            (req.user as any).merchantId = req.user._id;
            
            next();
        } catch (error) {
            console.error("Merchant ownership check error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    };
}
