import type { Request, Response } from 'express';
import { generateUploadUrlProfile, deleteFileFromR2 } from "../utils/fileUpload";

export const getUploadUrl = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        const { fileType, fileName, isPermanent, role = 'Merchant' } = req.body;

        console.log('Upload request received:', { 
            userId: user?._id, 
            userRole: user?.role, 
            fileType, 
            fileName, 
            role 
        });

        if (!user) {
            res.status(401).json({ 
                success: false,
                message: 'User not authenticated' 
            });
            return;
        }

        if (!fileType || !fileName) {
            res.status(400).json({ 
                success: false,
                message: 'File type and name are required' 
            });
            return;
        }

        // Validate file type - Accept all common image and video formats
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml',
            'video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm', 'video/avi', 'video/mov'
        ];
        
        // Also accept generic image/* and video/* types
        const isImageType = fileType.startsWith('image/');
        const isVideoType = fileType.startsWith('video/');
        const isAllowedType = allowedTypes.includes(fileType) || isImageType || isVideoType;
        
        if (!isAllowedType) {
            res.status(400).json({
                success: false,
                message: "File type not supported. Allowed types: images and videos"
            });
            return;
        }

        // Generate a presigned URL for uploading
        const { uploadUrl, publicUrl } = await generateUploadUrlProfile(
            fileType,
            fileName,
            role,
            user._id.toString(),
            isPermanent || false
        );

        res.status(200).json({ 
            success: true,
            uploadUrl, 
            publicUrl,
            fileType,
            fileName
        });
    } catch (error) {
        console.error('Error generating upload URL:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to generate upload URL' 
        });
    }
};

// Delete file from R2 storage
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        const { fileUrl } = req.body;

        console.log('Delete request received:', { 
            userId: user?._id, 
            userRole: user?.role, 
            fileUrl
        });

        if (!user) {
            res.status(401).json({ 
                success: false,
                message: 'User not authenticated' 
            });
            return;
        }

        if (!fileUrl) {
            res.status(400).json({ 
                success: false,
                message: 'File URL is required' 
            });
            return;
        }

        // Delete file from R2 storage
        await deleteFileFromR2(fileUrl);

        res.status(200).json({ 
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete file' 
        });
    }
};
