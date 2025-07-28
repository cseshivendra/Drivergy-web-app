
'use server';

import type { ApprovalStatusType, TrainerRegistrationFormValues, VehicleType, FullCustomerDetailsValues } from '@/types';
import { revalidatePath } from 'next/cache';
import { sendEmail } from './email';
import { format } from 'date-fns';
import { cloudinaryConfig } from './cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';


export async function uploadFile(file: File, folder: string): Promise<string> {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error("Cloudinary environment variables are not set.");
        throw new Error("Cannot upload file: Server storage is not configured. Please contact support.");
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


interface UpdateStatusArgs {
    userId: string;
    newStatus: ApprovalStatusType;
}

const generateId = (): string => {
    return Math.random().toString(36).substring(2, 10);
};

export async function updateUserApprovalStatus({ userId, newStatus }: UpdateStatusArgs) {
    console.warn("updateUserApprovalStatus is a mock function. No database is connected.");
    return { success: true };
}

export async function sendPasswordResetLink(email: string): Promise<{ success: boolean; error?: string }> {
    console.warn("sendPasswordResetLink is a mock function. No database is connected.");
    return { success: true };
}

export const registerTrainerAction = async (formData: FormData): Promise<{ success: boolean, error?: string }> => {
    console.warn("registerTrainerAction is a mock function. No database is connected.");
    return { success: true };
}


export const completeCustomerProfileAction = async (userId: string, formData: FormData): Promise<{ success: boolean, error?: string }> => {
    console.warn("completeCustomerProfileAction is a mock function. No database is connected.");
    return { success: true };
};
