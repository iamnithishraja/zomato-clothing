import jwt from 'jsonwebtoken';

export function generateToken(userId: string): string {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables.");
    }
	return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "365d" });
}

export function generateAdminToken(adminId: string): string {
    const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET;
    if (!JWT_ADMIN_SECRET) {
        throw new Error("JWT_ADMIN_SECRET is not defined in environment variables.");
    }
	return jwt.sign({ adminId, type: "admin" }, JWT_ADMIN_SECRET, { expiresIn: "7d" });
}