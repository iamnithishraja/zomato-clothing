import type { Request, Response } from 'express';
import z from 'zod';
import UserModel from '../Models/userModel';
import { verificationFieldsForClient, resolveVerificationStatus } from '../utils/verificationUtils';
import { deleteFileFromR2 } from '../utils/fileUpload';

const documentSchema = z.object({
  documentType: z.enum(['aadhaar', 'other']),
  url: z.string().url(),
  fileName: z.string().trim().max(255).optional(),
});

const submitSchema = z.object({
  documents: z.array(documentSchema).min(1).max(10),
});

export async function getVerificationStatus(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (user.role !== 'Merchant' && user.role !== 'Delivery') {
      return res.status(400).json({
        success: false,
        message: 'Verification is only required for merchants and delivery partners',
      });
    }

    return res.status(200).json({
      success: true,
      ...verificationFieldsForClient(user),
    });
  } catch (error) {
    console.error('getVerificationStatus error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function submitVerificationDocuments(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (user.role !== 'Merchant' && user.role !== 'Delivery') {
      return res.status(400).json({
        success: false,
        message: 'Verification is only required for merchants and delivery partners',
      });
    }

    if (!user.isProfileComplete) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile before submitting verification documents',
      });
    }

    const currentStatus = resolveVerificationStatus(user);
    if (currentStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Your account is already verified',
      });
    }

    if (currentStatus === 'pending_review') {
      return res.status(400).json({
        success: false,
        message: 'Documents already submitted. Please wait for admin review.',
      });
    }

    // rejected and pending_documents can submit (or re-submit)

    const { documents } = submitSchema.parse(req.body);
    const hasAadhaar = documents.some((d) => d.documentType === 'aadhaar');
    if (!hasAadhaar) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar document is required',
      });
    }

    // Remove previous uploads from storage when re-submitting
    if (user.verificationDocuments?.length) {
      await Promise.all(
        user.verificationDocuments.map((doc: { url?: string }) =>
          doc.url ? deleteFileFromR2(doc.url) : Promise.resolve(),
        ),
      );
    }

    const verificationDocuments = documents.map((d) => ({
      documentType: d.documentType,
      url: d.url,
      fileName: d.fileName || `${d.documentType}.pdf`,
      uploadedAt: new Date(),
    }));

    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        verificationDocuments,
        verificationStatus: 'pending_review',
        verificationSubmittedAt: new Date(),
        verificationReviewedAt: null,
        verificationReviewNote: null,
      },
      { returnDocument: 'after' }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Documents submitted successfully. Please wait for verification.',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        gender: updatedUser.gender,
        avatar: updatedUser.avatar,
        addresses: updatedUser.addresses,
        isPhoneVerified: updatedUser.isPhoneVerified,
        isEmailVerified: updatedUser.isEmailVerified,
        isProfileComplete: updatedUser.isProfileComplete,
        role: updatedUser.role,
        ...verificationFieldsForClient(updatedUser),
      },
    });
  } catch (error) {
    console.error('submitVerificationDocuments error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document data',
        errors: error.issues,
      });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
