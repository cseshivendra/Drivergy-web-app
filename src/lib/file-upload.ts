
'use server';

// This file is deprecated. All file upload logic is now handled in `src/lib/server-actions.ts`.
// This file is kept to prevent build errors from old import paths but should not be used.
// Please update any imports to point to the `uploadFile` function in `server-actions.ts`.

export async function uploadFile(file: File, folder: string): Promise<string> {
    console.warn("DEPRECATED: `uploadFile` is being called from the old `file-upload.ts`. Please update imports to use the function from `server-actions.ts`.");
    
    // For safety, we can re-export the new function here to ensure old call sites still work,
    // though the ideal solution is to update the import paths.
    const { uploadFile: newUploadFile } = await import('./server-actions');
    return newUploadFile(file, folder);
}

    