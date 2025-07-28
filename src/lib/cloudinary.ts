

'use server';

// =================================================================
// CLOUDINARY IS DISABLED - APP IS RUNNING IN OFFLINE MOCK MODE
// =================================================================
// This file has been updated to support offline mock mode.
// The uploadFile function will now return a placeholder URL instead
// of connecting to the live Cloudinary service.

export const cloudinaryConfig = async () => {
    // In mock mode, we do not configure the Cloudinary SDK.
    console.log("Cloudinary is in mock mode. No connection will be made.");
};

export const uploadFileToCloudinary = async (fileBuffer: Buffer, folder: string): Promise<string> => {
    console.log(`Mock Upload: Simulating upload of a file to folder: ${folder}`);
    // Return a placeholder image URL for mock purposes.
    return Promise.resolve("https://placehold.co/600x400.png");
};
