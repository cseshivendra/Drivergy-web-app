
'use server';

import { createNewUser } from './mock-data';
import type { RegistrationFormValues } from '@/types';
import { RegistrationFormSchema } from '@/types';

// This is a server action that can be called from client components.
export async function registerUserAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const data = Object.fromEntries(formData.entries());

        const files: { [key: string]: File | null } = {
            trainerCertificateFile: formData.get('trainerCertificateFile') as File | null,
            drivingLicenseFile: formData.get('drivingLicenseFile') as File | null,
            aadhaarCardFile: formData.get('aadhaarCardFile') as File | null,
        };
        
        const combinedData = { ...data, ...files };

        const validationResult = RegistrationFormSchema.safeParse(combinedData);

        if (!validationResult.success) {
            const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { success: false, error: `Invalid form data: ${errorMessages}` };
        }

        const validatedData = validationResult.data;

        // Call the centralized function to create the user in the database
        const result = await createNewUser(validatedData, files);

        if (!result.success) {
            return { success: false, error: result.error };
        }

        return { success: true };

    } catch (error) {
        console.error("Error in registerUserAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected server error occurred.";
        return { success: false, error: errorMessage };
    }
}
