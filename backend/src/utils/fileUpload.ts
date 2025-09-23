import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS SDK v3
const s3Client = new S3Client({
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY || '',
        secretAccessKey: process.env.R2_SECRET_KEY || '',
    },
    region: 'auto'
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'klinic-bucket';

// Generate a presigned URL for file upload
export const generateUploadUrlProfile = async (
    fileType: string, 
    fileName: string, 
    role: string, 
    userId: string, 
    isPermanent: boolean = false
): Promise<{ uploadUrl: string; publicUrl: string }> => {
    try {
        const fileExtension = fileName.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        
        // Determine the appropriate path based on file type and role
        let key: string;
        if (fileType === 'application/pdf') {
            // PDFs go into a separate folder
            key = `${role}/${userId}/pdfs/${uniqueFileName}`;
        } else if (fileName.toLowerCase().includes('cover')) {
            // Cover images go into a separate folder
            key = `${role}/${userId}/cover/${uniqueFileName}`;
        } else if (fileName.toLowerCase().includes('product')) {
            // Product images go into a separate folder
            key = `${role}/${userId}/products/${uniqueFileName}`;
        } else {
            // Profile pictures go into the root of the user's folder
            key = `${role}/${userId}/profile/${uniqueFileName}`;
        }

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: getMimeType(fileExtension || '')
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
        
        // Generate the public URL that will be accessible after upload
        const publicUrl = `https://pub-0f703feb53794f768ba649b826a64db4.r2.dev/${key}`;
        
        return { uploadUrl, publicUrl };
    } catch (error) {
        console.error('Error generating upload URL:', error);
        throw new Error('Failed to generate upload URL');
    }
};

// Delete file from R2 storage
export const deleteFileFromR2 = async (fileUrl: string): Promise<void> => {
    try {
        if (!fileUrl) return;
        
        // Extract the key from the URL
        // Example URL: https://pub-0f703feb53794f768ba649b826a64db4.r2.dev/user/6820f9377f5263b276ea76e9/33614f5c-084e-4725-b339-46056f7be568.pdf
        
        // Parse the URL to extract just the path portion
        const url = new URL(fileUrl);
        const key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
        
        console.log(`Attempting to delete file with key: ${key}`);
        console.log(`Using bucket: ${BUCKET_NAME}`);
        
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });
        
        await s3Client.send(command);
        console.log(`File deleted: ${key}`);
    } catch (error) {
        console.error('Error deleting file from R2:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        // We don't throw here to prevent the main operation from failing
        // if file deletion fails
    }
};

// Helper function to determine MIME type based on file extension
const getMimeType = (extension: string): string => {
    const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'm4v': 'video/x-m4v',
        'webm': 'video/webm',
        'txt': 'text/plain',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}; 