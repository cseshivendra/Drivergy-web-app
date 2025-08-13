import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

  test('should allow a user to register for a customer account', async ({ page }) => {
    await page.goto('/register');

    // Choose customer role
    await page.getByRole('button', { name: "I'm a Customer" }).click();
    
    // Ensure the customer form is visible
    await expect(page.getByRole('heading', { name: 'Register as a Customer' })).toBeVisible();

    // Fill out the registration form
    const uniqueId = `testuser_${Date.now()}`;
    await page.getByLabel('Username').fill(uniqueId);
    await page.getByLabel('Email Address').fill(`${uniqueId}@example.com`);
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm Password').fill('Password123!');
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Phone Number').fill('1234567890');

    // Submit the form
    await page.getByRole('button', { name: 'Register Customer' }).click();

    // Expect to be redirected to the pricing/subscriptions section on the homepage
    await expect(page).toHaveURL(/.*#subscriptions/);
    await expect(page.getByRole('heading', { name: 'Affordable Driving Lesson Prices' })).toBeVisible();

    // Check for the success toast
    await expect(page.getByText('Registration Successful!')).toBeVisible();
  });

  test('should allow a registered user to log in and see the dashboard', async ({ page }) => {
    await page.goto('/login');

    // Use existing mock user credentials
    await page.getByLabel('Email or Username').fill('customer@drivergy.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Expect to be redirected to the dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Check for a welcome message on the dashboard
    await expect(page.getByRole('heading', { name: /Welcome, Priya Sharma!/ })).toBeVisible();
  });

  test('should show an error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email or Username').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Check for the error toast message
    await expect(page.getByText('Login Failed')).toBeVisible();
    await expect(page.getByText('Invalid credentials. Please try again or register a new account.')).toBeVisible();

    // Ensure we are still on the login page
    await expect(page).toHaveURL(/.*\/login/);
  });

});
