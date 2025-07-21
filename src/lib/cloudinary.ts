
'use server';

import { v2 as cloudinary } from 'cloudinary';

// This file configures the Cloudinary SDK.
// It's marked with 'use server' to ensure this code only runs on the server.

let isConfigured = false;

export const cloudinaryConfig = async () => {
    if (isConfigured) {
        return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        console.error("Cloudinary environment variables are not set.");
        throw new Error("Cloudinary configuration is missing.");
    }
    
    try {
        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
        });
        isConfigured = true;
    } catch (error) {
        console.error("Error configuring Cloudinary:", error);
    }
};
