
'use server';

import { v2 as cloudinary } from 'cloudinary';
import { toast } from '@/hooks/use-toast';

// This function is designed to run only on the server.
export const uploadFileAndGetURL = async (file: File, public_id: string): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                public_id: public_id,
                overwrite: true,
                folder: 'drivergy',
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    toast({ title: "Upload Error", description: "Could not upload file to Cloudinary.", variant: "destructive" });
                    reject(error);
                } else if (result) {
                    resolve(result.secure_url);
                } else {
                    reject(new Error("Cloudinary upload did not return a result."));
                }
            }
        );
        uploadStream.end(buffer);
    });
};
