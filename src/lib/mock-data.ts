
import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues, FaqItem, BlogPost, SiteBanner, PromotionalPoster, FaqFormValues, BlogPostFormValues, VisualContentFormValues, FullCustomerDetailsValues, RegistrationFormValues, AdminDashboardData } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';
import { initializeFirebaseApp } from '@/lib/firebase/client';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, writeBatch, documentId, orderBy, limit, setDoc, onSnapshot } from 'firebase/firestore';
import type { FirebaseOptions } from 'firebase/app';


// Helper to get initialized client DB instance
const getClientDb = () => {
    const firebaseConfig: FirebaseOptions = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    try {
        const { db } = initializeFirebaseApp();
        return db;
    } catch(e) {
        console.warn("Client DB not available", e);
        return null;
    }
}


// =================================================================
// USER MANAGEMENT - READ OPERATIONS
// =================================================================

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
    const db = getClientDb();
    if (!db) return null;

    const collectionsToSearch = ['customers', 'trainers'];
    for (const col of collectionsToSearch) {
        try {
            const userRef = doc(db, col, userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const user = { id: userSnap.id, ...userSnap.data() } as UserProfile;
                if (user.uniqueId?.startsWith('CU') && user.assignedTrainerId) {
                    const trainerSnap = await getDoc(doc(db, "trainers", user.assignedTrainerId));
                    if (trainerSnap.exists()) {
                        const trainer = trainerSnap.data() as UserProfile;
                        user.assignedTrainerPhone = trainer.phone;
                        user.assignedTrainerExperience = trainer.yearsOfExperience;
                        user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
                    }
                }
                return user;
            }
        } catch (error: any) {
            console.error(`Error fetching user ${userId} from ${col}:`, error);
        }
    }
    return null; // Not found in any collection
};

// =================================================================
// DATA LISTENERS (REAL-TIME & ONE-TIME)
// =================================================================

export function listenToAdminDashboardData(callback: (data: AdminDashboardData) => void): () => void {
    const db = getClientDb();
    if (!db) {
        callback({} as AdminDashboardData);
        return () => {};
    }

    const unsubs: (() => void)[] = [];
    let combinedData: Partial<AdminDashboardData> = {};

    const updateData = (newData: Partial<AdminDashboardData>) => {
        combinedData = { ...combinedData, ...newData };
        callback(combinedData as AdminDashboardData);
    };

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
        const customers = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
        updateCombinedUsers(customers, 'customers');
    });

    const unsubTrainers = onSnapshot(collection(db, 'trainers'), (snap) => {
        const trainers = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
        updateCombinedUsers(trainers, 'trainers');
    });

    let customerUsers: UserProfile[] = [];
    let trainerUsers: UserProfile[] = [];

    const updateCombinedUsers = (users: UserProfile[], type: 'customers' | 'trainers') => {
        if (type === 'customers') customerUsers = users;
        if (type === 'trainers') trainerUsers = users;

        const allUsers = [...customerUsers, ...trainerUsers];
        const totalCustomers = customerUsers.length;
        const totalInstructors = trainerUsers.length;

        const activeSubscriptions = customerUsers.filter(u => u.approvalStatus === 'Approved' && u.subscriptionPlan !== 'None').length;
        const totalCertifiedTrainers = trainerUsers.filter(u => u.approvalStatus === 'Approved').length;
        const totalEarnings = customerUsers.filter(u => u.approvalStatus === 'Approved').reduce((acc, user) => {
            if (user.subscriptionPlan === 'Premium') return acc + 9999;
            if (user.subscriptionPlan === 'Gold') return acc + 7499;
            if (user.subscriptionPlan === 'Basic') return acc + 3999;
            return acc;
        }, 0);

        const lessonProgress = customerUsers
            .filter(u => u.approvalStatus === 'Approved' && u.assignedTrainerName)
            .map(c => ({
                studentId: c.uniqueId, studentName: c.name, trainerName: c.assignedTrainerName!,
                subscriptionPlan: c.subscriptionPlan, totalLessons: c.totalLessons || 0,
                completedLessons: c.completedLessons || 0,
                remainingLessons: (c.totalLessons || 0) - (c.completedLessons || 0),
            })).sort((a, b) => a.remainingLessons - b.remainingLessons);

        updateData({
            allUsers,
            lessonProgress,
            summaryData: {
                ...combinedData.summaryData,
                totalCustomers,
                totalInstructors,
                activeSubscriptions,
                totalEarnings,
                totalCertifiedTrainers
            } as SummaryData
        });
    };

    unsubs.push(unsubCustomers, unsubTrainers);

    unsubs.push(onSnapshot(collection(db, 'lessonRequests'), snap => updateData({ lessonRequests: snap.docs.map(d => ({ id: d.id, ...d.data() } as LessonRequest)), summaryData: { ...combinedData.summaryData, pendingRequests: snap.docs.filter(d => d.data().status === 'Pending').length } as SummaryData })));
    unsubs.push(onSnapshot(collection(db, 'rescheduleRequests'), snap => updateData({ rescheduleRequests: snap.docs.map(d => ({ id: d.id, ...d.data() } as RescheduleRequest)), summaryData: { ...combinedData.summaryData, pendingRescheduleRequests: snap.docs.filter(d => d.data().status === 'Pending').length } as SummaryData })));
    unsubs.push(onSnapshot(collection(db, 'feedback'), snap => updateData({ feedback: snap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback)) })));
    unsubs.push(onSnapshot(collection(db, 'referrals'), snap => updateData({ referrals: snap.docs.map(d => ({ id: d.id, ...d.data() } as Referral)) })));
    unsubs.push(onSnapshot(collection(db, 'courses'), snap => updateData({ courses: reAssignCourseIcons(snap.docs.map(d => ({ id: d.id, ...d.data() } as Course))) })));
    unsubs.push(onSnapshot(collection(db, 'quizSets'), snap => updateData({ quizSets: snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizSet)) })));
    unsubs.push(onSnapshot(collection(db, 'faqs'), snap => updateData({ faqs: snap.docs.map(d => ({ id: d.id, ...d.data() } as FaqItem)) })));
    unsubs.push(onSnapshot(collection(db, 'blogPosts'), snap => updateData({ blogPosts: snap.docs.map(d => ({ slug: d.id, ...d.data() } as BlogPost)) })));
    unsubs.push(onSnapshot(collection(db, 'siteBanners'), snap => updateData({ siteBanners: snap.docs.map(d => ({ id: d.id, ...d.data() } as SiteBanner)) })));
    unsubs.push(onSnapshot(collection(db, 'promotionalPosters'), snap => updateData({ promotionalPosters: snap.docs.map(d => ({ id: d.id, ...d.data() } as PromotionalPoster)) })));

    return () => unsubs.forEach(unsub => unsub());
}

export function listenToUser(userId: string, callback: (data: UserProfile | null) => void): () => void {
    const db = getClientDb();
    if (!db) {
        callback(null); return () => {};
    }

    const unsubCustomer = onSnapshot(doc(db, 'customers', userId), async (snap) => {
        if (snap.exists()) {
            const user = { id: snap.id, ...snap.data() } as UserProfile;
            if (user.assignedTrainerId) {
                const trainerSnap = await getDoc(doc(db, "trainers", user.assignedTrainerId));
                if (trainerSnap.exists()) {
                    const trainer = trainerSnap.data() as UserProfile;
                    user.assignedTrainerPhone = trainer.phone;
                    user.assignedTrainerExperience = trainer.yearsOfExperience;
                    user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
                }
            }
            callback(user);
        }
    });

    const unsubTrainer = onSnapshot(doc(db, 'trainers', userId), (snap) => {
        if (snap.exists()) {
            callback({ id: snap.id, ...snap.data() } as UserProfile);
        }
    });

    return () => {
        unsubCustomer();
        unsubTrainer();
    };
};

export function listenToTrainerStudents(trainerId: string, callback: (data: { students: UserProfile[]; feedback: Feedback[]; rescheduleRequests: RescheduleRequest[]; profile: UserProfile | null; }) => void): () => void {
    const db = getClientDb();
    if (!db) {
        callback({ students: [], feedback: [], rescheduleRequests: [], profile: null });
        return () => {};
    }

    const trainerProfileUnsub = onSnapshot(doc(db, 'trainers', trainerId), (trainerSnap) => {
        const trainerProfile = trainerSnap.exists() ? { id: trainerSnap.id, ...trainerSnap.data() } as UserProfile : null;

        const studentsQuery = query(collection(db!, "customers"), where("assignedTrainerId", "==", trainerId));
        const studentUnsub = onSnapshot(studentsQuery, (studentsSnap) => {
            const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
            const studentIds = students.map(s => s.id);

            const feedbackQuery = query(collection(db!, 'feedback'), where('trainerId', '==', trainerId));
            const feedbackUnsub = onSnapshot(feedbackQuery, (feedbackSnap) => {
                const feedback = feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback));

                let rescheduleUnsub = () => {};
                if (studentIds.length > 0) {
                    const rescheduleQuery = query(collection(db!, 'rescheduleRequests'), where('userId', 'in', studentIds));
                    rescheduleUnsub = onSnapshot(rescheduleQuery, (rescheduleSnap) => {
                        const rescheduleRequests = rescheduleSnap.docs.map(d => ({ id: d.id, ...d.data() } as RescheduleRequest));
                        callback({ students, feedback, rescheduleRequests, profile: trainerProfile });
                    });
                } else {
                    callback({ students, feedback, rescheduleRequests: [], profile: trainerProfile });
                }

                return () => rescheduleUnsub();
            });
            return () => feedbackUnsub();
        });
        return () => studentUnsub();
    });

    return () => trainerProfileUnsub();
}

export async function fetchCourses(): Promise<Course[]> {
    const db = getClientDb();
    if (!db) return [];
    const snapshot = await getDocs(collection(db, "courses"));
    return reAssignCourseIcons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
}

const allQuizSets: QuizSet[] = [
    {
        id: "set1",
        title: "Set 1: Basic Rules",
        questions: [
            { id: "q1", question: { en: "What does a red traffic light indicate?", hi: "लाल ट्रैफिक लाइट क्या दर्शाती है?" }, options: { en: ["Stop", "Go", "Slow down", "Proceed with caution"], hi: ["रुकें", "जाएँ", "धीमे चलें", "सावधानी से आगे बढ़ें"] }, correctAnswer: { en: "Stop", hi: "रुकें" } },
            { id: "q2", question: { en: "When is it permissible to use a horn?", hi: "हॉर्न का उपयोग कब किया जा सकता है?" }, options: { en: ["To greet a friend", "To avoid an accident", "To show frustration", "To ask for way"], hi: ["दोस्त का अभिवादन करने के लिए", "दुर्घटना से बचने के लिए", "निराशा दिखाने के लिए", "रास्ता मांगने के लिए"] }, correctAnswer: { en: "To avoid an accident", hi: "दुर्घटना से बचने के लिए" } },
            { id: "q3", question: { en: "What is the shape of a mandatory road sign?", hi: "एक अनिवार्य सड़क चिह्न का आकार क्या होता है?" }, options: { en: ["Triangular", "Rectangular", "Circular", "Octagonal"], hi: ["त्रिकोणीय", "आयताकार", "गोलाकार", "अष्टकोणीय"] }, correctAnswer: { en: "Circular", hi: "गोलाकार" } },
            { id: "q4", question: { en: "What does a continuous yellow line on the road mean?", hi: "सड़क पर एक सतत पीली रेखा का क्या मतलब है?" }, options: { en: ["Overtaking is allowed", "Overtaking is not allowed", "Parking is allowed", "Stop"], hi: ["ओवरटेक करने की अनुमति है", "ओवरटेक करने की अनुमति नहीं है", "पार्किंग की अनुमति है", "रुकें"] }, correctAnswer: { en: "Overtaking is not allowed", hi: "ओवरटेक करने की अनुमति नहीं है" } },
            { id: "q5", question: { en: "What is the minimum age for obtaining a learner's license for a geared motorcycle?", hi: "गियर वाली मोटरसाइकिल के लिए लर्नर लाइसेंस प्राप्त करने की न्यूनतम आयु क्या है?" }, options: { en: ["16 years", "18 years", "20 years", "21 years"], hi: ["16 वर्ष", "18 वर्ष", "20 वर्ष", "21 वर्ष"] }, correctAnswer: { en: "18 years", hi: "18 वर्ष" } }
        ]
    },
    {
        id: "set2",
        title: "Set 2: Road Signs",
        questions: [
            { id: "q1", question: { en: "What does a 'Stop' sign mean?", hi: "'स्टॉप' चिह्न का क्या अर्थ है?" }, options: { en: ["Slow down and proceed", "Stop completely and proceed when safe", "Give way to other traffic", "No entry"], hi: ["धीमे चलें और आगे बढ़ें", "पूरी तरह रुकें और सुरक्षित होने पर आगे बढ़ें", "अन्य यातायात को रास्ता दें", "प्रवेश निषेध"] }, correctAnswer: { en: "Stop completely and proceed when safe", hi: "पूरी तरह रुकें और सुरक्षित होने पर आगे बढ़ें" } },
            { id: "q2", question: { en: "A triangular sign with a red border is a...", hi: "लाल बॉर्डर वाला एक त्रिकोणीय चिह्न एक..." }, options: { en: ["Mandatory sign", "Informatory sign", "Cautionary/Warning sign", "Prohibitory sign"], hi: ["अनिवार्य चिह्न", "सूचनात्मक चिह्न", "सावधानी/चेतावनी चिह्न", "निषेधात्मक चिह्न"] }, correctAnswer: { en: "Cautionary/Warning sign", hi: "सावधानी/चेतावनी चिह्न" } },
            { id: "q3", question: { en: "What does the sign 'No Parking' mean?", hi: "'नो पार्किंग' चिह्न का क्या अर्थ है?" }, options: { en: ["You can park for a short time", "You can stop to drop off a passenger", "You cannot park your vehicle at that place", "You can park if the driver is in the vehicle"], hi: ["आप थोड़े समय के लिए पार्क कर सकते हैं", "आप एक यात्री को छोड़ने के लिए रुक सकते हैं", "आप उस स्थान पर अपना वाहन पार्क नहीं कर सकते", "यदि चालक वाहन में है तो आप पार्क कर सकते हैं"] }, correctAnswer: { en: "You cannot park your vehicle at that place", hi: "आप उस स्थान पर अपना वाहन पार्क नहीं कर सकते" } },
            { id: "q4", question: { en: "The sign for 'Speed Limit' is a type of...", hi: "'गति सीमा' का चिह्न एक प्रकार का... है।" }, options: { en: ["Cautionary sign", "Mandatory sign", "Informatory sign", "Temporary sign"], hi: ["सावधानी चिह्न", "अनिवार्य चिह्न", "सूचनात्मक चिह्न", "अस्थायी चिह्न"] }, correctAnswer: { en: "Mandatory sign", hi: "अनिवार्य चिह्न" } },
            { id: "q5", question: { en: "A blue circular sign with a white bicycle indicates...", hi: "सफेद साइकिल के साथ एक नीला गोलाकार चिह्न क्या दर्शाता है?" }, options: { en: ["No entry for bicycles", "Parking for bicycles", "Compulsory cycle track", "Bicycle repair shop ahead"], hi: ["साइकिलों के लिए प्रवेश निषेध", "साइकिलों के लिए पार्किंग", "अनिवार्य साइकिल ट्रैक", "आगे साइकिल मरम्मत की दुकान है"] }, correctAnswer: { en: "Compulsory cycle track", hi: "अनिवार्य साइकिल ट्रैक" } }
        ]
    },
    {
        id: "set3",
        title: "Set 3: Documents",
        questions: [
            { id: "q1", question: { en: "Which of the following documents are not required to be carried while driving a vehicle?", hi: "वाहन चलाते समय निम्नलिखित में से कौन से दस्तावेज़ ले जाना आवश्यक नहीं है?" }, options: { en: ["Driving License", "Registration Certificate (RC)", "Aadhaar Card", "Pollution Under Control (PUC) Certificate"], hi: ["ड्राइविंग लाइसेंस", "पंजीकरण प्रमाण पत्र (आरसी)", "आधार कार्ड", "प्रदूषण नियंत्रण (पीयूसी) प्रमाण पत्र"] }, correctAnswer: { en: "Aadhaar Card", hi: "आधार कार्ड" } },
            { id: "q2", question: { en: "What is the validity of a Learner's License?", hi: "लर्नर लाइसेंस की वैधता क्या है?" }, options: { en: ["3 months", "6 months", "1 year", "Until you get a permanent license"], hi: ["3 महीने", "6 महीने", "1 वर्ष", "जब तक आपको स्थायी लाइसेंस नहीं मिल जाता"] }, correctAnswer: { en: "6 months", hi: "6 महीने" } },
            { id: "q3", question: { en: "When can you apply for a permanent driving license?", hi: "आप स्थायी ड्राइविंग लाइसेंस के लिए कब आवेदन कर सकते हैं?" }, options: { en: ["After 30 days from the date of issue of learner's license", "After 60 days from the date of issue of learner's license", "Anytime after getting learner's license", "After 1 year of getting learner's license"], hi: ["लर्नर लाइसेंस जारी होने की तारीख से 30 दिनों के बाद", "लर्नर लाइसेंस जारी होने की तारीख से 60 दिनों के बाद", "लर्नर लाइसेंस मिलने के बाद कभी भी", "लर्नर लाइसेंस मिलने के 1 साल बाद"] }, correctAnswer: { en: "After 30 days from the date of issue of learner's license", hi: "लर्नर लाइसेंस जारी होने की तारीख से 30 दिनों के बाद" } },
            { id: "q4", question: { en: "A private vehicle's Registration Certificate (RC) is valid for...", hi: "एक निजी वाहन का पंजीकरण प्रमाण पत्र (आरसी) ... के लिए वैध है।" }, options: { en: ["5 years", "10 years", "15 years", "Lifetime"], hi: ["5 वर्ष", "10 वर्ष", "15 वर्ष", "आजीवन"] }, correctAnswer: { en: "15 years", hi: "15 वर्ष" } },
            { id: "q5", question: { en: "What does PUC stand for in relation to vehicles?", hi: "वाहनों के संबंध में पीयूसी का क्या अर्थ है?" }, options: { en: ["Public Utility Carrier", "Pollution Under Control", "Permanent Utility Certificate", "Public Under Carriage"], hi: ["पब्लिक यूटिलिटी कैरियर", "पॉल्यूशन अंडर कंट्रोल", "परमानेंट यूटिलिटी सर्टिफिकेट", "पब्लिक अंडर कैरिज"] }, correctAnswer: { en: "Pollution Under Control", hi: "पॉल्यूशन अंडर कंट्रोल" } }
        ]
    },
    {
        id: "set4",
        title: "Set 4: Overtaking & Lane Discipline",
        questions: [
            { id: "q1", question: { en: "From which side can you overtake a vehicle?", hi: "आप किसी वाहन को किस तरफ से ओवरटेक कर सकते हैं?" }, options: { en: ["From the right side", "From the left side", "From either side", "From the side which is wider"], hi: ["दाहिनी ओर से", "बायीं ओर से", "किसी भी ओर से", "जो ओर चौड़ी हो"] }, correctAnswer: { en: "From the right side", hi: "दाहिनी ओर से" } },
            { id: "q2", question: { en: "When is overtaking prohibited?", hi: "ओवरटेक करना कब प्रतिबंधित है?" }, options: { en: ["On a wide road", "When the road ahead is not clearly visible", "During daytime", "On a highway"], hi: ["चौड़ी सड़क पर", "जब आगे की सड़क स्पष्ट रूप से दिखाई न दे रही हो", "दिन के समय", "राजमार्ग पर"] }, correctAnswer: { en: "When the road ahead is not clearly visible", hi: "जब आगे की सड़क स्पष्ट रूप से दिखाई न दे रही हो" } },
            { id: "q3", question: { en: "What does a broken white line in the middle of the road indicate?", hi: "सड़क के बीच में टूटी हुई सफेद रेखा क्या दर्शाती है?" }, options: { en: ["You can overtake if safe", "You cannot overtake", "Lane changing is not allowed", "Stop"], hi: ["यदि सुरक्षित हो तो आप ओवरटेक कर सकते हैं", "आप ओवरटेक नहीं कर सकते", "लेन बदलने की अनुमति नहीं है", "रुकें"] }, correctAnswer: { en: "You can overtake if safe", hi: "यदि सुरक्षित हो तो आप ओवरटेक कर सकते हैं" } },
            { id: "q4", question: { en: "Before changing lanes, you should...", hi: "लेन बदलने से पहले, आपको चाहिए..." }, options: { en: ["Use horn and change lane", "Check mirrors and give a proper signal", "Increase speed", "Just change the lane"], hi: ["हॉर्न का प्रयोग करें और लेन बदलें", "शीशे देखें और उचित संकेत दें", "गति बढ़ाएं", "बस लेन बदल लें"] }, correctAnswer: { en: "Check mirrors and give a proper signal", hi: "शीशे देखें और उचित संकेत दें" } },
            { id: "q5", question: { en: "You should not overtake when...", hi: "आपको ओवरटेक नहीं करना चाहिए जब..." }, options: { en: ["Driving on a straight road", "The driver in front gives a signal to slow down", "Approaching a junction, corner or a pedestrian crossing", "Driving during the day"], hi: ["सीधी सड़क पर गाड़ी चलाते समय", "सामने वाला चालक धीमा होने का संकेत दे", "एक जंक्शन, कोने या पैदल यात्री क्रॉसिंग के पास पहुँचते समय", "दिन में गाड़ी चलाते समय"] }, correctAnswer: { en: "Approaching a junction, corner or a pedestrian crossing", hi: "एक जंक्शन, कोने या पैदल यात्री क्रॉसिंग के पास पहुँचते समय" } }
        ]
    },
    {
        id: "set5",
        title: "Set 5: Intersections & Right of Way",
        questions: [
            { id: "q1", question: { en: "At an uncontrolled intersection, who has the right of way?", hi: "एक अनियंत्रित चौराहे पर, किसे पहले जाने का अधिकार है?" }, options: { en: ["Vehicle coming from the left", "Vehicle coming from the right", "The larger vehicle", "The faster vehicle"], hi: ["बायीं ओर से आने वाला वाहन", "दाहिनी ओर से आने वाला वाहन", "बड़ा वाहन", "तेज वाहन"] }, correctAnswer: { en: "Vehicle coming from the right", hi: "दाहिनी ओर से आने वाला वाहन" } },
            { id: "q2", question: { en: "When approaching a roundabout, you should give way to traffic...", hi: "एक गोलचक्कर के पास पहुँचते समय, आपको यातायात को रास्ता देना चाहिए..." }, options: { en: ["On your left", "On your right", "Entering the roundabout", "Already in the roundabout"], hi: ["आपके बाईं ओर", "आपके दाईं ओर", "गोलचक्कर में प्रवेश करते हुए", "पहले से ही गोलचक्कर में"] }, correctAnswer: { en: "On your right", hi: "आपके दाईं ओर" } },
            { id: "q3", question: { en: "If an emergency vehicle (like an ambulance or fire truck) is approaching with sirens on, you must...", hi: "यदि एक आपातकालीन वाहन (जैसे एम्बुलेंस या फायर ट्रक) सायरन के साथ आ रहा है, तो आपको..." }, options: { en: ["Increase your speed", "Continue at the same speed", "Pull over to the left side of the road and stop", "Race with it"], hi: ["अपनी गति बढ़ाएं", "उसी गति से चलते रहें", "सड़क के बाईं ओर खींचकर रुक जाएं", "उसके साथ दौड़ लगाएं"] }, correctAnswer: { en: "Pull over to the left side of the road and stop", hi: "सड़क के बाईं ओर खींचकर रुक जाएं" } },
            { id: "q4", question: { en: "What does a 'Give Way' sign mean?", hi: "'रास्ता दें' चिह्न का क्या अर्थ है?" }, options: { en: ["Stop completely", "You have the right of way", "Slow down and be ready to stop if necessary to let other vehicles pass", "Continue without stopping"], hi: ["पूरी तरह रुकें", "आपको पहले जाने का अधिकार है", "धीमे चलें और यदि आवश्यक हो तो अन्य वाहनों को गुजरने देने के लिए रुकने के लिए तैयार रहें", "बिना रुके चलते रहें"] }, correctAnswer: { en: "Slow down and be ready to stop if necessary to let other vehicles pass", hi: "धीमे चलें और यदि आवश्यक हो तो अन्य वाहनों को गुजरने देने के लिए रुकने के लिए तैयार रहें" } },
            { id: "q5", question: { en: "When turning left at an intersection, you should...", hi: "एक चौराहे पर बाएं मुड़ते समय, आपको चाहिए..." }, options: { en: ["Keep to the center of the road", "Keep to the right lane", "Keep to the left side of the road", "Take the widest turn possible"], hi: ["सड़क के केंद्र में रहें", "दाहिनी लेन में रहें", "सड़क के बाईं ओर रहें", "संभव सबसे चौड़ा मोड़ लें"] }, correctAnswer: { en: "Keep to the left side of the road", hi: "सड़क के बाईं ओर रहें" } }
        ]
    },
    {
        id: "set6",
        title: "Set 6: Speed & Safety",
        questions: [
            { id: "q1", question: { en: "Driving a vehicle under the influence of alcohol is...", hi: "शराब के प्रभाव में वाहन चलाना..." }, options: { en: ["Allowed if you are careful", "Allowed at night", "Prohibited in all cases", "Allowed with a co-passenger"], hi: ["यदि आप सावधान हैं तो अनुमति है", "रात में अनुमति है", "सभी मामलों में निषिद्ध है", "एक सह-यात्री के साथ अनुमति है"] }, correctAnswer: { en: "Prohibited in all cases", hi: "सभी मामलों में निषिद्ध है" } },
            { id: "q2", question: { en: "What is the primary purpose of wearing a seatbelt?", hi: "सीटबेल्ट पहनने का प्राथमिक उद्देश्य क्या है?" }, options: { en: ["To avoid traffic fines", "To reduce the risk of serious injury in an accident", "To stay comfortable", "To look stylish"], hi: ["यातायात जुर्माने से बचने के लिए", "दुर्घटना में गंभीर चोट के जोखिम को कम करने के लिए", "आरामदायक रहने के लिए", "स्टाइलिश दिखने के लिए"] }, correctAnswer: { en: "To reduce the risk of serious injury in an accident", hi: "दुर्घटना में गंभीर चोट के जोखिम को कम करने के लिए" } },
            { id: "q3", question: { en: "Using a mobile phone while driving is...", hi: "गाड़ी चलाते समय मोबाइल फोन का उपयोग करना..." }, options: { en: ["Allowed with hands-free device", "Allowed for urgent calls", "Not allowed", "Allowed if the road is empty"], hi: ["हैंड्स-फ्री डिवाइस के साथ अनुमति है", "अत्यावश्यक कॉल के लिए अनुमति है", "अनुमति नहीं है", "यदि सड़क खाली है तो अनुमति है"] }, correctAnswer: { en: "Not allowed", hi: "अनुमति नहीं है" } },
            { id: "q4", question: { en: "What should be the ideal distance between your vehicle and the vehicle ahead?", hi: "आपके वाहन और आगे के वाहन के बीच आदर्श दूरी क्या होनी चाहिए?" }, options: { en: ["1 meter", "A safe distance according to speed (e.g., 2-second rule)", "5 meters", "As close as possible"], hi: ["1 मीटर", "गति के अनुसार एक सुरक्षित दूरी (जैसे, 2-सेकंड का नियम)", "5 मीटर", "जितना संभव हो उतना करीब"] }, correctAnswer: { en: "A safe distance according to speed (e.g., 2-second rule)", hi: "गति के अनुसार एक सुरक्षित दूरी (जैसे, 2-सेकंड का नियम)" } },
            { id: "q5", question: { en: "When driving in fog, you should use...", hi: "कोहरे में गाड़ी चलाते समय, आपको उपयोग करना चाहिए..." }, options: { en: ["High beam headlights", "Low beam headlights", "Parking lights", "No lights"], hi: ["हाई बीम हेडलाइट्स", "लो बीम हेडलाइट्स", "पार्किंग लाइट्स", "कोई लाइट नहीं"] }, correctAnswer: { en: "Low beam headlights", hi: "लो बीम हेडलाइट्स" } }
        ]
    },
    {
        id: "set7",
        title: "Set 7: Parking",
        questions: [
            { id: "q1", question: { en: "Where is parking prohibited?", hi: "पार्किंग कहाँ निषिद्ध है?" }, options: { en: ["On a one-way street", "Near a public park", "On a footpath or pedestrian crossing", "In a residential area"], hi: ["एक-तरफ़ा सड़क पर", "एक सार्वजनिक पार्क के पास", "फुटपाथ या पैदल यात्री क्रॉसिंग पर", "एक आवासीय क्षेत्र में"] }, correctAnswer: { en: "On a footpath or pedestrian crossing", hi: "फुटपाथ या पैदल यात्री क्रॉसिंग पर" } },
            { id: "q2", question: { en: "When parking on a hill, you should...", hi: "एक पहाड़ी पर पार्किंग करते समय, आपको..." }, options: { en: ["Leave the vehicle in neutral gear", "Turn the wheels away from the curb", "Turn the wheels towards the curb (if facing downhill) or away from the curb (if facing uphill)", "Keep the wheels straight"], hi: ["वाहन को न्यूट्रल गियर में छोड़ दें", "पहियों को कर्ब से दूर मोड़ें", "पहियों को कर्ब की ओर मोड़ें (यदि ढलान की ओर मुंह है) या कर्ब से दूर (यदि चढ़ाई की ओर मुंह है)", "पहियों को सीधा रखें"] }, correctAnswer: { en: "Turn the wheels towards the curb (if facing downhill) or away from the curb (if facing uphill)", hi: "पहियों को कर्ब की ओर मोड़ें (यदि ढलान की ओर मुंह है) या कर्ब से दूर (यदि चढ़ाई की ओर मुंह है)" } },
            { id: "q3", question: { en: "You should not park your vehicle...", hi: "आपको अपना वाहन पार्क नहीं करना चाहिए..." }, options: { en: ["Near a police station", "Near a hospital entrance", "Near a shopping mall", "In a designated parking area"], hi: ["एक पुलिस स्टेशन के पास", "एक अस्पताल के प्रवेश द्वार के पास", "एक शॉपिंग मॉल के पास", "एक निर्दिष्ट पार्किंग क्षेत्र में"] }, correctAnswer: { en: "Near a hospital entrance", hi: "एक अस्पताल के प्रवेश द्वार के पास" } },
            { id: "q4", question: { en: "What does a 'P' sign with a red slash through it mean?", hi: "'P' चिह्न जिसके माध्यम से एक लाल स्लैश है, का क्या अर्थ है?" }, options: { en: ["Parking allowed", "No Parking", "Paid Parking", "Parking for police"], hi: ["पार्किंग की अनुमति है", "नो पार्किंग", "सशुल्क पार्किंग", "पुलिस के लिए पार्किंग"] }, correctAnswer: { en: "No Parking", hi: "नो पार्किंग" } },
            { id: "q5", question: { en: "Is it allowed to park in front of a fire hydrant?", hi: "क्या आग हाइड्रेंट के सामने पार्क करने की अनुमति है?" }, options: { en: ["Yes", "No", "Only for a short time", "If someone is in the car"], hi: ["हाँ", "नहीं", "केवल थोड़े समय के लिए", "अगर कोई कार में है"] }, correctAnswer: { en: "No", hi: "नहीं" } }
        ]
    },
    {
        id: "set8",
        title: "Set 8: Emergency Situations",
        questions: [
            { id: "q1", question: { en: "If your vehicle breaks down on a highway, you should...", hi: "यदि आपका वाहन राजमार्ग पर खराब हो जाता है, तो आपको..." }, options: { en: ["Leave it in the middle of the road", "Try to move it to the extreme left and switch on hazard lights", "Ask for a lift from another vehicle", "Start repairing it immediately"], hi: ["इसे सड़क के बीच में छोड़ दें", "इसे बिल्कुल बाईं ओर ले जाने की कोशिश करें और हैज़र्ड लाइट चालू करें", "दूसरे वाहन से लिफ्ट मांगें", "तुरंत इसकी मरम्मत शुरू करें"] }, correctAnswer: { en: "Try to move it to the extreme left and switch on hazard lights", hi: "इसे बिल्कुल बाईं ओर ले जाने की कोशिश करें और हैज़र्ड लाइट चालू करें" } },
            { id: "q2", question: { en: "What is the first thing you should do when you see an accident?", hi: "जब आप कोई दुर्घटना देखते हैं तो आपको सबसे पहले क्या करना चाहिए?" }, options: { en: ["Start taking photos", "Call emergency services (e.g., 112)", "Drive away quickly", "Blame the drivers"], hi: ["तस्वीरें लेना शुरू करें", "आपातकालीन सेवाओं को कॉल करें (जैसे, 112)", "जल्दी से चले जाएं", "ड्राइवरों को दोष दें"] }, correctAnswer: { en: "Call emergency services (e.g., 112)", hi: "आपातकालीन सेवाओं को कॉल करें (जैसे, 112)" } },
            { id: "q3", question: { en: "If a tyre bursts while driving, you should...", hi: "गाड़ी चलाते समय टायर फट जाए तो आपको..." }, options: { en: ["Apply brakes hard immediately", "Accelerate", "Control the steering wheel firmly and slow down gradually", "Jump out of the vehicle"], hi: ["तुरंत जोर से ब्रेक लगाएं", "तेजी लाएं", "स्टीयरिंग व्हील को मजबूती से नियंत्रित करें और धीरे-धीरे धीमा करें", "वाहन से बाहर कूद जाएं"] }, correctAnswer: { en: "Control the steering wheel firmly and slow down gradually", hi: "स्टीयरिंग व्हील को मजबूती से नियंत्रित करें और धीरे-धीरे धीमा करें" } },
            { id: "q4", question: { en: "A person involved in an accident is known as a...", hi: "दुर्घटना में शामिल एक व्यक्ति को... के रूप में जाना जाता है।" }, options: { en: ["Good Samaritan", "Victim", "Witness", "Accused"], hi: ["नेक व्यक्ति", "पीड़ित", "गवाह", "आरोपी"] }, correctAnswer: { en: "Victim", hi: "पीड़ित" } },
            { id: "q5", question: { en: "What does the 'Good Samaritan Law' protect?", hi: " 'गुड सेमेरिटन कानून' किसकी रक्षा करता है?" }, options: { en: ["The accident victim", "The police", "People who help accident victims from legal and procedural hassles", "The vehicle owner"], hi: ["दुर्घटना पीड़ित", "पुलिस", "जो लोग दुर्घटना पीड़ितों को कानूनी और प्रक्रियात्मक परेशानियों से बचाने में मदद करते हैं", "वाहन मालिक"] }, correctAnswer: { en: "People who help accident victims from legal and procedural hassles", hi: "जो लोग दुर्घटना पीड़ितों को कानूनी और प्रक्रियात्मक परेशानियों से बचाने में मदद करते हैं" } }
        ]
    },
    {
        id: "set9",
        title: "Set 9: Vehicle Maintenance",
        questions: [
            { id: "q1", question: { en: "How often should you check the engine oil level?", hi: "आपको इंजन ऑयल का स्तर कितनी बार जांचना चाहिए?" }, options: { en: ["Every 5 years", "Once a year", "Regularly, as recommended by the manufacturer", "Only when the warning light comes on"], hi: ["हर 5 साल में", "साल में एक बार", "नियमित रूप से, निर्माता द्वारा अनुशंसित के रूप में", "केवल जब चेतावनी प्रकाश चालू हो"] }, correctAnswer: { en: "Regularly, as recommended by the manufacturer", hi: "नियमित रूप से, निर्माता द्वारा अनुशंसित के रूप में" } },
            { id: "q2", question: { en: "What is the function of the radiator in a car?", hi: "एक कार में रेडिएटर का क्या कार्य है?" }, options: { en: ["To heat the engine", "To cool the engine", "To filter the air", "To power the lights"], hi: ["इंजन को गर्म करने के लिए", "इंजन को ठंडा करने के लिए", "हवा को फ़िल्टर करने के लिए", "लाइटों को बिजली देने के लिए"] }, correctAnswer: { en: "To cool the engine", hi: "इंजन को ठंडा करने के लिए" } },
            { id: "q3", question: { en: "What does correct tyre pressure ensure?", hi: "सही टायर दबाव क्या सुनिश्चित करता है?" }, options: { en: ["Better fuel efficiency and safety", "Faster speed", "A louder horn", "A cleaner car"], hi: ["बेहतर ईंधन दक्षता और सुरक्षा", "तेज गति", "एक तेज हॉर्न", "एक साफ कार"] }, correctAnswer: { en: "Better fuel efficiency and safety", hi: "बेहतर ईंधन दक्षता और सुरक्षा" } },
            { id: "q4", question: { en: "The headlights of your vehicle should be clean to...", hi: "आपके वाहन की हेडलाइट्स को... के लिए साफ होना चाहिए।" }, options: { en: ["Look good", "Ensure proper visibility at night", "Save battery", "Increase fuel efficiency"], hi: ["अच्छा दिखने के लिए", "रात में उचित दृश्यता सुनिश्चित करने के लिए", "बैटरी बचाने के लिए", "ईंधन दक्षता बढ़ाने के लिए"] }, correctAnswer: { en: "Ensure proper visibility at night", hi: "रात में उचित दृश्यता सुनिश्चित करने के लिए" } },
            { id: "q5", question: { en: "What should you do if your car's temperature gauge shows the engine is overheating?", hi: "यदि आपकी कार का तापमान गेज दिखाता है कि इंजन ज़्यादा गरम हो रहा है तो आपको क्या करना चाहिए?" }, options: { en: ["Keep driving", "Pour cold water on the engine", "Stop the car at a safe place and let the engine cool down", "Drive faster to cool it down"], hi: ["गाड़ी चलाते रहें", "इंजन पर ठंडा पानी डालें", "कार को सुरक्षित स्थान पर रोकें और इंजन को ठंडा होने दें", "इसे ठंडा करने के लिए तेजी से चलाएं"] }, correctAnswer: { en: "Stop the car at a safe place and let the engine cool down", hi: "कार को सुरक्षित स्थान पर रोकें और इंजन को ठंडा होने दें" } }
        ]
    },
    {
        id: "set10",
        title: "Set 10: Miscellaneous",
        questions: [
            { id: "q1", question: { en: "When a blind person is crossing the road holding a white cane, you should...", hi: "जब एक अंधा व्यक्ति सफेद छड़ी लेकर सड़क पार कर रहा हो, तो आपको..." }, options: { en: ["Honk and pass", "Consider the white cane as a traffic sign to stop", "Drive slowly", "Ask them to walk faster"], hi: ["हॉर्न बजाएं और गुजर जाएं", "सफेद छड़ी को रुकने के लिए एक यातायात संकेत मानें", "धीरे चलाएं", "उन्हें तेजी से चलने के लिए कहें"] }, correctAnswer: { en: "Consider the white cane as a traffic sign to stop", hi: "सफेद छड़ी को रुकने के लिए एक यातायात संकेत मानें" } },
            { id: "q2", question: { en: "What is 'tailgating'?", hi: "'टेलगेटिंग' क्या है?" }, options: { en: ["Driving too close to the vehicle in front", "Following a truck", "Having a party at the back of a car", "Driving in the last lane"], hi: ["सामने वाले वाहन के बहुत करीब गाड़ी चलाना", "एक ट्रक का पीछा करना", "कार के पीछे पार्टी करना", "आखिरी लेन में गाड़ी चलाना"] }, correctAnswer: { en: "Driving too close to the vehicle in front", hi: "सामने वाले वाहन के बहुत करीब गाड़ी चलाना" } },
            { id: "q3", question: { en: "At a traffic signal, if the amber light is flashing, you should...", hi: "एक ट्रैफिक सिग्नल पर, यदि पीली बत्ती चमक रही है, तो आपको..." }, options: { en: ["Stop", "Speed up to cross", "Slow down and proceed with caution", "Wait for the green light"], hi: ["रुकें", "पार करने के लिए गति बढ़ाएं", "धीमे चलें और सावधानी से आगे बढ़ें", "हरी बत्ती का इंतजार करें"] }, correctAnswer: { en: "Slow down and proceed with caution", hi: "धीमे चलें और सावधानी से आगे बढ़ें" } },
            { id: "q4", question: { en: "What does a sign showing a bed indicate?", hi: "एक बिस्तर दिखाने वाला चिह्न क्या दर्शाता है?" }, options: { en: ["Hospital ahead", "Resting place ahead", "Dhaba ahead", "Hotel ahead"], hi: ["आगे अस्पताल है", "आगे विश्राम स्थल है", "आगे ढाबा है", "आगे होटल है"] }, correctAnswer: { en: "Resting place ahead", hi: "आगे विश्राम स्थल है" } },
            { id: "q5", question: { en: "While driving on a wet road, you should...", hi: "गीली सड़क पर गाड़ी चलाते समय, आपको..." }, options: { en: ["Drive at high speed", "Brake suddenly", "Avoid sudden braking and sharp turns", "Use high beam"], hi: ["तेज गति से चलाएं", "अचानक ब्रेक लगाएं", "अचानक ब्रेक लगाने और तेज मोड़ से बचें", "हाई बीम का प्रयोग करें"] }, correctAnswer: { en: "Avoid sudden braking and sharp turns", hi: "अचानक ब्रेक लगाने और तेज मोड़ से बचें" } }
        ]
    }
];

export async function fetchQuizSets(): Promise<QuizSet[]> {
    const db = getClientDb();
    if (!db) return [];
    const snapshot = await getDocs(collection(db, "quizSets"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizSet));
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const db = getClientDb();
    if (!db) return null;
    const snapshot = await getDoc(doc(db, 'blogPosts', slug));
    return snapshot.exists() ? { slug: snapshot.id, ...snapshot.data() } as BlogPost : null;
}

// Client-side function to listen for real-time updates
export function listenToBlogPosts(callback: (data: BlogPost[]) => void): () => void {
    const db = getClientDb();
    if (!db) {
        callback([]);
        return () => {};
    }
    const q = query(collection(db, 'blogPosts'), orderBy('date', 'desc'));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ slug: d.id, ...d.data() } as BlogPost)));
    });
}


export function listenToPromotionalPosters(callback: (data: PromotionalPoster[]) => void): () => void {
    const db = getClientDb();
    if (!db) {
        callback([]);
        return () => {};
    }
    return onSnapshot(collection(db, 'promotionalPosters'), snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as PromotionalPoster)));
    }, (error) => {
        console.error("Error listening to promotional posters:", error);
    });
}

// =================================================================
// WRITE OPERATIONS
// =================================================================

const generateId = (): string => Math.random().toString(36).substring(2, 10);

export async function addBlogPost(data: BlogPostFormValues): Promise<BlogPost | null> {
    const db = getClientDb();
    if (!db) return null;
    let imageUrl = data.imageSrc || 'https://placehold.co/1200x800.png';
    // File upload is handled by server action now
    const newPostData: Omit<BlogPost, 'slug'> = {
        title: data.title, category: data.category, excerpt: data.excerpt,
        content: data.content, author: data.author, date: format(new Date(), 'LLL d, yyyy'),
        imageSrc: imageUrl, imageHint: data.imageHint, tags: data.tags,
    };
    const docRef = doc(db, 'blogPosts', data.slug);
    await setDoc(docRef, newPostData);
    return { slug: docRef.id, ...newPostData };
}

export async function updateBlogPost(slug: string, data: BlogPostFormValues): Promise<boolean> {
    const db = getClientDb();
    if (!db) return false;
    const updateData: Partial<BlogPostFormValues> = { ...data };
    // File upload handled by server action
    delete updateData.imageFile;
    await updateDoc(doc(db, 'blogPosts', slug), updateData as any);
    return true;
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
    const db = getClientDb();
    if (!db) return false;
    await deleteDoc(doc(db, 'blogPosts', slug));
    return true;
}

export async function addCourseModule(courseId: string, moduleData: Omit<CourseModule, 'id'>): Promise<Course | null> {
    const db = getClientDb();
    if (!db) return null;
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) return null;
    const course = courseSnap.data() as Course;
    const newModule = { ...moduleData, id: generateId() };
    const updatedModules = [...(course.modules || []), newModule];
    await updateDoc(courseRef, { modules: updatedModules });
    return { ...course, modules: updatedModules, id: courseId };
}

export async function updateCourseModule(courseId: string, moduleId: string, moduleData: CourseModuleFormValues): Promise<Course | null> {
    const db = getClientDb();
    if (!db) return null;
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) return null;
    const course = courseSnap.data() as Course;
    const updatedModules = course.modules.map(m => m.id === moduleId ? { ...m, ...moduleData } : m);
    await updateDoc(courseRef, { modules: updatedModules });
    return { ...course, modules: updatedModules, id: courseId };
}

export async function deleteCourseModule(courseId: string, moduleId: string): Promise<boolean> {
    const db = getClientDb();
    if (!db) return false;
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) return false;
    const course = courseSnap.data() as Course;
    const updatedModules = course.modules.filter(m => m.id !== moduleId);
    await updateDoc(courseRef, { modules: updatedModules });
    return true;
}

export async function addFaq(data: FaqFormValues): Promise<FaqItem | null> {
    const db = getClientDb();
    if (!db) return null;
    const docRef = await addDoc(collection(db, 'faqs'), data);
    return { id: docRef.id, ...data };
}

export async function updateFaq(id: string, data: FaqFormValues): Promise<boolean> {
    const db = getClientDb();
    if (!db) return false;
    await updateDoc(doc(db, 'faqs', id), data as any);
    return true;
}

export async function deleteFaq(id: string): Promise<boolean> {
    const db = getClientDb();
    if (!db) return false;
    await deleteDoc(doc(db, 'faqs', id));
    return true;
}

export async function updateSiteBanner(id: string, data: VisualContentFormValues): Promise<boolean> {
    const db = getClientDb();
    if (!db) return false;
    const updateData: Partial<VisualContentFormValues> = { ...data };
    // File upload handled by server action
    delete updateData.imageFile;
    await updateDoc(doc(db, 'siteBanners', id), updateData as any);
    return true;
}

export async function updatePromotionalPoster(id: string, data: VisualContentFormValues): Promise<boolean> {
    const db = getClientDb();
    if (!db) return false;
    const updateData: Partial<VisualContentFormValues> = { ...data };
    // File upload handled by server action
    delete updateData.imageFile;
    await updateDoc(doc(db, 'promotionalPosters', id), updateData as any);
    return true;
}

export async function updateQuizQuestion(quizSetId: string, questionId: string, data: QuizQuestionFormValues): Promise<QuizSet | null> {
    const db = getClientDb();
    if (!db) return null;
    const setRef = doc(db, 'quizSets', quizSetId);
    const setSnap = await getDoc(setRef);
    if (!setSnap.exists()) return null;
    const quizSet = setSnap.data() as QuizSet;
    const updatedQuestions = quizSet.questions.map(q => {
        if (q.id === questionId) {
            return {
                id: q.id,
                question: { en: data.question_en, hi: data.question_hi },
                options: { en: data.options_en.split('\n').filter(o => o.trim() !== ''), hi: data.options_hi.split('\n').filter(o => o.trim() !== '') },
                correctAnswer: { en: data.correctAnswer_en, hi: data.correctAnswer_hi },
            };
        }
        return q;
    });
    await updateDoc(setRef, { questions: updatedQuestions });
    return { ...quizSet, questions: updatedQuestions, id: quizSetId };
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const db = getClientDb();
    if (!db) return false;
    const collections = ['customers', 'trainers'];
    for (const col of collections) {
        const userRef = doc(db, col, userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            // Password verification should be handled by Firebase Auth, this is a mock
            return false;
        }
    }
    return false;
};

const reAssignCourseIcons = (coursesToHydrate: Course[]): Course[] => coursesToHydrate.map(course => {
    let newIcon;
    if (course.title.includes('Car')) newIcon = Car;
    else if (course.title.includes('Motorcycle')) newIcon = Bike;
    else newIcon = FileText;
    return { ...course, icon: newIcon };
});

export async function fetchApprovedInstructors(filters: { location?: string; gender?: string } = {}): Promise<UserProfile[]> {
    const db = getClientDb();
    if (!db) return [];
    let q = query(collection(db, "trainers"), where("approvalStatus", "==", "Approved"));
    if (filters.location) {
        q = query(q, where("location", "==", filters.location));
    }
    if (filters.gender) {
        q = query(q, where("gender", "==", filters.gender));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
};

export async function assignTrainerToCustomer(customerId: string, trainerId: string): Promise<boolean> {
    const db = getClientDb();
    if (!db) return false;
    const customerRef = doc(db, "customers", customerId);
    const trainerRef = doc(db, "trainers", trainerId);
    const [customerSnap, trainerSnap] = await Promise.all([getDoc(customerRef), getDoc(trainerRef)]);
    if (!customerSnap.exists() || !trainerSnap.exists()) return false;
    const trainerData = trainerSnap.data() as UserProfile;
    await updateDoc(customerRef, {
        approvalStatus: 'In Progress', assignedTrainerId: trainerId,
        assignedTrainerName: trainerData.name
    });
    return true;
};

export async function updateAssignmentStatusByTrainer(customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> {
    const db = getClientDb();
    if (!db) return false;
    const customerRef = doc(db, "customers", customerId);
    const updates: { [key: string]: any } = { approvalStatus: newStatus };

    if (newStatus === 'Approved') {
        const customerSnap = await getDoc(customerRef);
        if(!customerSnap.exists()) return false;
        const user = customerSnap.data() as UserProfile;
        if(user.subscriptionStartDate) {
            const startDate = parse(user.subscriptionStartDate!, 'MMM dd, yyyy', new Date());
            const firstLessonDate = addDays(startDate, 2);
            firstLessonDate.setHours(9, 0, 0, 0);
            updates.upcomingLesson = format(firstLessonDate, 'MMM dd, yyyy, h:mm a');
        }


        const requestQuery = query(collection(db, 'lessonRequests'), where('customerId', '==', customerId));
        const requestSnapshot = await getDocs(requestQuery);
        if (!requestSnapshot.empty) {
            await updateDoc(requestSnapshot.docs[0].ref, { status: 'Active' });
        }
    } else { // Rejected
        updates.assignedTrainerId = null; updates.assignedTrainerName = null;
        updates.approvalStatus = 'Pending';
    }
    await updateDoc(customerRef, updates);
    return true;
}

export async function updateUserAttendance(studentId: string, status: 'Present' | 'Absent'): Promise<boolean> {
    const db = getClientDb();
    if (!db) return false;
    const studentRef = doc(db, "customers", studentId);
    const studentSnap = await getDoc(studentRef);
    if (!studentSnap.exists()) return false;
    const studentData = studentSnap.data() as UserProfile;
    const updates: { [key: string]: any } = { attendance: status };
    if (status === 'Present' && studentData.attendance !== 'Present') {
        updates.completedLessons = (studentData.completedLessons || 0) + 1;
    }
    await updateDoc(studentRef, updates);
    return true;
}

export async function updateSubscriptionStartDate(customerId: string, newDate: Date): Promise<UserProfile | null> {
    const db = getClientDb();
    if (!db) return null;
    const firstLessonDate = addDays(newDate, 2);
    firstLessonDate.setHours(9, 0, 0, 0);
    const updates = {
        subscriptionStartDate: format(newDate, 'MMM dd, yyyy'),
        upcomingLesson: format(firstLessonDate, 'MMM dd, yyyy, h:mm a'),
    };
    const customerRef = doc(db, 'customers', customerId);
    await updateDoc(customerRef, updates);
    const updatedSnap = await getDoc(customerRef);
    return updatedSnap.exists() ? { id: updatedSnap.id, ...updatedSnap.data() } as UserProfile : null;
}

export async function addRescheduleRequest(userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<RescheduleRequest | null> {
    const db = getClientDb();
    if (!db) return null;
    const newRequest: Omit<RescheduleRequest, 'id'> = {
        userId, customerName,
        originalLessonDate: format(originalDate, 'MMM dd, yyyy, h:mm a'),
        requestedRescheduleDate: format(newDate, 'MMM dd, yyyy, h:mm a'),
        status: 'Pending', requestTimestamp: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'rescheduleRequests'), newRequest);
    return { id: docRef.id, ...newRequest };
}

export async function updateRescheduleRequestStatus(requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> {
    const db = getClientDb();
    if (!db) return false;
    const requestRef = doc(db, 'rescheduleRequests', requestId);
    await updateDoc(requestRef, { status: newStatus });
    if (newStatus === 'Approved') {
        const requestSnap = await getDoc(requestRef);
        if (!requestSnap.exists()) return false;
        const requestData = requestSnap.data() as RescheduleRequest;
        await updateDoc(doc(db, 'customers', requestData.userId), { upcomingLesson: requestData.requestedRescheduleDate });
    }
    return true;
}

export async function addFeedback(customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> {
    const db = getClientDb();
    if (!db) return false;
    const newFeedback: Omit<Feedback, 'id'> = { customerId, customerName, trainerId, trainerName, rating, comment, submissionDate: new Date().toISOString() };
    await addDoc(collection(db, 'feedback'), newFeedback);
    await updateDoc(doc(db, 'customers', customerId), { feedbackSubmitted: true });
    return true;
}

export async function updateReferralPayoutStatus(referralId: string, status: PayoutStatusType): Promise<boolean> {
    const db = getClientDb();
    if (!db) return false;
    await updateDoc(doc(db, 'referrals', referralId), { payoutStatus: status });
    return true;
}

export async function fetchReferralsByUserId(userId: string | undefined): Promise<Referral[]> {
    const db = getClientDb();
    if (!db || !userId) return [];
    const q = query(collection(db, "referrals"), where("referrerId", "==", userId));
    const querySnapshot = await getDocs(q);
    const referrals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
    if (referrals.length === 0) return referrals;
    const refereeIds = referrals.map(r => r.refereeId).filter(Boolean);
    if(refereeIds.length === 0) return referrals;

    const usersMap = new Map<string, UserProfile>();
    for (let i = 0; i < refereeIds.length; i += 30) {
        const batchIds = refereeIds.slice(i, i + 30);
        const usersQuery = query(collection(db, 'customers'), where(documentId(), 'in', batchIds));
        const usersSnapshot = await getDocs(usersQuery);
        usersSnapshot.forEach(doc => usersMap.set(doc.id, { id: doc.id, ...doc.data() } as UserProfile));
    }

    return referrals.map(ref => {
        const referee = usersMap.get(ref.refereeId);
        return { ...ref, refereeUniqueId: referee?.uniqueId, refereeSubscriptionPlan: referee?.subscriptionPlan, refereeApprovalStatus: referee?.approvalStatus };
    });
}

export async function updateUserProfile(userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> {
    const db = getClientDb();
    if (!db) return null;
    let userRef;

    const collectionsToSearch = ['customers', 'trainers'];
    for (const col of collectionsToSearch) {
        const ref = doc(db, col, userId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            userRef = ref;
            break;
        }
    }

    if (!userRef) return null;

    const { photo, ...restData } = data;

    const updateData: Partial<UserProfile> = {
        ...restData,
        location: data.district,
    };

    Object.keys(updateData).forEach(key => (updateData as any)[key] === undefined && delete (updateData as any)[key]);
    await updateDoc(userRef, updateData);
    const updatedDoc = await getDoc(userRef);
    return updatedDoc.exists() ? { id: updatedDoc.id, ...updatedDoc.data() } as UserProfile : null;
};
