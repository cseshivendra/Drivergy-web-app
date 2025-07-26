'use server';

import { cloudinaryConfig } from './cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

/**
 * DEPRECATED: This function is being moved to server-actions.ts to avoid circular dependencies.
 * Please use the version from server-actions.ts instead.
 */
export async function uploadFile(file: File, folder: string): Promise<string> {
    console.warn("DEPRECATED: uploadFile is being called from file-upload.ts. Please update to use the function from server-actions.ts.");

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error("Cloudinary environment variables are not set.");
        throw new Error("Cannot upload file: Server storage is not configured. Please contact support.");
    }

    await cloudinaryConfig();

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: "auto"
            },
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

        file.arrayBuffer()
            .then(buffer => {
                streamifier.createReadStream(Buffer.from(buffer)).pipe(stream);
            })
            .catch(error => {
                console.error('Error converting file to buffer:', error);
                reject(new Error('Failed to read file for upload.'));
            });
    });
}
