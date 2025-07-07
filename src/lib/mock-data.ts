
import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues, FaqItem, BlogPost, SiteBanner, PromotionalPoster, FaqFormValues, BlogPostFormValues, VisualContentFormValues } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, writeBatch, documentId, orderBy, limit, setDoc } from 'firebase/firestore';


const initialFaqs: FaqItem[] = [
  {
    id: "faq-1",
    question: "What documents do I need to enroll?",
    answer: "For customer registration, you'll need a valid photo ID (like Aadhaar, PAN card, or Passport). If you already have a Learner's or Permanent License, you'll be asked to provide its details. Trainers need to provide their professional certifications and vehicle documents.",
  },
  {
    id: "faq-2",
    question: "Can I choose my instructor?",
    answer: "Yes! Our platform allows you to specify your preference for a male or female instructor during registration. We do our best to accommodate your choice based on instructor availability in your location.",
  },
  {
    id: "faq-3",
    question: "How do I book a driving lesson slot?",
    answer: "Once your registration is approved and you have an active subscription, you can log in to your customer dashboard. From there, you'll be able to view available slots for your chosen instructor and book them according to your convenience.",
  },
  {
    id: "faq-4",
    question: "What types of vehicles are available for training?",
    answer: "We offer training for both two-wheelers (scooters, motorcycles) and four-wheelers (manual and automatic cars). You can select your vehicle preference during registration.",
  },
  {
    id: "faq-5",
    question: "What if I need to cancel or reschedule a lesson?",
    answer: "You can manage your bookings through your dashboard. Please refer to our cancellation policy for details on timelines to avoid any charges. We recommend rescheduling at least 24 hours in advance.",
  },
  {
    id: "faq-6",
    question: "How do I redeem a coupon code?",
    answer: "You can apply a coupon or referral code on the payment page when you subscribe to a plan. Look for the 'Referral/Discount Code' field, enter your code, and click 'Apply' to see the discount on your total amount."
  },
  {
    id: "faq-7",
    question: "How can I use the points earned from referrals?",
    answer: "Referral points you earn can be used to get discounts on your subscription renewals or for other services within the Drivergy platform. Currently, points cannot be withdrawn as cash but offer great value towards your learning journey."
  },
  {
    id: "faq-8",
    question: "Is our driving school completion certificate valid at the RTO?",
    answer: "Drivergy Certificates are valid at RTO office as we are authorized partner.",
  }
];

const initialBlogPosts: BlogPost[] = [
  {
    slug: "10-essential-rto-tips-to-pass-your-driving-test-first-try",
    title: "10 Essential RTO Tips to Pass Your Driving Test First Try",
    category: "RTO Tips",
    excerpt: "Nervous about your driving test? We've compiled the top 10 tips, from pre-test checks to on-road etiquette, to help you ace your RTO exam with confidence.",
    content: "Nervous about your driving test? We've compiled the top 10 tips, from pre-test checks to on-road etiquette, to help you ace your RTO exam with confidence. This guide covers everything from the 'mirror-signal-manoeuvre' routine to handling tricky junctions and what examiners are really looking for. Preparation is key, and with our advice, you'll walk into the test center feeling prepared and calm. We'll also cover common pitfalls and how to avoid them, ensuring you make the best impression on your test day.",
    author: "Rohan Sharma",
    date: "July 26, 2024",
    imageSrc: "https://placehold.co/1200x800.png",
    imageHint: "driving test exam",
    tags: "rto, driving test, tips",
  },
  {
    slug: "mastering-parallel-parking-a-step-by-step-guide",
    title: "Mastering Parallel Parking: A Step-by-Step Guide",
    category: "Driving Skills",
    excerpt: "Parallel parking can be intimidating, but it doesn't have to be. Follow our simple, step-by-step guide to master this essential driving maneuver and park like a pro every time.",
    content: "Parallel parking can be intimidating, but it doesn't have to be. Follow our simple, step-by-step guide to master this essential driving maneuver and park like a pro every time. We break it down into easy-to-follow steps, complete with diagrams and reference points you can use in any car. With a little practice, you'll be able to confidently parallel park in even the tightest of spaces.",
    author: "Priya Mehta",
    date: "July 22, 2024",
    imageSrc: "https://placehold.co/1200x800.png",
    imageHint: "parallel parking car",
    tags: "parking, skills, guide",
  },
  {
    slug: "understanding-indian-road-signs-a-visual-guide",
    title: "Understanding Indian Road Signs: A Visual Guide",
    category: "RTO Knowledge",
    excerpt: "From mandatory signs to cautionary warnings, understanding road signs is crucial for safety. This visual guide will help you decode the most common signs you'll encounter on Indian roads.",
    content: "From mandatory signs to cautionary warnings, understanding road signs is crucial for safety. This visual guide will help you decode the most common signs you'll encounter on Indian roads. We categorize signs into mandatory, cautionary, and informatory groups, explaining the meaning behind the shapes, colors, and symbols. This knowledge is not only vital for passing your RTO test but also for being a safe and responsible driver.",
    author: "Anjali Verma",
    date: "July 18, 2024",
    imageSrc: "https://placehold.co/1200x800.png",
    imageHint: "road signs traffic",
    tags: "road signs, rto, safety",
  },
  {
    slug: "defensive-driving-101-how-to-stay-safe-in-city-traffic",
    title: "Defensive Driving 101: How to Stay Safe in City Traffic",
    category: "Driving Skills",
    excerpt: "City driving presents unique challenges. Learn the core principles of defensive driving to anticipate hazards, avoid accidents, and navigate busy urban environments safely.",
    content: "City driving presents unique challenges. Learn the core principles of defensive driving to anticipate hazards, avoid accidents, and navigate busy urban environments safely. This article covers techniques like maintaining a safe following distance, being aware of your surroundings (the '360-degree check'), managing blind spots, and communicating effectively with other road users. Defensive driving is about being proactive, not reactive.",
    author: "Vikram Singh",
    date: "July 15, 2024",
    imageSrc: "https://placehold.co/1200x800.png",
    imageHint: "city traffic car",
    tags: "defensive driving, safety, city driving",
  },
  {
    slug: "choosing-your-first-car-a-beginners-guide",
    title: "Choosing Your First Car: A Beginner's Guide",
    category: "Car Maintenance",
    excerpt: "Buying your first car is a huge milestone. This guide covers everything from budget to insurance to help you make a smart choice.",
    content: "Buying your first car is a huge milestone. This guide covers everything from setting a realistic budget (including running costs) to understanding insurance options and performing basic pre-purchase inspections. We'll help you decide between new and used, petrol and diesel, and manual and automatic, so you can make an informed decision that you'll be happy with for years to come.",
    author: "Rohan Sharma",
    date: "July 12, 2024",
    imageSrc: "https://placehold.co/1200x800.png",
    imageHint: "new car dealership",
    tags: "buying car, guide, beginners",
  },
  {
    slug: "night-driving-tips-for-staying-safe-after-dark",
    title: "Night Driving: Tips for Staying Safe After Dark",
    category: "Driving Skills",
    excerpt: "Driving at night comes with its own set of risks. Learn how to improve visibility and stay alert on the road after sunset.",
    content: "Driving at night comes with its own set of risks due to reduced visibility and glare from oncoming traffic. This guide provides essential tips for staying safe, including how to properly use your headlights, manage glare, increase your following distance, and stay alert. We also cover how to keep your windscreen and mirrors clean for maximum clarity after dark.",
    author: "Priya Mehta",
    date: "July 08, 2024",
    imageSrc: "https://placehold.co/1200x800.png",
    imageHint: "night road car lights",
    tags: "night driving, safety, tips",
  },
];

const initialBanners: SiteBanner[] = [
  {
    id: 'hero-1',
    title: 'Join a Team of Professionals',
    description: 'Our certified instructors provide personalized training to ensure you become a safe and confident driver.',
    imageSrc: 'https://placehold.co/1920x1080.png',
    imageHint: 'driving instructors team',
  },
  {
    id: 'hero-2',
    title: 'Learn in a Safe Environment',
    description: 'Master driving in our fleet of modern, dual-control cars, making your learning experience safe and comfortable.',
    imageSrc: 'https://placehold.co/1920x1080.png',
    imageHint: 'driving lesson car interior',
  },
  {
    id: 'hero-3',
    title: 'Your Success Is Our Mission',
    description: "Join thousands of successful students who've passed their driving test with our expert guidance and support.",
    imageSrc: 'https://placehold.co/1920x1080.png',
    imageHint: 'happy driver license',
  }
];

const initialPromotionalPosters: PromotionalPoster[] = [
  {
    id: 'promo-1',
    href: "/site/register",
    imageSrc: "https://placehold.co/600x800.png",
    imageHint: "driving school promotion",
    title: "Student Discount",
    description: "Get 15% off on your first Premium plan.",
  },
  {
    id: 'promo-2',
    href: "/site/rto-services",
    imageSrc: "https://placehold.co/600x800.png",
    imageHint: "rto license poster",
    title: "Hassle-Free RTO",
    description: "We help you with all your license needs.",
  },
  {
    id: 'promo-3',
    href: "/site/register",
    imageSrc: "https://placehold.co/600x800.png",
    imageHint: "refer friend bonus",
    title: "Refer & Earn",
    description: "Invite friends and get rewards.",
  }
];

const initialCourses: Omit<Course, 'icon'>[] = [
  {
    id: 'course1',
    title: 'Comprehensive Car Program',
    description: 'From basics to advanced maneuvers, this course prepares you for confident city and highway driving.',
    totalEnrolled: 125,
    totalCertified: 98,
    image: 'https://placehold.co/600x400.png',
    modules: [
      { id: 'c1m1', title: 'Vehicle Controls & Basics', description: 'Understanding the car and its functions.', duration: '2 hours', recordedLectureLink: '#' },
      { id: 'c1m2', title: 'Parking & Reversing', description: 'Master parallel, perpendicular, and angle parking.', duration: '3 hours', recordedLectureLink: '#' },
      { id: 'c1m3', title: 'On-Road Traffic Navigation', description: 'Real-world driving in moderate traffic.', duration: '5 hours', recordedLectureLink: '#' },
    ],
  },
  {
    id: 'course2',
    title: 'Motorcycle Rider Course',
    description: 'Learn to ride a two-wheeler safely, covering balance, traffic rules, and emergency braking.',
    totalEnrolled: 88,
    totalCertified: 71,
    image: 'https://placehold.co/600x400.png',
    modules: [
      { id: 'c2m1', title: 'Balancing and Control', description: 'Getting comfortable on the bike.', duration: '2 hours', recordedLectureLink: '#' },
      { id: 'c2m2', title: 'Safety and Gear', description: 'Importance of helmets and safety gear.', duration: '1 hour', recordedLectureLink: '#' },
    ],
  },
  {
    id: 'course3',
    title: 'RTO Test Preparation',
    description: 'A specialized course to help you ace the official RTO driving test and get your license.',
    totalEnrolled: 210,
    totalCertified: 195,
    image: 'https://placehold.co/600x400.png',
    modules: [
      { id: 'c3m1', title: 'Theory and Signals', description: 'Covering all traffic signs and rules.', duration: '3 hours', recordedLectureLink: '#' },
      { id: 'c3m2', title: 'Practical Test Simulation', description: 'Simulating the official test environment.', duration: '2 hours', recordedLectureLink: '#' },
    ],
  },
];

const baseQuestions = [
  {
    question: {
      en: 'A red traffic light indicates that you must:',
      hi: 'एक लाल ट्रैफिक लाइट इंगित करती है कि आपको:',
    },
    options: {
      en: ['Stop behind the line', 'Slow down', 'Proceed with caution', 'Go if the way is clear'],
      hi: ['रेखा के पीछे रुकें', 'धीमे हो जाएं', 'सावधानी से आगे बढ़ें', 'रास्ता साफ हो तो जाएं'],
    },
    correctAnswer: {
      en: 'Stop behind the line',
      hi: 'रेखा के पीछे रुकें',
    },
  },
  {
    question: {
      en: 'A triangular sign with a red border is a:',
      hi: 'लाल बॉर्डर वाला एक त्रिकोणीय संकेत है:',
    },
    options: {
      en: ['Mandatory sign', 'Warning sign', 'Informatory sign', 'Regulatory sign'],
      hi: ['अनिवार्य संकेत', 'चेतावनी संकेत', 'सूचनात्मक संकेत', 'नियामक संकेत'],
    },
    correctAnswer: {
      en: 'Warning sign',
      hi: 'चेतावनी संकेत',
    },
  },
  {
    question: {
      en: 'When is overtaking prohibited?',
      hi: 'ओवरटेक करना कब प्रतिबंधित है?',
    },
    options: {
      en: ['On a wide road', 'When the road ahead is not clearly visible', 'During the daytime', 'On a one-way street'],
      hi: ['चौड़ी सड़क पर', 'जब आगे का रास्ता साफ दिखाई न दे', 'दिन के समय', 'एक तरफा सड़क पर'],
    },
    correctAnswer: {
      en: 'When the road ahead is not clearly visible',
      hi: 'जब आगे का रास्ता साफ दिखाई न दे',
    },
  },
  {
    question: {
      en: 'A blue circular sign with a white bicycle symbol indicates:',
      hi: 'एक सफेद साइकिल प्रतीक वाला नीला गोलाकार संकेत इंगित करता है:',
    },
    options: {
      en: ['Bicycles are not allowed', 'Parking for bicycles', 'Compulsory pedal cycle track', 'Bicycle repair shop ahead'],
      hi: ['साइकिल की अनुमति नहीं है', 'साइकिल के लिए पार्किंग', 'अनिवार्य पेडल साइकिल ट्रैक', 'आगे साइकिल मरम्मत की दुकान'],
    },
    correctAnswer: {
      en: 'Compulsory pedal cycle track',
      hi: 'अनिवार्य पेडल साइकिल ट्रैक',
    },
  },
  {
    question: {
      en: 'What is the minimum age for obtaining a license for a motorcycle with gears?',
      hi: 'गियर वाली मोटरसाइकिल के लिए लाइसेंस प्राप्त करने की न्यूनतम आयु क्या है?',
    },
    options: {
      en: ['16 years', '18 years', '20 years', '21 years'],
      hi: ['16 साल', '18 साल', '20 साल', '21 साल'],
    },
    correctAnswer: {
      en: '18 years',
      hi: '18 साल',
    },
  },
  {
    question: {
      en: 'What does a flashing yellow traffic light mean?',
      hi: 'एक चमकती पीली ट्रैफिक लाइट का क्या मतलब है?',
    },
    options: {
      en: ['Stop completely', 'Speed up', 'Slow down and proceed with caution', 'The light is about to turn red'],
      hi: ['पूरी तरह से रुकें', 'गति बढ़ाएं', 'धीमे चलें और सावधानी से आगे बढ़ें', 'लाइट लाल होने वाली है'],
    },
    correctAnswer: {
      en: 'Slow down and proceed with caution',
      hi: 'धीमे चलें और सावधानी से आगे बढ़ें',
    },
  },
  {
    question: {
      en: 'If you are approached by an ambulance with its siren on, you should:',
      hi: 'यदि आपके पास सायरन बजाती हुई एम्बुलेंस आती है, तो आपको:',
    },
    options: {
      en: ['Increase your speed', 'Allow passage by moving to the left', 'Continue at the same speed', 'Stop in the middle of the road'],
      hi: ['अपनी गति बढ़ाएं', 'बाईं ओर हटकर रास्ता दें', 'उसी गति से चलते रहें', 'सड़क के बीच में रुक जाएं'],
    },
    correctAnswer: {
      en: 'Allow passage by moving to the left',
      hi: 'बाईं ओर हटकर रास्ता दें',
    },
  },
  {
    question: {
      en: 'What does the sign showing a horn with a red slash across it mean?',
      hi: 'जिस संकेत में हॉर्न पर लाल स्लैश होता है, उसका क्या मतलब है?',
    },
    options: {
      en: ['Honking is compulsory', 'You may honk softly', 'Horn prohibited', 'Hospital nearby'],
      hi: ['हॉर्न बजाना अनिवार्य है', 'आप धीरे से हॉर्न बजा सकते हैं', 'हॉर्न प्रतिबंधित है', 'पास में अस्पताल है'],
    },
    correctAnswer: {
      en: 'Horn prohibited',
      hi: 'हॉर्न प्रतिबंधित है',
    },
  },
  {
    question: {
      en: 'While driving, using a mobile phone is:',
      hi: 'ड्राइवING करते समय, मोबाइल फोन का उपयोग करना:',
    },
    options: {
      en: ['Allowed if using a hands-free device', 'Allowed for short calls', 'Prohibited', 'Allowed only when stopped'],
      hi: ['हैंड्स-फ्री डिवाइस का उपयोग करने पर अनुमति है', 'छोटी कॉल के लिए अनुमति है', 'प्रतिबंधित है', 'केवल रुकने पर अनुमति है'],
    },
    correctAnswer: {
      en: 'Prohibited',
      hi: 'प्रतिबंधित है',
    },
  },
  {
    question: {
      en: "The validity of a Learner's License is:",
      hi: "एक लर्नर लाइसेंस की वैधता है:",
    },
    options: {
      en: ['3 months', '6 months', '1 year', 'Until you get a permanent license'],
      hi: ['3 महीने', '6 महीने', '1 साल', 'जब तक आपको स्थायी लाइसेंस नहीं मिल जाता'],
    },
    correctAnswer: {
      en: '6 months',
      hi: '6 महीने',
    },
  },
  {
    question: {
      en: 'When parking a vehicle facing downhill, the front wheels should be turned:',
      hi: 'ढलान पर वाहन पार्क करते समय, आगे के पहियों को मोड़ना चाहिए:',
    },
    options: {
      en: ['Towards the right', 'Straight ahead', 'Towards the kerb or side of the road', 'It does not matter'],
      hi: ['दाईं ओर', 'सीधे आगे', 'फुटपाथ या सड़क के किनारे की ओर', 'इससे कोई फर्क नहीं पड़ता'],
    },
    correctAnswer: {
      en: 'Towards the kerb or side of the road',
      hi: 'फुटपाथ या सड़क के किनारे की ओर',
    },
  },
  {
    question: {
      en: 'Which of these documents must be carried while driving a vehicle?',
      hi: 'वाहन चलाते समय इनमें से कौन से दस्तावेज ले जाने चाहिए?',
    },
    options: {
      en: ['Driving license, registration, insurance, PUC', 'Aadhaar card and PAN card', 'Vehicle purchase invoice', 'Your birth certificate'],
      hi: ['ड्राइविंग लाइसेंस, पंजीकरण, बीमा, पीयूसी', 'आधार कार्ड और पैन कार्ड', 'वाहन खरीद चालान', 'आपका जन्म प्रमाण पत्र'],
    },
    correctAnswer: {
      en: 'Driving license, registration, insurance, PUC',
      hi: 'ड्राइविंग लाइसेंस, पंजीकरण, बीमा, पीयूसी',
    },
  },
  {
    question: {
      en: "What does the term 'tailgating' mean in driving?",
      hi: "ड्राइविंग में 'टेलगेटिंग' शब्द का क्या अर्थ है?",
    },
    options: {
      en: ['Following another vehicle too closely', 'Checking your tail lights', 'Driving with the trunk open', 'Overtaking from the left'],
      hi: ['दूसरे वाहन का बहुत करीब से पीछा करना', 'अपनी टेल लाइट की जाँच करना', 'ट्रंक खुला रखकर गाड़ी चलाना', 'बाईं ओर से ओवरटेक करना'],
    },
    correctAnswer: {
      en: 'Following another vehicle too closely',
      hi: 'दूसरे वाहन का बहुत करीब से पीछा करना',
    },
  },
  {
    question: {
      en: 'The hand signal for turning right is:',
      hi: 'दाईं ओर मुड़ने का हाथ का संकेत है:',
    },
    options: {
      en: ['Extend the right arm straight out, palm facing forward', 'Rotate the arm in a clockwise circle', 'Extend the right arm and move it up and down', 'Point the arm downwards'],
      hi: ['दाहिना हाथ सीधा बाहर फैलाएं, हथेली आगे की ओर', 'हाथ को दक्षिणावर्त वृत्त में घुमाएं', 'दाहिना हाथ फैलाकर ऊपर-नीचे करें', 'हाथ को नीचे की ओर इंगित करें'],
    },
    correctAnswer: {
      en: 'Extend the right arm straight out, palm facing forward',
      hi: 'दाहिना हाथ सीधा बाहर फैलाएं, हथेली आगे की ओर',
    },
  },
  {
    question: {
      en: 'What is the purpose of a pedestrian crossing (Zebra crossing)?',
      hi: 'पैदल यात्री क्रॉसिंग (ज़ेबरा क्रॉसिंग) का उद्देश्य क्या है?',
    },
    options: {
      en: ['For vehicles to stop', 'For pedestrians to safely cross the road', 'To mark the end of a speed limit', 'For parking'],
      hi: ['वाहनों को रोकने के लिए', 'पैदल चलने वालों को सुरक्षित रूप से सड़क पार करने के लिए', 'गति सीमा के अंत को चिह्नित करने के लिए', 'पार्किंग के लिए'],
    },
    correctAnswer: {
      en: 'For pedestrians to safely cross the road',
      hi: 'पैदल चलने वालों को सुरक्षित रूप से सड़क पार करने के लिए',
    },
  },
];

const initialQuizSets: QuizSet[] = Array.from({ length: 10 }, (_, i) => ({
  id: `set${i + 1}`,
  title: `Set ${i + 1}`,
  questions: baseQuestions.map((q, j) => ({
    id: `q${i + 1}-${j + 1}`,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
  })),
}));

// =================================================================
// MOCK DATABASE & LOCAL STORAGE PERSISTENCE
// =================================================================

interface MockDatabase {
  users: UserProfile[];
  lessonRequests: LessonRequest[];
  rescheduleRequests: RescheduleRequest[];
  feedback: Feedback[];
  referrals: Referral[];
  courses: Course[];
  quizSets: QuizSet[];
  faqs: FaqItem[];
  blogPosts: BlogPost[];
  siteBanners: SiteBanner[];
  promotionalPosters: PromotionalPoster[];
}

const ADMIN_ID = 'admin-user-id-01';
const SAMPLE_TRAINER_ID = 'sample-trainer-id-01';
const SAMPLE_CUSTOMER_ID = 'sample-customer-id-01';

const adminUser: UserProfile = {
  id: ADMIN_ID,
  uniqueId: 'ADMIN-001',
  name: 'Admin User',
  username: 'admin',
  password: 'admin',
  contact: 'admin@drivergy.com',
  phone: '1234567890',
  location: 'Gurugram',
  subscriptionPlan: 'Admin',
  registrationTimestamp: new Date('2023-01-01T09:00:00Z').toISOString(),
  approvalStatus: 'Approved',
  gender: 'Other',
  photoURL: 'https://placehold.co/100x100.png?text=A',
};

const sampleTrainer: UserProfile = {
  id: SAMPLE_TRAINER_ID,
  uniqueId: 'TR-SAMPLE',
  name: 'Rajesh Kumar',
  username: 'rajesh.trainer',
  password: 'password123',
  contact: 'rajesh.k@example.com',
  phone: '9876543211',
  location: 'Delhi',
  subscriptionPlan: 'Trainer',
  registrationTimestamp: new Date('2023-10-15T09:00:00Z').toISOString(),
  vehicleInfo: 'Car (Manual)',
  approvalStatus: 'Approved',
  myReferralCode: 'RAJESH4321',
  photoURL: 'https://placehold.co/100x100.png',
  specialization: 'Car',
  yearsOfExperience: 8,
  gender: 'Male',
  totalReferralPoints: 100, // Give him one successful referral for demo data
};

const sampleCustomer: UserProfile = {
  id: SAMPLE_CUSTOMER_ID,
  uniqueId: 'CU-SAMPLE',
  name: 'Shivendra Singh',
  username: 'shivendra',
  password: 'password123',
  contact: 'shivendra.s@example.com',
  phone: '9876543210',
  location: 'New Delhi',
  subscriptionPlan: 'Premium',
  registrationTimestamp: new Date('2024-05-20T14:30:00Z').toISOString(),
  vehicleInfo: 'Four-Wheeler',
  approvalStatus: 'Pending',
  dlStatus: 'New Learner',
  photoIdType: 'Aadhaar Card',
  photoIdNumber: '123456789012',
  trainerPreference: 'Any',
  myReferralCode: 'SHIV4567',
  photoURL: 'https://placehold.co/100x100.png',
  gender: 'Male',
  flatHouseNumber: 'B-123',
  street: 'Main Road',
  district: 'New Delhi',
  state: 'Delhi',
  pincode: '110001',
  subscriptionStartDate: format(new Date(), 'MMM dd, yyyy'),
  assignedTrainerId: SAMPLE_TRAINER_ID,
  assignedTrainerName: 'Rajesh Kumar',
  upcomingLesson: format(addDays(new Date(), 3), 'MMM dd, yyyy, h:mm a'),
  totalLessons: 20,
  completedLessons: 5,
  attendance: 'Pending',
  feedbackSubmitted: false,
  totalReferralPoints: 0,
};

const sampleReferral: Referral = {
  id: 'sample-ref-1',
  referrerId: SAMPLE_TRAINER_ID,
  referrerName: 'Rajesh Kumar',
  refereeId: 'another-customer-id',
  refereeName: 'Priya Sharma',
  status: 'Successful',
  pointsEarned: 100,
  payoutStatus: 'Pending',
  timestamp: new Date('2024-06-10T11:00:00Z').toISOString(),
};

const initialUsers = [adminUser, sampleCustomer, sampleTrainer];

let MOCK_DB: MockDatabase = {
  users: [],
  lessonRequests: [],
  rescheduleRequests: [],
  feedback: [],
  referrals: [],
  courses: [],
  quizSets: [],
  faqs: [],
  blogPosts: [],
  siteBanners: [],
  promotionalPosters: [],
};

const generateId = () => `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const reAssignCourseIcons = (coursesToHydrate: Course[]): Course[] => {
  return coursesToHydrate.map(course => {
    let newIcon = course.icon;
    if (course.id === 'course1') newIcon = Car;
    else if (course.id === 'course2') newIcon = Bike;
    else if (course.id === 'course3') newIcon = FileText;
    return { ...course, icon: newIcon };
  });
};

const saveData = () => {
  if (typeof window !== 'undefined') {
    // We remove the icon functions before saving to avoid non-serializable data errors
    const serializableDb = {
      ...MOCK_DB,
      courses: MOCK_DB.courses.map(({ icon, ...rest }) => rest)
    };
    localStorage.setItem('drivergyMockDb', JSON.stringify(serializableDb));
  }
};

const loadData = () => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('drivergyMockDb');
    if (data) {
      const parsedDb = JSON.parse(data);
      parsedDb.courses = reAssignCourseIcons(parsedDb.courses || []);
      MOCK_DB = { ...MOCK_DB, ...parsedDb };

      // Robustness checks - add initial data if missing
      const userExists = (uniqueId: string) => MOCK_DB.users.some(u => u.uniqueId === uniqueId);
      if (!userExists('ADMIN-001')) MOCK_DB.users.push(adminUser);
      if (!userExists('CU-SAMPLE')) MOCK_DB.users.push(sampleCustomer);
      if (!userExists('TR-SAMPLE')) MOCK_DB.users.push(sampleTrainer);

      const referralExists = (id: string) => MOCK_DB.referrals.some(r => r.id === id);
      if (!referralExists('sample-ref-1')) MOCK_DB.referrals.push(sampleReferral);

      if (!MOCK_DB.faqs || MOCK_DB.faqs.length === 0) MOCK_DB.faqs = initialFaqs;
      if (!MOCK_DB.blogPosts || MOCK_DB.blogPosts.length === 0) MOCK_DB.blogPosts = initialBlogPosts;
      if (!MOCK_DB.siteBanners || MOCK_DB.siteBanners.length === 0) MOCK_DB.siteBanners = initialBanners;
      if (!MOCK_DB.promotionalPosters || MOCK_DB.promotionalPosters.length === 0) MOCK_DB.promotionalPosters = initialPromotionalPosters;
      if (!MOCK_DB.quizSets || MOCK_DB.quizSets.length === 0) MOCK_DB.quizSets = initialQuizSets;
      if (!MOCK_DB.courses || MOCK_DB.courses.length === 0) MOCK_DB.courses = reAssignCourseIcons(initialCourses);

      saveData();
    } else {
      // If no data in local storage, initialize with all hardcoded data
      MOCK_DB.users = initialUsers;
      MOCK_DB.referrals = [sampleReferral];
      MOCK_DB.courses = reAssignCourseIcons(initialCourses);
      MOCK_DB.quizSets = initialQuizSets;
      MOCK_DB.faqs = initialFaqs;
      MOCK_DB.blogPosts = initialBlogPosts;
      MOCK_DB.siteBanners = initialBanners;
      MOCK_DB.promotionalPosters = initialPromotionalPosters;
      saveData();
    }
  }
};

loadData();


// =================================================================
// USER MANAGEMENT
// =================================================================

export const authenticateUserByCredentials = async (username: string, password: string): Promise<UserProfile | null> => {
  if (!db) {
    const user = MOCK_DB.users.find(u => u.username?.toLowerCase() === username.toLowerCase() && u.password === password);
    return user ? { ...user } : null;
  }

  // Special case for admin login on live DB to ensure it always works and seeds the user if needed.
  if (username.toLowerCase() === 'admin' && password === 'admin') {
    const adminDocRef = doc(db, 'users', ADMIN_ID);
    const adminDocSnap = await getDoc(adminDocRef);

    if (!adminDocSnap.exists()) {
      // Admin user doesn't exist, so create it on the fly.
      // We must remove the `id` from the object before setting it.
      const { id, ...adminData } = adminUser;
      await setDoc(adminDocRef, adminData);
      console.log("Admin user has been seeded into the live database.");
      return adminUser; // Return the complete profile including the ID
    } else {
      // Admin exists, return their profile
      return { id: adminDocSnap.id, ...adminDocSnap.data() } as UserProfile;
    }
  }

  // Regular user login logic for the live database
  const usersRef = collection(db, "users");
  // Firestore queries are case-sensitive. This will only find users with exact username match.
  const q = query(usersRef, where("username", "==", username), where("password", "==", password), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }
  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() } as UserProfile;
};


export const updateUserProfile = async (userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> => {
  if (!db) {
    const userIndex = MOCK_DB.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    const updatedUser: UserProfile = {
      ...MOCK_DB.users[userIndex],
      name: data.name,
      contact: data.email,
      phone: data.phone,
      location: data.district || MOCK_DB.users[userIndex].location,
      photoURL: data.photo ? `https://placehold.co/100x100.png` : MOCK_DB.users[userIndex].photoURL,
      flatHouseNumber: data.flatHouseNumber,
      street: data.street,
      state: data.state,
      district: data.district,
      pincode: data.pincode,
    };
    MOCK_DB.users[userIndex] = updatedUser;
    saveData();
    return { ...updatedUser };
  }

  const userRef = doc(db, "users", userId);
  const updateData = {
    name: data.name,
    contact: data.email,
    phone: data.phone,
    location: data.district,
    photoURL: data.photo ? `https://placehold.co/100x100.png` : undefined, // This needs real storage logic
    flatHouseNumber: data.flatHouseNumber,
    street: data.street,
    state: data.state,
    district: data.district,
    pincode: data.pincode,
  };
  // This removes undefined fields so we don't overwrite existing data with nothing
  Object.keys(updateData).forEach(key => updateData[key as keyof typeof updateData] === undefined && delete updateData[key as keyof typeof updateData]);

  await updateDoc(userRef, updateData);
  const updatedDoc = await getDoc(userRef);
  return { id: updatedDoc.id, ...updatedDoc.data() } as UserProfile;
};

export const changeUserPassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
  // This function remains mock-only as it requires Firebase Auth integration, not just Firestore.
  const userIndex = MOCK_DB.users.findIndex(u => u.id === userId);
  if (userIndex !== -1 && MOCK_DB.users[userIndex].password === currentPassword) {
    MOCK_DB.users[userIndex].password = newPassword;
    saveData();
    return true;
  }
  return false;
};

export const addCustomer = async (data: CustomerRegistrationFormValues): Promise<UserProfile> => {
  const getLessonsForPlan = (plan: string): number => ({ Premium: 20, Gold: 15, Basic: 10 }[plan] || 0);

  const newUser: Omit<UserProfile, 'id'> = {
    uniqueId: `CU-${generateId().slice(-6).toUpperCase()}`,
    name: data.name,
    username: data.username,
    password: data.password,
    contact: data.email,
    phone: data.phone,
    location: data.district,
    gender: data.gender,
    flatHouseNumber: data.flatHouseNumber,
    street: data.street,
    district: data.district,
    state: data.state,
    pincode: data.pincode,
    subscriptionPlan: data.subscriptionPlan,
    registrationTimestamp: new Date().toISOString(),
    vehicleInfo: data.vehiclePreference,
    approvalStatus: 'Pending',
    dlStatus: data.dlStatus,
    dlNumber: data.dlNumber,
    photoIdType: data.photoIdType,
    photoIdNumber: data.photoIdNumber,
    trainerPreference: data.trainerPreference,
    myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${generateId().slice(-4)}`,
    attendance: 'Pending',
    photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
    subscriptionStartDate: format(data.subscriptionStartDate, 'MMM dd, yyyy'),
    totalLessons: getLessonsForPlan(data.subscriptionPlan),
    completedLessons: 0,
    totalReferralPoints: 0,
  };

  if (!db) {
    const userWithId = { ...newUser, id: generateId() };
    MOCK_DB.users.push(userWithId);

    const newRequest: LessonRequest = { id: generateId(), customerId: userWithId.id, customerName: newUser.name, vehicleType: data.vehiclePreference as VehicleType, status: 'Pending', requestTimestamp: new Date().toISOString() };
    MOCK_DB.lessonRequests.push(newRequest);
    saveData();
    return userWithId;
  }

  const docRef = await addDoc(collection(db, 'users'), newUser);
  const newRequestData: Omit<LessonRequest, 'id'> = { customerId: docRef.id, customerName: newUser.name, vehicleType: data.vehiclePreference as VehicleType, status: 'Pending', requestTimestamp: new Date().toISOString() };
  await addDoc(collection(db, 'lessonRequests'), newRequestData);
  // Handle referral logic for firestore if needed
  return { id: docRef.id, ...newUser };
};

export const addTrainer = async (data: TrainerRegistrationFormValues): Promise<UserProfile> => {
  const newTrainer: Omit<UserProfile, 'id'> = {
    uniqueId: `TR-${generateId().slice(-6).toUpperCase()}`,
    name: data.name,
    username: data.username,
    password: data.password,
    contact: data.email,
    phone: data.phone,
    location: data.location,
    gender: data.gender,
    subscriptionPlan: "Trainer",
    registrationTimestamp: new Date().toISOString(),
    vehicleInfo: data.trainerVehicleType,
    approvalStatus: 'Pending',
    myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${generateId().slice(-4)}`,
    photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
    specialization: data.specialization,
    yearsOfExperience: data.yearsOfExperience,
  };

  if (!db) {
    const trainerWithId = { ...newTrainer, id: generateId() };
    MOCK_DB.users.push(trainerWithId);
    saveData();
    return trainerWithId;
  }

  const docRef = await addDoc(collection(db, 'users'), newTrainer);
  return { id: docRef.id, ...newTrainer };
};

export const updateUserApprovalStatus = async (userId: string, newStatus: ApprovalStatusType): Promise<boolean> => {
  if (!db) {
    const userIndex = MOCK_DB.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      MOCK_DB.users[userIndex].approvalStatus = newStatus;
      saveData();
      return true;
    }
    return false;
  }

  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { approvalStatus: newStatus });
  return true;
};

export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  const mockFetch = () => [...MOCK_DB.users].sort((a,b) => new Date(b.registrationTimestamp).getTime() - new Date(a.registrationTimestamp).getTime());
  if (!db) return mockFetch();

  try {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, orderBy("registrationTimestamp", "desc"));
    const userSnapshot = await getDocs(q);
    return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
  } catch (error: any) {
    if (error.code === 'permission-denied' || (error.message && error.message.includes('insufficient permissions'))) {
      console.warn("Firebase permission denied in fetchAllUsers. Falling back to mock data.");
      return mockFetch();
    }
    throw error;
  }
};

export const fetchUserById = async (userId: string): Promise<UserProfile | null> => {
  if (!db) {
    const user = MOCK_DB.users.find(u => u.id === userId);
    if (!user) return null;

    // If user is a customer with an assigned trainer, fetch trainer details and attach them.
    if (user.uniqueId.startsWith('CU') && user.assignedTrainerId) {
      const trainer = MOCK_DB.users.find(t => t.id === user.assignedTrainerId);
      if (trainer) {
        user.assignedTrainerPhone = trainer.phone;
        user.assignedTrainerExperience = trainer.yearsOfExperience;
        user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
      }
    }
    return { ...user };
  }
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;

  const user = { id: userSnap.id, ...userSnap.data() } as UserProfile;

  // If user is a customer with an assigned trainer, fetch trainer details and attach them.
  if (user.uniqueId?.startsWith('CU') && user.assignedTrainerId) {
    const trainerRef = doc(db, "users", user.assignedTrainerId);
    const trainerSnap = await getDoc(trainerRef);
    if (trainerSnap.exists()) {
      const trainer = trainerSnap.data() as UserProfile;
      user.assignedTrainerPhone = trainer.phone;
      user.assignedTrainerExperience = trainer.yearsOfExperience;
      user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
    }
  }

  return user;
};


export const fetchApprovedInstructors = async (filters: { location?: string; gender?: string } = {}): Promise<UserProfile[]> => {
  if (!db) {
    return MOCK_DB.users.filter(u =>
        u.uniqueId.startsWith('TR') &&
        u.approvalStatus === 'Approved' &&
        (!filters.location || u.location === filters.location) &&
        (!filters.gender || u.gender === filters.gender)
    );
  }

  let queries = [
    where("uniqueId", ">=", "TR-"),
    where("uniqueId", "<", "TR." ), // A trick to query by prefix
    where("approvalStatus", "==", "Approved")
  ];
  if(filters.location) queries.push(where("location", "==", filters.location));
  if(filters.gender) queries.push(where("gender", "==", filters.gender));

  const q = query(collection(db, "users"), ...queries);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
};

export const assignTrainerToCustomer = async (customerId: string, trainerId: string): Promise<boolean> => {
  if (!db) {
    const customerIndex = MOCK_DB.users.findIndex(u => u.id === customerId);
    const trainer = MOCK_DB.users.find(u => u.id === trainerId);
    if (customerIndex !== -1 && trainer) {
      MOCK_DB.users[customerIndex].approvalStatus = 'In Progress';
      MOCK_DB.users[customerIndex].assignedTrainerId = trainer.id;
      MOCK_DB.users[customerIndex].assignedTrainerName = trainer.name;
      saveData();
      return true;
    }
    return false;
  }
  const customerRef = doc(db, "users", customerId);
  const trainerDoc = await getDoc(doc(db, "users", trainerId));
  if (!trainerDoc.exists()) return false;

  await updateDoc(customerRef, {
    approvalStatus: 'In Progress',
    assignedTrainerId: trainerId,
    assignedTrainerName: trainerDoc.data().name
  });
  return true;
};

// =================================================================
// SUMMARY & DASHBOARD DATA
// =================================================================

export const fetchSummaryData = async (): Promise<SummaryData> => {
  const mockFetch = () => {
    const totalCustomers = MOCK_DB.users.filter(u => u.uniqueId.startsWith('CU')).length;
    const totalInstructors = MOCK_DB.users.filter(u => u.uniqueId.startsWith('TR')).length;
    const activeSubscriptions = MOCK_DB.users.filter(u => u.approvalStatus === 'Approved').length;
    const pendingRequests = MOCK_DB.lessonRequests.filter(r => r.status === 'Pending').length;
    const pendingRescheduleRequests = MOCK_DB.rescheduleRequests.filter(r => r.status === 'Pending').length;
    const totalCertifiedTrainers = MOCK_DB.users.filter(u => u.uniqueId.startsWith('TR') && u.approvalStatus === 'Approved').length;
    const totalEarnings = MOCK_DB.users.filter(u => u.approvalStatus === 'Approved' && u.subscriptionPlan !== 'Trainer').reduce((acc, user) => {
      if (user.subscriptionPlan === 'Premium') return acc + 9999;
      if (user.subscriptionPlan === 'Gold') return acc + 7499;
      if (user.subscriptionPlan === 'Basic') return acc + 3999;
      return acc;
    }, 0);
    return { totalCustomers, totalInstructors, activeSubscriptions, pendingRequests, pendingRescheduleRequests, totalEarnings, totalCertifiedTrainers };
  };

  if (!db) return mockFetch();

  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);

    const totalCustomers = users.filter(u => u.uniqueId?.startsWith('CU')).length;
    const totalInstructors = users.filter(u => u.uniqueId?.startsWith('TR')).length;
    const activeSubscriptions = users.filter(u => u.approvalStatus === 'Approved').length;
    const pendingRequests = (await getDocs(query(collection(db, 'lessonRequests'), where('status', '==', 'Pending')))).size;
    const pendingRescheduleRequests = (await getDocs(query(collection(db, 'rescheduleRequests'), where('status', '==', 'Pending')))).size;
    const totalCertifiedTrainers = users.filter(u => u.uniqueId?.startsWith('TR') && u.approvalStatus === 'Approved').length;

    const totalEarnings = users.filter(u => u.approvalStatus === 'Approved' && u.subscriptionPlan !== 'Trainer').reduce((acc, user) => {
      if (user.subscriptionPlan === 'Premium') return acc + 9999;
      if (user.subscriptionPlan === 'Gold') return acc + 7499;
      if (user.subscriptionPlan === 'Basic') return acc + 3999;
      return acc;
    }, 0);

    return { totalCustomers, totalInstructors, activeSubscriptions, pendingRequests, pendingRescheduleRequests, totalEarnings, totalCertifiedTrainers };
  } catch (error: any) {
    if (error.code === 'permission-denied' || (error.message && error.message.includes('insufficient permissions'))) {
      console.warn("Firebase permission denied in fetchSummaryData. Falling back to mock data.");
      return mockFetch();
    }
    throw error;
  }
};

// =================================================================
// TRAINER SPECIFIC FUNCTIONS
// =================================================================
export const fetchAllTrainerStudents = async (trainerId: string): Promise<UserProfile[]> => {
  if (!db) {
    return MOCK_DB.users.filter(u => u.assignedTrainerId === trainerId);
  }
  try {
    const q = query(collection(db, "users"), where("assignedTrainerId", "==", trainerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
  } catch (error: any) {
    if (error.code === 'permission-denied' || (error.message && error.message.includes('insufficient permissions'))) {
      console.warn("Firebase permission denied in fetchAllTrainerStudents. Falling back to mock data. Please check your Firestore security rules.");
      return MOCK_DB.users.filter(u => u.assignedTrainerId === trainerId);
    }
    // Re-throw other errors
    throw error;
  }
};

export const updateAssignmentStatusByTrainer = async (customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> => {
  const customerRef = doc(db, "users", customerId);
  if (!db) {
    const customerIndex = MOCK_DB.users.findIndex(u => u.id === customerId);
    if (customerIndex === -1) return false;

    MOCK_DB.users[customerIndex].approvalStatus = newStatus;

    if (newStatus === 'Approved') {
      const customer = MOCK_DB.users[customerIndex];
      const startDate = parse(customer.subscriptionStartDate!, 'MMM dd, yyyy', new Date());
      const firstLessonDate = addDays(startDate, 2);
      firstLessonDate.setHours(9, 0, 0, 0); // 9 AM
      customer.upcomingLesson = format(firstLessonDate, 'MMM dd, yyyy, h:mm a');

      const reqIndex = MOCK_DB.lessonRequests.findIndex(r => r.customerId === customerId && r.status === 'Pending');
      if (reqIndex !== -1) MOCK_DB.lessonRequests[reqIndex].status = 'Active';

    } else { // Rejected
      MOCK_DB.users[customerIndex].assignedTrainerId = undefined;
      MOCK_DB.users[customerIndex].assignedTrainerName = undefined;
    }
    saveData();
    return true;
  }

  await updateDoc(customerRef, { approvalStatus: newStatus });
  if (newStatus === 'Approved') {
    const customerSnap = await getDoc(customerRef);
    if(!customerSnap.exists()) return false;
    const user = customerSnap.data() as UserProfile;
    const startDate = parse(user.subscriptionStartDate!, 'MMM dd, yyyy', new Date());
    const firstLessonDate = addDays(startDate, 2);
    firstLessonDate.setHours(9, 0, 0, 0);

    await updateDoc(customerRef, {
      upcomingLesson: format(firstLessonDate, 'MMM dd, yyyy, h:mm a'),
    });

    const reqQuery = query(collection(db, 'lessonRequests'), where('customerId', '==', customerId), where('status', '==', 'Pending'));
    const reqSnapshot = await getDocs(reqQuery);
    const batch = writeBatch(db);
    reqSnapshot.docs.forEach(doc => batch.update(doc.ref, { status: 'Active' }));
    await batch.commit();
  } else {
    await updateDoc(customerRef, { assignedTrainerId: null, assignedTrainerName: null });
  }
  return true;
};

export const fetchTrainerFeedback = async (trainerId: string): Promise<Feedback[]> => {
  if (!db) {
    return MOCK_DB.feedback
        .filter(f => f.trainerId === trainerId)
        .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
  }
  try {
    const q = query(collection(db, 'feedback'), where('trainerId', '==', trainerId), orderBy('submissionDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Feedback[];
  } catch (error: any) {
    if (error.code === 'permission-denied' || (error.message && error.message.includes('insufficient permissions'))) {
      console.warn("Firebase permission denied in fetchTrainerFeedback. Falling back to mock data. Please check your Firestore security rules.");
      return MOCK_DB.feedback
          .filter(f => f.trainerId === trainerId)
          .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
    }
    // Re-throw other errors
    throw error;
  }
};

export const updateUserAttendance = async (studentId: string, status: 'Present' | 'Absent'): Promise<boolean> => {
  const studentRef = doc(db, "users", studentId);
  if (!db) {
    const studentIndex = MOCK_DB.users.findIndex(u => u.id === studentId);
    if (studentIndex === -1) return false;
    const student = MOCK_DB.users[studentIndex];
    const alreadyPresent = student.attendance === 'Present';
    student.attendance = status;
    if (status === 'Present' && !alreadyPresent) {
      student.completedLessons = (student.completedLessons || 0) + 1;
    }
    MOCK_DB.users[studentIndex] = student;
    saveData();
    return true;
  }

  const studentSnap = await getDoc(studentRef);
  if (!studentSnap.exists()) return false;

  const studentData = studentSnap.data() as UserProfile;
  const updates: Partial<UserProfile> = { attendance: status };

  if (status === 'Present' && studentData.attendance !== 'Present') {
    updates.completedLessons = (studentData.completedLessons || 0) + 1;
  }

  await updateDoc(studentRef, updates);
  return true;
};

// =================================================================
// GENERIC CONTENT MANAGEMENT & OTHER FUNCTIONS
// =================================================================
const handlePermissionError = <T>(error: any, fallback: () => T, functionName: string): T => {
  if (error.code === 'permission-denied' || (error.message && error.message.includes('insufficient permissions'))) {
    console.warn(`Firebase permission denied in ${functionName}. Falling back to mock data.`);
    return fallback();
  }
  throw error;
};

export const fetchAllLessonRequests = async (): Promise<LessonRequest[]> => {
  const mockFetch = () => [...MOCK_DB.lessonRequests].sort((a, b) => new Date(b.requestTimestamp).getTime() - new Date(a.requestTimestamp).getTime());
  if (!db) return mockFetch();

  try {
    const snapshot = await getDocs(query(collection(db, 'lessonRequests'), orderBy('requestTimestamp', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LessonRequest[];
  } catch (error) {
    return handlePermissionError(error, mockFetch, 'fetchAllLessonRequests');
  }
};

export const addRescheduleRequest = async (userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<RescheduleRequest> => {
  const newRequest = {
    userId,
    customerName,
    originalLessonDate: format(originalDate, 'MMM dd, yyyy, h:mm a'),
    requestedRescheduleDate: format(newDate, 'MMM dd, yyyy, h:mm a'),
    status: 'Pending' as RescheduleRequestStatusType,
    requestTimestamp: new Date().toISOString(),
  };

  if (!db) {
    const requestWithId = { ...newRequest, id: generateId() };
    MOCK_DB.rescheduleRequests.push(requestWithId);
    saveData();
    return requestWithId;
  }

  const docRef = await addDoc(collection(db, 'rescheduleRequests'), newRequest);
  return { id: docRef.id, ...newRequest };
};

export const fetchRescheduleRequests = async (): Promise<RescheduleRequest[]> => {
  const mockFetch = () => [...MOCK_DB.rescheduleRequests].sort((a,b) => new Date(b.requestTimestamp).getTime() - new Date(a.requestTimestamp).getTime());
  if (!db) return mockFetch();

  try {
    const snapshot = await getDocs(query(collection(db, 'rescheduleRequests'), orderBy('requestTimestamp', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RescheduleRequest[];
  } catch (error) {
    return handlePermissionError(error, mockFetch, 'fetchRescheduleRequests');
  }
};

export const updateRescheduleRequestStatus = async (requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> => {
  const requestRef = doc(db, 'rescheduleRequests', requestId);
  if (!db) {
    const requestIndex = MOCK_DB.rescheduleRequests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) return false;
    MOCK_DB.rescheduleRequests[requestIndex].status = newStatus;
    if (newStatus === 'Approved') {
      const requestData = MOCK_DB.rescheduleRequests[requestIndex];
      const customerIndex = MOCK_DB.users.findIndex(u => u.id === requestData.userId);
      if (customerIndex !== -1) {
        MOCK_DB.users[customerIndex].upcomingLesson = requestData.requestedRescheduleDate;
      }
    }
    saveData();
    return true;
  }

  await updateDoc(requestRef, { status: newStatus });
  if (newStatus === 'Approved') {
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) return false;
    const requestData = requestSnap.data() as RescheduleRequest;
    await updateDoc(doc(db, 'users', requestData.userId), { upcomingLesson: requestData.requestedRescheduleDate });
  }
  return true;
};

export const addFeedback = async (customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> => {
  const newFeedback: Omit<Feedback, 'id'> = { customerId, customerName, trainerId, trainerName, rating, comment, submissionDate: new Date().toISOString() };
  if (!db) {
    MOCK_DB.feedback.push({ ...newFeedback, id: generateId() });
    const customerIndex = MOCK_DB.users.findIndex(u => u.id === customerId);
    if (customerIndex !== -1) MOCK_DB.users[customerIndex].feedbackSubmitted = true;
    saveData();
    return true;
  }
  await addDoc(collection(db, 'feedback'), newFeedback);
  await updateDoc(doc(db, 'users', customerId), { feedbackSubmitted: true });
  return true;
};

export const fetchAllFeedback = async (): Promise<Feedback[]> => {
  const mockFetch = () => [...MOCK_DB.feedback].sort((a,b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
  if (!db) return mockFetch();

  try {
    const snapshot = await getDocs(query(collection(db, 'feedback'), orderBy('submissionDate', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Feedback[];
  } catch (error) {
    return handlePermissionError(error, mockFetch, 'fetchAllFeedback');
  }
};

export const fetchCustomerLessonProgress = async (): Promise<LessonProgressData[]> => {
  const mockFetch = () => MOCK_DB.users
      .filter(u => u.approvalStatus === 'Approved' && u.assignedTrainerName)
      .map(c => ({ studentId: c.uniqueId, studentName: c.name, trainerName: c.assignedTrainerName!, subscriptionPlan: c.subscriptionPlan, totalLessons: c.totalLessons || 0, completedLessons: c.completedLessons || 0, remainingLessons: (c.totalLessons || 0) - (c.completedLessons || 0), }))
      .sort((a, b) => a.remainingLessons - b.remainingLessons);

  if (!db) return mockFetch();

  try {
    const q = query(collection(db, 'users'), where('approvalStatus', '==', 'Approved'));
    const snapshot = await getDocs(q);
    const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
        .filter(u => u.assignedTrainerName); // Filter client-side

    return users.map(c => ({ studentId: c.uniqueId, studentName: c.name, trainerName: c.assignedTrainerName!, subscriptionPlan: c.subscriptionPlan, totalLessons: c.totalLessons || 0, completedLessons: c.completedLessons || 0, remainingLessons: (c.totalLessons || 0) - (c.completedLessons || 0), })).sort((a, b) => a.remainingLessons - b.remainingLessons);
  } catch (error) {
    return handlePermissionError(error, mockFetch, 'fetchCustomerLessonProgress');
  }
};

export const updateSubscriptionStartDate = async (customerId: string, newDate: Date): Promise<UserProfile | null> => {
  const customerRef = doc(db, 'users', customerId);
  const firstLessonDate = addDays(newDate, 2);
  firstLessonDate.setHours(9, 0, 0, 0); // 9 AM
  const updates = {
    subscriptionStartDate: format(newDate, 'MMM dd, yyyy'),
    upcomingLesson: format(firstLessonDate, 'MMM dd, yyyy, h:mm a'),
  };

  if (!db) {
    const customerIndex = MOCK_DB.users.findIndex(u => u.id === customerId);
    if (customerIndex === -1) return null;
    MOCK_DB.users[customerIndex] = { ...MOCK_DB.users[customerIndex], ...updates };
    saveData();
    return { ...MOCK_DB.users[customerIndex] };
  }

  await updateDoc(customerRef, updates);
  const updatedSnap = await getDoc(customerRef);
  return updatedSnap.exists() ? { id: updatedSnap.id, ...updatedSnap.data() } as UserProfile : null;
}

export const fetchAllReferrals = async (): Promise<Referral[]> => {
  const mockFetch = () => MOCK_DB.referrals.map(ref => ({...ref,refereeUniqueId: MOCK_DB.users.find(u => u.id === ref.refereeId)?.uniqueId,refereeSubscriptionPlan: MOCK_DB.users.find(u => u.id === ref.refereeId)?.subscriptionPlan,refereeApprovalStatus: MOCK_DB.users.find(u => u.id === ref.refereeId)?.approvalStatus,})).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (!db) return mockFetch();

  try {
    const referralsSnapshot = await getDocs(query(collection(db, 'referrals'), orderBy('timestamp', 'desc')));
    const referrals = referralsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Referral[]);
    const refereeIds = [...new Set(referrals.map(r => r.refereeId).filter(Boolean))];

    if (refereeIds.length === 0) return referrals;

    const usersSnapshot = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', refereeIds)));
    const usersById = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data() as UserProfile]));

    return referrals.map(ref => {
      const referee = usersById.get(ref.refereeId);
      return { ...ref, refereeUniqueId: referee?.uniqueId, refereeSubscriptionPlan: referee?.subscriptionPlan, refereeApprovalStatus: referee?.approvalStatus, };
    });
  } catch (error) {
    return handlePermissionError(error, mockFetch, 'fetchAllReferrals');
  }
};

export const fetchReferralsByUserId = async (userId: string): Promise<Referral[]> => {
  const mockFetch = () => MOCK_DB.referrals.filter(r => r.referrerId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (!db) return mockFetch();

  try {
    const q = query(collection(db, 'referrals'), where('referrerId', '==', userId), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Referral[];
  } catch (error) {
    return handlePermissionError(error, mockFetch, 'fetchReferralsByUserId');
  }
};

export const updateReferralPayoutStatus = async (referralId: string, status: PayoutStatusType): Promise<boolean> => {
  if (!db) {
    const referralIndex = MOCK_DB.referrals.findIndex(r => r.id === referralId);
    if (referralIndex !== -1) {
      MOCK_DB.referrals[referralIndex].payoutStatus = status;
      saveData();
      return true;
    }
    return false;
  }
  await updateDoc(doc(db, 'referrals', referralId), { payoutStatus: status });
  return true;
};

export const fetchCourses = async (): Promise<Course[]> => {
  const mockFetch = () => [...MOCK_DB.courses];
  if (!db) return mockFetch();

  try {
    const snapshot = await getDocs(query(collection(db, 'courses')));
    if (snapshot.empty) return mockFetch();
    return reAssignCourseIcons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[]);
  } catch (error) {
    return handlePermissionError(error, mockFetch, 'fetchCourses');
  }
};

export const addCourseModule = async (courseId: string, moduleData: Omit<CourseModule, 'id'>): Promise<Course | null> => {
  if (!db) {
    const courseIndex = MOCK_DB.courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return null;
    const newModule: CourseModule = { ...moduleData, id: generateId() };
    MOCK_DB.courses[courseIndex].modules.push(newModule);
    saveData();
    return MOCK_DB.courses[courseIndex];
  }
  const courseRef = doc(db, 'courses', courseId);
  const courseSnap = await getDoc(courseRef);
  if (!courseSnap.exists()) return null;
  const course = courseSnap.data() as Course;
  const newModule = { ...moduleData, id: generateId() };
  const updatedModules = [...(course.modules || []), newModule];
  await updateDoc(courseRef, { modules: updatedModules });
  return { ...course, modules: updatedModules, id: courseId };
};

export const updateCourseModule = async (courseId: string, moduleId: string, moduleData: CourseModuleFormValues): Promise<Course | null> => {
  if (!db) {
    const courseIndex = MOCK_DB.courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return null;
    const moduleIndex = MOCK_DB.courses[courseIndex].modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return null;
    MOCK_DB.courses[courseIndex].modules[moduleIndex] = { ...MOCK_DB.courses[courseIndex].modules[moduleIndex], ...moduleData };
    saveData();
    return MOCK_DB.courses[courseIndex];
  }
  const courseRef = doc(db, 'courses', courseId);
  const courseSnap = await getDoc(courseRef);
  if (!courseSnap.exists()) return null;
  const course = courseSnap.data() as Course;
  const updatedModules = course.modules.map(m => m.id === moduleId ? { ...m, ...moduleData } : m);
  await updateDoc(courseRef, { modules: updatedModules });
  return { ...course, modules: updatedModules, id: courseId };
};

export const deleteCourseModule = async (courseId: string, moduleId: string): Promise<boolean> => {
  if (!db) {
    const courseIndex = MOCK_DB.courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return false;
    MOCK_DB.courses[courseIndex].modules = MOCK_DB.courses[courseIndex].modules.filter(m => m.id !== moduleId);
    saveData();
    return true;
  }
  const courseRef = doc(db, 'courses', courseId);
  const courseSnap = await getDoc(courseRef);
  if (!courseSnap.exists()) return false;
  const course = courseSnap.data() as Course;
  const updatedModules = course.modules.filter(m => m.id !== moduleId);
  await updateDoc(courseRef, { modules: updatedModules });
  return true;
};

export const fetchQuizSets = async (): Promise<QuizSet[]> => {
  const mockFetch = () => [...MOCK_DB.quizSets];
  if (!db) return mockFetch();

  try {
    const snapshot = await getDocs(query(collection(db, 'quizSets')));
    if (snapshot.empty) return mockFetch();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QuizSet[];
  } catch(error) {
    return handlePermissionError(error, mockFetch, 'fetchQuizSets');
  }
};

export const updateQuizQuestion = async (quizSetId: string, questionId: string, data: QuizQuestionFormValues): Promise<QuizSet | null> => {
  const setRef = doc(db, 'quizSets', quizSetId);
  if (!db) {
    const setIndex = MOCK_DB.quizSets.findIndex(s => s.id === quizSetId);
    if (setIndex === -1) return null;
    const questionIndex = MOCK_DB.quizSets[setIndex].questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) return null;
    const updatedQuestion: Question = { id: questionId, question: { en: data.question_en, hi: data.question_hi }, options: { en: data.options_en.split('\\n').filter(o => o.trim() !== ''), hi: data.options_hi.split('\\n').filter(o => o.trim() !== '') }, correctAnswer: { en: data.correctAnswer_en, hi: data.correctAnswer_hi } };
    MOCK_DB.quizSets[setIndex].questions[questionIndex] = updatedQuestion;
    saveData();
    return MOCK_DB.quizSets[setIndex];
  }

  const setSnap = await getDoc(setRef);
  if (!setSnap.exists()) return null;
  const quizSet = setSnap.data() as QuizSet;
  const updatedQuestions = quizSet.questions.map(q => {
    if (q.id === questionId) {
      return {
        id: q.id,
        question: { en: data.question_en, hi: data.question_hi },
        options: { en: data.options_en.split('\\n').filter(o => o.trim() !== ''), hi: data.options_hi.split('\\n').filter(o => o.trim() !== '') },
        correctAnswer: { en: data.correctAnswer_en, hi: data.correctAnswer_hi },
      };
    }
    return q;
  });
  await updateDoc(setRef, { questions: updatedQuestions });
  return { ...quizSet, questions: updatedQuestions, id: quizSetId };
};

export const fetchFaqs = async (): Promise<FaqItem[]> => {
  const mockFetch = () => [...MOCK_DB.faqs];
  if (!db) return mockFetch();

  try {
    const snapshot = await getDocs(query(collection(db, 'faqs')));
    if (snapshot.empty) return mockFetch();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FaqItem[];
  } catch(error) {
    return handlePermissionError(error, mockFetch, 'fetchFaqs');
  }
};

export const addFaq = async (data: FaqFormValues): Promise<FaqItem> => {
  if (!db) {
    const newFaq: FaqItem = { id: generateId(), ...data };
    MOCK_DB.faqs.push(newFaq);
    saveData();
    return newFaq;
  }
  const docRef = await addDoc(collection(db, 'faqs'), data);
  return { id: docRef.id, ...data };
}

export const updateFaq = async (id: string, data: FaqFormValues): Promise<boolean> => {
  if (!db) {
    const index = MOCK_DB.faqs.findIndex(f => f.id === id);
    if (index === -1) return false;
    MOCK_DB.faqs[index] = { ...MOCK_DB.faqs[index], ...data };
    saveData();
    return true;
  }
  await updateDoc(doc(db, 'faqs', id), data);
  return true;
}

export const deleteFaq = async (id: string): Promise<boolean> => {
  if (!db) {
    const initialLength = MOCK_DB.faqs.length;
    MOCK_DB.faqs = MOCK_DB.faqs.filter(f => f.id !== id);
    saveData();
    return MOCK_DB.faqs.length < initialLength;
  }
  await deleteDoc(doc(db, 'faqs', id));
  return true;
}

export const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  const mockFetch = () => [...MOCK_DB.blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  if (!db) return mockFetch();

  try {
    const snapshot = await getDocs(query(collection(db, 'blogPosts'), orderBy('date', 'desc')));
    if (snapshot.empty) return mockFetch();
    return snapshot.docs.map(doc => doc.data() as BlogPost);
  } catch(error) {
    return handlePermissionError(error, mockFetch, 'fetchBlogPosts');
  }
};

export const addBlogPost = async (data: BlogPostFormValues): Promise<BlogPost> => {
  const { imageFile, ...restOfData } = data;
  // This is a mock upload. In a real app, you'd upload the file and get a URL.
  const newImageSrc = imageFile ? 'https://placehold.co/1200x800.png' : data.imageSrc;

  const newPost: BlogPost = {
    ...restOfData,
    imageSrc: newImageSrc || 'https://placehold.co/1200x800.png', // Provide a fallback
  };

  if (!db) {
    // Check if slug already exists to prevent duplicates
    if (MOCK_DB.blogPosts.some(p => p.slug === newPost.slug)) {
      throw new Error("A blog post with this slug already exists.");
    }
    MOCK_DB.blogPosts.unshift(newPost);
    saveData();
    return newPost;
  }

  // In Firestore, we should also check for slug uniqueness before adding
  const q = query(collection(db, 'blogPosts'), where('slug', '==', newPost.slug));
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error("A blog post with this slug already exists.");
  }

  await addDoc(collection(db, 'blogPosts'), newPost);
  return newPost;
};

export const fetchBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  const mockFetch = () => MOCK_DB.blogPosts.find(p => p.slug === slug) || null;
  if (!db) return mockFetch();

  try {
    const q = query(collection(db, 'blogPosts'), where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return mockFetch();
    return snapshot.docs[0].data() as BlogPost;
  } catch (error) {
    return handlePermissionError(error, mockFetch, 'fetchBlogPostBySlug');
  }
};

export const updateBlogPost = async (slug: string, data: BlogPostFormValues): Promise<boolean> => {
  const { imageFile, ...restOfData } = data;
  const newImageSrc = imageFile ? 'https://placehold.co/1200x800.png' : data.imageSrc; // Mock upload

  if (!db) {
    const index = MOCK_DB.blogPosts.findIndex(p => p.slug === slug);
    if (index === -1) return false;
    MOCK_DB.blogPosts[index] = { ...MOCK_DB.blogPosts[index], ...restOfData, imageSrc: newImageSrc || MOCK_DB.blogPosts[index].imageSrc, slug: data.slug };
    saveData();
    return true;
  }

  const q = query(collection(db, 'blogPosts'), where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return false;
  const docRef = snapshot.docs[0].ref;
  await updateDoc(docRef, { ...restOfData, imageSrc: newImageSrc || data.imageSrc });
  return true;
}

export const deleteBlogPost = async (slug: string): Promise<boolean> => {
  if (!db) {
    const initialLength = MOCK_DB.blogPosts.length;
    MOCK_DB.blogPosts = MOCK_DB.blogPosts.filter(p => p.slug !== slug);
    saveData();
    return MOCK_DB.blogPosts.length < initialLength;
  }
  const q = query(collection(db, 'blogPosts'), where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return false;
  await deleteDoc(snapshot.docs[0].ref);
  return true;
}

export const fetchSiteBanners = async (): Promise<SiteBanner[]> => {
  const mockFetch = () => [...MOCK_DB.siteBanners];
  if (!db) return mockFetch();

  try {
    const snapshot = await getDocs(query(collection(db, 'siteBanners')));
    if (snapshot.empty) return mockFetch();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SiteBanner[];
  } catch (error) {
    return handlePermissionError(error, mockFetch, 'fetchSiteBanners');
  }
};

export const updateSiteBanner = async (id: string, data: VisualContentFormValues): Promise<boolean> => {
  const { imageFile, ...restOfData } = data;
  const newImageSrc = imageFile ? 'https://placehold.co/1200x800.png' : data.imageSrc;
  if (!db) {
    const index = MOCK_DB.siteBanners.findIndex(b => b.id === id);
    if (index === -1) return false;
    MOCK_DB.siteBanners[index] = { ...MOCK_DB.siteBanners[index], ...restOfData, imageSrc: newImageSrc || MOCK_DB.siteBanners[index].imageSrc };
    saveData();
    return true;
  }
  await updateDoc(doc(db, 'siteBanners', id), { ...restOfData, imageSrc: newImageSrc || data.imageSrc });
  return true;
}

export const fetchPromotionalPosters = async (): Promise<PromotionalPoster[]> => {
  const mockFetch = () => [...MOCK_DB.promotionalPosters];
  if (!db) return mockFetch();

  try {
    const snapshot = await getDocs(query(collection(db, 'promotionalPosters')));
    if (snapshot.empty) return mockFetch();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PromotionalPoster[];
  } catch (error) {
    return handlePermissionError(error, mockFetch, 'fetchPromotionalPosters');
  }
};

export const updatePromotionalPoster = async (id: string, data: VisualContentFormValues): Promise<boolean> => {
  const { imageFile, ...restOfData } = data;
  const newImageSrc = imageFile ? 'https://placehold.co/600x800.png' : data.imageSrc;
  if (!db) {
    const index = MOCK_DB.promotionalPosters.findIndex(p => p.id === id);
    if (index === -1) return false;
    MOCK_DB.promotionalPosters[index] = { ...MOCK_DB.promotionalPosters[index], ...restOfData, imageSrc: newImageSrc || MOCK_DB.promotionalPosters[index].imageSrc, href: data.href || '#' };
    saveData();
    return true;
  }
  await updateDoc(doc(db, 'promotionalPosters', id), { ...restOfData, imageSrc: newImageSrc || data.imageSrc, href: data.href || '#' });
  return true;
}














