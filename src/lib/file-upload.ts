'use server';

import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfig } from './cloudinary';

// This is a server action that handles file uploads.
// It ensures Cloudinary is configured and then uploads the file.
export async function uploadFile(file: File): Promise<string | null> {
    // Ensure the Cloudinary config is set up.
    await cloudinaryConfig();

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                resource_type: 'auto', // Automatically detect file type (image, video, pdf)
            }, (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error("Cloudinary upload failed with no result."));
                }
            }).end(buffer);
        });

        return uploadResult.secure_url;
    } catch (error) {
        console.error("Upload Error:", error);
        return null;
    }
}
