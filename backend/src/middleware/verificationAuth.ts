import type { Response, NextFunction } from 'express';
import type { CustomRequest } from '../types';
import { isVerificationApproved, resolveVerificationStatus } from '../utils/verificationUtils';

/**
 * Blocks Merchant/Delivery users until admin approves their verification documents.
 */
export function requireApprovedVerification(
  req: CustomRequest,
  res: Response,
  next: NextFunction
): void | Response {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (req.user.role === 'User') {
      return next();
    }

    if (!isVerificationApproved(req.user)) {
      const status = resolveVerificationStatus(req.user);
      return res.status(403).json({
        success: false,
        message: 'Account verification required before using this feature',
        verificationStatus: status,
        code: 'VERIFICATION_REQUIRED',
      });
    }

    return next();
  } catch (error) {
    console.error('Verification authorization error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
