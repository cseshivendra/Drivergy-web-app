

import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues, FaqItem, BlogPost, SiteBanner, PromotionalPoster, FaqFormValues, BlogPostFormValues, VisualContentFormValues, FullCustomerDetailsValues, RegistrationFormValues, AdminDashboardData } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, writeBatch, documentId, orderBy, limit, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';


// =================================================================
// USER MANAGEMENT - READ OPERATIONS
// =================================================================

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
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
            { id: "q5", question: { en: "What is the minimum age for obtaining a learner's license for a geared motorcycle?", hi: "गियर वाली मोटरसाइकिल के लिए लर्नर लाइसेंस प्राप्त करने की न्यूनतम आयु क्या है?" }, options: { en: ["16 years", "18 years", "20 years", "21 years"], hi: ["16 वर्ष", "18 वर्ष", "20 वर्ष", "21 वर्ष"] }, correctAnswer: { en: "18 years", hi: "18 वर्ष" } },
            { id: "q6", question: { en: "When should you use dipped headlights (low beam)?", hi: "आपको डिप्ड हेडलाइट्स (लो बीम) का उपयोग कब करना चाहिए?" }, options: { en: ["During daytime", "In well-lit areas at night", "On empty highways", "In heavy rain"], hi: ["दिन के समय", "रात में अच्छी रोशनी वाले क्षेत्रों में", "खाली राजमार्गों पर", "भारी बारिश में"] }, correctAnswer: { en: "In well-lit areas at night", hi: "रात में अच्छी रोशनी वाले क्षेत्रों में" } },
            { id: "q7", question: { en: "What does the term 'defensive driving' mean?", hi: "'रक्षात्मक ड्राइविंग' शब्द का क्या अर्थ है?" }, options: { en: ["Driving aggressively", "Driving slowly", "Anticipating dangers and making safe choices", "Only driving in daylight"], hi: ["आक्रामक तरीके से गाड़ी चलाना", "धीमी गति से गाड़ी चलाना", "खतरों का अनुमान लगाना और सुरक्षित विकल्प चुनना", "केवल दिन के उजाले में गाड़ी चलाना"] }, correctAnswer: { en: "Anticipating dangers and making safe choices", hi: "खतरों का अनुमान लगाना और सुरक्षित विकल्प चुनना" } },
            { id: "q8", question: { en: "You must not drive on the right hand side of the road, except...", hi: "आपको सड़क के दाईं ओर गाड़ी नहीं चलानी चाहिए, सिवाय..." }, options: { en: ["When you are in a hurry", "When overtaking", "When the left side is crowded", "At night"], hi: ["जब आप जल्दी में हों", "ओवरटेक करते समय", "जब बाईं ओर भीड़ हो", "रात में"] }, correctAnswer: { en: "When overtaking", hi: "ओवरटेक करते समय" } },
            { id: "q9", question: { en: "What is the primary duty of a driver when a pedestrian is crossing at a marked crosswalk?", hi: "एक चिह्नित क्रॉसवाक पर एक पैदल यात्री के पार करते समय एक चालक का प्राथमिक कर्तव्य क्या है?" }, options: { en: ["Honk to alert them", "Stop and let the pedestrian cross", "Swerve around them", "Increase speed to pass quickly"], hi: ["उन्हें सचेत करने के लिए हॉर्न बजाएं", "रुकें और पैदल यात्री को पार करने दें", "उनके चारों ओर घूमें", "जल्दी से गुजरने के लिए गति बढ़ाएं"] }, correctAnswer: { en: "Stop and let the pedestrian cross", hi: "रुकें और पैदल यात्री को पार करने दें" } },
            { id: "q10", question: { en: "A U-turn is prohibited on a...", hi: "एक... पर यू-टर्न निषिद्ध है।" }, options: { en: ["Wide road", "Busy road", "One-way street", "Road with a divider"], hi: ["चौड़ी सड़क", "व्यस्त सड़क", "एक-तरफ़ा सड़क", "डिवाइडर वाली सड़क"] }, correctAnswer: { en: "Busy road", hi: "व्यस्त सड़क" } },
            { id: "q11", question: { en: "On a road without a footpath, pedestrians should...", hi: "फुटपाथ के बिना सड़क पर, पैदल चलने वालों को..." }, options: { en: ["Walk on the left side", "Walk on the right side, facing oncoming traffic", "Walk in the middle of the road", "Not walk at all"], hi: ["बाईं ओर चलें", "दाईं ओर चलें, आने वाले यातायात का सामना करते हुए", "सड़क के बीच में चलें", "बिल्कुल न चलें"] }, correctAnswer: { en: "Walk on the right side, facing oncoming traffic", hi: "दाईं ओर चलें, आने वाले यातायात का सामना करते हुए" } },
            { id: "q12", question: { en: "What does a flashing yellow traffic light mean?", hi: "एक चमकती पीली ट्रैफिक लाइट का क्या मतलब है?" }, options: { en: ["Stop", "Speed up", "Slow down and proceed with caution", "Traffic light is faulty"], hi: ["रुकें", "गति बढ़ाएं", "धीमे चलें और सावधानी से आगे बढ़ें", "ट्रैफिक लाइट खराब है"] }, correctAnswer: { en: "Slow down and proceed with caution", hi: "धीमे चलें और सावधानी से आगे बढ़ें" } },
            { id: "q13", question: { en: "You should not park your vehicle in front of a...", hi: "आपको अपना वाहन... के सामने पार्क नहीं करना चाहिए।" }, options: { en: ["Park", "Shop", "Hospital entrance", "Cinema hall"], hi: ["पार्क", "दुकान", "अस्पताल का प्रवेश द्वार", "सिनेमा हॉल"] }, correctAnswer: { en: "Hospital entrance", hi: "अस्पताल का प्रवेश द्वार" } },
            { id: "q14", question: { en: "Which of these is a non-transport vehicle?", hi: "इनमें से कौन सा एक गैर-परिवहन वाहन है?" }, options: { en: ["Taxi", "Bus", "Private Car", "Autorickshaw"], hi: ["टैक्सी", "बस", "निजी कार", "ऑटोरिक्शा"] }, correctAnswer: { en: "Private Car", hi: "निजी कार" } },
            { id: "q15", question: { en: "Double solid white/yellow lines in the center of a road mean...", hi: "सड़क के केंद्र में दोहरी ठोस सफेद/पीली रेखाओं का मतलब है..." }, options: { en: ["Overtaking is permitted", "Overtaking and crossing the line is strictly prohibited", "You can cross to make a U-turn", "It is a suggestion"], hi: ["ओवरटेक करने की अनुमति है", "ओवरटेक करना और रेखा पार करना सख्त वर्जित है", "आप यू-टर्न लेने के लिए पार कर सकते हैं", "यह एक सुझाव है"] }, correctAnswer: { en: "Overtaking and crossing the line is strictly prohibited", hi: "ओवरटेक करना और रेखा पार करना सख्त वर्जित है" } }
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
            { id: "q5", question: { en: "A blue circular sign with a white bicycle indicates...", hi: "सफेद साइकिल के साथ एक नीला गोलाकार चिह्न क्या दर्शाता है?" }, options: { en: ["No entry for bicycles", "Parking for bicycles", "Compulsory cycle track", "Bicycle repair shop ahead"], hi: ["साइकिलों के लिए प्रवेश निषेध", "साइकिलों के लिए पार्किंग", "अनिवार्य साइकिल ट्रैक", "आगे साइकिल मरम्मत की दुकान है"] }, correctAnswer: { en: "Compulsory cycle track", hi: "अनिवार्य साइकिल ट्रैक" } },
            { id: "q6", question: { en: "What does a sign showing a horn with a red slash through it mean?", hi: "लाल स्लैश के साथ एक हॉर्न दिखाने वाले चिह्न का क्या अर्थ है?" }, options: { en: ["Horn prohibited", "Honk loudly", "Musical horn allowed", "Hospital ahead"], hi: ["हॉर्न निषिद्ध", "जोर से हॉर्न बजाएं", "संगीत वाला हॉर्न अनुमत", "आगे अस्पताल है"] }, correctAnswer: { en: "Horn prohibited", hi: "हॉर्न निषिद्ध" } },
            { id: "q7", question: { en: "A triangular sign showing a person walking indicates...", hi: "एक चलते हुए व्यक्ति को दिखाने वाला एक त्रिकोणीय चिह्न... दर्शाता है।" }, options: { en: ["Pedestrian crossing ahead", "Park ahead", "School ahead", "Playground ahead"], hi: ["आगे पैदल यात्री क्रॉसिंग", "आगे पार्क", "आगे स्कूल", "आगे खेल का मैदान"] }, correctAnswer: { en: "Pedestrian crossing ahead", hi: "आगे पैदल यात्री क्रॉसिंग" } },
            { id: "q8", question: { en: "The sign for 'Give Way' is shaped like a/an...", hi: "'रास्ता दें' का चिह्न... के आकार का होता है।" }, options: { en: ["Circle", "Octagon", "Inverted Triangle", "Square"], hi: ["गोला", "अष्टकोण", "उलटा त्रिभुज", "वर्ग"] }, correctAnswer: { en: "Inverted Triangle", hi: "उलटा त्रिभुज" } },
            { id: "q9", question: { en: "A rectangular blue sign with a white 'P' indicates...", hi: "सफेद 'P' के साथ एक आयताकार नीला चिह्न... दर्शाता है।" }, options: { en: ["Petrol pump", "Police station", "Parking", "Public telephone"], hi: ["पेट्रोल पंप", "पुलिस स्टेशन", "पार्किंग", "सार्वजनिक टेलीफोन"] }, correctAnswer: { en: "Parking", hi: "पार्किंग" } },
            { id: "q10", question: { en: "What does a sign showing a falling rock indicate?", hi: "एक गिरते हुए चट्टान को दिखाने वाला चिह्न क्या दर्शाता है?" }, options: { en: ["Quarry ahead", "Road works ahead", "Falling rocks zone", "Loose gravel"], hi: ["आगे खदान", "आगे सड़क का काम", "गिरते चट्टानों का क्षेत्र", "ढीली बजरी"] }, correctAnswer: { en: "Falling rocks zone", hi: "गिरते चट्टानों का क्षेत्र" } },
            { id: "q11", question: { en: "The sign for 'No U-Turn' is what type of sign?", hi: "'नो यू-टर्न' का चिह्न किस प्रकार का चिह्न है?" }, options: { en: ["Prohibitory", "Cautionary", "Informatory", "Mandatory"], hi: ["निषेधात्मक", "सावधानी", "सूचनात्मक", "अनिवार्य"] }, correctAnswer: { en: "Prohibitory", hi: "निषेधात्मक" } },
            { id: "q12", question: { en: "A sign showing two arrows pointing in opposite directions within a red circle means...", hi: "एक लाल वृत्त के भीतर विपरीत दिशाओं में इंगित करने वाले दो तीरों वाला चिह्न का अर्थ है..." }, options: { en: ["Two-way traffic", "Overtaking prohibited", "No entry for all vehicles", "End of restriction"], hi: ["दो-तरफ़ा यातायात", "ओवरटेकिंग निषिद्ध", "सभी वाहनों के लिए प्रवेश निषेध", "प्रतिबंध का अंत"] }, correctAnswer: { en: "Overtaking prohibited", hi: "ओवरटेकिंग निषिद्ध" } },
            { id: "q13", question: { en: "What does a triangular sign with a train symbol mean?", hi: "एक ट्रेन प्रतीक वाले एक त्रिकोणीय चिह्न का क्या मतलब है?" }, options: { en: ["Railway station nearby", "Unmanned level crossing ahead", "Manned level crossing ahead", "Viewpoint"], hi: ["पास में रेलवे स्टेशन", "आगे मानव रहित लेवल क्रॉसिंग", "आगे मानव सहित लेवल क्रॉसिंग", "दृश्य बिंदु"] }, correctAnswer: { en: "Unmanned level crossing ahead", hi: "आगे मानव रहित लेवल क्रॉसिंग" } },
            { id: "q14", question: { en: "The sign for 'Right Hand Curve' is a...", hi: "'दाहिने हाथ का मोड़' का चिह्न एक... है।" }, options: { en: ["Mandatory sign", "Cautionary sign", "Informatory sign", "Prohibitory sign"], hi: ["अनिवार्य चिह्न", "सावधानी चिह्न", "सूचनात्मक चिह्न", "निषेधात्मक चिह्न"] }, correctAnswer: { en: "Cautionary sign", hi: "सावधानी चिह्न" } },
            { id: "q15", question: { en: "A blue circular sign with a white arrow pointing straight means...", hi: "एक सीधे इंगित करने वाले सफेद तीर के साथ एक नीला गोलाकार चिह्न का मतलब है..." }, options: { en: ["One Way", "Straight ahead only", "No entry", "Speed limit ends"], hi: ["एक तरफ़ा", "केवल सीधे आगे", "प्रवेश निषेध", "गति सीमा समाप्त"] }, correctAnswer: { en: "Straight ahead only", hi: "केवल सीधे आगे" } }
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
            { id: "q5", question: { en: "What does PUC stand for in relation to vehicles?", hi: "वाहनों के संबंध में पीयूसी का क्या अर्थ है?" }, options: { en: ["Public Utility Carrier", "Pollution Under Control", "Permanent Utility Certificate", "Public Under Carriage"], hi: ["पब्लिक यूटिलिटी कैरियर", "पॉल्यूशन अंडर कंट्रोल", "परमानेंट यूटिलिटी सर्टिफिकेट", "पब्लिक अंडर कैरिज"] }, correctAnswer: { en: "Pollution Under Control", hi: "पॉल्यूशन अंडर कंट्रोल" } },
            { id: "q6", question: { en: "A vehicle's insurance must be renewed...", hi: "एक वाहन का बीमा... नवीनीकृत किया जाना चाहिए।" }, options: { en: ["Every 5 years", "Every 2 years", "Before it expires", "Only when you want to sell the vehicle"], hi: ["हर 5 साल में", "हर 2 साल में", "समाप्त होने से पहले", "केवल जब आप वाहन बेचना चाहते हैं"] }, correctAnswer: { en: "Before it expires", hi: "समाप्त होने से पहले" } },
            { id: "q7", question: { en: "What is the form number for a new learner's license application?", hi: "एक नए लर्नर लाइसेंस आवेदन के लिए फॉर्म नंबर क्या है?" }, options: { en: ["Form 1", "Form 2", "Form 4", "Form 29"], hi: ["फॉर्म 1", "फॉर्म 2", "फॉर्म 4", "फॉर्म 29"] }, correctAnswer: { en: "Form 2", hi: "फॉर्म 2" } },
            { id: "q8", question: { en: "A driving license for a transport vehicle is valid for...", hi: "एक परिवहन वाहन के लिए एक ड्राइविंग लाइसेंस... के लिए वैध है।" }, options: { en: ["10 years", "5 years", "20 years", "1 year"], hi: ["10 वर्ष", "5 वर्ष", "20 वर्ष", "1 वर्ष"] }, correctAnswer: { en: "5 years", hi: "5 वर्ष" } },
            { id: "q9", question: { en: "To drive a taxi, you need a...", hi: "एक टैक्सी चलाने के लिए, आपको एक... की आवश्यकता है।" }, options: { en: ["Private vehicle license", "Learner's license", "Commercial vehicle driving license", "No license"], hi: ["निजी वाहन लाइसेंस", "लर्नर लाइसेंस", "वाणिज्यिक वाहन ड्राइविंग लाइसेंस", "कोई लाइसेंस नहीं"] }, correctAnswer: { en: "Commercial vehicle driving license", hi: "वाणिज्यिक वाहन ड्राइविंग लाइसेंस" } },
            { id: "q10", question: { en: "If you lose your driving license, what should you do first?", hi: "यदि आप अपना ड्राइविंग लाइसेंस खो देते हैं, तो आपको सबसे पहले क्या करना चाहिए?" }, options: { en: ["Apply for a new one immediately", "File a police report (FIR)", "Continue driving", "Wait for a week"], hi: ["तुरंत एक नए के लिए आवेदन करें", "एक पुलिस रिपोर्ट (एफआईआर) दर्ज करें", "गाड़ी चलाना जारी रखें", "एक सप्ताह प्रतीक्षा करें"] }, correctAnswer: { en: "File a police report (FIR)", hi: "एक पुलिस रिपोर्ट (एफआईआर) दर्ज करें" } },
            { id: "q11", question: { en: "The document that contains details of the vehicle engine number and chassis number is...", hi: "वह दस्तावेज़ जिसमें वाहन के इंजन नंबर और चेसिस नंबर का विवरण होता है, वह है..." }, options: { en: ["Driving License", "Insurance Certificate", "Registration Certificate (RC)", "PUC Certificate"], hi: ["ड्राइविंग लाइसेंस", "बीमा प्रमाण पत्र", "पंजीकरण प्रमाण पत्र (आरसी)", "पीयूसी प्रमाण पत्र"] }, correctAnswer: { en: "Registration Certificate (RC)", hi: "पंजीकरण प्रमाण पत्र (आरसी)" } },
            { id: "q12", question: { en: "The fitness certificate for a private vehicle is valid for...", hi: "एक निजी वाहन के लिए फिटनेस प्रमाण पत्र... के लिए वैध है।" }, options: { en: ["1 year", "5 years", "15 years", "2 years"], hi: ["1 वर्ष", "5 वर्ष", "15 वर्ष", "2 वर्ष"] }, correctAnswer: { en: "15 years", hi: "15 वर्ष" } },
            { id: "q13", question: { en: "What is HSRP?", hi: "एचएसआरपी क्या है?" }, options: { en: ["High Speed Road Permit", "High Security Registration Plate", "Heavy Safety Road Plate", "High Standard Road Project"], hi: ["हाई स्पीड रोड परमिट", "हाई सिक्योरिटी रजिस्ट्रेशन प्लेट", "हेवी सेफ्टी रोड प्लेट", "हाई स्टैंडर्ड रोड प्रोजेक्ट"] }, correctAnswer: { en: "High Security Registration Plate", hi: "हाई सिक्योरिटी रजिस्ट्रेशन प्लेट" } },
            { id: "q14", question: { en: "It is mandatory to have at least... insurance for your vehicle.", hi: "आपके वाहन के लिए कम से कम... बीमा होना अनिवार्य है।" }, options: { en: ["Comprehensive", "First Party", "Third Party", "No insurance"], hi: ["व्यापक", "प्रथम पक्ष", "तृतीय पक्ष", "कोई बीमा नहीं"] }, correctAnswer: { en: "Third Party", hi: "तृतीय पक्ष" } },
            { id: "q15", question: { en: "If your driving license expires, you can renew it without a penalty within...", hi: "यदि आपका ड्राइविंग लाइसेंस समाप्त हो जाता है, तो आप इसे बिना किसी दंड के... के भीतर नवीनीकृत कर सकते हैं।" }, options: { en: ["30 days", "60 days", "90 days", "1 year"], hi: ["30 दिन", "60 दिन", "90 दिन", "1 वर्ष"] }, correctAnswer: { en: "30 days", hi: "30 दिन" } }
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
            { id: "q5", question: { en: "You should not overtake when...", hi: "आपको ओवरटेक नहीं करना चाहिए जब..." }, options: { en: ["Driving on a straight road", "The driver in front gives a signal to slow down", "Approaching a junction, corner or a pedestrian crossing", "Driving during the day"], hi: ["सीधी सड़क पर गाड़ी चलाते समय", "सामने वाला चालक धीमा होने का संकेत दे", "एक जंक्शन, कोने या पैदल यात्री क्रॉसिंग के पास पहुँचते समय", "दिन में गाड़ी चलाते समय"] }, correctAnswer: { en: "Approaching a junction, corner or a pedestrian crossing", hi: "एक जंक्शन, कोने या पैदल यात्री क्रॉसिंग के पास पहुँचते समय" } },
            { id: "q6", question: { en: "Can you overtake on a road with a solid single yellow line?", hi: "क्या आप एक ठोस एकल पीली रेखा वाली सड़क पर ओवरटेक कर सकते हैं?" }, options: { en: ["Yes, anytime", "No, it is prohibited", "Yes, if the road is clear", "Only during the day"], hi: ["हाँ, कभी भी", "नहीं, यह निषिद्ध है", "हाँ, यदि सड़क साफ है", "केवल दिन के दौरान"] }, correctAnswer: { en: "No, it is prohibited", hi: "नहीं, यह निषिद्ध है" } },
            { id: "q7", question: { en: "When being overtaken, you should...", hi: "जब आपको ओवरटेक किया जा रहा हो, तो आपको..." }, options: { en: ["Increase your speed", "Maintain your speed and allow the vehicle to overtake", "Move to the right", "Honk continuously"], hi: ["अपनी गति बढ़ाएं", "अपनी गति बनाए रखें और वाहन को ओवरटेक करने दें", "दाईं ओर बढ़ें", "लगातार हॉर्न बजाएं"] }, correctAnswer: { en: "Maintain your speed and allow the vehicle to overtake", hi: "अपनी गति बनाए रखें और वाहन को ओवरटेक करने दें" } },
            { id: "q8", question: { en: "In which lane should slow-moving traffic travel?", hi: "धीमी गति से चलने वाले यातायात को किस लेन में चलना चाहिए?" }, options: { en: ["Rightmost lane", "Leftmost lane", "Any lane", "Center lane"], hi: ["सबसे दाहिनी लेन", "सबसे बाईं लेन", "कोई भी लेन", "केंद्र लेन"] }, correctAnswer: { en: "Leftmost lane", hi: "सबसे बाईं लेन" } },
            { id: "q9", question: { en: "Before overtaking, ensure that...", hi: "ओवरटेक करने से पहले, सुनिश्चित करें कि..." }, options: { en: ["The vehicle in front is slow", "You have enough space and the road ahead is clear", "You are getting late", "There is no police"], hi: ["सामने वाला वाहन धीमा है", "आपके पास पर्याप्त जगह है और आगे की सड़क साफ है", "आप देर हो रहे हैं", "कोई पुलिस नहीं है"] }, correctAnswer: { en: "You have enough space and the road ahead is clear", hi: "आपके पास पर्याप्त जगह है और आगे की सड़क साफ है" } },
            { id: "q10", question: { en: "Lane changing without giving a signal can lead to...", hi: "बिना संकेत दिए लेन बदलने से... हो सकता है।" }, options: { en: ["Better mileage", "Faster travel", "Accidents", "Nothing"], hi: ["बेहतर माइलेज", "तेज यात्रा", "दुर्घटनाएं", "कुछ नहीं"] }, correctAnswer: { en: "Accidents", hi: "दुर्घटनाएं" } },
            { id: "q11", question: { en: "What does 'lane discipline' mean?", hi: "'लेन अनुशासन' का क्या मतलब है?" }, options: { en: ["Driving only in one lane", "Sticking to your lane and changing only when safe", "Zig-zag driving", "Driving on the line"], hi: ["केवल एक लेन में गाड़ी चलाना", "अपनी लेन में रहना और केवल सुरक्षित होने पर बदलना", "ज़िग-ज़ैग ड्राइविंग", "रेखा पर गाड़ी चलाना"] }, correctAnswer: { en: "Sticking to your lane and changing only when safe", hi: "अपनी लेन में रहना और केवल सुरक्षित होने पर बदलना" } },
            { id: "q12", question: { en: "Overtaking from the left is permitted when...", hi: "बाईं ओर से ओवरटेक करने की अनुमति है जब..." }, options: { en: ["The vehicle in front is turning right", "You are in a hurry", "The right side is blocked", "Never"], hi: ["सामने वाला वाहन दाईं ओर मुड़ रहा है", "आप जल्दी में हैं", "दाईं ओर अवरुद्ध है", "कभी नहीं"] }, correctAnswer: { en: "The vehicle in front is turning right", hi: "सामने वाला वाहन दाईं ओर मुड़ रहा है" } },
            { id: "q13", question: { en: "You should not overtake a vehicle near a...", hi: "आपको एक... के पास एक वाहन को ओवरटेक नहीं करना चाहिए।" }, options: { en: ["Park", "School or hospital", "Mall", "Restaurant"], hi: ["पार्क", "स्कूल या अस्पताल", "मॉल", "रेस्तरां"] }, correctAnswer: { en: "School or hospital", hi: "स्कूल या अस्पताल" } },
            { id: "q14", question: { en: "What is the correct procedure for changing lanes?", hi: "लेन बदलने की सही प्रक्रिया क्या है?" }, options: { en: ["Just turn the steering", "Signal, check mirrors and blind spots, then change lane", "Honk and change lane", "Slow down and change lane"], hi: ["बस स्टीयरिंग घुमाएं", "संकेत दें, दर्पण और ब्लाइंड स्पॉट देखें, फिर लेन बदलें", "हॉर्न बजाएं और लेन बदलें", "धीमे चलें और लेन बदलें"] }, correctAnswer: { en: "Signal, check mirrors and blind spots, then change lane", hi: "संकेत दें, दर्पण और ब्लाइंड स्पॉट देखें, फिर लेन बदलें" } },
            { id: "q15", question: { en: "On a three-lane highway, the rightmost lane is for...", hi: "तीन-लेन वाले राजमार्ग पर, सबसे दाहिनी लेन... के लिए है।" }, options: { en: ["Overtaking and fast-moving vehicles", "Slow vehicles", "Heavy vehicles", "Parking"], hi: ["ओवरटेकिंग और तेज गति वाले वाहन", "धीमे वाहन", "भारी वाहन", "पार्किंग"] }, correctAnswer: { en: "Overtaking and fast-moving vehicles", hi: "ओवरटेकिंग और तेज गति वाले वाहन" } }
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
            { id: "q5", question: { en: "When turning left at an intersection, you should...", hi: "एक चौराहे पर बाएं मुड़ते समय, आपको चाहिए..." }, options: { en: ["Keep to the center of the road", "Keep to the right lane", "Keep to the left side of the road", "Take the widest turn possible"], hi: ["सड़क के केंद्र में रहें", "दाहिनी लेन में रहें", "सड़क के बाईं ओर रहें", "संभव सबसे चौड़ा मोड़ लें"] }, correctAnswer: { en: "Keep to the left side of the road", hi: "सड़क के बाईं ओर रहें" } },
            { id: "q6", question: { en: "Who has the right-of-way at a 'T' intersection?", hi: "'टी' चौराहे पर किसे पहले जाने का अधिकार है?" }, options: { en: ["The vehicle approaching from the right", "The vehicle on the terminating road", "The vehicle on the through road", "The vehicle that arrives first"], hi: ["दाईं ओर से आने वाला वाहन", "समाप्त होने वाली सड़क पर वाहन", "थ्रू रोड पर वाहन", "जो वाहन पहले पहुंचता है"] }, correctAnswer: { en: "The vehicle on the through road", hi: "थ्रू रोड पर वाहन" } },
            { id: "q7", question: { en: "When turning right, you should be in the...", hi: "दाईं ओर मुड़ते समय, आपको... में होना चाहिए।" }, options: { en: ["Leftmost lane", "Rightmost lane", "Any lane", "Center of the road"], hi: ["सबसे बाईं लेन", "सबसे दाहिनी लेन", "कोई भी लेन", "सड़क का केंद्र"] }, correctAnswer: { en: "Rightmost lane", hi: "सबसे दाहिनी लेन" } },
            { id: "q8", question: { en: "At a traffic signal, you want to go straight but the lane is blocked. You should...", hi: "एक ट्रैफिक सिग्नल पर, आप सीधे जाना चाहते हैं लेकिन लेन अवरुद्ध है। आपको..." }, options: { en: ["Move to the adjacent lane and proceed", "Wait for the lane to clear", "Honk to make way", "Take a different route"], hi: ["आसन्न लेन में जाएं और आगे बढ़ें", "लेन के साफ होने की प्रतीक्षा करें", "रास्ता बनाने के लिए हॉर्न बजाएं", "एक अलग मार्ग लें"] }, correctAnswer: { en: "Wait for the lane to clear", hi: "लेन के साफ होने की प्रतीक्षा करें" } },
            { id: "q9", question: { en: "What does a green arrow signal at an intersection mean?", hi: "एक चौराहे पर एक हरे तीर के संकेत का क्या मतलब है?" }, options: { en: ["You can go straight", "You can proceed in the direction of the arrow", "All traffic must stop", "The signal is about to change"], hi: ["आप सीधे जा सकते हैं", "आप तीर की दिशा में आगे बढ़ सकते हैं", "सभी यातायात को रुकना चाहिए", "सिग्नल बदलने वाला है"] }, correctAnswer: { en: "You can proceed in the direction of the arrow", hi: "आप तीर की दिशा में आगे बढ़ सकते हैं" } },
            { id: "q10", question: { en: "Blocking an intersection is...", hi: "एक चौराहे को अवरुद्ध करना..." }, options: { en: ["Allowed during peak hours", "A traffic violation", "Allowed if you are in a hurry", "Normal"], hi: ["पीक आवर्स के दौरान अनुमति है", "एक यातायात उल्लंघन है", "यदि आप जल्दी में हैं तो अनुमति है", "सामान्य है"] }, correctAnswer: { en: "A traffic violation", hi: "एक यातायात उल्लंघन है" } },
            { id: "q11", question: { en: "Before entering a main road from a smaller road, you must...", hi: "एक छोटी सड़क से एक मुख्य सड़क में प्रवेश करने से पहले, आपको..." }, options: { en: ["Give way to traffic on the main road", "Proceed without stopping", "Honk and enter", "Enter at high speed"], hi: ["मुख्य सड़क पर यातायात को रास्ता दें", "बिना रुके आगे बढ़ें", "हॉर्न बजाएं और प्रवेश करें", "तेज गति से प्रवेश करें"] }, correctAnswer: { en: "Give way to traffic on the main road", hi: "मुख्य सड़क पर यातायात को रास्ता दें" } },
            { id: "q12", question: { en: "When two vehicles approach an uncontrolled intersection at the same time, who goes first?", hi: "जब दो वाहन एक ही समय में एक अनियंत्रित चौराहे पर पहुँचते हैं, तो कौन पहले जाता है?" }, options: { en: ["The vehicle on the left", "The vehicle on the right", "The bigger vehicle", "The one who honks first"], hi: ["बाईं ओर का वाहन", "दाईं ओर का वाहन", "बड़ा वाहन", "जो पहले हॉर्न बजाता है"] }, correctAnswer: { en: "The vehicle on the right", hi: "दाईं ओर का वाहन" } },
            { id: "q13", question: { en: "A driver must give a hand signal when...", hi: "एक चालक को हाथ का संकेत देना चाहिए जब..." }, options: { en: ["His indicators are not working", "He is turning", "He is stopping", "All of the above"], hi: ["उसके इंडिकेटर काम नहीं कर रहे हैं", "वह मुड़ रहा है", "वह रुक रहा है", "उपरोक्त सभी"] }, correctAnswer: { en: "All of the above", hi: "उपरोक्त सभी" } },
            { id: "q14", question: { en: "When can you cross a solid yellow line?", hi: "आप एक ठोस पीली रेखा को कब पार कर सकते हैं?" }, options: { en: ["When overtaking", "When turning", "Never", "When the road is clear"], hi: ["ओवरटेक करते समय", "मुड़ते समय", "कभी नहीं", "जब सड़क साफ हो"] }, correctAnswer: { en: "Never", hi: "कभी नहीं" } },
            { id: "q15", question: { en: "At a four-way stop, who has the right-of-way?", hi: "एक चार-तरफ़ा स्टॉप पर, किसे पहले जाने का अधिकार है?" }, options: { en: ["The vehicle that arrived first", "The vehicle on the main road", "The vehicle turning left", "The vehicle going straight"], hi: ["जो वाहन पहले आया", "मुख्य सड़क पर वाहन", "बाईं ओर मुड़ने वाला वाहन", "सीधे जाने वाला वाहन"] }, correctAnswer: { en: "The vehicle that arrived first", hi: "जो वाहन पहले आया" } }
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
            { id: "q5", question: { en: "When driving in fog, you should use...", hi: "कोहरे में गाड़ी चलाते समय, आपको उपयोग करना चाहिए..." }, options: { en: ["High beam headlights", "Low beam headlights", "Parking lights", "No lights"], hi: ["हाई बीम हेडलाइट्स", "लो बीम हेडलाइट्स", "पार्किंग लाइट्स", "कोई लाइट नहीं"] }, correctAnswer: { en: "Low beam headlights", hi: "लो बीम हेडलाइट्स" } },
            { id: "q6", question: { en: "The maximum permissible speed for a car in a city is generally...", hi: "एक शहर में एक कार के लिए अधिकतम अनुमेय गति आम तौर पर... है।" }, options: { en: ["80 km/h", "60 km/h", "50 km/h or as signposted", "100 km/h"], hi: ["80 किमी/घंटा", "60 किमी/घंटा", "50 किमी/घंटा या जैसा कि साइनपोस्ट किया गया है", "100 किमी/घंटा"] }, correctAnswer: { en: "50 km/h or as signposted", hi: "50 किमी/घंटा या जैसा कि साइनपोस्ट किया गया है" } },
            { id: "q7", question: { en: "For motorcyclists, wearing a helmet is...", hi: "मोटरसाइकिल चालकों के लिए, हेलमेट पहनना..." }, options: { en: ["Optional", "Compulsory for the driver only", "Compulsory for both driver and pillion rider", "Only for long drives"], hi: ["वैकल्पिक", "केवल चालक के लिए अनिवार्य", "चालक और पीछे बैठने वाले दोनों के लिए अनिवार्य", "केवल लंबी ड्राइव के लिए"] }, correctAnswer: { en: "Compulsory for both driver and pillion rider", hi: "चालक और पीछे बैठने वाले दोनों के लिए अनिवार्य" } },
            { id: "q8", question: { en: "Driving when you are tired can...", hi: "जब आप थके हुए हों तो गाड़ी चलाने से..." }, options: { en: ["Improve your concentration", "Increase your reaction time, making it dangerous", "Make you drive faster", "Not affect your driving"], hi: ["आपकी एकाग्रता में सुधार होता है", "आपकी प्रतिक्रिया का समय बढ़ता है, जिससे यह खतरनाक हो जाता है", "आप तेजी से गाड़ी चलाते हैं", "आपकी ड्राइविंग पर कोई असर नहीं पड़ता"] }, correctAnswer: { en: "Increase your reaction time, making it dangerous", hi: "आपकी प्रतिक्रिया का समय बढ़ता है, जिससे यह खतरनाक हो जाता है" } },
            { id: "q9", question: { en: "What does 'hydroplaning' or 'aquaplaning' mean?", hi: "'हाइड्रोप्लेनिंग' या 'एक्वाप्लेनिंग' का क्या मतलब है?" }, options: { en: ["Driving on a wet road", "A layer of water builds between the tires and the roadway, leading to loss of traction", "Washing your car", "Driving a boat"], hi: ["गीली सड़क पर गाड़ी चलाना", "टायरों और सड़क के बीच पानी की एक परत बन जाती है, जिससे कर्षण का नुकसान होता है", "अपनी कार धोना", "नाव चलाना"] }, correctAnswer: { en: "A layer of water builds between the tires and the roadway, leading to loss of traction", hi: "टायरों और सड़क के बीच पानी की एक परत बन जाती है, जिससे कर्षण का नुकसान होता है" } },
            { id: "q10", question: { en: "What is the \"2-second rule\" for?", hi: "'2-सेकंड का नियम' किस लिए है?" }, options: { en: ["Parking time", "Maintaining a safe following distance", "Overtaking time", "Resting time"], hi: ["पार्किंग का समय", "एक सुरक्षित निम्नलिखित दूरी बनाए रखने के लिए", "ओवरटेक करने का समय", "आराम का समय"] }, correctAnswer: { en: "Maintaining a safe following distance", hi: "एक सुरक्षित निम्नलिखित दूरी बनाए रखने के लिए" } },
            { id: "q11", question: { en: "The speed limit for a school zone is...", hi: "एक स्कूल क्षेत्र के लिए गति सीमा... है।" }, options: { en: ["50 km/h", "As signposted, usually lower", "Same as the city limit", "There is no speed limit"], hi: ["50 किमी/घंटा", "जैसा कि साइनपोस्ट किया गया है, आमतौर पर कम", "शहर की सीमा के समान", "कोई गति सीमा नहीं है"] }, correctAnswer: { en: "As signposted, usually lower", hi: "जैसा कि साइनपोस्ट किया गया है, आमतौर पर कम" } },
            { id: "q12", question: { en: "Child safety locks in a car are meant to...", hi: "एक कार में चाइल्ड सेफ्टी लॉक का मतलब है..." }, options: { en: ["Prevent the car from being stolen", "Prevent children from opening the doors from inside", "Lock the steering wheel", "Lock the music system"], hi: ["कार को चोरी होने से बचाने के लिए", "बच्चों को अंदर से दरवाजे खोलने से रोकने के लिए", "स्टीयरिंग व्हील को लॉक करने के लिए", "संगीत प्रणाली को लॉक करने के लिए"] }, correctAnswer: { en: "Prevent children from opening the doors from inside", hi: "बच्चों को अंदर से दरवाजे खोलने से रोकने के लिए" } },
            { id: "q13", question: { en: "What is a 'blind spot' in driving?", hi: "'ब्लाइंड स्पॉट' ड्राइविंग में क्या है?" }, options: { en: ["A dark spot on the road", "An area around your vehicle that cannot be seen in the mirrors", "A spot where you cannot park", "A point on the dashboard"], hi: ["सड़क पर एक अंधेरा स्थान", "आपके वाहन के चारों ओर एक क्षेत्र जिसे दर्पणों में नहीं देखा जा सकता है", "एक स्थान जहाँ आप पार्क नहीं कर सकते", "डैशबोर्ड पर एक बिंदु"] }, correctAnswer: { en: "An area around your vehicle that cannot be seen in the mirrors", hi: "आपके वाहन के चारों ओर एक क्षेत्र जिसे दर्पणों में नहीं देखा जा सकता है" } },
            { id: "q14", question: { en: "ABS in a car stands for...", hi: "एक कार में एबीएस का मतलब है..." }, options: { en: ["Anti-Breaking System", "Auto Brake Sensor", "Anti-lock Braking System", "All-Brake System"], hi: ["एंटी-ब्रेकिंग सिस्टम", "ऑटो ब्रेक सेंसर", "एंटी-लॉक ब्रेकिंग सिस्टम", "ऑल-ब्रेक सिस्टम"] }, correctAnswer: { en: "Anti-lock Braking System", hi: "एंटी-लॉक ब्रेकिंग सिस्टम" } },
            { id: "q15", question: { en: "Driving at night requires more caution because...", hi: "रात में गाड़ी चलाने में अधिक सावधानी की आवश्यकता होती है क्योंकि..." }, options: { en: ["There are more vehicles", "Visibility is reduced", "The roads are empty", "It is colder"], hi: ["अधिक वाहन होते हैं", "दृश्यता कम हो जाती है", "सड़कें खाली होती हैं", "यह ठंडा होता है"] }, correctAnswer: { en: "Visibility is reduced", hi: "दृश्यता कम हो जाती है" } }
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
            { id: "q5", question: { en: "Is it allowed to park in front of a fire hydrant?", hi: "क्या आग हाइड्रेंट के सामने पार्क करने की अनुमति है?" }, options: { en: ["Yes", "No", "Only for a short time", "If someone is in the car"], hi: ["हाँ", "नहीं", "केवल थोड़े समय के लिए", "अगर कोई कार में है"] }, correctAnswer: { en: "No", hi: "नहीं" } },
            { id: "q6", question: { en: "What is parallel parking?", hi: "समानांतर पार्किंग क्या है?" }, options: { en: ["Parking parallel to a river", "Parking in a line with other vehicles, parallel to the curb", "Parking at a 45-degree angle", "Parking in a garage"], hi: ["एक नदी के समानांतर पार्किंग", "अन्य वाहनों के साथ एक पंक्ति में पार्किंग, कर्ब के समानांतर", "45-डिग्री के कोण पर पार्किंग", "एक गैरेज में पार्किंग"] }, correctAnswer: { en: "Parking in a line with other vehicles, parallel to the curb", hi: "अन्य वाहनों के साथ एक पंक्ति में पार्किंग, कर्ब के समानांतर" } },
            { id: "q7", question: { en: "You should not park within... of a road intersection.", hi: "आपको एक सड़क चौराहे के... के भीतर पार्क नहीं करना चाहिए।" }, options: { en: ["50 meters", "100 meters", "10 meters", "Parking is allowed at intersections"], hi: ["50 मीटर", "100 मीटर", "10 मीटर", "चौराहों पर पार्किंग की अनुमति है"] }, correctAnswer: { en: "10 meters", hi: "10 मीटर" } },
            { id: "q8", question: { en: "A 'No Stopping' sign means...", hi: "'नो स्टॉपिंग' चिह्न का मतलब है..." }, options: { en: ["You can park", "You cannot stop, even to pick up or drop off passengers", "You can stop for 2 minutes", "You can stop if you keep the engine running"], hi: ["आप पार्क कर सकते हैं", "आप रुक नहीं सकते, यहां तक कि यात्रियों को लेने या छोड़ने के लिए भी", "आप 2 मिनट के लिए रुक सकते हैं", "यदि आप इंजन चालू रखते हैं तो आप रुक सकते हैं"] }, correctAnswer: { en: "You cannot stop, even to pick up or drop off passengers", hi: "आप रुक नहीं सकते, यहां तक कि यात्रियों को लेने या छोड़ने के लिए भी" } },
            { id: "q9", question: { en: "When leaving your parked vehicle, you should...", hi: "अपने पार्क किए हुए वाहन को छोड़ते समय, आपको..." }, options: { en: ["Leave the engine running", "Engage the handbrake and lock the car", "Leave the windows open", "Leave the lights on"], hi: ["इंजन चालू छोड़ दें", "हैंडब्रेक लगाएं और कार को लॉक करें", "खिड़कियां खुली छोड़ दें", "लाइटें चालू छोड़ दें"] }, correctAnswer: { en: "Engage the handbrake and lock the car", hi: "हैंडब्रेक लगाएं और कार को लॉक करें" } },
            { id: "q10", question: { en: "Parking is not allowed...", hi: "पार्किंग की अनुमति नहीं है..." }, options: { en: ["On a bridge", "In a designated parking lot", "In front of your own house", "On a wide road"], hi: ["एक पुल पर", "एक निर्दिष्ट पार्किंग स्थल में", "अपने घर के सामने", "एक चौड़ी सड़क पर"] }, correctAnswer: { en: "On a bridge", hi: "एक पुल पर" } },
            { id: "q11", question: { en: "Which gear should you leave your car in when parked on a downhill slope?", hi: "एक ढलान पर पार्क करते समय आपको अपनी कार को किस गियर में छोड़ना चाहिए?" }, options: { en: ["Neutral", "First gear", "Reverse gear", "Top gear"], hi: ["न्यूट्रल", "पहला गियर", "रिवर्स गियर", "टॉप गियर"] }, correctAnswer: { en: "Reverse gear", hi: "रिवर्स गियर" } },
            { id: "q12", question: { en: "What does 'angular parking' mean?", hi: "'कोणीय पार्किंग' का क्या मतलब है?" }, options: { en: ["Parking at a 90-degree angle to the curb", "Parking at an angle to the curb (usually 45 degrees)", "Parking in a circle", "Parking parallel to the curb"], hi: ["कर्ब से 90-डिग्री के कोण पर पार्किंग", "कर्ब से एक कोण पर पार्किंग (आमतौर पर 45 डिग्री)", "एक वृत्त में पार्किंग", "कर्ब के समानांतर पार्किंग"] }, correctAnswer: { en: "Parking at an angle to the curb (usually 45 degrees)", hi: "कर्ब से एक कोण पर पार्किंग (आमतौर पर 45 डिग्री)" } },
            { id: "q13", question: { en: "It is illegal to park...", hi: "...पार्क करना अवैध है।" }, options: { en: ["In a paid parking lot", "In a way that obstructs other vehicles", "For more than 8 hours", "During the day"], hi: ["एक सशुल्क पार्किंग स्थल में", "इस तरह से कि यह अन्य वाहनों को बाधित करे", "8 घंटे से अधिक के लिए", "दिन के दौरान"] }, correctAnswer: { en: "In a way that obstructs other vehicles", hi: "इस तरह से कि यह अन्य वाहनों को बाधित करे" } },
            { id: "q14", question: { en: "Before opening your car door after parking, you should...", hi: "पार्किंग के बाद अपनी कार का दरवाजा खोलने से पहले, आपको..." }, options: { en: ["Open it quickly", "Check for cyclists and other traffic", "Honk", "Turn on the interior light"], hi: ["इसे जल्दी से खोलें", "साइकिल चालकों और अन्य यातायात की जांच करें", "हॉर्न बजाएं", "आंतरिक प्रकाश चालू करें"] }, correctAnswer: { en: "Check for cyclists and other traffic", hi: "साइकिल चालकों और अन्य यातायात की जांच करें" } },
            { id: "q15", question: { en: "Which gear should you leave your car in when parked on an uphill slope?", hi: "एक चढ़ाई पर पार्क करते समय आपको अपनी कार को किस गियर में छोड़ना चाहिए?" }, options: { en: ["Neutral", "First gear", "Reverse gear", "Second gear"], hi: ["न्यूट्रल", "पहला गियर", "रिवर्स गियर", "दूसरा गियर"] }, correctAnswer: { en: "First gear", hi: "पहला गियर" } }
        ]
    },
    {
        id: "set8",
        title: "Set 8: Emergency Situations",
        questions: [
            { id: "q1", question: { en: "If your vehicle breaks down on a highway, you should...", hi: "यदि आपका वाहन राजमार्ग पर खराब हो जाता है, तो आपको..." }, options: { en: ["Leave it in the middle of the road", "Try to move it to the extreme left and switch on hazard lights", "Ask for a lift from another vehicle", "Start repairing it immediately"], hi: ["इसे सड़क के बीच में छोड़ दें", "इसे बिल्कुल बाईं ओर ले जाने की कोशिश करें और हैज़र्ड लाइट चालू करें", "दूसरे वाहन से लिफ्ट मांगें", "तुरंत इसकी मरम्मत शुरू करें"] }, correctAnswer: { en: "Try to move it to the extreme left and switch on hazard lights", hi: "इसे बिल्कुल बाईं ओर ले जाने की कोशिश करें और हैज़र्ड लाइट चालू करें" } },
            { id: "q2", question: { en: "What is the first thing you should do when you see an accident?", hi: "जब आप कोई दुर्घटना देखते हैं तो आपको सबसे पहले क्या करना चाहिए?" }, options: { en: ["Start taking photos", "Call emergency services (e.g., 112)", "Drive away quickly", "Blame the drivers"], hi: ["तस्वीरें लेना शुरू करें", "आपातकालीन सेवाओं को कॉल करें (जैसे, 112)", "जल्दी से चले जाएं", "ड्राइवरों को दोष दें"] }, correctAnswer: { en: "Call emergency services (e.g., 112)", hi: "आपातकालीन सेवाओं को कॉल करें (जैसे, 112)" } },
            { id: "q3", question: { en: "If a tyre bursts while driving, you should...", hi: "गाड़ी चलाते समय टायर फट जाए तो आपको..." }, options: { en: ["Apply brakes hard immediately", "Accelerate", "Control the steering wheel firmly and slow down gradually", "Jump out of the vehicle"], hi: ["तुरंत जोर से ब्रेक लगाएं", "तेजी लाएं", "स्टीयरिंग व्हील को मजबूती से नियंत्रित करें और धीरे-धीरे धीमा करें", "वाहन से बाहर कूद जाएं"] }, correctAnswer: { en: "Control the steering wheel firmly and slow down gradually", hi: "स्टीयरिंग व्हील को मजबूती से नियंत्रित करें और धीरे-धीरे धीमा करें" } },
            { id: "q4", question: { en: "The triangular warning sign should be placed... behind a broken-down vehicle.", hi: "त्रिकोणीय चेतावनी चिह्न को एक टूटे-फूटे वाहन के पीछे... रखा जाना चाहिए।" }, options: { en: ["10 meters", "20 meters", "50 meters", "100 meters"], hi: ["10 मीटर", "20 मीटर", "50 मीटर", "100 मीटर"] }, correctAnswer: { en: "50 meters", hi: "50 मीटर" } },
            { id: "q5", question: { en: "What does the 'Good Samaritan Law' protect?", hi: " 'गुड सेमेरिटन कानून' किसकी रक्षा करता है?" }, options: { en: ["The accident victim", "The police", "People who help accident victims from legal and procedural hassles", "The vehicle owner"], hi: ["दुर्घटना पीड़ित", "पुलिस", "जो लोग दुर्घटना पीड़ितों को कानूनी और प्रक्रियात्मक परेशानियों से बचाने में मदद करते हैं", "वाहन मालिक"] }, correctAnswer: { en: "People who help accident victims from legal and procedural hassles", hi: "जो लोग दुर्घटना पीड़ितों को कानूनी और प्रक्रियात्मक परेशानियों से बचाने में मदद करते हैं" } },
            { id: "q6", question: { en: "If your brakes fail, you should first...", hi: "यदि आपके ब्रेक फेल हो जाते हैं, तो आपको सबसे पहले..." }, options: { en: ["Jump out of the car", "Pump the brake pedal several times and use the handbrake", "Turn off the engine", "Honk continuously"], hi: ["कार से बाहर कूद जाएं", "ब्रेक पेडल को कई बार पंप करें और हैंडब्रेक का उपयोग करें", "इंजन बंद करें", "लगातार हॉर्न बजाएं"] }, correctAnswer: { en: "Pump the brake pedal several times and use the handbrake", hi: "ब्रेक पेडल को कई बार पंप करें और हैंडब्रेक का उपयोग करें" } },
            { id: "q7", question: { en: "The national emergency number in India is...", hi: "भारत में राष्ट्रीय आपातकालीन नंबर... है।" }, options: { en: ["100", "101", "108", "112"], hi: ["100", "101", "108", "112"] }, correctAnswer: { en: "112", hi: "112" } },
            { id: "q8", question: { en: "If you are involved in a minor accident with no injuries, you should...", hi: "यदि आप बिना किसी चोट के एक छोटी दुर्घटना में शामिल हैं, तो आपको..." }, options: { en: ["Drive away immediately", "Exchange insurance and contact details with the other driver", "Start an argument", "Call your friends"], hi: ["तुरंत चले जाएं", "दूसरे चालक के साथ बीमा और संपर्क विवरण का आदान-प्रदान करें", "एक बहस शुरू करें", "अपने दोस्तों को बुलाएं"] }, correctAnswer: { en: "Exchange insurance and contact details with the other driver", hi: "दूसरे चालक के साथ बीमा और संपर्क विवरण का आदान-प्रदान करें" } },
            { id: "q9", question: { en: "Hazard warning lights (blinkers) should be used when...", hi: "खतरे की चेतावनी लाइट (ब्लिंकर) का उपयोग तब किया जाना चाहिए जब..." }, options: { en: ["Driving in the rain", "Your vehicle is stationary and causing an obstruction", "Parking", "Driving at night"], hi: ["बारिश में गाड़ी चलाते समय", "आपका वाहन स्थिर है और एक बाधा उत्पन्न कर रहा है", "पार्किंग", "रात में गाड़ी चलाते समय"] }, correctAnswer: { en: "Your vehicle is stationary and causing an obstruction", hi: "आपका वाहन स्थिर है और एक बाधा उत्पन्न कर रहा है" } },
            { id: "q10", question: { en: "If your car catches fire, you should...", hi: "यदि आपकी कार में आग लग जाती है, तो आपको..." }, options: { en: ["Keep driving to the nearest garage", "Stop the car, turn off the engine, get everyone out, and move away", "Try to put it out with water", "Open the bonnet immediately"], hi: ["निकटतम गैरेज तक गाड़ी चलाते रहें", "कार रोकें, इंजन बंद करें, सभी को बाहर निकालें, और दूर हटें", "इसे पानी से बुझाने की कोशिश करें", "तुरंत बोनट खोलें"] }, correctAnswer: { en: "Stop the car, turn off the engine, get everyone out, and move away", hi: "कार रोकें, इंजन बंद करें, सभी को बाहर निकालें, और दूर हटें" } },
            { id: "q11", question: { en: "When approaching a flooded area, you should...", hi: "एक बाढ़ वाले क्षेत्र के पास पहुँचते समय, आपको..." }, options: { en: ["Drive through it at high speed", "Avoid it if possible, or drive through slowly in low gear", "Wait for the water to recede", "Turn on high beam lights"], hi: ["तेज गति से इसके माध्यम से ड्राइव करें", "यदि संभव हो तो इससे बचें, या कम गियर में धीरे-धीरे ड्राइव करें", "पानी के घटने की प्रतीक्षा करें", "हाई बीम लाइट चालू करें"] }, correctAnswer: { en: "Avoid it if possible, or drive through slowly in low gear", hi: "यदि संभव हो तो इससे बचें, या कम गियर में धीरे-धीरे ड्राइव करें" } },
            { id: "q12", question: { en: "What does a first-aid kit in a vehicle contain?", hi: "एक वाहन में एक प्राथमिक चिकित्सा किट में क्या होता है?" }, options: { en: ["Snacks and drinks", "Tools for repair", "Bandages, antiseptic, cotton, etc.", "Extra fuel"], hi: ["स्नैक्स और पेय", "मरम्मत के लिए उपकरण", "पट्टियाँ, एंटीसेप्टिक, कपास, आदि।", "अतिरिक्त ईंधन"] }, correctAnswer: { en: "Bandages, antiseptic, cotton, etc.", hi: "पट्टियाँ, एंटीसेप्टिक, कपास, आदि।" } },
            { id: "q13", question: { en: "If an animal suddenly comes in front of your vehicle, you should...", hi: "यदि कोई जानवर अचानक आपके वाहन के सामने आ जाता है, तो आपको..." }, options: { en: ["Accelerate and pass", "Brake hard and swerve", "Control your speed and try to avoid hitting it without losing control", "Honk loudly"], hi: ["तेजी लाएं और गुजर जाएं", "जोर से ब्रेक लगाएं और घूमें", "अपनी गति को नियंत्रित करें और नियंत्रण खोए बिना इसे मारने से बचने की कोशिश करें", "जोर से हॉर्न बजाएं"] }, correctAnswer: { en: "Control your speed and try to avoid hitting it without losing control", hi: "अपनी गति को नियंत्रित करें और नियंत्रण खोए बिना इसे मारने से बचने की कोशिश करें" } },
            { id: "q14", question: { en: "If you feel drowsy while driving, you should...", hi: "यदि आपको गाड़ी चलाते समय उनींदापन महसूस होता है, तो आपको..." }, options: { en: ["Play loud music", "Open the window", "Pull over to a safe place and rest", "Drink coffee and keep driving"], hi: ["तेज संगीत बजाएं", "खिड़की खोलें", "एक सुरक्षित स्थान पर खींचें और आराम करें", "कॉफी पिएं और गाड़ी चलाते रहें"] }, correctAnswer: { en: "Pull over to a safe place and rest", hi: "एक सुरक्षित स्थान पर खींचें और आराम करें" } },
            { id: "q15", question: { en: "In case of a non-injury accident, you are required to report to the police within...", hi: "एक गैर-चोट दुर्घटना के मामले में, आपको... के भीतर पुलिस को रिपोर्ट करना आवश्यक है।" }, options: { en: ["12 hours", "24 hours", "48 hours", "1 week"], hi: ["12 घंटे", "24 घंटे", "48 घंटे", "1 सप्ताह"] }, correctAnswer: { en: "24 hours", hi: "24 घंटे" } }
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
            { id: "q5", question: { en: "What should you do if your car's temperature gauge shows the engine is overheating?", hi: "यदि आपकी कार का तापमान गेज दिखाता है कि इंजन ज़्यादा गरम हो रहा है तो आपको क्या करना चाहिए?" }, options: { en: ["Keep driving", "Pour cold water on the engine", "Stop the car at a safe place and let the engine cool down", "Drive faster to cool it down"], hi: ["गाड़ी चलाते रहें", "इंजन पर ठंडा पानी डालें", "कार को सुरक्षित स्थान पर रोकें और इंजन को ठंडा होने दें", "इसे ठंडा करने के लिए तेजी से चलाएं"] }, correctAnswer: { en: "Stop the car at a safe place and let the engine cool down", hi: "कार को सुरक्षित स्थान पर रोकें और इंजन को ठंडा होने दें" } },
            { id: "q6", question: { en: "What does the battery do in a vehicle?", hi: "एक वाहन में बैटरी क्या करती है?" }, options: { en: ["Cools the engine", "Starts the engine and powers electrical systems", "Filters the fuel", "Controls the speed"], hi: ["इंजन को ठंडा करती है", "इंजन को शुरू करती है और विद्युत प्रणालियों को शक्ति प्रदान करती है", "ईंधन को फ़िल्टर करती है", "गति को नियंत्रित करती है"] }, correctAnswer: { en: "Starts the engine and powers electrical systems", hi: "इंजन को शुरू करती है और विद्युत प्रणालियों को शक्ति प्रदान करती है" } },
            { id: "q7", question: { en: "The tread on your tires should not be less than...", hi: "आपके टायरों पर ट्रेड... से कम नहीं होना चाहिए।" }, options: { en: ["5 mm", "3 mm", "1.6 mm", "10 mm"], hi: ["5 मिमी", "3 मिमी", "1.6 मिमी", "10 मिमी"] }, correctAnswer: { en: "1.6 mm", hi: "1.6 मिमी" } },
            { id: "q8", question: { en: "It is important to check your vehicle's lights...", hi: "अपने वाहन की लाइटों की जांच करना महत्वपूर्ण है..." }, options: { en: ["Once a year", "Regularly", "Only when they fail", "Never"], hi: ["साल में एक बार", "नियमित रूप से", "केवल जब वे विफल हो जाते हैं", "कभी नहीं"] }, correctAnswer: { en: "Regularly", hi: "नियमित रूप से" } },
            { id: "q9", question: { en: "What is the purpose of the exhaust system?", hi: "निकास प्रणाली का उद्देश्य क्या है?" }, options: { en: ["To increase engine noise", "To carry harmful gases from the engine to the rear of the vehicle", "To cool the car's interior", "To improve radio reception"], hi: ["इंजन के शोर को बढ़ाने के लिए", "इंजन से हानिकारक गैसों को वाहन के पीछे तक ले जाने के लिए", "कार के इंटीरियर को ठंडा करने के लिए", "रेडियो रिसेप्शन में सुधार करने के लिए"] }, correctAnswer: { en: "To carry harmful gases from the engine to the rear of the vehicle", hi: "इंजन से हानिकारक गैसों को वाहन के पीछे तक ले जाने के लिए" } },
            { id: "q10", question: { en: "When should you replace your windscreen wipers?", hi: "आपको अपने विंडस्क्रीन वाइपर कब बदलने चाहिए?" }, options: { en: ["Every 5 years", "When they stop working", "When they no longer clear the screen effectively", "During monsoon"], hi: ["हर 5 साल में", "जब वे काम करना बंद कर दें", "जब वे अब स्क्रीन को प्रभावी ढंग से साफ नहीं करते हैं", "मानसून के दौरान"] }, correctAnswer: { en: "When they no longer clear the screen effectively", hi: "जब वे अब स्क्रीन को प्रभावी ढंग से साफ नहीं करते हैं" } },
            { id: "q11", question: { en: "What does the clutch do?", hi: "क्लच क्या करता है?" }, options: { en: ["Connects and disconnects the engine from the gearbox", "Changes the gears", "Brakes the vehicle", "Accelerates the vehicle"], hi: ["इंजन को गियरबॉक्स से जोड़ता और डिस्कनेक्ट करता है", "गियर बदलता है", "वाहन को ब्रेक लगाता है", "वाहन को तेज करता है"] }, correctAnswer: { en: "Connects and disconnects the engine from the gearbox", hi: "इंजन को गियरबॉक्स से जोड़ता और डिस्कनेक्ट करता है" } },
            { id: "q12", question: { en: "What is wheel alignment?", hi: "व्हील एलाइनमेंट क्या है?" }, options: { en: ["Balancing the wheels", "Adjusting the angles of the wheels to the manufacturer's specifications", "Rotating the tires", "Cleaning the wheels"], hi: ["पहियों को संतुलित करना", "निर्माता के विनिर्देशों के अनुसार पहियों के कोणों को समायोजित करना", "टायरों को घुमाना", "पहियों को साफ करना"] }, correctAnswer: { en: "Adjusting the angles of the wheels to the manufacturer's specifications", hi: "निर्माता के विनिर्देशों के अनुसार पहियों के कोणों को समायोजित करना" } },
            { id: "q13", question: { en: "Low coolant level can lead to...", hi: "कम शीतलक स्तर... का कारण बन सकता है।" }, options: { en: ["Engine overheating", "Better mileage", "Faster acceleration", "Brake failure"], hi: ["इंजन का अधिक गरम होना", "बेहतर माइलेज", "तेज त्वरण", "ब्रेक विफलता"] }, correctAnswer: { en: "Engine overheating", hi: "इंजन का अधिक गरम होना" } },
            { id: "q14", question: { en: "The horn of the vehicle should be...", hi: "वाहन का हॉर्न... होना चाहिए।" }, options: { en: ["As loud as possible", "Musical", "As per prescribed standards", "Multi-toned"], hi: ["जितना संभव हो उतना तेज", "संगीत वाला", "निर्धारित मानकों के अनुसार", "बहु-टोंड"] }, correctAnswer: { en: "As per prescribed standards", hi: "निर्धारित मानकों के अनुसार" } },
            { id: "q15", question: { en: "Uneven wear of tires can be caused by...", hi: "टायरों का असमान घिसाव... के कारण हो सकता है।" }, options: { en: ["Frequent cleaning", "Incorrect tyre pressure or wheel alignment", "Driving at night", "Using the radio"], hi: ["बार-बार सफाई", "गलत टायर दबाव या व्हील एलाइनमेंट", "रात में गाड़ी चलाना", "रेडियो का उपयोग करना"] }, correctAnswer: { en: "Incorrect tyre pressure or wheel alignment", hi: "गलत टायर दबाव या व्हील एलाइनमेंट" } }
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
            { id: "q5", question: { en: "While driving on a wet road, you should...", hi: "गीली सड़क पर गाड़ी चलाते समय, आपको..." }, options: { en: ["Drive at high speed", "Brake suddenly", "Avoid sudden braking and sharp turns", "Use high beam"], hi: ["तेज गति से चलाएं", "अचानक ब्रेक लगाएं", "अचानक ब्रेक लगाने और तेज मोड़ से बचें", "हाई बीम का प्रयोग करें"] }, correctAnswer: { en: "Avoid sudden braking and sharp turns", hi: "अचानक ब्रेक लगाने और तेज मोड़ से बचें" } },
            { id: "q6", question: { en: "You should use your turn indicators...", hi: "आपको अपने टर्न इंडिकेटर्स का उपयोग करना चाहिए..." }, options: { en: ["Only at night", "Well before making a turn or changing lanes", "As you are turning", "Only on highways"], hi: ["केवल रात में", "मोड़ने या लेन बदलने से काफी पहले", "जैसे ही आप मुड़ रहे हैं", "केवल राजमार्गों पर"] }, correctAnswer: { en: "Well before making a turn or changing lanes", hi: "मोड़ने या लेन बदलने से काफी पहले" } },
            { id: "q7", question: { en: "What is the legal blood alcohol concentration (BAC) limit for drivers in India?", hi: "भारत में चालकों के लिए कानूनी रक्त शराब एकाग्रता (बीएसी) की सीमा क्या है?" }, options: { en: ["0.05%", "0.08%", "0.03%", "0.00%"], hi: ["0.05%", "0.08%", "0.03%", "0.00%"] }, correctAnswer: { en: "0.03%", hi: "0.03%" } },
            { id: "q8", question: { en: "Reversing a vehicle is prohibited on a...", hi: "एक... पर वाहन को रिवर्स करना निषिद्ध है।" }, options: { en: ["Parking lot", "One-way street", "Residential street", "Service lane"], hi: ["पार्किंग स्थल", "एक-तरफ़ा सड़क", "आवासीय सड़क", "सर्विस लेन"] }, correctAnswer: { en: "One-way street", hi: "एक-तरफ़ा सड़क" } },
            { id: "q9", question: { en: "What should you do if you are being dazzled by the headlights of an oncoming vehicle?", hi: "यदि आप एक आने वाले वाहन की हेडलाइट्स से चकाचौंध हो रहे हैं तो आपको क्या करना चाहिए?" }, options: { en: ["Look directly at the lights", "Flash your high beams", "Slow down and look to the left side of the road", "Close your eyes briefly"], hi: ["सीधे लाइटों को देखें", "अपनी हाई बीम फ्लैश करें", "धीमे चलें और सड़क के बाईं ओर देखें", "संक्षेप में अपनी आँखें बंद करें"] }, correctAnswer: { en: "Slow down and look to the left side of the road", hi: "धीमे चलें और सड़क के बाईं ओर देखें" } },
            { id: "q10", question: { en: "A vehicle can be seized by authorities if...", hi: "एक वाहन को अधिकारियों द्वारा जब्त किया जा सकता है यदि..." }, options: { en: ["It does not have valid registration or permit", "It is dirty", "It is an old model", "It has a loud music system"], hi: ["इसके पास वैध पंजीकरण या परमिट नहीं है", "यह गंदा है", "यह एक पुराना मॉडल है", "इसमें एक तेज संगीत प्रणाली है"] }, correctAnswer: { en: "It does not have valid registration or permit", hi: "इसके पास वैध पंजीकरण या परमिट नहीं है" } },
            { id: "q11", question: { en: "What does a sign showing a cup and saucer indicate?", hi: "एक कप और तश्तरी दिखाने वाला चिह्न क्या दर्शाता है?" }, options: { en: ["Tea shop", "Restaurant/Refreshments", "Kitchenware store", "Rest area"], hi: ["चाय की दुकान", "रेस्तरां/जलपान", "रसोई के सामान की दुकान", "विश्राम क्षेत्र"] }, correctAnswer: { en: "Restaurant/Refreshments", hi: "रेस्तरां/जलपान" } },
            { id: "q12", question: { en: "What is the purpose of a catalytic converter?", hi: "एक उत्प्रेरक कनवर्टर का उद्देश्य क्या है?" }, options: { en: ["To increase engine power", "To reduce harmful emissions from the exhaust", "To cool the engine", "To improve mileage"], hi: ["इंजन की शक्ति बढ़ाने के लिए", "निकास से हानिकारक उत्सर्जन को कम करने के लिए", "इंजन को ठंडा करने के लिए", "माइलेज में सुधार करने के लिए"] }, correctAnswer: { en: "To reduce harmful emissions from the exhaust", hi: "निकास से हानिकारक उत्सर्जन को कम करने के लिए" } },
            { id: "q13", question: { en: "When approaching a railway crossing with the gates closed, you should...", hi: "गेट बंद के साथ एक रेलवे क्रॉसिंग के पास पहुँचते समय, आपको..." }, options: { en: ["Wait on the left side of the road before the barrier", "Try to cross from under the barrier", "Honk for the gate to be opened", "Park on the tracks"], hi: ["बैरियर से पहले सड़क के बाईं ओर प्रतीक्षा करें", "बैरियर के नीचे से पार करने की कोशिश करें", "गेट खोलने के लिए हॉर्न बजाएं", "पटरियों पर पार्क करें"] }, correctAnswer: { en: "Wait on the left side of the road before the barrier", hi: "बैरियर से पहले सड़क के बाईं ओर प्रतीक्षा करें" } },
            { id: "q14", question: { en: "It is dangerous to drive with bald tyres because...", hi: "गंजे टायरों के साथ गाड़ी चलाना खतरनाक है क्योंकि..." }, options: { en: ["They look bad", "They are illegal", "They have poor grip, especially on wet roads", "They make a lot of noise"], hi: ["वे बुरे दिखते हैं", "वे अवैध हैं", "उनकी पकड़ खराब होती है, खासकर गीली सड़कों पर", "वे बहुत शोर करते हैं"] }, correctAnswer: { en: "They have poor grip, especially on wet roads", hi: "उनकी पकड़ खराब होती है, खासकर गीली सड़कों पर" } },
            { id: "q15", question: { en: "The abbreviation 'LMV' on a driving license stands for...", hi: "एक ड्राइविंग लाइसेंस पर संक्षिप्त नाम 'एलएमवी' का मतलब है..." }, options: { en: ["Light Motor Vehicle", "Large Motor Vehicle", "Luxury Motor Vehicle", "Long Motor Vehicle"], hi: ["लाइट मोटर व्हीकल", "लार्ज मोटर व्हीकल", "लग्जरी मोटर व्हीकल", "लॉन्ग मोटर व्हीकल"] }, correctAnswer: { en: "Light Motor Vehicle", hi: "लाइट मोटर व्हीकल" } }
        ]
    }
];

export async function fetchQuizSets(): Promise<QuizSet[]> {
    return allQuizSets;
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    if (!db) return null;
    const snapshot = await getDoc(doc(db, 'blogPosts', slug));
    return snapshot.exists() ? { slug: snapshot.id, ...snapshot.data() } as BlogPost : null;
}

// Client-side function to listen for real-time updates
export function listenToBlogPosts(callback: (data: BlogPost[]) => void): () => void {
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
    const posterData: PromotionalPoster[] = [
        {
            id: 'customer-offer-1',
            title: '20% Off Premium Plan!',
            description: 'Get started with our best plan and save big. Limited time only!',
            href: '/payment?plan=Premium&price=9999',
            imageSrc: 'https://placehold.co/600x800/ef4444/ffffff.png',
            imageHint: 'discount sale offer',
        },
        {
            id: 'trainer-offer-1',
            title: 'Join as a Trainer!',
            description: 'Sign up this month and get a ₹1000 joining bonus after your first student.',
            href: '/register',
            imageSrc: 'https://placehold.co/600x800/3b82f6/ffffff.png',
            imageHint: 'driving instructor welcome',
        },
        {
            id: 'referral-offer-1',
            title: 'Double Referral Points!',
            description: 'For a limited time, earn double the points for every friend you refer.',
            href: '/dashboard/referrals/invite',
            imageSrc: 'https://placehold.co/600x800/22c55e/ffffff.png',
            imageHint: 'gift points reward',
        },
    ];
    callback(posterData);
    return () => {}; // No-op for cleanup since it's static data
}

// =================================================================
// HELPER & MISC FUNCTIONS
// =================================================================

const reAssignCourseIcons = (coursesToHydrate: Course[]): Course[] => coursesToHydrate.map(course => {
    let newIcon;
    if (course.title.includes('Car')) newIcon = Car;
    else if (course.title.includes('Motorcycle')) newIcon = Bike;
    else newIcon = FileText;
    return { ...course, icon: newIcon };
});

export async function fetchApprovedInstructors(filters: { location?: string; gender?: string } = {}): Promise<UserProfile[]> {
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

export async function fetchReferralsByUserId(userId: string | undefined): Promise<Referral[]> {
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
