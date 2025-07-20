'use server';

import { v2 as cloudinary } from 'cloudinary';

let isConfigured = false;

export const cloudinaryConfig = async () => {
    if (isConfigured) {
        return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        console.warn("Cloudinary configuration is missing. File uploads will not work.");
        return;
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });

    isConfigured = true;
    console.log("Cloudinary configured successfully.");
};
