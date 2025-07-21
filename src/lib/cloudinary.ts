// This file is meant to be run on the server only.
// It handles the configuration and upload logic for Cloudinary.
import { v2 as cloudinary } from 'cloudinary';

let isConfigured = false;

// This function initializes the Cloudinary SDK with your credentials.
// It's designed to run only once.
export const cloudinaryConfig = async () => {
    if (isConfigured) {
        return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        console.warn("Cloudinary environment variables are not set. File uploads will not work.");
        return;
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });
    
    isConfigured = true;
    console.log("Cloudinary configured successfully.");
};
