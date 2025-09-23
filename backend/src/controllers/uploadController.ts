import type { Request, Response } from 'express';
import { generateUploadUrlProfile } from "../utils/fileUpload";
import { v4 as uuidv4 } from 'uuid';

// Generate upload URL for single file upload
export const generateUploadUrl = async (req: Request, res: Response): Promise<void> => {
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

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
        if (!allowedTypes.includes(fileType)) {
            res.status(400).json({
                success: false,
                message: "File type not supported. Allowed types: " + allowedTypes.join(', ')
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

// Generate multiple upload URLs for batch uploads
export const generateMultipleUploadUrls = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        const { files, role = 'Merchant' } = req.body;

        console.log('Multiple upload request received:', { 
            userId: user?._id, 
            userRole: user?.role, 
            filesCount: files?.length, 
            role 
        });

        if (!user) {
            res.status(401).json({ 
                success: false,
                message: 'User not authenticated' 
            });
            return;
        }

        if (!files || !Array.isArray(files) || files.length === 0) {
            res.status(400).json({
                success: false,
                message: "Files array is required and must not be empty"
            });
            return;
        }

        if (files.length > 10) {
            res.status(400).json({
                success: false,
                message: "Maximum 10 files allowed per batch"
            });
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
        
        // Validate all files
        for (const file of files) {
            if (!file.fileType || !file.fileName) {
                res.status(400).json({
                    success: false,
                    message: "Each file must have fileType and fileName"
                });
                return;
            }
            
            if (!allowedTypes.includes(file.fileType)) {
                res.status(400).json({
                    success: false,
                    message: `File type ${file.fileType} not supported. Allowed types: ${allowedTypes.join(', ')}`
                });
                return;
            }
        }

        // Generate upload URLs for all files
        const uploadResults = await Promise.all(
            files.map(async (file: { fileType: string; fileName: string; isPermanent?: boolean }) => {
                try {
                    const { uploadUrl, publicUrl } = await generateUploadUrlProfile(
                        file.fileType,
                        file.fileName,
                        role,
                        user._id.toString(),
                        file.isPermanent || false
                    );
                    
                    return {
                        fileName: file.fileName,
                        fileType: file.fileType,
                        uploadUrl,
                        publicUrl
                    };
                } catch (error) {
                    console.error(`Error generating upload URL for ${file.fileName}:`, error);
                    return {
                        fileName: file.fileName,
                        fileType: file.fileType,
                        error: "Failed to generate upload URL"
                    };
                }
            })
        );

        const successful = uploadResults.filter(result => !result.error);
        const failed = uploadResults.filter(result => result.error);

        res.status(200).json({
            success: true,
            results: uploadResults,
            successful: successful.length,
            failed: failed.length,
            message: `${successful.length} upload URLs generated successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`
        });
    } catch (error) {
        console.error("Error generating multiple upload URLs:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate upload URLs"
        });
    }
};
