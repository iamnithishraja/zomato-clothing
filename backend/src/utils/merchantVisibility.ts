import UserModel from '../Models/userModel';
import type { Types } from 'mongoose';
import { isVerificationApproved } from './verificationUtils';

/** Merchant IDs whose stores/products are visible to customers. */
export async function getApprovedMerchantIds(): Promise<Types.ObjectId[]> {
  const merchants = await UserModel.find({ role: 'Merchant' })
    .select('_id verificationStatus isProfileComplete role')
    .lean();

  return merchants
    .filter((m) => isVerificationApproved(m))
    .map((m) => m._id as Types.ObjectId);
}
