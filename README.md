# Drivergy - Driving School Platform

This is a Next.js application for Drivergy, a modern platform for driving education, built with Next.js, TypeScript, ShadCN UI, Tailwind CSS, and Genkit for AI features.

The project is structured for a dual-purpose experience: a public-facing marketing site and a private, authenticated dashboard for users (customers, trainers, and admins).

## Application Structure

- `src/app/(app)`: Contains all routes and components for the authenticated application dashboard. This includes user profiles, course management, and role-specific views.
- `src/app/site`: Contains all routes for the public-facing website, including the homepage, blog, FAQ, and registration pages.
- `src/components`: Shared React components used across the application.
- `src/lib`: Core logic, utility functions, and data fetching.
- `src/ai`: Contains AI-related code, primarily Genkit flows for features like the chatbot.
- `src/context`: React context providers for managing state like authentication and theme.
- `src/types`: TypeScript type definitions and Zod schemas for data validation.

## Environment Configuration

To run the application, you need to provide environment variables. These are stored in the `.env` file in the root of the project.

### 1. Firebase Configuration

**Client-Side Keys (Public):**
These keys are prefixed with `NEXT_PUBLIC_` and are safe to expose in the browser.
- Go to your **Firebase project settings** (click the ⚙️ gear icon).
- Under the **General** tab, scroll down to **Your apps**.
- Select your web app and find the `firebaseConfig` object.
- Copy the values into the corresponding `NEXT_PUBLIC_` variables in your `.env` file.

**Admin/Server-Side Keys (Secret):**
These keys are used for server-side operations and **must be kept secret**.
- In your Firebase project, go to **Project settings > Service accounts**.
- Click **"Generate new private key"**. A JSON file will be downloaded.
- Open the JSON file and copy the following values into your `.env` file:
    - `project_id` -> `FIREBASE_PROJECT_ID`
    - `client_email` -> `FIREBASE_CLIENT_EMAIL`
    - `private_key` -> `FIREBASE_PRIVATE_KEY` (Copy the entire key, including the `-----BEGIN...` and `-----END...` lines).

### 2. Google AI Key (for Genkit)

This key is required for all AI-powered features, such as the chatbot.
- Go to [**Google AI Studio**](https://aistudio.google.com/app/apikey).
- Click **"Create API key"** in a new or existing Google Cloud project.
- Copy the generated API key.
- Paste it into the `GOOGLE_API_KEY` variable in your `.env` file.

### 3. Other Services
The `.env` file also contains placeholders for email (Nodemailer) and file storage (Cloudinary). Fill these in if you are using these services.

### IMPORTANT: Fixing the Registration "Permission Denied" Error

If you encounter a "PERMISSION_DENIED" or "Caller does not have required permission" error during user registration, it means the server-side service account is missing a required role in Google Cloud.

Follow these steps to fix it:

1.  **Go to the IAM page** in your Google Cloud Console for the `driveview-pfyzq` project. You can use this direct link: [https://console.cloud.google.com/iam-admin/iam?project=driveview-pfyzq](https://console.cloud.google.com/iam-admin/iam?project=driveview-pfyzq)
2.  Click the **"+ GRANT ACCESS"** button at the top of the page.
3.  In the "New principals" field, paste the following service account email:
    `firebase-adminsdk-fbsvc@driveview-pfyzq.iam.gserviceaccount.com`
4.  In the "Assign roles" dropdown, search for and select the **"Service Usage Consumer"** role.
5.  Click **"Save"**.
6.  **Wait for 1-2 minutes** for the permission to apply across Google's systems, then try registering a user again.

### IMPORTANT: Deployment
When you deploy to a hosting service like **Vercel** or **Firebase App Hosting**, you must add these same environment variables to your project's settings on that platform. They will not be deployed from your local `.env` file.

## Local Development

1.  **Install dependencies:** `npm install`
2.  **Run the development server:** `npm run dev`
    - The app will be available at `http://localhost:9002`.

## Deployment to Vercel

This project is configured for seamless deployment to Vercel.

- **Automatic Deployments:** Every time you push a commit to the `main` branch on GitHub, Vercel will automatically start a new build and deploy the changes, provided your environment variables are set correctly on Vercel.
- **Manual Redeployment:** To manually trigger a new build, go to your project on the Vercel Dashboard, navigate to the **"Deployments"** tab, and use the "Redeploy" option on the latest deployment from the `main` branch.
