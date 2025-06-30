
import { z } from 'zod';
import type React from 'react';

export const ApprovalStatusOptions = ["Pending", "Approved", "Rejected"] as const;
export type ApprovalStatusType = typeof ApprovalStatusOptions[number];

export const TrainerPreferenceOptions = ["Male", "Female", "Any"] as const;

export interface UserProfile {
  id: string;
  uniqueId: string;
  name: string;
  username?: string; // Add username
  password?: string; // Add password
  contact: string; // Email
  phone?: string; // Phone number is optional
  location: string;
  subscriptionPlan: string;
  registrationTimestamp: string;
  vehicleInfo?: string;
  approvalStatus: ApprovalStatusType;
  myReferralCode?: string;
  flatHouseNumber?: string;
  street?: string;
  district?: string;
  state?: string;
  pincode?: string;
  // Customer specific details that might be useful on profile:
  dlStatus?: string;
  dlNumber?: string;
  photoIdType?: string;
  photoIdNumber?: string;
  trainerPreference?: typeof TrainerPreferenceOptions[number];
  upcomingLesson?: string; // For reschedule approval
}

export const LessonRequestStatusOptions = ["Pending", "Active", "Completed"] as const;
export interface LessonRequest {
  id:string;
  customerName: string;
  vehicleType: 'Two-Wheeler' | 'Four-Wheeler';
  status: typeof LessonRequestStatusOptions[number];
  requestTimestamp: string;
}

export const RescheduleRequestStatusOptions = ["Pending", "Approved", "Rejected"] as const;
export type RescheduleRequestStatusType = typeof RescheduleRequestStatusOptions[number];

export interface RescheduleRequest {
  id: string;
  userId: string;
  customerName: string;
  originalLessonDate: string;
  requestedRescheduleDate: string;
  status: RescheduleRequestStatusType;
  requestTimestamp: string;
}

export interface SummaryData {
  totalCustomers: number;
  totalInstructors: number;
  activeSubscriptions: number;
  pendingRequests: number; // Lesson requests
  pendingRescheduleRequests: number; // New field
  totalEarnings: number;
  totalCertifiedTrainers: number;
}

export type VehicleType = 'Two-Wheeler' | 'Four-Wheeler';

export const Locations = [
  // Tier 1 Cities
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
  // Tier 2 Cities
  "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal",
  "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik",
  "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad",
  "Amritsar", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior",
  "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh"
];
export const SubscriptionPlans = ["Basic", "Premium", "Gold"];

export const ComplaintFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100),
  email: z.string().email({ message: "Please enter a valid email address." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }).max(150),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }).max(2000),
});

export type ComplaintFormValues = z.infer<typeof ComplaintFormSchema>;

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  recordedLectureLink?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  icon?: React.ElementType;
  totalEnrolled: number;
  totalCertified: number;
  modules: CourseModule[];
  image?: string;
}

export const IndianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const DistrictsByState: Record<string, string[]> = {
  "Andhra Pradesh": ["Anantapur","Chittoor","East Godavari","Guntur","Krishna","Kurnool","Nellore","Prakasam","Srikakulam","Visakhapatnam","Vizianagaram","West Godavari","Y.S.R. Kadapa"],
  "Arunachal Pradesh": ["Tawang","West Kameng","East Kameng","Papum Pare","Kurung Kumey","Kra Daadi","Lower Subansiri","Upper Subansiri","West Siang","East Siang","Siang","Upper Siang","Lower Siang","Lower Dibang Valley","Dibang Valley","Anjaw","Lohit","Namsai","Changlang","Tirap","Longding"],
  "Assam": ["Baksa","Barpeta","Biswanath","Bongaigaon","Cachar","Charaideo","Chirang","Darrang","Dhemaji","Dhubri","Dibrugarh","Goalpara","Golaghat","Hailakandi","Hojai","Jorhat","Kamrup Metropolitan","Kamrup","Karbi Anglong","Karimganj","Kokrajhar","Lakhimpur","Majuli","Morigaon","Nagaon","Nalbari","Dima Hasao","Sivasagar","Sonitpur","South Salmara-Mankachar","Tinsukia","Udalguri","West Karbi Anglong"],
  "Bihar": ["Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar","Darbhanga","East Champaran (Motihari)","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur (Bhabua)","Katihar","Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger (Monghyr)","Muzaffarpur","Nalanda","Nawada","Patna","Purnia (Purnea)","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura","Sheohar","Sitamarhi","Siwan","Supaul","Vaishali","West Champaran"],
  "Chhattisgarh": ["Balod","Baloda Bazar","Balrampur","Bastar","Bemetara","Bijapur","Bilaspur","Dantewada (South Bastar)","Dhamtari","Durg","Gariaband","Janjgir-Champa","Jashpur","Kabirdham (Kawardha)","Kanker (North Bastar)","Kondagaon","Korba","Koriya","Mahasamund","Mungeli","Narayanpur","Raigarh","Raipur","Rajnandgaon","Sukma","Surajpur","Surguja"],
  "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Goa": ["North Goa","South Goa"],
  "Gujarat": ["Ahmedabad","Amreli","Anand","Aravalli","Banaskantha (Palanpur)","Bharuch","Bhavnagar","Botad","Chhota Udepur","Dahod","Dangs (Ahwa)","Devbhoomi Dwarka","Gandhinagar","Gir Somnath","Jamnagar","Junagadh","Kachchh","Kheda (Nadiad)","Mahisagar","Mehsana","Morbi","Narmada (Rajpipla)","Navsari","Panchmahal (Godhra)","Patan","Porbandar","Rajkot","Sabarkantha (Himmatnagar)","Surat","Surendranagar","Tapi (Vyara)","Vadodara","Valsad"],
  "Haryana": ["Ambala","Bhiwani","Charkhi Dadri","Faridabad","Fatehabad","Gurugram (Gurgaon)","Hisar","Jhajjar","Jind","Kaithal","Karnal","Kurukshetra","Mahendragarh","Nuh","Palwal","Panchkula","Panipat","Rewari","Rohtak","Sirsa","Sonipat","Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur","Chamba","Hamirpur","Kangra","Kinnaur","Kullu","Lahaul & Spiti","Mandi","Shimla","Sirmaur (Sirmour)","Solan","Una"],
  "Jharkhand": ["Bokaro","Chatra","Deoghar","Dhanbad","Dumka","East Singhbhum","Garhwa","Giridih","Godda","Gumla","Hazaribag","Jamtara","Khunti","Koderma","Latehar","Lohardaga","Pakur","Palamu","Ramgarh","Ranchi","Sahebganj","Seraikela-Kharsawan","Simdega","West Singhbhum"],
  "Karnataka": ["Bagalkot","Ballari (Bellary)","Belagavi (Belgaum)","Bengaluru (Bangalore) Rural","Bengaluru (Bangalore) Urban","Bidar","Chamarajanagar","Chikballapur","Chikkamagaluru (Chikmagalur)","Chitradurga","Dakshina Kannada","Davangere","Dharwad","Gadag","Hassan","Haveri","Kalaburagi (Gulbarga)","Kodagu","Kolar","Koppal","Mandya","Mysuru (Mysore)","Raichur","Ramanagara","Shivamogga (Shimoga)","Tumakuru (Tumkur)","Udupi","Uttara Kannada (Karwar)","Vijayapura (Bijapur)","Yadgir"],
  "Kerala": ["Alappuzha","Ernakulam","Idukki","Kannur","Kasaragod","Kollam","Kottayam","Kozhikode","Malappuram","Palakkad","Pathanamthitta","Thiruvananthapuram","Thrissur","Wayanad"],
  "Madhya Pradesh": ["Agar Malwa","Alirajpur","Anuppur","Ashoknagar","Balaghat","Barwani","Betul","Bhind","Bhopal","Burhanpur","Chhatarpur","Chhindwara","Damoh","Datia","Dewas","Dhar","Dindori","Guna","Gwalior","Harda","Hoshangabad","Indore","Jabalpur","Jhabua","Katni","Khandwa","Khargone","Mandla","Mandsaur","Morena","Narsinghpur","Neemuch","Panna","Raisen","Rajgarh","Ratlam","Rewa","Sagar","Satna","Sehore","Seoni","Shahdol","Shajapur","Sheopur","Shivpuri","Sidhi","Singrauli","Tikamgarh","Ujjain","Umaria","Vidisha"],
  "Maharashtra": ["Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana","Chandrapur","Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City","Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Osmanabad","Palghar","Parbhani","Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha","Washim","Yavatmal"],
  "Manipur": ["Bishnupur","Chandel","Churachandpur","Imphal East","Imphal West","Jiribam","Kakching","Kamjong","Kangpokpi","Noney","Pherzawl","Senapati","Tamenglong","Tengnoupal","Thoubal","Ukhrul"],
  "Meghalaya": ["East Garo Hills","East Jaintia Hills","East Khasi Hills","North Garo Hills","Ri Bhoi","South Garo Hills","South West Garo Hills","South West Khasi Hills","West Garo Hills","West Jaintia Hills","West Khasi Hills"],
  "Mizoram": ["Aizawl","Champhai","Kolasib","Lawngtlai","Lunglei","Mamit","Saiha","Serchhip"],
  "Nagaland": ["Dimapur","Kiphire","Kohima","Longleng","Mokokchung","Mon","Peren","Phek","Tuensang","Wokha","Zunheboto"],
  "Odisha": ["Angul","Balangir","Balasore","Bargarh","Bhadrak","Boudh","Cuttack","Deogarh","Dhenkanal","Gajapati","Ganjam","Jagatsinghapur","Jajpur","Jharsuguda","Kalahandi","Kandhamal","Kendrapara","Kendujhar (Keonjhar)","Khordha","Koraput","Malkangiri","Mayurbhanj","Nabarangpur","Nayagarh","Nuapada","Puri","Rayagada","Sambalpur","Sonepur","Sundargarh"],
  "Punjab": ["Amritsar","Barnala","Bathinda","Faridkot","Fatehgarh Sahib","Fazilka","Ferozepur","Gurdaspur","Hoshiarpur","Jalandhar","Kapurthala","Ludhiana","Mansa","Moga","Muktsar","Nawanshahr (Shahid Bhagat Singh Nagar)","Pathankot","Patiala","Rupnagar (Ropar)","Sahibzada Ajit Singh Nagar (Mohali)","Sangrur","Tarn Taran"],
  "Rajasthan": ["Ajmer","Alwar","Banswara","Baran","Barmer","Bharatpur","Bhilwara","Bikaner","Bundi","Chittorgarh","Churu","Dausa","Dholpur","Dungarpur","Hanumangarh","Jaipur","Jaisalmer","Jalore","Jhalawar","Jhunjhunu","Jodhpur","Karauli","Kota","Nagaur","Pali","Pratapgarh","Rajsamand","Sawai Madhopur","Sikar","Sirohi","Sri Ganganagar","Tonk","Udaipur"],
  "Sikkim": ["East Sikkim","North Sikkim","South Sikkim","West Sikkim"],
  "Tamil Nadu": ["Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul","Erode","Kallakurichi","Kanchipuram","Kanyakumari","Karur","Krishnagiri","Madurai","Nagapattinam","Namakkal","Nilgiris","Perambalur","Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivaganga","Tenkasi","Thanjavur","Theni","Thoothukudi (Tuticorin)","Tiruchirappalli","Tirunelveli","Tirupathur","Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur","Vellore","Viluppuram","Virudhunagar"],
  "Telangana": ["Adilabad","Bhadradri Kothagudem","Hyderabad","Jagtial","Jangaon","Jayashankar Bhoopalpally","Jogulamba Gadwal","Kamareddy","Karimnagar","Khammam","Komaram Bheem Asifabad","Mahabubabad","Mahabubnagar","Mancherial","Medak","Medchal","Nagarkurnool","Nalgonda","Nirmal","Nizamabad","Peddapalli","Rajanna Sircilla","Rangareddy","Sangareddy","Siddipet","Suryapet","Vikarabad","Wanaparthy","Warangal (Rural)","Warangal (Urban)","Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai","Gomati","Khowai","North Tripura","Sepahijala","South Tripura","Unakoti","West Tripura"],
  "Uttar Pradesh": ["Agra","Aligarh","Allahabad","Ambedkar Nagar","Amethi (Chatrapati Sahuji Mahraj Nagar)","Amroha (J.P. Nagar)","Auraiya","Azamgarh","Baghpat","Bahraich","Ballia","Balrampur","Banda","Barabanki","Bareilly","Basti","Bhadohi","Bijnor","Budaun","Bulandshahr","Chandauli","Chitrakoot","Deoria","Etah","Etawah","Faizabad","Farrukhabad","Fatehpur","Firozabad","Gautam Buddha Nagar","Ghaziabad","Ghazipur","Gonda","Gorakhpur","Hamirpur","Hapur (Panchsheel Nagar)","Hardoi","Hathras (Mahamaya Nagar)","Jalaun","Jaunpur","Jhansi","Kannauj","Kanpur Dehat","Kanpur Nagar","Kanshiram Nagar (Kasganj)","Kaushambi","Kushinagar (Padrauna)","Lakhimpur - Kheri","Lalitpur","Lucknow","Maharajganj","Mahoba","Mainpuri","Mathura","Mau","Meerut","Mirzapur","Moradabad","Muzaffarnagar","Pilibhit","Pratapgarh","RaeBareli","Rampur","Saharanpur","Sambhal (Bhim Nagar)","Sant Kabir Nagar","Shahjahanpur","Shamali (Prabuddh Nagar)","Shravasti","Siddharth Nagar","Sitapur","Sonbhadra","Sultanpur","Unnao","Varanasi"],
  "Uttarakhand": ["Almora","Bageshwar","Chamoli","Champawat","Dehradun","Haridwar","Nainital","Pauri Garhwal","Pithoragarh","Rudraprayag","Tehri Garhwal","Udham Singh Nagar","Uttarkashi"],
  "West Bengal": ["Alipurduar","Bankura","Birbhum","Cooch Behar","Dakshin Dinajpur (South Dinajpur)","Darjeeling","Hooghly","Howrah","Jalpaiguri","Jhargram","Kalimpong","Kolkata","Malda","Murshidabad","Nadia","North 24 Parganas","Paschim Medinipur (West Medinipur)","Paschim (West) Burdwan","Purba Burdwan (Bardhaman)","Purba Medinipur (East Medinipur)","Purulia","South 24 Parganas","Uttar Dinajpur (North Dinajpur)"],
};


export const VehiclePreferenceOptions = ["Two-Wheeler", "Four-Wheeler", "Both"] as const;
export const SpecializationOptions = ["Two-Wheeler", "Car", "Three-Wheeler", "Defensive Driving"] as const;
export const TrainerVehicleTypeOptions = ["Scooter", "Motorcycle", "Car (Manual)", "Car (Automatic)", "Three-Wheeler"] as const;
export const FuelTypeOptions = ["Petrol", "Diesel", "Electric", "CNG", "LPG", "Hybrid"] as const;
export const GenderOptions = ["Male", "Female", "Other", "Prefer not to say"] as const;
export const DLStatusOptions = ["New Learner", "Already Have DL"] as const;
export const PhotoIdTypeOptions = ["Aadhaar Card", "PAN Card", "Voter ID", "Passport", "Driving License"] as const;

const fileField = z.any(); 
const optionalFileField = z.any().optional();

// Base schema without any refinements or transforms
const BaseRegistrationObjectSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }).max(20),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  location: z.string().min(1, { message: "Please select a location." }),
  gender: z.enum(GenderOptions, { required_error: "Please select a gender." }),
});

// --- Schemas for Discriminated Union ---
// These MUST be pure ZodObjects without refinements (.refine, .superRefine, .transform)

const CustomerRegistrationObjectSchema = BaseRegistrationObjectSchema.extend({
  userRole: z.literal('customer'),
  subscriptionPlan: z.enum(SubscriptionPlans, { required_error: "Please select a subscription plan." }),
  vehiclePreference: z.enum(VehiclePreferenceOptions, { required_error: "Vehicle preference is required for customers." }),
  trainerPreference: z.enum(TrainerPreferenceOptions, { required_error: "Please select your trainer preference."}),
  referralCodeApplied: z.string().optional(),
  flatHouseNumber: z.string().min(1, { message: "House/Flat number is required." }),
  street: z.string().min(3, { message: "Street name is required." }),
  district: z.string().min(1, { message: "Please select a district." }),
  state: z.string().min(1, { message: "Please select a state." }),
  pincode: z.string().regex(/^\d{6}$/, { message: "Please enter a valid 6-digit pincode." }),
  dlStatus: z.enum(DLStatusOptions, { required_error: "Please select your Driving License status."}),
  dlNumber: z.string().optional(),
  dlTypeHeld: z.string().optional(),
  dlFileCopy: optionalFileField,
  photoIdType: z.enum(PhotoIdTypeOptions, { required_error: "Please select a Photo ID type." }),
  photoIdNumber: z.string().min(1, { message: "Photo ID number is required." }),
  photoIdFile: fileField,
});

const TrainerRegistrationObjectSchema = BaseRegistrationObjectSchema.extend({
  userRole: z.literal('trainer'),
  yearsOfExperience: z.coerce.number().int().min(0, "Years of experience cannot be negative.").max(50, "Years of experience seems too high.").optional(),
  specialization: z.enum(SpecializationOptions, { required_error: "Please select a specialization." }),
  trainerVehicleType: z.enum(TrainerVehicleTypeOptions, { required_error: "Please select vehicle type." }),
  fuelType: z.enum(FuelTypeOptions, { required_error: "Please select fuel type."}),
  vehicleNumber: z.string().min(1, { message: "Vehicle number is required." }).max(20, { message: "Vehicle number seems too long."}),
  trainerCertificateNumber: z.string().min(1, { message: "Trainer certificate number is required." }).max(50),
  trainerCertificateFile: fileField,
  aadhaarCardNumber: z.string()
    .min(12, { message: "Aadhaar number must be 12 digits." })
    .max(12, { message: "Aadhaar number must be 12 digits." })
    .regex(/^\d{12}$/, { message: "Invalid Aadhaar number format (must be 12 digits)." }),
  aadhaarCardFile: fileField,
  drivingLicenseNumber: z.string().min(1, { message: "Driving license number is required." }).max(50),
  drivingLicenseFile: fileField,
});

// Create the final schema by applying all refinements to the union
export const RegistrationFormSchema = z.discriminatedUnion("userRole", [
  CustomerRegistrationObjectSchema,
  TrainerRegistrationObjectSchema,
]).superRefine((data, ctx) => {
  // Password confirmation check (common to both)
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });
  }

  // Phone number check (common to both)
  if (data.phone && !/^\d{10}$/.test(data.phone)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Phone number must be 10 digits.",
      path: ["phone"],
    });
  }
  
  // Customer-specific file checks
  if (data.userRole === 'customer') {
    if (!data.photoIdFile || data.photoIdFile.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Photo ID document is required.",
        path: ["photoIdFile"],
      });
    }
  }

  // Trainer-specific file checks
  if (data.userRole === 'trainer') {
    if (!data.trainerCertificateFile || data.trainerCertificateFile.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Trainer certificate is required.",
        path: ["trainerCertificateFile"],
      });
    }
    if (!data.aadhaarCardFile || data.aadhaarCardFile.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Aadhaar card copy is required.",
        path: ["aadhaarCardFile"],
      });
    }
    if (!data.drivingLicenseFile || data.drivingLicenseFile.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Driving license copy is required.",
        path: ["drivingLicenseFile"],
      });
    }
  }
});


export type RegistrationFormValues = z.infer<typeof RegistrationFormSchema>;
export type CustomerRegistrationFormValues = z.infer<typeof CustomerRegistrationObjectSchema>;
export type TrainerRegistrationFormValues = z.infer<typeof TrainerRegistrationObjectSchema>;

// Schema for updating user profile
export const UserProfileUpdateSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional().refine(val => !val || /^\d{10}$/.test(val), {
    message: "Phone number must be 10 digits if provided.",
  }),
  location: z.string().min(1, { message: "Please select a location." }),
});

export type UserProfileUpdateValues = z.infer<typeof UserProfileUpdateSchema>;

// Schema for changing password
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match.",
  path: ["confirmNewPassword"],
});

export type ChangePasswordValues = z.infer<typeof ChangePasswordSchema>;
