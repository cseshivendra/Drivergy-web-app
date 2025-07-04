
'use client';

import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';

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
        image: 'https://placehold.co/600x400/d92525/ffffff.png',
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
}

let MOCK_DB: MockDatabase = {
  users: [],
  lessonRequests: [],
  rescheduleRequests: [],
  feedback: [],
  referrals: [],
  courses: [],
  quizSets: [],
};

// =================================================================
// INITIAL DATA (if not in localStorage)
// =================================================================


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
      // After loading, we re-assign the icon functions based on ID
      parsedDb.courses = reAssignCourseIcons(parsedDb.courses || []);
      MOCK_DB = { ...MOCK_DB, ...parsedDb };
       // Robustness check: If quizSets are missing from saved data, initialize them.
      if (!MOCK_DB.quizSets || MOCK_DB.quizSets.length === 0) {
        MOCK_DB.quizSets = initialQuizSets;
        saveData();
      }
    } else {
      // If no data in local storage, initialize with hardcoded data
      MOCK_DB.courses = reAssignCourseIcons(initialCourses);
      MOCK_DB.quizSets = initialQuizSets;
      saveData(); // Save initial data to local storage
    }
  }
};

// Load data from localStorage when the app starts
loadData();


// =================================================================
// USER MANAGEMENT
// =================================================================

export const authenticateUserByCredentials = async (username: string, password: string): Promise<UserProfile | null> => {
  const user = MOCK_DB.users.find(u => u.username === username && u.password === password);
  return user ? { ...user } : null;
};

export const updateUserProfile = async (userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> => {
  const userIndex = MOCK_DB.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return null;

  const updatedUser: UserProfile = {
    ...MOCK_DB.users[userIndex],
    name: data.name,
    contact: data.email,
    phone: data.phone,
    location: data.location,
    photoURL: data.photo ? `https://placehold.co/100x100.png?text=${data.name.charAt(0)}&v=${Date.now()}` : MOCK_DB.users[userIndex].photoURL,
  };
  MOCK_DB.users[userIndex] = updatedUser;
  saveData();
  return { ...updatedUser };
};

export const changeUserPassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
  const userIndex = MOCK_DB.users.findIndex(u => u.id === userId);
  if (userIndex !== -1 && MOCK_DB.users[userIndex].password === currentPassword) {
    MOCK_DB.users[userIndex].password = newPassword;
    saveData();
    return true;
  }
  return false;
};

const generateId = () => `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const addCustomer = async (data: CustomerRegistrationFormValues): Promise<UserProfile> => {
  const newId = generateId();
  const getLessonsForPlan = (plan: string): number => ({ Premium: 20, Gold: 15, Basic: 10 }[plan] || 0);

  const newUser: UserProfile = {
    id: newId,
    uniqueId: `CU${newId.slice(-6).toUpperCase()}`,
    name: data.name,
    username: data.username,
    password: data.password,
    contact: data.email,
    phone: data.phone,
    location: data.location,
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
    myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${newId.slice(-4)}`,
    attendance: 'Pending',
    photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
    subscriptionStartDate: format(data.subscriptionStartDate, 'MMM dd, yyyy'),
    totalLessons: getLessonsForPlan(data.subscriptionPlan),
    completedLessons: 0,
    totalReferralPoints: 0,
  };
  MOCK_DB.users.push(newUser);
  
  const newRequest: LessonRequest = {
    id: generateId(),
    customerId: newUser.id,
    customerName: newUser.name,
    vehicleType: data.vehiclePreference as VehicleType,
    status: 'Pending',
    requestTimestamp: new Date().toISOString(),
  };
  MOCK_DB.lessonRequests.push(newRequest);

  if (data.referralCode) {
    const referrer = MOCK_DB.users.find(u => u.myReferralCode === data.referralCode.trim());
    if (referrer) {
      const points = 100; // Hardcoded points for a successful referral
      const newReferral: Referral = {
        id: generateId(),
        referrerId: referrer.id,
        referrerName: referrer.name,
        refereeId: newId,
        refereeName: data.name,
        status: 'Successful',
        pointsEarned: points,
        payoutStatus: 'Pending',
        timestamp: new Date().toISOString(),
      };
      MOCK_DB.referrals.push(newReferral);

      const referrerIndex = MOCK_DB.users.findIndex(u => u.id === referrer.id);
      if (referrerIndex !== -1) {
        MOCK_DB.users[referrerIndex].totalReferralPoints = (MOCK_DB.users[referrerIndex].totalReferralPoints || 0) + points;
      }
    }
  }
  
  saveData();
  return { ...newUser };
};

export const addTrainer = async (data: TrainerRegistrationFormValues): Promise<UserProfile> => {
  const newId = generateId();
  const newTrainer: UserProfile = {
    id: newId,
    uniqueId: `TR${newId.slice(-6).toUpperCase()}`,
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
    myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${newId.slice(-4)}`,
    photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
    specialization: data.specialization,
    yearsOfExperience: data.yearsOfExperience,
  };
  MOCK_DB.users.push(newTrainer);
  saveData();
  return { ...newTrainer };
};

export const updateUserApprovalStatus = async (userId: string, newStatus: ApprovalStatusType): Promise<boolean> => {
  const userIndex = MOCK_DB.users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    MOCK_DB.users[userIndex].approvalStatus = newStatus;
    saveData();
    return true;
  }
  return false;
};

export const fetchAllUsers = async (): Promise<UserProfile[]> => [...MOCK_DB.users].sort((a,b) => new Date(b.registrationTimestamp).getTime() - new Date(a.registrationTimestamp).getTime());

export const fetchUserById = async (userId: string): Promise<UserProfile | null> => MOCK_DB.users.find(u => u.id === userId) || null;

export const fetchApprovedInstructors = async (filters: { location?: string; gender?: string } = {}): Promise<UserProfile[]> => {
  return MOCK_DB.users.filter(u =>
    u.uniqueId.startsWith('TR') &&
    u.approvalStatus === 'Approved' &&
    (!filters.location || u.location === filters.location) &&
    (!filters.gender || u.gender === filters.gender)
  );
};

export const assignTrainerToCustomer = async (customerId: string, trainerId: string): Promise<boolean> => {
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
};

// =================================================================
// REQUEST MANAGEMENT
// =================================================================

export const fetchAllLessonRequests = async (): Promise<LessonRequest[]> => [...MOCK_DB.lessonRequests].sort((a,b) => new Date(b.requestTimestamp).getTime() - new Date(a.requestTimestamp).getTime());

export const addRescheduleRequest = async (userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<RescheduleRequest> => {
  const newRequest: RescheduleRequest = {
    id: generateId(),
    userId,
    customerName,
    originalLessonDate: format(originalDate, 'MMM dd, yyyy, h:mm a'),
    requestedRescheduleDate: format(newDate, 'MMM dd, yyyy, h:mm a'),
    status: 'Pending',
    requestTimestamp: new Date().toISOString(),
  };
  MOCK_DB.rescheduleRequests.push(newRequest);
  saveData();
  return newRequest;
};

export const fetchRescheduleRequests = async (): Promise<RescheduleRequest[]> => [...MOCK_DB.rescheduleRequests].sort((a,b) => new Date(b.requestTimestamp).getTime() - new Date(a.requestTimestamp).getTime());

export const updateRescheduleRequestStatus = async (requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> => {
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
};

// =================================================================
// SUMMARY & DASHBOARD DATA
// =================================================================

export const fetchSummaryData = async (): Promise<SummaryData> => {
  const totalCustomers = MOCK_DB.users.filter(u => u.uniqueId.startsWith('CU')).length;
  const totalInstructors = MOCK_DB.users.filter(u => u.uniqueId.startsWith('TR')).length;
  const activeSubscriptions = MOCK_DB.users.filter(u => u.approvalStatus === 'Approved').length;
  const pendingRequests = MOCK_DB.lessonRequests.filter(r => r.status === 'Pending').length;
  const pendingRescheduleRequests = MOCK_DB.rescheduleRequests.filter(r => r.status === 'Pending').length;
  const totalCertifiedTrainers = MOCK_DB.users.filter(u => u.uniqueId.startsWith('TR') && u.approvalStatus === 'Approved').length;
  
  const totalEarnings = MOCK_DB.users
    .filter(u => u.approvalStatus === 'Approved' && u.subscriptionPlan !== 'Trainer')
    .reduce((acc, user) => {
      if (user.subscriptionPlan === 'Premium') return acc + 9999;
      if (user.subscriptionPlan === 'Gold') return acc + 7499;
      if (user.subscriptionPlan === 'Basic') return acc + 3999;
      return acc;
    }, 0);

  return { totalCustomers, totalInstructors, activeSubscriptions, pendingRequests, pendingRescheduleRequests, totalEarnings, totalCertifiedTrainers };
};

// =================================================================
// TRAINER SPECIFIC FUNCTIONS
// =================================================================

export const fetchAllTrainerStudents = async (trainerId: string): Promise<UserProfile[]> => MOCK_DB.users.filter(u => u.assignedTrainerId === trainerId);

export const fetchTrainerFeedback = async (trainerId: string): Promise<Feedback[]> => MOCK_DB.feedback.filter(f => f.trainerId === trainerId);

export const updateAssignmentStatusByTrainer = async (customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> => {
  const customerIndex = MOCK_DB.users.findIndex(u => u.id === customerId);
  if (customerIndex === -1) return false;

  MOCK_DB.users[customerIndex].approvalStatus = newStatus;

  if (newStatus === 'Approved') {
    const user = MOCK_DB.users[customerIndex];
    const startDate = parse(user.subscriptionStartDate!, 'MMM dd, yyyy', new Date());
    const firstLessonDate = addDays(startDate, 2);
    firstLessonDate.setHours(9, 0, 0, 0);
    
    MOCK_DB.users[customerIndex].upcomingLesson = format(firstLessonDate, 'MMM dd, yyyy, h:mm a');
    
    const reqIndex = MOCK_DB.lessonRequests.findIndex(r => r.customerId === customerId && r.status === 'Pending');
    if (reqIndex !== -1) {
      MOCK_DB.lessonRequests[reqIndex].status = 'Active';
    }
  } else { // Rejected
    MOCK_DB.users[customerIndex].assignedTrainerId = undefined;
    MOCK_DB.users[customerIndex].assignedTrainerName = undefined;
  }
  saveData();
  return true;
};

export const updateUserAttendance = async (studentId: string, status: 'Present' | 'Absent'): Promise<boolean> => {
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
};

// =================================================================
// FEEDBACK & MISC
// =================================================================

export const addFeedback = async (customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> => {
  const newFeedback: Feedback = {
    id: generateId(),
    customerId,
    customerName,
    trainerId,
    trainerName,
    rating,
    comment,
    submissionDate: new Date().toISOString(),
  };
  MOCK_DB.feedback.push(newFeedback);

  const customerIndex = MOCK_DB.users.findIndex(u => u.id === customerId);
  if (customerIndex !== -1) {
    MOCK_DB.users[customerIndex].feedbackSubmitted = true;
  }
  
  saveData();
  return true;
};

export const fetchAllFeedback = async (): Promise<Feedback[]> => [...MOCK_DB.feedback].sort((a,b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());

export const fetchCustomerLessonProgress = async (): Promise<LessonProgressData[]> => {
  return MOCK_DB.users
    .filter(u => u.approvalStatus === 'Approved' && u.assignedTrainerName)
    .map(c => ({
      studentId: c.uniqueId,
      studentName: c.name,
      trainerName: c.assignedTrainerName!,
      subscriptionPlan: c.subscriptionPlan,
      totalLessons: c.totalLessons || 0,
      completedLessons: c.completedLessons || 0,
      remainingLessons: (c.totalLessons || 0) - (c.completedLessons || 0),
    }))
    .sort((a, b) => a.remainingLessons - b.remainingLessons);
};

export const updateSubscriptionStartDate = async (customerId: string, newDate: Date): Promise<UserProfile | null> => {
  const customerIndex = MOCK_DB.users.findIndex(u => u.id === customerId);
  if (customerIndex === -1) return null;

  const firstLessonDate = addDays(newDate, 2);
  firstLessonDate.setHours(9, 0, 0, 0);

  MOCK_DB.users[customerIndex].subscriptionStartDate = format(newDate, 'MMM dd, yyyy');
  MOCK_DB.users[customerIndex].upcomingLesson = format(firstLessonDate, 'MMM dd, yyyy, h:mm a');
  
  saveData();
  return { ...MOCK_DB.users[customerIndex] };
}

// =================================================================
// REFERRALS
// =================================================================

export const fetchAllReferrals = async (): Promise<Referral[]> => {
  return MOCK_DB.referrals
    .map(ref => {
      const referee = MOCK_DB.users.find(u => u.id === ref.refereeId);
      return {
        ...ref,
        refereeUniqueId: referee?.uniqueId,
        refereeSubscriptionPlan: referee?.subscriptionPlan,
        refereeApprovalStatus: referee?.approvalStatus,
      };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const fetchReferralsByUserId = async (userId: string): Promise<Referral[]> => {
  return MOCK_DB.referrals
    .filter(r => r.referrerId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const updateReferralPayoutStatus = async (referralId: string, status: PayoutStatusType): Promise<boolean> => {
  const referralIndex = MOCK_DB.referrals.findIndex(r => r.id === referralId);
  if (referralIndex !== -1) {
    MOCK_DB.referrals[referralIndex].payoutStatus = status;
    saveData();
    return true;
  }
  return false;
};


// =================================================================
// CONTENT MANAGEMENT (COURSES & QUIZZES)
// =================================================================

export const fetchCourses = async (): Promise<Course[]> => {
    return [...MOCK_DB.courses];
};

export const addCourseModule = async (courseId: string, moduleData: Omit<CourseModule, 'id'>): Promise<Course | null> => {
    const courseIndex = MOCK_DB.courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return null;

    const newModule: CourseModule = {
        ...moduleData,
        id: generateId(),
    };

    MOCK_DB.courses[courseIndex].modules.push(newModule);
    saveData();
    return MOCK_DB.courses[courseIndex];
};

export const updateCourseModule = async (courseId: string, moduleId: string, moduleData: CourseModuleFormValues): Promise<Course | null> => {
    const courseIndex = MOCK_DB.courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return null;

    const moduleIndex = MOCK_DB.courses[courseIndex].modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return null;

    MOCK_DB.courses[courseIndex].modules[moduleIndex] = {
        ...MOCK_DB.courses[courseIndex].modules[moduleIndex],
        ...moduleData,
    };
    saveData();
    return MOCK_DB.courses[courseIndex];
};

export const deleteCourseModule = async (courseId: string, moduleId: string): Promise<boolean> => {
    const courseIndex = MOCK_DB.courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return false;

    MOCK_DB.courses[courseIndex].modules = MOCK_DB.courses[courseIndex].modules.filter(m => m.id !== moduleId);
    saveData();
    return true;
};

export const fetchQuizSets = async (): Promise<QuizSet[]> => {
    return [...MOCK_DB.quizSets];
};

export const updateQuizQuestion = async (quizSetId: string, questionId: string, data: QuizQuestionFormValues): Promise<QuizSet | null> => {
  const setIndex = MOCK_DB.quizSets.findIndex(s => s.id === quizSetId);
  if (setIndex === -1) return null;

  const questionIndex = MOCK_DB.quizSets[setIndex].questions.findIndex(q => q.id === questionId);
  if (questionIndex === -1) return null;

  const updatedQuestion: Question = {
    id: questionId,
    question: {
      en: data.question_en,
      hi: data.question_hi,
    },
    options: {
      en: data.options_en.split('\n').filter(o => o.trim() !== ''),
      hi: data.options_hi.split('\n').filter(o => o.trim() !== ''),
    },
    correctAnswer: {
      en: data.correctAnswer_en,
      hi: data.correctAnswer_hi,
    }
  };

  MOCK_DB.quizSets[setIndex].questions[questionIndex] = updatedQuestion;
  saveData();
  return MOCK_DB.quizSets[setIndex];
};
