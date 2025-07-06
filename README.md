# Drivergy - Driving School Platform

This is a Next.js application for Drivergy, a modern platform for driving education, built with Next.js, TypeScript, ShadCN UI, Tailwind CSS, and Genkit for AI features.

The project is structured for a dual-purpose experience: a public-facing marketing site and a private, authenticated dashboard for users (customers, trainers, and admins).

## Application Structure

- `src/app/(app)`: Contains all routes and components for the authenticated application dashboard. This includes user profiles, course management, and role-specific views.
- `src/app/site`: Contains all routes for the public-facing website, including the homepage, blog, FAQ, and registration pages.
- `src/components`: Shared React components used across the application.
  - `components/ui`: ShadCN UI components.
  - `components/dashboard`: Components specific to the admin/user dashboards.
  - `components/forms`: Reusable form components.
- `src/lib`: Core logic, utility functions, and data fetching.
  - `lib/mock-data.ts`: Contains all the data fetching logic. It's designed to work with a live Firebase database but falls back to local mock data if Firebase keys are not provided.
- `src/ai`: Contains AI-related code, primarily Genkit flows for features like the chatbot.
- `src/context`: React context providers for managing state like authentication and theme.
- `src/types`: TypeScript type definitions and Zod schemas for data validation.

## Environment Configuration (`.env.local`)

To connect the application to your own Firebase backend and enable AI features, you need to create a `.env.local` file in the root of your project.

1.  **Create the file:**
    ```bash
    touch .env.local
    ```
2.  **Add your configuration keys:** Open the `.env.local` file and add the following variables, replacing the placeholder values with your actual keys.

    ```
    # Firebase Configuration
    # You can get these from your Firebase project settings
    NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
    NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID

    # Google AI (for Genkit Chatbot)
    # Get this from Google AI Studio: https://aistudio.google.com/app/apikey
    GOOGLE_API_KEY=YOUR_GOOGLE_AI_API_KEY
    ```

**Important:** If these keys are not provided, the app will run in a local-only "mock" mode, which is useful for UI development but will not connect to a live database.

## Local Development

To run the application on your local machine, follow these steps:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the Next.js application on `http://localhost:9002`.

## Deployment to Vercel

This project is configured for seamless deployment to Vercel.

- **Automatic Deployments:** Every time you push a commit to the `main` branch on GitHub, Vercel will automatically start a new build and deploy the changes.

- **Manual Redeployment:** If for any reason a new commit does not trigger a build, you can manually redeploy the latest version:
    1.  Go to your project on the Vercel Dashboard.
    2.  Navigate to the **"Deployments"** tab.
    3.  Find the most recent deployment from the `main` branch at the top of the list.
    4.  Click the `...` (more options) menu on the right side of that deployment row.
    5.  Select **"Redeploy"** from the menu.

This will force Vercel to start a new build using the latest committed code.
