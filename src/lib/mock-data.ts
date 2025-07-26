

'use server';

import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues, FaqItem, BlogPost, SiteBanner, PromotionalPoster, FaqFormValues, BlogPostFormValues, VisualContentFormValues, FullCustomerDetailsValues } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';
import { db, isFirebaseConfigured } from './firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, writeBatch, documentId, orderBy, limit, setDoc, onSnapshot } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { uploadFile } from './file-upload';

// =================================================================
// MANUAL ADMIN USER DEFINITION
// =================================================================
const MANUAL_ADMIN_USER: UserProfile = {
    id: 'default_admin_user_id_001',
    uniqueId: "AD-000001",
    name: "Admin",
    username: "admin",
    password: "admin",
    contact: "admin@drivergy.com",
    phone: "1234567890",
    gender: "Prefer not to say",
    location: "Gurugram",
    subscriptionPlan: "Admin",
    registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
    approvalStatus: 'Approved',
};


// Default mock data for when Firebase is not connected
const MOCK_SITE_BANNERS: SiteBanner[] = [
    {
        id: "banner-1",
        title: "Start Your Driving Journey Today",
        description: "Join thousands of students who have successfully learned to drive with our expert instructors and state-of-the-art platform.",
        imageSrc: "https://res.cloudinary.com/dssbgilba/image/upload/v1753180604/Gemini_Generated_Image_zcrb88zcrb88zcrb_s6hlap.png",
        imageHint: "driving road car sunset",
    },
    {
        id: "banner-2",
        title: "Become a Certified Driving Trainer",
        description: "Empower the next generation of drivers. Join our platform to manage your schedule, connect with students, and grow your business.",
        imageSrc: "https://res.cloudinary.com/dssbgilba/image/upload/v1753180604/Gemini_Generated_Image_4j07z44j07z44j07_nhtkry.png",
        imageHint: "driving instructor teaching student",
    },
    {
        id: "banner-3",
        title: "Master the Roads with Confidence",
        description: "Our advanced courses will equip you with defensive driving techniques and skills for all road conditions. Sign up now!",
        imageSrc: "https://res.cloudinary.com/dssbgilba/image/upload/v1753180603/Gemini_Generated_Image_7pzsi77pzsi77pzs_um61ih.png",
        imageHint: "city traffic modern car",
    }
  ];

const MOCK_BLOG_POSTS: BlogPost[] = [
    {
        slug: "10-common-mistakes-to-avoid-during-driving-test",
        title: "10 Common Mistakes to Avoid During Your Driving Test",
        category: "RTO Exams",
        excerpt: "Passing your driving test is a major milestone. Avoid these common pitfalls to ensure you get your license on the first try.",
        content: "Your driving test is the final hurdle to getting your license. Don't let simple mistakes trip you up. Here are 10 common errors to avoid: 1. Forgetting to check mirrors. 2. Not using turn signals correctly. 3. Poor speed control. 4. Failing to yield the right-of-way. 5. Incorrect lane changes. 6. Stalling the vehicle. 7. Poor parallel parking. 8. Not stopping completely at stop signs. 9. Following too closely. 10. Showing signs of nervousness like jerky movements. Practice these points, stay calm, and you'll do great!",
        author: "Rohan Verma",
        date: "September 05, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "driving test car",
        tags: "driving test, RTO, mistakes, tips",
    },
    {
        slug: "understanding-indian-road-signs-a-comprehensive-guide",
        title: "Understanding Indian Road Signs: A Comprehensive Guide",
        category: "Road Safety",
        excerpt: "From mandatory signs to cautionary warnings, this guide breaks down the most important Indian road signs you need to know.",
        content: "Indian roads have a unique set of traffic signs. Understanding them is crucial for safety. They are broadly categorized into three types: Mandatory/Regulatory Signs (circular), Cautionary/Warning Signs (triangular), and Informatory Signs (rectangular). This post provides a visual guide to the most common signs in each category, helping you become a more aware and safer driver.",
        author: "Priya Sharma",
        date: "September 04, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "road signs traffic",
        tags: "road signs, traffic rules, safety, India",
    },
    {
        slug: "how-to-parallel-park-perfectly-every-time",
        title: "How to Parallel Park Perfectly Every Time",
        category: "Driving Tips",
        excerpt: "Parallel parking can be daunting, but with our step-by-step method, you can master this essential skill and park with confidence.",
        content: "Follow our simple steps for perfect parallel parking: 1. Find a space at least 1.5 times the length of your car. 2. Pull up alongside the car in front of the space. 3. Check your mirrors and begin reversing slowly. 4. Turn the steering wheel fully towards the curb. 5. When your car is at a 45-degree angle, straighten the wheel and continue reversing. 6. Once your front bumper clears the rear bumper of the car in front, turn the wheel fully away from the curb. 7. Straighten up and center your car in the space. It's all about reference points and practice!",
        author: "Amit Singh",
        date: "September 03, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "parallel parking car",
        tags: "parking, parallel parking, driving skills, tutorial",
    },
    {
        slug: "complete-guide-to-getting-your-learners-license-in-india",
        title: "The Complete Guide to Getting Your Learner's License in India",
        category: "RTO Exams",
        excerpt: "Getting your Learner's License is the first step to driving legally. Here's everything you need to know about the process.",
        content: "Applying for a Learner's License in India involves a few key steps. First, gather your documents: proof of age, proof of address, and passport-sized photographs. Next, fill out the application form online via the Parivahan Sewa portal. You'll then need to book a slot for the learner's test, which is a computer-based test of your knowledge of traffic rules and signs. Pass the test, and you'll be issued your Learner's License, which is valid for 6 months.",
        author: "Sunita Reddy",
        date: "September 02, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "license document application",
        tags: "learner's license, RTO, documents, application",
    },
    {
        slug: "essential-pre-drive-car-checklist-for-every-driver",
        title: "Essential Pre-Drive Car Checklist for Every Driver",
        category: "Vehicle Maintenance",
        excerpt: "A quick 2-minute check before you drive can save you from a lot of trouble on the road. Here's a simple checklist to follow.",
        content: "Before starting your journey, perform these quick checks (often remembered by the acronym POWER): P - Petrol (check fuel level), O - Oil (check engine oil level weekly), W - Water (check coolant and windshield washer fluid), E - Electrics (check lights, indicators, horn), R - Rubber (check tire pressure and condition). This simple routine enhances your safety and keeps your car in good health.",
        author: "Rohan Verma",
        date: "September 01, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "car checklist maintenance",
        tags: "car maintenance, checklist, safety, pre-drive",
    },
    {
        slug: "navigating-night-driving-tips-for-safety-and-confidence",
        title: "Navigating Night Driving: Tips for Safety and Confidence",
        category: "Driving Tips",
        excerpt: "Reduced visibility makes night driving challenging. These tips will help you stay safe and confident on the road after dark.",
        content: "Driving at night requires extra caution. Ensure your headlights, taillights, and signal lights are clean and working. Use your high beams on empty roads but dim them for oncoming traffic. Reduce your speed and increase your following distance. Also, keep your windshield clean inside and out to reduce glare. Taking frequent breaks on long drives helps combat fatigue.",
        author: "Anjali Mehta",
        date: "August 30, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "night driving road",
        tags: "night driving, safety, visibility, tips",
    },
    {
        slug: "monsoon-driving-101-how-to-stay-safe-on-wet-roads",
        title: "Monsoon Driving 101: How to Stay Safe on Wet Roads",
        category: "Road Safety",
        excerpt: "Rainy season brings slippery roads and poor visibility. Learn how to adapt your driving to stay safe during the monsoon.",
        content: "Driving in the monsoon demands special skills. Check your tires, wipers, and brakes before the season starts. Slow down, as braking distances increase on wet roads. Avoid sudden braking or accelerating. Be wary of waterlogged areas and if you must drive through water, do so slowly in a low gear. Maintain a safe distance from the vehicle ahead.",
        author: "Priya Sharma",
        date: "August 28, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "rainy road car",
        tags: "monsoon, rain, safety, driving tips",
    },
    {
        slug: "what-to-do-after-a-minor-car-accident",
        title: "What to Do After a Minor Car Accident",
        category: "Road Safety",
        excerpt: "Even a small fender bender can be stressful. Knowing the right steps to take can protect you legally and financially.",
        content: "If you're in a minor accident: 1. Stop your vehicle safely and turn on your hazard lights. 2. Check for injuries. 3. If it's safe, move your vehicles out of traffic. 4. Exchange information with the other driver: name, address, phone number, insurance details, and license plate number. 5. Take photos of the damage to both vehicles and the accident scene. 6. Report the accident to your insurance company. Avoid admitting fault at the scene.",
        author: "Vikram Kumar",
        date: "August 26, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "car accident traffic",
        tags: "accident, safety, insurance, legal",
    },
    {
        slug: "choosing-the-right-driving-school-what-to-look-for",
        title: "Choosing the Right Driving School: What to Look For",
        category: "Driving Tips",
        excerpt: "The right driving school can make all the difference. Here are key factors to consider before you enroll.",
        content: "When choosing a driving school, look for: 1. Certified and experienced instructors. 2. A structured curriculum that covers both theory and practicals. 3. Well-maintained training vehicles. 4. Flexible scheduling options. 5. Positive reviews and testimonials from past students. 6. Transparent pricing with no hidden costs. A good school like Drivergy invests in your success and safety.",
        author: "Rohan Verma",
        date: "August 24, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "driving school instructor",
        tags: "driving school, instructor, learning, tips",
    },
    {
        slug: "defensive-driving-techniques-that-can-save-your-life",
        title: "Defensive Driving Techniques That Can Save Your Life",
        category: "Road Safety",
        excerpt: "Defensive driving is about anticipating danger and staying one step ahead. Learn these techniques to become a safer driver.",
        content: "Defensive driving means driving to save lives, time, and money, in spite of the conditions around you and the actions of others. Key techniques include: maintaining a safe following distance (the 3-second rule), constantly scanning your surroundings, being aware of blind spots, and having an escape route in mind. It's a proactive mindset that significantly reduces your risk of an accident.",
        author: "Amit Singh",
        date: "August 22, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "safe driving shield",
        tags: "defensive driving, safety, road safety, skills",
    },
    {
        slug: "how-to-get-an-international-driving-permit-in-india",
        title: "How to Get an International Driving Permit (IDP) in India",
        category: "RTO Services",
        excerpt: "Planning to drive abroad? An International Driving Permit is essential. Here's a guide to obtaining one from your local RTO.",
        content: "An IDP is a translation of your Indian driving license, allowing you to drive in many foreign countries. To get one, you need a valid Indian license, passport, visa, and flight tickets. Apply at your local RTO or through the Parivahan portal. The permit is typically valid for one year. It's a must-have for any international road trip.",
        author: "Sunita Reddy",
        date: "August 20, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "passport travel globe",
        tags: "IDP, RTO, international driving, travel",
    },
    {
        slug: "basic-car-maintenance-you-can-do-yourself",
        title: "Basic Car Maintenance You Can Do Yourself",
        category: "Vehicle Maintenance",
        excerpt: "You don't have to be a mechanic to keep your car in good shape. Learn these simple DIY maintenance tasks.",
        content: "Save money and keep your car reliable with these DIY tasks: 1. Checking and topping up fluids (engine oil, coolant, windshield washer). 2. Inspecting and cleaning your battery terminals. 3. Replacing your engine air filter. 4. Changing your windshield wiper blades. 5. Checking your tire pressure. These simple checks can prevent major problems down the road.",
        author: "Vikram Kumar",
        date: "August 18, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "car engine maintenance",
        tags: "car maintenance, DIY, vehicle care, tips",
    },
    {
        slug: "the-importance-of-lane-discipline-on-indian-roads",
        title: "The Importance of Lane Discipline on Indian Roads",
        category: "Road Safety",
        excerpt: "Sticking to your lane is one of the simplest yet most effective ways to improve traffic flow and prevent accidents.",
        content: "Lane discipline is crucial for road safety. It involves staying within your marked lane and changing lanes only when it's safe to do so, using your indicators. Weaving between lanes increases the risk of collisions and causes traffic jams. The leftmost lane is generally for slower-moving traffic, while the right lanes are for overtaking. Following this simple rule makes driving safer for everyone.",
        author: "Priya Sharma",
        date: "August 16, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "highway traffic lanes",
        tags: "lane discipline, safety, traffic, rules",
    },
    {
        slug: "rto-computer-test-questions-and-answers",
        title: "RTO Computer Test: Sample Questions and Answers",
        category: "RTO Exams",
        excerpt: "Practice with these sample questions to get a feel for what to expect on your RTO Learner's License computer test.",
        content: "The RTO computer test assesses your knowledge of traffic signs and rules. Questions often include: 'What does this sign mean?' (with an image), 'When should you not use your horn?', and 'What is the correct procedure for overtaking?'. Drivergy's RTO Quiz section provides numerous practice sets to help you prepare thoroughly and pass with flying colors.",
        author: "Rohan Verma",
        date: "August 14, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "computer test exam",
        tags: "RTO, computer test, mock test, questions",
    },
    {
        slug: "how-to-handle-a-tire-blowout-while-driving",
        title: "How to Handle a Tire Blowout While Driving",
        category: "Road Safety",
        excerpt: "A tire blowout is a scary experience, but knowing how to react can prevent a serious accident. Here’s what to do.",
        content: "If you have a tire blowout: 1. Do not slam on the brakes. 2. Grip the steering wheel firmly. 3. Gently ease your foot off the accelerator. 4. Let the car slow down gradually. 5. Steer gently towards the side of the road once you have control. 6. Turn on your hazard lights. Staying calm and avoiding sudden inputs is key.",
        author: "Amit Singh",
        date: "August 12, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "flat tire car",
        tags: "tire blowout, safety, emergency, driving",
    },
    {
        slug: "understanding-your-cars-dashboard-warning-lights",
        title: "Understanding Your Car's Dashboard Warning Lights",
        category: "Vehicle Maintenance",
        excerpt: "Those little symbols on your dashboard are important. This guide explains what the most common warning lights mean.",
        content: "Don't ignore your dashboard warning lights. The Check Engine light can indicate anything from a loose gas cap to a serious engine issue. The Battery light means there's a problem with the charging system. The Oil Pressure light is a critical warning to stop the engine immediately. Familiarize yourself with your car's manual to understand what each light signifies.",
        author: "Vikram Kumar",
        date: "August 10, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "car dashboard lights",
        tags: "warning lights, dashboard, maintenance, car care",
    },
    {
        slug: "the-rules-of-traffic-circles-and-roundabouts-in-india",
        title: "The Rules of Traffic Circles and Roundabouts in India",
        category: "Driving Tips",
        excerpt: "Roundabouts are designed to improve traffic flow, but they can be confusing. Learn the correct way to navigate them.",
        content: "When approaching a roundabout, slow down and yield to traffic already in the circle. Traffic in the roundabout always has the right-of-way. Enter when there is a safe gap. Use your indicators to signal your exit. Stay in the correct lane based on your intended exit—typically, the left lane for turning left or going straight, and the right lane for turning right or making a U-turn.",
        author: "Priya Sharma",
        date: "August 08, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "roundabout traffic aerial",
        tags: "roundabout, traffic circle, rules, driving",
    },
    {
        slug: "how-to-renew-your-driving-license-online",
        title: "How to Renew Your Driving License Online",
        category: "RTO Services",
        excerpt: "Your driving license is valid for a limited time. Learn how to renew it easily online through the Parivahan portal.",
        content: "Renewing your driving license is now a simple online process. You can apply for renewal up to one year before expiry or within one year after expiry. Visit the Parivahan Sarathi website, fill out the renewal application form, upload scanned copies of your documents (like your old license and Form 1A medical certificate if applicable), and pay the fee online. You may need to book a slot for a visit to the RTO for biometric verification.",
        author: "Sunita Reddy",
        date: "August 06, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "online form computer",
        tags: "license renewal, RTO, online, documents",
    },
    {
        slug: "driving-in-heavy-city-traffic-a-survival-guide",
        title: "Driving in Heavy City Traffic: A Survival Guide",
        category: "Driving Tips",
        excerpt: "Bumper-to-bumper traffic can be stressful. These tips will help you navigate the chaos of city driving like a pro.",
        content: "To survive heavy traffic: 1. Stay calm and patient. 2. Maintain a safe distance, even at low speeds. 3. Avoid constant lane changes. 4. Be aware of two-wheelers and pedestrians. 5. Use your horn sparingly. 6. Anticipate the flow of traffic ahead instead of just looking at the car in front of you. A smooth and steady approach is much safer and less stressful than aggressive driving.",
        author: "Rohan Verma",
        date: "August 04, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "city traffic jam",
        tags: "city driving, traffic, safety, tips",
    },
    {
        slug: "the-consequences-of-drowsy-driving",
        title: "The Consequences of Drowsy Driving and How to Prevent It",
        category: "Road Safety",
        excerpt: "Driving while tired can be as dangerous as driving drunk. Learn to recognize the signs and prevent drowsy driving.",
        content: "Drowsy driving impairs your judgment, slows reaction time, and can lead to fatal accidents. Signs of fatigue include frequent yawning, difficulty focusing, and drifting from your lane. To prevent it, get adequate sleep before a long drive, take breaks every two hours, and avoid driving during late-night hours when your body is naturally inclined to sleep. If you feel tired, pull over and rest.",
        author: "Anjali Mehta",
        date: "August 02, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "tired driver yawning",
        tags: "drowsy driving, fatigue, safety, accident prevention",
    },
];

const allMockQuestions: Omit<Question, 'id'>[] = [
    {
        question: { en: "What does a circular sign with a blue background indicate?", hi: "नीले बैकग्राउंड वाला गोलाकार चिह्न क्या दर्शाता है?" },
        options: { en: ["A mandatory direction", "A warning", "An informational sign", "A parking zone"], hi: ["एक अनिवार्य दिशा", "एक चेतावनी", "एक सूचनात्मक चिह्न", "एक पार्किंग क्षेत्र"] },
        correctAnswer: { en: "A mandatory direction", hi: "एक अनिवार्य दिशा" }
    },
    {
        question: { en: "When approaching an intersection with a flashing yellow light, you should:", hi: "एक चमकती पीली बत्ती वाले चौराहे पर पहुँचते समय, आपको:" },
        options: { en: ["Stop completely", "Proceed with caution", "Speed up", "Wait for it to turn green"], hi: ["पूरी तरह से रुकें", "सावधानी से आगे बढ़ें", "गति बढ़ाएँ", "इसके हरे होने की प्रतीक्षा करें"] },
        correctAnswer: { en: "Proceed with caution", hi: "सावधानी से आगे बढ़ें" }
    },
    {
        question: { en: "The 'No Parking' sign is what shape?", hi: "'नो पार्किंग' का चिह्न किस आकार का होता है?" },
        options: { en: ["Circular", "Triangular", "Octagonal", "Square"], hi: ["गोलाकार", "त्रिकोणीय", "अष्टकोणीय", "वर्गाकार"] },
        correctAnswer: { en: "Circular", hi: "गोलाकार" }
    },
    {
        question: { en: "When are you allowed to use a horn?", hi: "आपको हॉर्न का उपयोग करने की अनुमति कब है?" },
        options: { en: ["To greet a friend", "To express anger", "To prevent a potential accident", "At all times"], hi: ["एक दोस्त का अभिवादन करने के लिए", "गुस्सा व्यक्त करने के लिए", "एक संभावित दुर्घटना को रोकने के लिए", "हर समय"] },
        correctAnswer: { en: "To prevent a potential accident", hi: "एक संभावित दुर्घटना को रोकने के लिए" }
    },
    {
        question: { en: "What is the legal blood alcohol concentration (BAC) limit for driving in India?", hi: "भारत में ड्राइविंग के लिए कानूनी रक्त अल्कोहल सांद्रता (BAC) सीमा क्या है?" },
        options: { en: ["0.05%", "0.08%", "0.03%", "0.1%"], hi: ["0.05%", "0.08%", "0.03%", "0.1%"] },
        correctAnswer: { en: "0.03%", hi: "0.03%" }
    },
    {
        question: { en: "A triangular sign with a red border indicates a:", hi: "लाल बॉर्डर वाला एक त्रिकोणीय चिह्न एक दर्शाता है:" },
        options: { en: ["Warning sign", "Mandatory sign", "Informatory sign", "Stop sign"], hi: ["चेतावनी चिह्न", "अनिवार्य चिह्न", "सूचनात्मक चिह्न", "स्टॉप चिह्न"] },
        correctAnswer: { en: "Warning sign", hi: "चेतावनी चिह्न" }
    },
    {
        question: { en: "When can you overtake a vehicle from the left?", hi: "आप किसी वाहन को बाईं ओर से कब ओवरटेक कर सकते हैं?" },
        options: { en: ["Never", "When the vehicle ahead is turning right and there is space", "On a one-way street", "On a highway"], hi: ["कभी नहीँ", "जब आगे वाला वाहन दाईं ओर मुड़ रहा हो और जगह हो", "एक-तरफ़ा सड़क पर", "राजमार्ग पर"] },
        correctAnswer: { en: "When the vehicle ahead is turning right and there is space", hi: "जब आगे वाला वाहन दाईं ओर मुड़ रहा हो और जगह हो" }
    },
    {
        question: { en: "What does the 'Stop' sign look like?", hi: "'स्टॉप' का चिह्न कैसा दिखता है?" },
        options: { en: ["A red octagon", "A red triangle", "A blue circle", "A red square"], hi: ["एक लाल अष्टकोण", "एक लाल त्रिकोण", "एक नीला गोला", "एक लाल वर्ग"] },
        correctAnswer: { en: "A red octagon", hi: "एक लाल अष्टकोण" }
    },
    {
        question: { en: "You should not use high-beam headlights when:", hi: "आपको हाई-बीम हेडलाइट्स का उपयोग कब नहीं करना चाहिए:" },
        options: { en: ["Driving in fog", "A vehicle is approaching from the opposite direction", "On a dark, empty road", "During the day"], hi: ["कोहरे में गाड़ी चलाते समय", "विपरीत दिशा से कोई वाहन आ रहा हो", "एक अंधेरी, खाली सड़क पर", "दिन के दौरान"] },
        correctAnswer: { en: "A vehicle is approaching from the opposite direction", hi: "विपरीत दिशा से कोई वाहन आ रहा हो" }
    },
    {
        question: { en: "A continuous yellow line in the middle of the road means:", hi: "सड़क के बीच में एक सतत पीली रेखा का मतलब है:" },
        options: { en: ["Overtaking is permitted", "Overtaking is permitted, but with caution", "Overtaking is strictly prohibited", "You can stop on this line"], hi: ["ओवरटेक करने की अनुमति है", "ओवरटेक करने की अनुमति है, लेकिन सावधानी के साथ", "ओवरटेक करना सख्त वर्जित है", "आप इस रेखा पर रुक सकते हैं"] },
        correctAnswer: { en: "Overtaking is strictly prohibited", hi: "ओवरटेक करना सख्त वर्जित है" }
    },
     {
        question: { en: "What is the purpose of a catalytic converter?", hi: "उत्प्रेरक कनवर्टर का उद्देश्य क्या है?" },
        options: { en: ["To increase fuel efficiency", "To reduce harmful emissions", "To cool the engine", "To improve braking"], hi: ["ईंधन दक्षता बढ़ाने के लिए", "हानिकारक उत्सर्जन को कम करने के लिए", "इंजन को ठंडा करने के लिए", "ब्रेकिंग में सुधार करने के लिए"] },
        correctAnswer: { en: "To reduce harmful emissions", hi: "हानिकारक उत्सर्जन को कम करने के लिए" }
    },
    {
        question: { en: "Before changing lanes, you must:", hi: "लेन बदलने से पहले, आपको चाहिए:" },
        options: { en: ["Honk your horn", "Check mirrors and blind spots", "Increase your speed", "Slow down significantly"], hi: ["अपना हॉर्न बजाएं", "आईने और ब्लाइंड स्पॉट की जाँच करें", "अपनी गति बढ़ाएं", "काफी धीमा करें"] },
        correctAnswer: { en: "Check mirrors and blind spots", hi: "आईने और ब्लाइंड स्पॉट की जाँच करें" }
    },
    {
        question: { en: "The sign for 'School Ahead' is:", hi: "'आगे स्कूल है' का चिह्न है:" },
        options: { en: ["Triangular", "Circular", "Rectangular", "Square"], hi: ["त्रिकोणीय", "गोलाकार", "आयताकार", "वर्गाकार"] },
        correctAnswer: { en: "Triangular", hi: "त्रिकोणीय" }
    },
    {
        question: { en: "At a four-way intersection with stop signs, who has the right-of-way?", hi: "स्टॉप संकेतों वाले चार-तरफा चौराहे पर, किसका अधिकार है?" },
        options: { en: ["The largest vehicle", "The vehicle that arrived first", "The vehicle on the right", "The vehicle that is going straight"], hi: ["सबसे बड़ा वाहन", "जो वाहन पहले आया", "दाईं ओर का वाहन", "जो वाहन सीधा जा रहा है"] },
        correctAnswer: { en: "The vehicle that arrived first", hi: "जो वाहन पहले आया" }
    },
    {
        question: { en: "What does a broken white line in the middle of the road indicate?", hi: "सड़क के बीच में एक टूटी हुई सफेद रेखा क्या दर्शाती है?" },
        options: { en: ["No overtaking", "Overtaking is permitted if safe", "Lane ends", "Pedestrian crossing"], hi: ["कोई ओवरटेकिंग नहीं", "सुरक्षित होने पर ओवरटेकिंग की अनुमति है", "लेन समाप्त होती है", "पैदल यात्री क्रॉसिंग"] },
        correctAnswer: { en: "Overtaking is permitted if safe", hi: "सुरक्षित होने पर ओवरटेकिंग की अनुमति है" }
    }
];

const MOCK_QUIZ_SETS: QuizSet[] = Array.from({ length: 10 }, (_, i) => {
    // Shuffle all questions for each set to make them unique
    const shuffledQuestions = [...allMockQuestions].sort(() => 0.5 - Math.random());
    
    return {
        id: `set${i + 1}`,
        title: `Practice Set ${i + 1}`,
        questions: shuffledQuestions.slice(0, 15).map((q, j) => ({
            ...q,
            id: `set${i + 1}-q${j + 1}`
        }))
    };
});

const generateId = () => {
    if (db) {
        return doc(collection(db, 'id-generator')).id;
    }
    return Math.random().toString(36).substring(2, 15);
};

// Helper to re-hydrate icons after fetching from DB
const reAssignCourseIcons = (coursesToHydrate: Course[]): Course[] => {
    return coursesToHydrate.map(course => {
        let newIcon;
        if (course.id === 'course1') newIcon = Car;
        else if (course.id === 'course2') newIcon = Bike;
        else if (course.id === 'course3') newIcon = FileText;
        else newIcon = FileText; // Default icon
        return { ...course, icon: newIcon };
    });
};

// =================================================================
// USER MANAGEMENT - WRITE & ONE-TIME READ OPERATIONS
// =================================================================
export async function getOrCreateGoogleUser(firebaseUser: FirebaseUser): Promise<UserProfile | null> {
    if (!db) return null;
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as UserProfile;
    } else {
        const newUser: Omit<UserProfile, 'id'> = {
            uniqueId: `CU-${generateId().slice(-6).toUpperCase()}`,
            name: firebaseUser.displayName || 'Google User',
            username: firebaseUser.email || '',
            contact: firebaseUser.email || '',
            phone: firebaseUser.phoneNumber || '',
            gender: 'Prefer not to say',
            location: 'TBD',
            subscriptionPlan: 'None',
            registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
            approvalStatus: 'Pending',
            myReferralCode: `${(firebaseUser.displayName || 'USER').split(' ')[0].toUpperCase()}${generateId().slice(-4)}`,
            photoURL: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${(firebaseUser.displayName || 'U').charAt(0)}`,
            totalReferralPoints: 0,
        };
        try {
            await setDoc(userRef, newUser);
            return { id: userRef.id, ...newUser };
        } catch(error: any) {
            console.error("Error creating new Google user:", error);
            return null;
        }
    }
};

export async function authenticateUserByCredentials(username: string, password: string): Promise<UserProfile | null> {
    if (!db) {
      // Fallback for non-Firebase environment
      if (username === 'admin' && password === 'admin') {
        return MANUAL_ADMIN_USER;
      }
      return null;
    }
  
    // --- Admin Login Logic ---
    if (username === 'admin' && password === 'admin') {
      const adminRef = doc(db, "users", MANUAL_ADMIN_USER.id);
      const adminSnap = await getDoc(adminRef);
  
      if (adminSnap.exists()) {
        console.log("Found existing admin user in DB.");
        return { id: adminSnap.id, ...adminSnap.data() } as UserProfile;
      } else {
        try {
          console.log("Admin user not found in DB. Creating now...");
          await setDoc(adminRef, MANUAL_ADMIN_USER);
          console.log("Admin user created successfully in DB.");
          return MANUAL_ADMIN_USER;
        } catch (error) {
          console.error("Failed to create admin user in DB:", error);
          // Fallback to manual object if DB write fails, ensuring login
          return MANUAL_ADMIN_USER;
        }
      }
    }
  
    // --- Regular User Login Logic ---
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username), limit(1));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        console.log(`Login failed: No user found with username '${username}'`);
        return null;
      }
  
      const userDoc = querySnapshot.docs[0];
      const user = userDoc.data();
  
      if (user.password === password) {
        return { id: userDoc.id, ...user } as UserProfile;
      }
  
      console.log(`Login failed: Incorrect password for username '${username}'`);
      return null;
    } catch (error: any) {
      console.error("Error authenticating user:", error);
      return null;
    }
  };

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
    if (!db || !userId) return null;
    try {
        let userQuery;
        // Check if the ID is a Firebase Auth UID or a Drivergy uniqueId
        if (userId.startsWith('CU-') || userId.startsWith('TR-')) {
            userQuery = query(collection(db, 'users'), where('uniqueId', '==', userId), limit(1));
        } else {
            // Assume it's a Firestore document ID (which is the Firebase Auth UID)
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return null;
            const user = { id: userSnap.id, ...userSnap.data() } as UserProfile;
            if (user.uniqueId?.startsWith('CU') && user.assignedTrainerId) {
                const trainerSnap = await getDoc(doc(db, "users", user.assignedTrainerId));
                if (trainerSnap.exists()) {
                    const trainer = trainerSnap.data() as UserProfile;
                    user.assignedTrainerPhone = trainer.phone;
                    user.assignedTrainerExperience = trainer.yearsOfExperience;
                    user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
                }
            }
            return user;
        }

        const querySnapshot = await getDocs(userQuery);
        if (querySnapshot.empty) {
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() } as UserProfile;

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
    } catch(error: any) {
        console.error(`Error fetching user ${userId}:`, error);
        return null;
    }
};


export async function updateUserProfile(userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> {
    if (!db) return null;
    try {
        const updateData: { [key: string]: any } = {
            name: data.name,
            contact: data.email,
            phone: data.phone,
            location: data.district,
            flatHouseNumber: data.flatHouseNumber,
            street: data.street,
            state: data.state,
            district: data.district,
            pincode: data.pincode,
        };

        if (data.photo) {
            updateData.photoURL = await uploadFile(data.photo, `user_photos/${userId}`);
        }

        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, updateData);
        const updatedDoc = await getDoc(userRef);
        return { id: updatedDoc.id, ...updatedDoc.data() } as UserProfile;
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return null;
    }
};

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    if (!db) return false;
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists() || userSnap.data().password !== currentPassword) {
            return false;
        }
        await updateDoc(userRef, { password: newPassword });
        return true;
    } catch (error: any) {
        console.error("Error changing password:", error);
        return false;
    }
};

export async function updateUserApprovalStatus(userId: string, newStatus: ApprovalStatusType): Promise<boolean> {
    if (!db) return false;
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { approvalStatus: newStatus });
        return true;
    } catch (error: any) {
        console.error(`Error updating user ${userId} status:`, error);
        return false;
    }
};

export async function addCustomer(data: CustomerRegistrationFormValues): Promise<UserProfile | null> {
    if (!db) return null;

    const newUser: Omit<UserProfile, 'id'> = {
        uniqueId: `CU-${generateId().slice(-6).toUpperCase()}`,
        name: data.name,
        username: data.username,
        password: data.password,
        contact: data.email,
        phone: data.phone,
        gender: data.gender,
        location: "TBD", // To be determined
        subscriptionPlan: "None", // Start with no plan
        registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
        approvalStatus: 'Pending', // Pending profile completion
        myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${generateId().slice(-4)}`,
        photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
        totalReferralPoints: 0,
    };

    try {
        const userRef = doc(collection(db, 'users'));
        await setDoc(userRef, newUser);
        return { id: userRef.id, ...newUser };
    } catch (error: any) {
        console.error("Error adding customer:", error);
        return null;
    }
};

export async function completeCustomerProfile(userId: string, data: FullCustomerDetailsValues): Promise<boolean> {
    if (!db) return false;
    const getLessonsForPlan = (plan: string): number => ({ Premium: 20, Gold: 15, Basic: 10 }[plan] || 0);

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            throw new Error("User profile not found.");
        }
        const user = userSnap.data();

        const photoIdUrl = await uploadFile(data.photoIdFile, `user_documents/${userId}`);
        const profileData = {
            subscriptionPlan: data.subscriptionPlan,
            vehicleInfo: data.vehiclePreference,
            trainerPreference: data.trainerPreference,
            flatHouseNumber: data.flatHouseNumber,
            street: data.street,
            district: data.district,
            state: data.state,
            pincode: data.pincode,
            location: data.district, // Set primary location from district
            dlStatus: data.dlStatus,
            dlNumber: data.dlNumber || '',
            dlTypeHeld: data.dlTypeHeld || '',
            photoIdType: data.photoIdType,
            photoIdNumber: data.photoIdNumber,
            photoIdUrl: photoIdUrl,
            subscriptionStartDate: format(data.subscriptionStartDate, 'MMM dd, yyyy'),
            totalLessons: getLessonsForPlan(data.subscriptionPlan),
            completedLessons: 0,
            approvalStatus: 'Pending' as ApprovalStatusType, // Now pending admin assignment
        };

        await updateDoc(userRef, profileData);

        // Create the lesson request for the admin
        const newRequestData: Omit<LessonRequest, 'id'> = {
            customerId: userId,
            customerName: user.name,
            vehicleType: data.vehiclePreference as VehicleType,
            status: 'Pending',
            requestTimestamp: new Date().toISOString(),
        };
        const newRequestRef = doc(collection(db, 'lessonRequests'));
        await setDoc(newRequestRef, newRequestData);
        return true;
    } catch (error: any) {
        console.error("Error completing customer profile:", error);
        if (error instanceof Error && error.message.includes("Cloudinary configuration")) {
            throw new Error("Cannot upload file: Server storage is not configured. Please contact support.");
        }
        throw new Error("An unexpected error occurred during profile update.");
    }
};

export async function addTrainer(data: TrainerRegistrationFormValues): Promise<UserProfile | null> {
    if (!db) return null;

    try {
        const [certUrl, dlUrl, aadhaarUrl] = await Promise.all([
            uploadFile(data.trainerCertificateFile, 'trainer_documents'),
            uploadFile(data.drivingLicenseFile, 'trainer_documents'),
            uploadFile(data.aadhaarCardFile, 'trainer_documents'),
        ]);

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
            registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
            vehicleInfo: data.trainerVehicleType,
            approvalStatus: 'Pending',
            myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${generateId().slice(-4)}`,
            photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
            specialization: data.specialization,
            yearsOfExperience: data.yearsOfExperience,
            trainerCertificateUrl: certUrl,
            drivingLicenseUrl: dlUrl,
            aadhaarCardUrl: aadhaarUrl,
        };

        const userRef = doc(collection(db, 'users'));
        await setDoc(userRef, newTrainer);
        return { id: userRef.id, ...newTrainer };
    } catch (error: any) {
        console.error("Error adding trainer:", error);
        if (error instanceof Error && error.message.includes("Cloudinary configuration")) {
            throw new Error("Server configuration error. Cannot upload documents. Please contact support.");
        }
        throw new Error(error.message || "An unexpected error occurred during registration.");
    }
};

export async function assignTrainerToCustomer(customerId: string, trainerId: string): Promise<boolean> {
    if (!db) return false;
    try {
        const customerRef = doc(db, "users", customerId);
        const customerSnap = await getDoc(customerRef);
        const trainerSnap = await getDoc(doc(db, "users", trainerId));

        if (!customerSnap.exists() || !trainerSnap.exists()) {
            throw new Error("Assign Trainer Error: Customer or Trainer document not found.");
        }

        const customerData = customerSnap.data() as UserProfile;
        const trainerData = trainerSnap.data() as UserProfile;

        // Update customer to 'In Progress' and assign trainer details
        await updateDoc(customerRef, {
            approvalStatus: 'In Progress',
            assignedTrainerId: trainerId,
            assignedTrainerName: trainerData.name
        });
        return true;
    } catch (error: any) {
        console.error("Error assigning trainer:", error);
        return false;
    }
};


export async function updateAssignmentStatusByTrainer(customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> {
    if (!db) return false;
    try {
        const customerRef = doc(db, "users", customerId);
        const updates: { [key: string]: any } = { approvalStatus: newStatus };

        if (newStatus === 'Approved') {
            const customerSnap = await getDoc(customerRef);
            if(!customerSnap.exists()) return false;
            const user = customerSnap.data() as UserProfile;
            const startDate = parse(user.subscriptionStartDate!, 'MMM dd, yyyy', new Date());
            const firstLessonDate = addDays(startDate, 2);
            firstLessonDate.setHours(9, 0, 0, 0);
            updates.upcomingLesson = format(firstLessonDate, 'MMM dd, yyyy, h:mm a');

            // Update lesson request to 'Active'
            const requestQuery = query(collection(db, 'lessonRequests'), where('customerId', '==', customerId));
            const requestSnapshot = await getDocs(requestQuery);
            if (!requestSnapshot.empty) {
                const requestDocRef = requestSnapshot.docs[0].ref;
                await updateDoc(requestDocRef, { status: 'Active' });
            }

        } else { // If trainer rejects
            updates.assignedTrainerId = null;
            updates.assignedTrainerName = null;
            updates.approvalStatus = 'Pending'; // Return to admin queue
        }

        await updateDoc(customerRef, updates);
        return true;
    } catch (error: any) {
        console.error("Error updating assignment by trainer:", error);
        return false;
    }
};

export async function updateUserAttendance(studentId: string, status: 'Present' | 'Absent'): Promise<boolean> {
    if (!db) return false;
    try {
        const studentRef = doc(db, "users", studentId);
        const studentSnap = await getDoc(studentRef);
        if (!studentSnap.exists()) return false;

        const studentData = studentSnap.data() as UserProfile;
        const updates: { [key: string]: any } = { attendance: status };

        if (status === 'Present' && studentData.attendance !== 'Present') {
            updates.completedLessons = (studentData.completedLessons || 0) + 1;
        }

        await updateDoc(studentRef, updates);
        return true;
    } catch(error: any) {
        console.error("Error updating attendance:", error);
        return false;
    }
};

export async function updateSubscriptionStartDate(customerId: string, newDate: Date): Promise<UserProfile | null> {
    if (!db) return null;
    const firstLessonDate = addDays(newDate, 2);
    firstLessonDate.setHours(9, 0, 0, 0);
    const updates = {
        subscriptionStartDate: format(newDate, 'MMM dd, yyyy'),
        upcomingLesson: format(firstLessonDate, 'MMM dd, yyyy, h:mm a'),
    };
    try {
        const customerRef = doc(db, 'users', customerId);
        await updateDoc(customerRef, updates);
        const updatedSnap = await getDoc(customerRef);
        return updatedSnap.exists() ? { id: updatedSnap.id, ...updatedSnap.data() } as UserProfile : null;
    } catch(error: any) {
        console.error("Error updating start date:", error);
        return null;
    }
}

// =================================================================
// REAL-TIME LISTENERS
// =================================================================

export async function listenToAllLessonRequests(callback: (data: LessonRequest[]) => void) {
    if (!isFirebaseConfigured() || !db) return callback([]);
    const q = query(collection(db, 'lessonRequests'), orderBy('requestTimestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LessonRequest)));
    }, (error) => {
        console.error("Error listening to lesson requests:", error);
    });
}

export async function listenToAllFeedback(callback: (data: Feedback[]) => void) {
    if (!isFirebaseConfigured() || !db) return callback([]);
    const q = query(collection(db, 'feedback'), orderBy('submissionDate', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback)));
    }, (error) => {
        console.error("Error listening to feedback:", error);
    });
}

export async function listenToAllReferrals(callback: (data: Referral[]) => void) {
    if (!isFirebaseConfigured() || !db) return callback([]);
    const q = query(collection(db, "referrals"), orderBy("timestamp", "desc"));
    return onSnapshot(q, async (snapshot) => {
        const referrals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
        if (referrals.length === 0) {
            callback([]);
            return;
        }

        const refereeIds = [...new Set(referrals.map(r => r.refereeId))].filter(Boolean);
        if (refereeIds.length === 0) {
            callback(referrals);
            return;
        }

        const usersMap = new Map<string, UserProfile>();
        for (let i = 0; i < refereeIds.length; i += 30) {
            const batchIds = refereeIds.slice(i, i + 30);
            const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', batchIds));
            const usersSnapshot = await getDocs(usersQuery);
            usersSnapshot.forEach(doc => usersMap.set(doc.id, { id: doc.id, ...doc.data() } as UserProfile));
        }

        const enrichedReferrals = referrals.map(ref => {
            const referee = usersMap.get(ref.refereeId);
            return {
                ...ref,
                refereeUniqueId: referee?.uniqueId,
                refereeSubscriptionPlan: referee?.subscriptionPlan,
                refereeApprovalStatus: referee?.approvalStatus,
            };
        });
        callback(enrichedReferrals);
    }, (error) => {
        console.error("Error listening to referrals:", error);
    });
};
export async function listenToQuizSets(callback: (data: QuizSet[]) => void) { 
    if (!isFirebaseConfigured() || !db) return callback(MOCK_QUIZ_SETS);
    return onSnapshot(collection(db, 'quizSets'), (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizSet)));
    }, (error) => {
        console.error("Error listening to quiz sets:", error);
        callback(MOCK_QUIZ_SETS);
    });
}
export async function listenToPromotionalPosters(callback: (data: PromotionalPoster[]) => void) {
    if (!isFirebaseConfigured() || !db) return callback([]);
    return onSnapshot(collection(db, 'promotionalPosters'), (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromotionalPoster)));
    }, (error) => {
        console.error("Error listening to promotional posters:", error);
    });
}
export async function listenToCourses(callback: (data: Course[]) => void) {
    if (!isFirebaseConfigured() || !db) return callback([]);
    return onSnapshot(collection(db, 'courses'), (snapshot) => {
        const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
        callback(reAssignCourseIcons(courses));
    }, (error) => {
        console.error("Error listening to courses:", error);
    });
}

export async function listenToFaqs(callback: (data: FaqItem[]) => void) {
    if (!isFirebaseConfigured() || !db) return callback([]);
    return onSnapshot(collection(db, 'faqs'), (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FaqItem)));
    }, (error) => {
        console.error("Error listening to faqs:", error);
    });
}

export async function listenToBlogPosts(callback: (data: BlogPost[]) => void) {
    if (!isFirebaseConfigured() || !db) return callback(MOCK_BLOG_POSTS);
    const q = query(collection(db, 'blogPosts'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({...doc.data(), slug: doc.id } as BlogPost)));
    }, (error) => {
        console.error("Error listening to blog posts:", error);
        callback(MOCK_BLOG_POSTS);
    });
}
export async function listenToSiteBanners(callback: (data: SiteBanner[]) => void) {
    if (!isFirebaseConfigured() || !db) return callback(MOCK_SITE_BANNERS);
    return onSnapshot(collection(db, 'siteBanners'), (snapshot) => {
        if(snapshot.empty) {
            callback(MOCK_SITE_BANNERS);
            return;
        }
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SiteBanner)));
    }, (error) => {
        console.error("Error listening to site banners:", error);
        callback(MOCK_SITE_BANNERS);
    });
}

export async function listenToUser(userId: string, callback: (data: UserProfile | null) => void) {
    if (!isFirebaseConfigured() || !db) return callback(null);
    return onSnapshot(doc(db!, 'users', userId), async (snap) => {
        if (!snap.exists()) {
            callback(null);
            return;
        }
        const user = { id: snap.id, ...snap.data() } as UserProfile;
        if (user.uniqueId?.startsWith('CU') && user.assignedTrainerId) {
            const trainerSnap = await getDoc(doc(db!, "users", user.assignedTrainerId));
            if (trainerSnap.exists()) {
                const trainer = trainerSnap.data() as UserProfile;
                user.assignedTrainerPhone = trainer.phone;
                user.assignedTrainerExperience = trainer.yearsOfExperience;
                user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
            }
        }
        callback(user);
    }, (error) => {
        console.error(`Error listening to user ${userId}:`, error);
    });
};

export async function listenToTrainerStudents(trainerId: string, callback: (students: UserProfile[], feedback: Feedback[]) => void) {
    if (!isFirebaseConfigured() || !db) return callback([], []);
    const studentsQuery = query(collection(db!, "users"), where("assignedTrainerId", "==", trainerId));
    const feedbackQuery = query(collection(db!, 'feedback'), where('trainerId', '==', trainerId));

    const unsubStudents = onSnapshot(studentsQuery, () => {
        Promise.all([getDocs(studentsQuery), getDocs(feedbackQuery)]).then(([studentsSnap, feedbackSnap]) => {
            const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
            const feedback = feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback));
            callback(students, feedback);
        }).catch(err => console.error("Error fetching trainer student data:", err));
    }, (err) => console.error("Student listener error:", err));

    const unsubFeedback = onSnapshot(feedbackQuery, () => {
        Promise.all([getDocs(studentsQuery), getDocs(feedbackQuery)]).then(([studentsSnap, feedbackSnap]) => {
            const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
            const feedback = feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback));
            callback(students, feedback);
        }).catch(err => console.error("Error fetching trainer feedback data:", err));
    }, (err) => console.error("Feedback listener error:", err));

    return () => {
        unsubStudents();
        unsubFeedback();
    };
}


// =================================================================
// CALCULATED/AGGREGATED DATA LISTENERS
// =================================================================

export async function listenToSummaryData(callback: (data: Partial<SummaryData>) => void) {
    if (!isFirebaseConfigured() || !db) return callback({});
    const usersUnsub = onSnapshot(collection(db!, 'users'), (snap) => {
        const users = snap.docs.map(doc => doc.data() as UserProfile);
        const totalCustomers = users.filter(u => u.uniqueId?.startsWith('CU')).length;
        const totalInstructors = users.filter(u => u.uniqueId?.startsWith('TR')).length;
        const activeSubscriptions = users.filter(u => u.approvalStatus === 'Approved').length;
        const totalCertifiedTrainers = users.filter(u => u.uniqueId?.startsWith('TR') && u.approvalStatus === 'Approved').length;
        const totalEarnings = users.filter(u => u.approvalStatus === 'Approved' && u.subscriptionPlan !== 'Trainer').reduce((acc, user) => {
            if (user.subscriptionPlan === 'Premium') return acc + 9999;
            if (user.subscriptionPlan === 'Gold') return acc + 7499;
            if (user.subscriptionPlan === 'Basic') return acc + 3999;
            return acc;
        }, 0);

        callback({ totalCustomers, totalInstructors, activeSubscriptions, totalCertifiedTrainers, totalEarnings });
    }, (error) => {
      console.error("Error listening to users for summary:", error);
    });

    const requestsUnsub = onSnapshot(query(collection(db!, 'lessonRequests'), where('status', '==', 'Pending')), (snap) => {
        callback(prev => ({ ...prev, pendingRequests: snap.size }));
    }, (error) => {
      console.error("Error listening to lessonRequests for summary:", error);
    });

    const rescheduleUnsub = onSnapshot(query(collection(db!, 'rescheduleRequests'), where('status', '==', 'Pending')), (snap) => {
        callback(prev => ({ ...prev, pendingRescheduleRequests: snap.size }));
    }, (error) => {
      console.error("Error listening to rescheduleRequests for summary:", error);
    });

    return () => {
        usersUnsub();
        requestsUnsub();
        rescheduleUnsub();
    };
};

export async function listenToCustomerLessonProgress(callback: (data: LessonProgressData[]) => void) {
    if (!isFirebaseConfigured() || !db) return callback([]);
    const q = query(collection(db!, 'users'), where('approvalStatus', '==', 'Approved'));
    return onSnapshot(q, (snapshot) => {
        const users = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
            .filter(u => u.assignedTrainerName);

        const progressData = users.map(c => ({
            studentId: c.uniqueId,
            studentName: c.name,
            trainerName: c.assignedTrainerName!,
            subscriptionPlan: c.subscriptionPlan,
            totalLessons: c.totalLessons || 0,
            completedLessons: c.completedLessons || 0,
            remainingLessons: (c.totalLessons || 0) - (c.completedLessons || 0),
        })).sort((a, b) => a.remainingLessons - b.remainingLessons);

        callback(progressData);
    }, (error) => {
      console.error("Error listening to lesson progress:", error);
    });
};

// =================================================================
// WRITE OPERATIONS (No changes needed for real-time, they trigger listeners)
// =================================================================

export async function addRescheduleRequest(userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<RescheduleRequest | null> {
    if (!db) return null;
    const newRequest = {
        userId, customerName,
        originalLessonDate: format(originalDate, 'MMM dd, yyyy, h:mm a'),
        requestedRescheduleDate: format(newDate, 'MMM dd, yyyy, h:mm a'),
        status: 'Pending' as RescheduleRequestStatusType,
        requestTimestamp: new Date().toISOString(),
    };

    try {
        const docRef = await addDoc(collection(db, 'rescheduleRequests'), newRequest);
        return { id: docRef.id, ...newRequest };
    } catch(error: any) {
        console.error("Error adding reschedule request:", error);
        return null;
    }
};

export async function updateRescheduleRequestStatus(requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> {
    if (!db) return false;
    try {
        const requestRef = doc(db, 'rescheduleRequests', requestId);
        await updateDoc(requestRef, { status: newStatus });
        if (newStatus === 'Approved') {
            const requestSnap = await getDoc(requestRef);
            if (!requestSnap.exists()) return false;
            const requestData = requestSnap.data() as RescheduleRequest;
            await updateDoc(doc(db, 'users', requestData.userId), { upcomingLesson: requestData.requestedRescheduleDate });
        }
        return true;
    } catch(error: any) {
        console.error("Error updating reschedule request:", error);
        return false;
    }
};

export async function addFeedback(customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> {
    if (!db) return false;
    const newFeedback: Omit<Feedback, 'id'> = { customerId, customerName, trainerId, trainerName, rating, comment, submissionDate: new Date().toISOString() };
    try {
        await addDoc(collection(db, 'feedback'), newFeedback);
        await updateDoc(doc(db, 'users', customerId), { feedbackSubmitted: true });
        return true;
    } catch(error: any) {
        console.error("Error adding feedback:", error);
        return false;
    }
};

export async function updateReferralPayoutStatus(referralId: string, status: PayoutStatusType): Promise<boolean> {
    if (!db) return false;
    try {
        await updateDoc(doc(db, 'referrals', referralId), { payoutStatus: status });
        return true;
    } catch(error: any) {
        console.error("Error updating referral status:", error);
        return false;
    }
};


export async function addCourseModule(courseId: string, moduleData: Omit<CourseModule, 'id'>): Promise<Course | null> {
    if (!db) return null;
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        if (!courseSnap.exists()) return null;
        const course = courseSnap.data() as Course;
        const newModule = { ...moduleData, id: generateId() };
        const updatedModules = [...(course.modules || []), newModule];
        await updateDoc(courseRef, { modules: updatedModules });
        return { ...course, modules: updatedModules, id: courseId };
    } catch (error: any) {
        console.error("Error adding course module:", error);
        return null;
    }
};

export async function updateCourseModule(courseId: string, moduleId: string, moduleData: CourseModuleFormValues): Promise<Course | null> {
    if (!db) return null;
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        if (!courseSnap.exists()) return null;
        const course = courseSnap.data() as Course;
        const updatedModules = course.modules.map(m => m.id === moduleId ? { ...m, ...moduleData } : m);
        await updateDoc(courseRef, { modules: updatedModules });
        return { ...course, modules: updatedModules, id: courseId };
    } catch (error: any) {
        console.error("Error updating course module:", error);
        return null;
    }
};

export async function deleteCourseModule(courseId: string, moduleId: string): Promise<boolean> {
    if (!db) return false;
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        if (!courseSnap.exists()) return false;
        const course = courseSnap.data() as Course;
        const updatedModules = course.modules.filter(m => m.id !== moduleId);
        await updateDoc(courseRef, { modules: updatedModules });
        return true;
    } catch(error: any) {
        console.error("Error deleting course module:", error);
        return false;
    }
};

export async function updateQuizQuestion(quizSetId: string, questionId: string, data: QuizQuestionFormValues): Promise<QuizSet | null> {
    if (!db) return null;
    try {
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
    } catch(error: any) {
        console.error("Error updating quiz question:", error);
        return null;
    }
};


export async function addFaq(data: FaqFormValues): Promise<FaqItem | null> {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, 'faqs'), data);
        return { id: docRef.id, ...data };
    } catch (error: any) {
        console.error("Error adding FAQ:", error);
        return null;
    }
}

export async function updateFaq(id: string, data: FaqFormValues): Promise<boolean> {
    if (!db) return false;
    try {
        await updateDoc(doc(db, 'faqs', id), data);
        return true;
    } catch (error: any) {
        console.error("Error updating FAQ:", error);
        return false;
    }
}

export async function deleteFaq(id: string): Promise<boolean> {
    if (!db) return false;
    try {
        await deleteDoc(doc(db, 'faqs', id));
        return true;
    } catch(error: any) {
        console.error("Error deleting FAQ:", error);
        return false;
    }
}

export async function addBlogPost(data: BlogPostFormValues): Promise<BlogPost | null> {
    if (!db) return null;
    let imageUrl = 'https://placehold.co/1200x800.png';
    if(data.imageFile) {
        imageUrl = await uploadFile(data.imageFile, 'blog_images');
    } else if (data.imageSrc) {
        imageUrl = data.imageSrc;
    }
    const newPost: BlogPost = { ...data, imageSrc: imageUrl };
    try {
        const q = query(collection(db, 'blogPosts'), where('slug', '==', newPost.slug));
        const existing = await getDocs(q);
        if (!existing.empty) { throw new Error("A blog post with this slug already exists."); }
        await setDoc(doc(db, 'blogPosts', newPost.slug), newPost);
        return newPost;
    } catch(error: any) {
        console.error("Error adding blog post:", error);
        return null;
    }
};

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    if (!isFirebaseConfigured() || !db) {
        return MOCK_BLOG_POSTS.find(p => p.slug === slug) || null;
    }
    try {
        const docRef = doc(db!, 'blogPosts', slug);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return snapshot.data() as BlogPost;
    } catch (error: any) {
        console.error("Error fetching blog post by slug:", error);
        return null;
    }
};

export async function updateBlogPost(slug: string, data: BlogPostFormValues): Promise<boolean> {
    if (!db) return false;
    try {
        const docRef = doc(db, 'blogPosts', slug);
        const updateData: Partial<BlogPostFormValues> = { ...data };
        if(data.imageFile) {
            updateData.imageSrc = await uploadFile(data.imageFile, 'blog_images');
        }
        delete updateData.imageFile;

        await updateDoc(docRef, updateData as any);
        return true;
    } catch(error: any) {
        console.error("Error updating blog post:", error);
        return false;
    }
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
    if (!db) return false;
    try {
        await deleteDoc(doc(db, 'blogPosts', slug));
        return true;
    } catch(error: any) {
        console.error("Error deleting blog post:", error);
        return false;
    }
}

export async function updateSiteBanner(id: string, data: VisualContentFormValues): Promise<boolean> {
    if (!db) return false;
    try {
        const updateData: Partial<VisualContentFormValues> = { ...data };
        if (data.imageFile) {
            updateData.imageSrc = await uploadFile(data.imageFile, 'site_visuals');
        }
        delete updateData.imageFile; // Always remove the file object before updating DB

        // Ensure all fields are included in the update
        await updateDoc(doc(db, 'siteBanners', id), {
            title: updateData.title,
            description: updateData.description,
            imageSrc: updateData.imageSrc,
            imageHint: updateData.imageHint,
        });
        return true;
    } catch (error: any) {
        console.error("Error updating site banner:", error);
        return false;
    }
};

export async function updatePromotionalPoster(id: string, data: VisualContentFormValues): Promise<boolean> {
    if (!db) return false;
    try {
        const updateData: Partial<VisualContentFormValues> = { ...data };
        if (data.imageFile) {
            updateData.imageSrc = await uploadFile(data.imageFile, 'site_visuals');
        }
        delete updateData.imageFile;

        // Ensure all fields are included in the update
        await updateDoc(doc(db, 'promotionalPosters', id), {
            title: updateData.title,
            description: updateData.description,
            imageSrc: updateData.imageSrc,
            imageHint: updateData.imageHint,
            href: updateData.href,
        });
        return true;
    } catch (error: any) {
        console.error("Error updating promotional poster:", error);
        return false;
    }
};

// This one-time fetch is still needed for pages that don't need real-time updates.
export async function fetchCourses(): Promise<Course[]> {
    if (!isFirebaseConfigured() || !db) return [];
    try {
        const snapshot = await getDocs(collection(db!, "courses"));
        const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Course);
        return reAssignCourseIcons(courses);
    } catch (error: any) {
        console.error("Error fetching courses:", error);
        return [];
    }
};

export async function fetchQuizSets(): Promise<QuizSet[]> {
    if (!isFirebaseConfigured() || !db) return MOCK_QUIZ_SETS;
    try {
        const snapshot = await getDocs(collection(db!, "quizSets"));
        if (snapshot.empty) {
            console.warn("No quiz sets found in Firestore, returning mock data.");
            return MOCK_QUIZ_SETS;
        }
        const sets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as QuizSet);
        return sets;
    } catch (error: any) {
        console.error("Error fetching quiz sets:", error);
        return MOCK_QUIZ_SETS;
    }
};


export async function fetchApprovedInstructors(filters: { location?: string; gender?: string } = {}): Promise<UserProfile[]> {
    if (!db) return [];
    try {
        const q = query(
            collection(db, "users"),
            where("approvalStatus", "==", "Approved"),
            where("subscriptionPlan", "==", "Trainer")
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
            .filter(u =>
                (!filters.location || u.location === filters.location) &&
                (!filters.gender || u.gender === filters.gender)
            );
    } catch (error: any) {
        console.error("Error fetching approved instructors:", error);
        return [];
    }
};

export async function fetchReferralsByUserId(userId: string | undefined): Promise<Referral[]> {
    if (!db || !userId) return [];
    try {
        const q = query(collection(db, "referrals"), where("referrerId", "==", userId));
        const querySnapshot = await getDocs(q);

        const referrals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));

        if (referrals.length === 0) return [];

        const refereeIds = referrals.map(r => r.refereeId);
        if(refereeIds.length === 0) return referrals;

        const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', refereeIds));
        const usersSnapshot = await getDocs(usersQuery);
        const usersMap = new Map<string, UserProfile>();
        usersSnapshot.forEach(doc => usersMap.set(doc.id, { id: doc.id, ...doc.data() } as UserProfile));

        return referrals.map(ref => {
            const referee = usersMap.get(ref.refereeId);
            return {
                ...ref,
                refereeUniqueId: referee?.uniqueId,
                refereeSubscriptionPlan: referee?.subscriptionPlan,
                refereeApprovalStatus: referee?.approvalStatus,
            };
        });
    } catch (error: any) {
        console.error("Error fetching user referrals:", error);
        return [];
    }
};
