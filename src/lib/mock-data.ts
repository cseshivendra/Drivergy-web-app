

'use server';

import { cloudinaryConfig } from './cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

/**
 * Uploads a file to Cloudinary.
 * This is a server action and should only be called from server-side code or other server actions.
 * @param file - The file to upload, as a File object.
 * @param folder - The folder in Cloudinary to upload the file to.
 * @returns The secure URL of the uploaded file.
 * @throws An error if the upload fails.
 */
export async function uploadFile(file: File, folder: string): Promise<string> {
    // Direct check for environment variables to provide a clearer error.
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error("Cloudinary environment variables are not set.");
        throw new Error("Cannot upload file: Server storage is not configured. Please contact support.");
    }

    // This will throw an error if config is missing, which will be caught by the calling function.
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

        // Convert the File object to a buffer and then stream it
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
