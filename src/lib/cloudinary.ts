
'use server';

import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// It is crucial that this configuration is ONLY done in a server-side context.
// This function should be called within a Server Action or a Route Handler.
export const initializeCloudinary = async () => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.warn("Cloudinary environment variables not fully set. File uploads will fail.");
        return;
    }
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
};

export const uploadFileToCloudinary = async (fileBuffer: Buffer, folder: string): Promise<string> => {
    // Ensure config is set before an upload attempt
    await initializeCloudinary();
    
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: folder, resource_type: "auto" },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(new Error('File upload to Cloudinary failed.'));
                } else if (result) {
                    resolve(result.secure_url);
                } else {
                    reject(new Error('File upload failed: No result from Cloudinary.'));
                }
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};
