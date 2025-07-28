
'use server';

import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// This function configures the Cloudinary SDK with your API keys.
// It's called automatically by the upload function.
export const cloudinaryConfig = async () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
};

// This function handles the file upload to Cloudinary.
export const uploadFileToCloudinary = async (fileBuffer: Buffer, folder: string): Promise<string> => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.error("Cloudinary environment variables are not set.");
        throw new Error("Cannot upload file: Server storage is not configured.");
    }

    await cloudinaryConfig();

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
