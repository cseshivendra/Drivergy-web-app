
'use server';

import { z } from 'zod';
import { RegistrationFormSchema, FullCustomerDetailsSchema, BlogPostSchema } from '@/types';
import type { UserProfile, ApprovalStatusType, PayoutStatusType, RescheduleRequestStatusType, UserProfileUpdateValues, BlogPostFormValues, RescheduleRequest } from '@/types';
import { allUsers, fetchUserById, updateUserInMockDB, mockBlogPosts, mockRescheduleRequests, mockFeedback, mockReferrals } from './mock-data';
import { format } from 'date-fns';

// =================================================================
// MOCK SERVER ACTIONS - Now interacts with stateful mock data
// =================================================================

export async function registerUserAction(prevState: any, formData: FormData): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    console.log("Mock registerUserAction called.");
    try {
        const data = Object.fromEntries(formData.entries());
        const validationResult = RegistrationFormSchema.safeParse(data);

        if (!validationResult.success) {
            const formattedErrors = validationResult.error.format();
            console.error("Registration validation failed:", formattedErrors);
            return { success: false, error: 'Invalid form data provided. Please check the fields and try again.' };
        }
        
        const { email, username, userRole } = validationResult.data;
        const existingUser = allUsers.find(u => u.contact.toLowerCase() === email.toLowerCase() || (u.username && u.username.toLowerCase() === username.toLowerCase()));
        if (existingUser) {
            return { success: false, error: 'A user is already registered with this email or username.' };
        }

        const newUser: UserProfile = {
            id: `mock-user-${Date.now()}`,
            uniqueId: `${userRole === 'customer' ? 'CU' : 'TR'}-${Date.now().toString().slice(-6)}`,
            name: validationResult.data.name,
            username: validationResult.data.username,
            contact: validationResult.data.email,
            phone: validationResult.data.phone,
            gender: validationResult.data.gender,
            password: validationResult.data.password, 
            subscriptionPlan: 'None',
            registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
            approvalStatus: 'Pending',
        };
        
        if (userRole === 'trainer' && 'location' in validationResult.data) {
            Object.assign(newUser, {
                subscriptionPlan: 'Trainer',
                location: validationResult.data.location,
                specialization: validationResult.data.specialization,
                yearsOfExperience: validationResult.data.yearsOfExperience,
                vehicleInfo: validationResult.data.trainerVehicleType,
            });
        } else if (userRole === 'customer') {
            Object.assign(newUser, {
                trainerPreference: validationResult.data.trainerPreference
            });
        }
        
        allUsers.push(newUser);
        
        console.log("Simulating successful user registration for:", email);
        console.log("Total users in mock DB:", allUsers.length);
        
        return { success: true, user: newUser };

    } catch (error: any) {
        console.error("Error in mock registerUserAction:", error);
        return { success: false, error: 'An unexpected server error occurred.' };
    }
}

export async function sendPasswordResetLink(email: string): Promise<{ success: boolean; error?: string }> {
    console.log(`Simulating password reset link sent to ${email}.`);
    return { success: true };
}

export async function updateUserApprovalStatus({ userId, newStatus }: { userId: string; newStatus: ApprovalStatusType; }): Promise<{ success: boolean; error?: string }> {
    console.log(`Updating status for user ${userId} to ${newStatus}.`);
    const user = await fetchUserById(userId);
    if (user) {
        user.approvalStatus = newStatus;
        updateUserInMockDB(user);
        return { success: true };
    }
    return { success: false, error: 'User not found' };
}

export const completeCustomerProfileAction = async (prevState: any, formData: FormData): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    try {
        const data = Object.fromEntries(formData.entries());
        
        const userId = data.userId as string;
        if (!userId) {
            return { success: false, error: 'User ID is missing from the form submission.' };
        }

        let user = await fetchUserById(userId);
        if (!user) {
            return { success: false, error: `User with ID ${userId} not found.` };
        }
        
        if (data.photoIdFile && typeof data.photoIdFile === 'object' && 'size' in data.photoIdFile) {
           if ((data.photoIdFile as File).size === 0) {
               data.photoIdFile = undefined;
           }
        } else {
            data.photoIdFile = undefined;
        }

        const validationResult = FullCustomerDetailsSchema.safeParse(data);

        if (!validationResult.success) {
            console.error("Profile completion validation error:", validationResult.error.format());
            return { success: false, error: "The provided information was invalid. Please check the fields and try again." };
        }

        const profileData = validationResult.data;
        const photoIdUrl = `https://placehold.co/mock-file/${Date.now()}.pdf`;

        Object.assign(user, {
            ...profileData,
            photoIdUrl: photoIdUrl,
            subscriptionStartDate: format(profileData.subscriptionStartDate, 'MMM dd, yyyy'),
            approvalStatus: 'Pending', // Awaiting trainer assignment
        });
        
        if (profileData.referralCode) {
            const referrer = allUsers.find(u => u.myReferralCode === profileData.referralCode);
            if (referrer) {
                mockReferrals.push({
                    id: `ref-${Date.now()}`,
                    referrerId: referrer.id,
                    refereeId: user.id,
                    refereeName: user.name,
                    status: 'Successful',
                    pointsEarned: 100,
                    payoutStatus: 'Pending',
                    timestamp: format(new Date(), 'MMM dd, yyyy'),
                    refereeUniqueId: user.uniqueId,
                    refereeSubscriptionPlan: user.subscriptionPlan,
                    refereeApprovalStatus: 'Pending'
                });
            }
        }

        updateUserInMockDB(user);
        console.log(`Successfully completed profile for user ${userId}.`);
        
        const updatedUser = await fetchUserById(userId);
        return { success: true, user: updatedUser! };

    } catch (error) {
        console.error("Error in completeCustomerProfileAction:", error);
        return { success: false, error: "An unexpected server error occurred during profile update." };
    }
};

export async function assignTrainerToCustomer(customerId: string, trainerId: string): Promise<boolean> {
    console.log(`Assigning trainer ${trainerId} to customer ${customerId}.`);
    const customer = await fetchUserById(customerId);
    const trainer = await fetchUserById(trainerId);
    if (customer && trainer) {
        customer.assignedTrainerId = trainerId;
        customer.assignedTrainerName = trainer.name;
        customer.approvalStatus = 'In Progress'; // Now waiting for trainer to accept
        updateUserInMockDB(customer);
        return true;
    }
    return false;
};

export async function updateAssignmentStatusByTrainer(customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> {
    console.log(`Updating assignment status for customer ${customerId} to ${newStatus}.`);
    const customer = await fetchUserById(customerId);
    if (customer) {
        customer.approvalStatus = newStatus;
        if(newStatus === 'Approved' && !customer.upcomingLesson) {
            // Schedule first lesson
            const startDate = customer.subscriptionStartDate ? parse(customer.subscriptionStartDate, 'MMM dd, yyyy', new Date()) : new Date();
            customer.upcomingLesson = format(addDays(startDate, 2), 'MMM dd, yyyy, 10:00 AM');
        }
        updateUserInMockDB(customer);
        return true;
    }
    return false;
}

export async function updateUserAttendance(studentId: string, status: 'Present' | 'Absent'): Promise<boolean> {
    console.log(`Updating attendance for student ${studentId} to ${status}.`);
    const student = await fetchUserById(studentId);
    if(student){
        student.attendance = status;
        if(status === 'Present'){
            student.completedLessons = (student.completedLessons || 0) + 1;
        }
        updateUserInMockDB(student);
        return true;
    }
    return false;
}

export async function updateSubscriptionStartDate(customerId: string, newDate: Date): Promise<UserProfile | null> {
    console.log(`Updating subscription start date for ${customerId}.`);
    const customer = await fetchUserById(customerId);
    if(customer) {
        customer.subscriptionStartDate = format(newDate, 'MMM dd, yyyy');
        // Also update upcoming lesson based on new start date
        customer.upcomingLesson = format(addDays(newDate, 2), 'MMM dd, yyyy, 10:00 AM');
        updateUserInMockDB(customer);
        return customer;
    }
    return null;
}

export async function addRescheduleRequest(userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<boolean> {
    console.log(`Adding reschedule request for ${customerName}.`);
    const newRequest: RescheduleRequest = {
        id: `resched-${Date.now()}`,
        userId: userId,
        customerName: customerName,
        originalLessonDate: format(originalDate, 'MMM dd, yyyy, h:mm a'),
        requestedRescheduleDate: format(newDate, 'MMM dd, yyyy, h:mm a'),
        status: 'Pending',
        requestTimestamp: format(new Date(), 'MMM dd, yyyy'),
    };
    mockRescheduleRequests.push(newRequest);
    return true;
}

export async function updateRescheduleRequestStatus(requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> {
    console.log(`Updating reschedule request ${requestId} status to ${newStatus}.`);
    const requestIndex = mockRescheduleRequests.findIndex(r => r.id === requestId);
    if (requestIndex !== -1) {
        mockRescheduleRequests[requestIndex].status = newStatus;
        
        // If approved, update the customer's upcoming lesson
        if (newStatus === 'Approved') {
            const customer = await fetchUserById(mockRescheduleRequests[requestIndex].userId);
            if (customer) {
                customer.upcomingLesson = mockRescheduleRequests[requestIndex].requestedRescheduleDate;
                updateUserInMockDB(customer);
            }
        }
        return true;
    }
    return false;
}

export async function addFeedback(customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> {
    console.log(`Adding feedback from ${customerName} for ${trainerName}.`);
    const customer = await fetchUserById(customerId);
    if(customer){
        customer.feedbackSubmitted = true;
        updateUserInMockDB(customer);
        mockFeedback.push({
            id: `fb-${Date.now()}`,
            customerId, customerName, trainerId, trainerName, rating, comment,
            submissionDate: format(new Date(), 'MMM dd, yyyy')
        });
        return true;
    }
    return false;
}

export async function updateReferralPayoutStatus(referralId: string, status: PayoutStatusType): Promise<boolean> {
    console.log(`Updating referral payout status for ${referralId} to ${status}.`);
    const refIndex = mockReferrals.findIndex(r => r.id === referralId);
    if (refIndex !== -1) {
        mockReferrals[refIndex].payoutStatus = status;
        return true;
    }
    return false;
}

export async function updateUserProfile(userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> {
    console.log(`Updating profile for user ${userId}.`);
    const user = await fetchUserById(userId);
    if(user){
        Object.assign(user, data);
        updateUserInMockDB(user);
        return user;
    }
    return null;
};

export async function addBlogPost(data: BlogPostFormValues): Promise<boolean> {
    const existingPost = mockBlogPosts.find(p => p.slug === data.slug);
    if (existingPost) {
        throw new Error("A post with this slug already exists.");
    }
    const newPost = {
        ...data,
        imageSrc: data.imageSrc || 'https://placehold.co/1200x800.png',
        date: format(new Date(), 'LLL d, yyyy'),
    };
    mockBlogPosts.unshift(newPost);
    return true;
}

export async function updateBlogPost(slug: string, data: BlogPostFormValues): Promise<boolean> {
    const postIndex = mockBlogPosts.findIndex(p => p.slug === slug);
    if (postIndex === -1) {
        return false;
    }
    const updatedPost = {
        ...mockBlogPosts[postIndex],
        ...data,
        slug: slug,
    };
    mockBlogPosts[postIndex] = updatedPost;
    return true;
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
    const initialLength = mockBlogPosts.length;
    const posts = mockBlogPosts.filter(p => p.slug !== slug);
    const success = posts.length < initialLength;
    if (success) {
        while (mockBlogPosts.length > 0) { mockBlogPosts.pop(); }
        posts.forEach(p => mockBlogPosts.push(p));
    }
    return success;
}

export async function changeUserPassword(userId: string, currentPass: string, newPass: string): Promise<boolean> {
    console.log(`Simulating password change for user ${userId}.`);
    const user = await fetchUserById(userId);
    if (user && user.password === currentPass) {
        user.password = newPass;
        updateUserInMockDB(user);
        return true;
    }
    return false;
}
