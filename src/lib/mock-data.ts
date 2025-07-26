
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

const allMockQuestions: Omit<Question, 'id'>[] = [
    // Traffic Signs & Signals (40 questions)
    { question: { en: "What does this sign mean? (Image of Stop Sign)", hi: "इस चिह्न का क्या अर्थ है? (स्टॉप साइन की छवि)" }, options: { en: ["Stop", "Give Way", "No Entry", "Hospital Ahead"], hi: ["रुकें", "रास्ता दें", "प्रवेश निषेध", "आगे अस्पताल है"] }, correctAnswer: { en: "Stop", hi: "रुकें" } },
    { question: { en: "What does a triangular sign with a red border usually indicate?", hi: "लाल बॉर्डर वाला त्रिकोणीय चिह्न आमतौर पर क्या दर्शाता है?" }, options: { en: ["A mandatory instruction", "A warning", "An informational sign", "A parking zone"], hi: ["एक अनिवार्य निर्देश", "एक चेतावनी", "एक सूचनात्मक चिह्न", "एक पार्किंग क्षेत्र"] }, correctAnswer: { en: "A warning", hi: "एक चेतावनी" } },
    { question: { en: "What does an inverted red triangle sign mean?", hi: "एक उल्टे लाल त्रिकोण चिह्न का क्या अर्थ है?" }, options: { en: ["Stop", "Give Way", "No Entry", "Dangerous Dip"], hi: ["रुकें", "रास्ता दें", "प्रवेश निषेध", "खतरनाक ढलान"] }, correctAnswer: { en: "Give Way", hi: "रास्ता दें" } },
    { question: { en: "A circular sign with a blue background indicates:", hi: "नीले बैकग्राउंड वाला गोलाकार चिह्न क्या दर्शाता है?" }, options: { en: ["Compulsory action", "A warning", "Information", "Prohibition"], hi: ["अनिवार्य कार्रवाई", "एक चेतावनी", "जानकारी", "निषेध"] }, correctAnswer: { en: "Compulsory action", hi: "अनिवार्य कार्रवाई" } },
    { question: { en: "A flashing red traffic light means:", hi: "एक चमकती लाल ट्रैफिक लाइट का मतलब है:" }, options: { en: ["Stop and proceed when safe", "Slow down", "The light is broken", "Go fast"], hi: ["रुकें और सुरक्षित होने पर आगे बढ़ें", "धीमे चलें", "बत्ती खराब है", "तेजी से जाएं"] }, correctAnswer: { en: "Stop and proceed when safe", hi: ["रुकें और सुरक्षित होने पर आगे बढ़ें"] } },
    { question: { en: "A sign showing a bed indicates what?", hi: "एक बिस्तर दिखाने वाला चिह्न क्या दर्शाता है?" }, options: { en: ["Hospital", "Resting Place", "Hotel", "Dharamshala"], hi: ["अस्पताल", "आराम करने की जगह", "होटल", "धर्मशाला"] }, correctAnswer: { en: "Resting Place", hi: "आराम करने की जगह" } },
    { question: { en: "The 'No Parking' sign is:", hi: "'नो पार्किंग' का चिह्न है:" }, options: { en: ["Circular, blue background, red border and a red slash", "Triangular, red border", "Rectangular, blue background", "Circular, red background"], hi: ["गोलाकार, नीला बैकग्राउंड, लाल बॉर्डर और एक लाल स्लैश", "त्रिकोणीय, लाल बॉर्डर", "आयताकार, नीला बैकग्राउंड", "गोलाकार, लाल बैकग्राउंड"] }, correctAnswer: { en: "Circular, blue background, red border and a red slash", hi: "गोलाकार, नीला बैकग्राउंड, लाल बॉर्डर और एक लाल स्लैश" } },
    { question: { en: "A sign with a horn symbol crossed out means:", hi: "एक हॉर्न प्रतीक वाला चिह्न जिस पर क्रॉस लगा हो, का मतलब है:" }, options: { en: ["Honk loudly", "Compulsory honking", "No honking", "Hospital nearby"], hi: ["जोर से हॉर्न बजाएं", "अनिवार्य हॉर्न बजाना", "हॉर्न बजाना मना है", "पास में अस्पताल है"] }, correctAnswer: { en: "No honking", hi: "हॉर्न बजाना मना है" } },
    { question: { en: "What does the sign 'U-turn Prohibited' look like?", hi: "'यू-टर्न निषिद्ध' का चिह्न कैसा दिखता है?" }, options: { en: ["A U-shaped arrow", "A U-shaped arrow with a red slash over it", "A U-shaped arrow in a blue circle", "A triangular sign with a U-turn arrow"], hi: ["एक यू-आकार का तीर", "एक यू-आकार का तीर जिस पर लाल स्लैश लगा हो", "एक नीले गोले में यू-आकार का तीर", "एक यू-टर्न तीर वाला त्रिकोणीय चिह्न"] }, correctAnswer: { en: "A U-shaped arrow with a red slash over it", hi: "एक यू-आकार का तीर जिस पर लाल स्लैश लगा हो" } },
    { question: { en: "A solid white line in the center of the road indicates:", hi: "सड़क के केंद्र में एक ठोस सफेद रेखा इंगित करती है:" }, options: { en: ["You can change lanes", "You must not change lanes", "It is a one-way street", "Parking is allowed"], hi: ["आप लेन बदल सकते हैं", "आपको लेन नहीं बदलना चाहिए", "यह एक-तरफ़ा सड़क है", "पार्किंग की अनुमति है"] }, correctAnswer: { en: "You must not change lanes", hi: "आपको लेन नहीं बदलना चाहिए" } },
    { question: { en: "What does a sign showing a falling rock indicate?", hi: "गिरती चट्टान दिखाने वाला चिह्न क्या इंगित करता है?" }, options: { en: ["Quarry ahead", "Loose gravel", "Risk of falling rocks", "Road works"], hi: ["आगे खदान है", "ढीली बजरी", "चट्टानों के गिरने का खतरा", "सड़क का काम"] }, correctAnswer: { en: "Risk of falling rocks", hi: "चट्टानों के गिरने का खतरा" } },
    { question: { en: "An octagonal (8-sided) sign is always a:", hi: "एक अष्टकोणीय (8-भुजाओं वाला) चिह्न हमेशा एक होता है:" }, options: { en: ["Stop sign", "Give Way sign", "Warning sign", "Speed Limit sign"], hi: ["स्टॉप चिह्न", "रास्ता दें चिह्न", "चेतावनी चिह्न", "गति सीमा चिह्न"] }, correctAnswer: { en: "Stop sign", hi: "स्टॉप चिह्न" } },
    { question: { en: "The sign for 'Right Hand Curve' is a:", hi: "'दाहिना मोड़' का चिह्न है:" }, options: { en: ["Triangular sign showing a road curving to the right", "Circular sign showing an arrow to the right", "Rectangular sign with text", "Square sign"], hi: ["एक त्रिकोणीय चिह्न जिसमें सड़क दाईं ओर मुड़ती है", "एक गोलाकार चिह्न जिसमें दाईं ओर एक तीर होता है", "पाठ के साथ आयताकार चिह्न", "वर्गाकार चिह्न"] }, correctAnswer: { en: "Triangular sign showing a road curving to the right", hi: "एक त्रिकोणीय चिह्न जिसमें सड़क दाईं ओर मुड़ती है" } },
    { question: { en: "A steady green arrow traffic light means:", hi: "एक स्थिर हरी तीर ट्रैफिक लाइट का मतलब है:" }, options: { en: ["You can turn in the direction of the arrow after stopping", "You can proceed in the direction of the arrow", "Yield to oncoming traffic", "U-turn is allowed"], hi: ["आप रुकने के बाद तीर की दिशा में मुड़ सकते हैं", "आप तीर की दिशा में आगे बढ़ सकते हैं", "आने वाले यातायात को रास्ता दें", "यू-टर्न की अनुमति है"] }, correctAnswer: { en: "You can proceed in the direction of the arrow", hi: "आप तीर की दिशा में आगे बढ़ सकते हैं" } },
    { question: { en: "What does the 'No Entry' sign look like?", hi: "'प्रवेश निषेध' का चिह्न कैसा दिखता है?" }, options: { en: ["A plain red circle", "A red circle with a white horizontal bar", "A blue circle", "A red triangle"], hi: ["एक सादा लाल गोला", "एक सफेद क्षैतिज पट्टी वाला लाल गोला", "एक नीला गोला", "एक लाल त्रिकोण"] }, correctAnswer: { en: "A red circle with a white horizontal bar", hi: "एक सफेद क्षैतिज पट्टी वाला लाल गोला" } },
    { question: { en: "A broken white line in the center of the road allows:", hi: "सड़क के केंद्र में एक टूटी हुई सफेद रेखा अनुमति देती है:" }, options: { en: ["Overtaking if safe", "Overtaking only from the left", "No overtaking", "Stopping on the line"], hi: ["सुरक्षित होने पर ओवरटेक करना", "केवल बाईं ओर से ओवरटेक करना", "ओवरटेक नहीं करना", "लाइन पर रुकना"] }, correctAnswer: { en: "Overtaking if safe", hi: "सुरक्षित होने पर ओवरटेक करना" } },
    { question: { en: "The sign for 'Men at Work' is what shape?", hi: "'काम पर पुरुष' के लिए चिह्न किस आकार का है?" }, options: { en: ["Circular", "Rectangular", "Triangular", "Octagonal"], hi: ["गोलाकार", "आयताकार", "त्रिकोणीय", "अष्टकोणीय"] }, correctAnswer: { en: "Triangular", hi: "त्रिकोणीय" } },
    { question: { en: "What does a sign showing a bicycle in a blue circle mean?", hi: "नीले गोले में साइकिल दिखाने वाले चिह्न का क्या मतलब है?" }, options: { en: ["No cycling", "Bicycle crossing ahead", "Compulsory cycle track", "Cycle repair shop"], hi: ["साइकिल चलाना मना है", "आगे साइकिल क्रॉसिंग है", "अनिवार्य साइकिल ट्रैक", "साइकिल मरम्मत की दुकान"] }, correctAnswer: { en: "Compulsory cycle track", hi: "अनिवार्य साइकिल ट्रैक" } },
    { question: { en: "A sign with '50' inside a red circle means:", hi: "लाल गोले के अंदर '50' वाले चिह्न का मतलब है:" }, options: { en: ["Drive at 50 km/h", "Minimum speed is 50 km/h", "Speed limit is 50 km/h", "Road number 50"], hi: ["50 किमी/घंटा पर ड्राइव करें", "न्यूनतम गति 50 किमी/घंटा है", "गति सीमा 50 किमी/घंटा है", "सड़क संख्या 50"] }, correctAnswer: { en: "Speed limit is 50 km/h", hi: "गति सीमा 50 किमी/घंटा है" } },
    { question: { en: "What does a flashing yellow traffic light signify?", hi: "एक चमकती पीली ट्रैफिक लाइट क्या दर्शाती है?" }, options: { en: ["Stop", "Slow down and proceed with caution", "The light is about to turn red", "The light is broken"], hi: ["रुकें", "धीमे चलें और सावधानी से आगे बढ़ें", "बत्ती लाल होने वाली है", "बत्ती खराब है"] }, correctAnswer: { en: "Slow down and proceed with caution", hi: "धीमे चलें और सावधानी से आगे बढ़ें" } },
    { question: { en: "What does a sign with a '+' symbol indicate?", hi: "'+' चिह्न वाला चिह्न क्या दर्शाता है?" }, options: { en: ["Crossroad ahead", "First aid post", "No entry", "Hospital"], hi: ["आगे चौराहा है", "प्राथमिक चिकित्सा चौकी", "प्रवेश निषेध", "अस्पताल"] }, correctAnswer: { en: "Crossroad ahead", hi: "आगे चौराहा है" } },
    { question: { en: "What does a sign showing a train indicate?", hi: "एक ट्रेन दिखाने वाला चिह्न क्या दर्शाता है?" }, options: { en: ["Railway station nearby", "Unmanned railway crossing", "Guarded railway crossing", "End of railway line"], hi: ["पास में रेलवे स्टेशन", "मानव रहित रेलवे क्रॉसिंग", "रक्षित रेलवे क्रॉसिंग", "रेलवे लाइन का अंत"] }, correctAnswer: { en: "Unmanned railway crossing", hi: "मानव रहित रेलवे क्रॉसिंग" } },
    { question: { en: "The sign for a narrow bridge ahead is:", hi: "आगे संकरा पुल होने का चिह्न है:" }, options: { en: ["Rectangular", "Circular", "Triangular", "Square"], hi: ["आयताकार", "गोलाकार", "त्रिकोणीय", "वर्गाकार"] }, correctAnswer: { en: "Triangular", hi: "त्रिकोणीय" } },
    { question: { en: "What does a sign showing a pedestrian indicate?", hi: "एक पैदल यात्री दिखाने वाला चिह्न क्या दर्शाता है?" }, options: { en: ["Pedestrian crossing ahead", "No pedestrians allowed", "Pedestrians must use subway", "School ahead"], hi: ["आगे पैदल यात्री क्रॉसिंग है", "पैदल चलने वालों को अनुमति नहीं है", "पैदल चलने वालों को सबवे का उपयोग करना चाहिए", "आगे स्कूल है"] }, correctAnswer: { en: "Pedestrian crossing ahead", hi: "आगे पैदल यात्री क्रॉसिंग है" } },
    { question: { en: "What should you do when you see a 'School Ahead' sign?", hi: "जब आप 'आगे स्कूल है' का चिह्न देखते हैं तो आपको क्या करना चाहिए?" }, options: { en: ["Honk loudly", "Increase speed", "Slow down and be prepared to stop", "Ignore the sign"], hi: ["जोर से हॉर्न बजाएं", "गति बढ़ाएं", "धीमे चलें और रुकने के लिए तैयार रहें", "चिह्न को अनदेखा करें"] }, correctAnswer: { en: "Slow down and be prepared to stop", hi: "धीमे चलें और रुकने के लिए तैयार रहें" } },
    { question: { en: "A white arrow painted on the road surface indicates:", hi: "सड़क की सतह पर चित्रित एक सफेद तीर इंगित करता है:" }, options: { en: ["A suggestion", "A compulsory direction", "A warning", "A parking direction"], hi: ["एक सुझाव", "एक अनिवार्य दिशा", "एक चेतावनी", "एक पार्किंग दिशा"] }, correctAnswer: { en: "A compulsory direction", hi: "एक अनिवार्य दिशा" } },
    { question: { en: "What does a sign with two arrows pointing in opposite vertical directions mean?", hi: "विपरीत ऊर्ध्वाधर दिशाओं में इंगित करने वाले दो तीरों वाले चिह्न का क्या मतलब है?" }, options: { en: ["Two-way traffic", "One-way street", "Height limit", "Road widens"], hi: ["दो-तरफ़ा यातायात", "एक-तरफ़ा सड़क", "ऊंचाई सीमा", "सड़क चौड़ी होती है"] }, correctAnswer: { en: "Two-way traffic", hi: "दो-तरफ़ा यातायात" } },
    { question: { en: "The sign for 'Slippery Road' shows:", hi: "'फिसलन वाली सड़क' का चिह्न दिखाता है:" }, options: { en: ["A car with wavy lines behind it", "A car on a slope", "A car and a snowflake", "A car splashing water"], hi: ["एक कार जिसके पीछे लहरदार रेखाएँ हों", "ढलान पर एक कार", "एक कार और एक स्नोफ्लेक", "पानी éclaboussant une voiture"], hi: ["एक कार जिसके पीछे लहरदार रेखाएं हों", "ढलान पर एक कार", "एक कार और एक स्नोफ्लेक", "पानी उछालती एक कार"] }, correctAnswer: { en: "A car with wavy lines behind it", hi: "एक कार जिसके पीछे लहरदार रेखाएं हों" } },
    { question: { en: "A sign indicating 'Restriction Ends' is:", hi: "'प्रतिबंध समाप्त' का चिह्न है:" }, options: { en: ["A circular sign with a black diagonal line", "A plain white circle", "A triangular sign", "A blue rectangular sign"], hi: ["एक काली विकर्ण रेखा वाला गोलाकार चिह्न", "एक सादा सफेद गोला", "एक त्रिकोणीय चिह्न", "एक नीला आयताकार चिह्न"] }, correctAnswer: { en: "A circular sign with a black diagonal line", hi: "एक काली विकर्ण रेखा वाला गोलाकार चिह्न" } },
    { question: { en: "The sign for 'Side Road Right' indicates:", hi: "'दाईं ओर साइड रोड' का चिह्न इंगित करता है:" }, options: { en: ["A road joining from the right", "You must turn right", "A dead end to the right", "A sharp right turn"], hi: ["दाईं ओर से एक सड़क जुड़ रही है", "आपको दाईं ओर मुड़ना चाहिए", "दाईं ओर एक बंद गली", "एक तेज दाहिना मोड़"] }, correctAnswer: { en: "A road joining from the right", hi: "दाईं ओर से एक सड़क जुड़ रही है" } },
    { question: { en: "A green light in a traffic signal means:", hi: "ट्रैफिक सिग्नल में हरी बत्ती का मतलब है:" }, options: { en: ["Proceed if the way is clear", "Stop", "Slow down", "Get ready to go"], hi: ["यदि रास्ता साफ है तो आगे बढ़ें", "रुकें", "धीमे चलें", "जाने के लिए तैयार हो जाएं"] }, correctAnswer: { en: "Proceed if the way is clear", hi: "यदि रास्ता साफ है तो आगे बढ़ें" } },
    { question: { en: "What does a sign of a truck in a red circle mean?", hi: "लाल गोले में एक ट्रक के चिह्न का क्या मतलब है?" }, options: { en: ["Trucks allowed", "Trucks prohibited", "Truck parking", "Heavy vehicles ahead"], hi: ["ट्रकों को अनुमति है", "ट्रक निषिद्ध हैं", "ट्रक पार्किंग", "आगे भारी वाहन हैं"] }, correctAnswer: { en: "Trucks prohibited", hi: "ट्रक निषिद्ध हैं" } },
    { question: { en: "A 'T-Intersection' sign warns that:", hi: "'टी-इंटरसेक्शन' चिह्न चेतावनी देता है कि:" }, options: { en: ["You must turn left or right", "The road ahead is a dead end", "There is a tea stall ahead", "The road splits into two"], hi: ["आपको बाएं या दाएं मुड़ना होगा", "आगे की सड़क एक बंद गली है", "आगे एक चाय की दुकान है", "सड़क दो भागों में बंटती है"] }, correctAnswer: { en: "You must turn left or right", hi: "आपको बाएं या दाएं मुड़ना होगा" } },
    { question: { en: "A sign with a number on it, indicating height with arrows above and below, signifies:", hi: "एक चिह्न जिस पर एक संख्या हो, जो ऊपर और नीचे तीरों के साथ ऊंचाई को इंगित करता है, दर्शाता है:" }, options: { en: ["Height limit", "Width limit", "Length limit", "Weight limit"], hi: ["ऊंचाई सीमा", "चौड़ाई सीमा", "लंबाई सीमा", "वजन सीमा"] }, correctAnswer: { en: "Height limit", hi: "ऊंचाई सीमा" } },
    { question: { en: "The 'Keep Left' sign is:", hi: "'बाएं रखें' का चिह्न है:" }, options: { en: ["A triangular sign", "A circular sign with a blue background and a white arrow pointing left", "A rectangular sign", "An optional sign"], hi: ["एक त्रिकोणीय चिह्न", "नीले बैकग्राउंड और बाएं ओर इशारा करते सफेद तीर वाला गोलाकार चिह्न", "एक आयताकार चिह्न", "एक वैकल्पिक चिह्न"] }, correctAnswer: { en: "A circular sign with a blue background and a white arrow pointing left", hi: "नीले बैकग्राउंड और बाएं ओर इशारा करते सफेद तीर वाला गोलाकार चिह्न" } },
    { question: { en: "What does a 'Steep Ascent' sign look like?", hi: "'खड़ी चढ़ाई' का चिह्न कैसा दिखता है?" }, options: { en: ["A car going downhill", "A car going uphill shown in a triangle", "A number indicating percentage", "A circular sign"], hi: ["एक कार नीचे की ओर जा रही है", "एक त्रिकोण में ऊपर की ओर जाती हुई कार", "प्रतिशत दर्शाने वाली एक संख्या", "एक गोलाकार चिह्न"] }, correctAnswer: { en: "A car going uphill shown in a triangle", hi: "एक त्रिकोण में ऊपर की ओर जाती हुई कार" } },
    { question: { en: "An arrow pointing upwards with a red slash through it means:", hi: "एक ऊपर की ओर इशारा करते तीर पर लाल स्लैश का मतलब है:" }, options: { en: ["Straight ahead prohibited", "One way", "Road closed", "No overtaking"], hi: ["सीधे जाना निषिद्ध है", "एक तरफ़ा", "सड़क बंद है", "ओवरटेक करना मना है"] }, correctAnswer: { en: "Straight ahead prohibited", hi: "सीधे जाना निषिद्ध है" } },
    { question: { en: "A sign for a roundabout ahead is what shape?", hi: "आगे गोलचक्कर होने का चिह्न किस आकार का है?" }, options: { en: ["Circular", "Octagonal", "Triangular", "Rectangular"], hi: ["गोलाकार", "अष्टकोणीय", "त्रिकोणीय", "आयताकार"] }, correctAnswer: { en: "Triangular", hi: "त्रिकोणीय" } },
    { question: { en: "What does a 'Cattle' warning sign mean?", hi: "'मवेशी' चेतावनी चिह्न का क्या मतलब है?" }, options: { en: ["Cattle market ahead", "Risk of cattle on the road", "No cattle allowed", "Dairy farm"], hi: ["आगे मवेशी बाजार है", "सड़क पर मवेशियों का खतरा", "मवेशियों को अनुमति नहीं है", "डेयरी फार्म"] }, correctAnswer: { en: "Risk of cattle on the road", hi: "सड़क पर मवेशियों का खतरा" } },
    { question: { en: "A yellow line painted on the curb indicates:", hi: "फुटपाथ पर चित्रित एक पीली रेखा इंगित करती है:" }, options: { en: ["No parking", "Parking for commercial vehicles", "You can stop briefly", "Loading/Unloading zone"], hi: ["कोई पार्किंग नहीं", "वाणिज्यिक वाहनों के लिए पार्किंग", "आप थोड़ी देर के लिए रुक सकते हैं", "लोडिंग/अनलोडिंग क्षेत्र"] }, correctAnswer: { en: "No parking", hi: "कोई पार्किंग नहीं" } },

    // Traffic Rules & Regulations (40 questions)
    { question: { en: "When is overtaking from the left permitted?", hi: "बाईं ओर से ओवरटेक करने की अनुमति कब है?" }, options: { en: ["Always", "Never", "When the vehicle in front is turning right and there's sufficient space on the left", "On a one-way street"], hi: ["हमेशा", "कभी नहीं", "जब आगे का वाहन दाईं ओर मुड़ रहा हो और बाईं ओर पर्याप्त जगह हो", "एक-तरफ़ा सड़क पर"] }, correctAnswer: { en: "When the vehicle in front is turning right and there's sufficient space on the left", hi: "जब आगे का वाहन दाईं ओर मुड़ रहा हो और बाईं ओर पर्याप्त जगह हो" } },
    { question: { en: "A continuous yellow line in the middle of the road means:", hi: "सड़क के बीच में एक सतत पीली रेखा का मतलब है:" }, options: { en: ["Overtaking is permitted", "Overtaking is permitted only with caution", "Overtaking or crossing the line is strictly prohibited", "You can take a U-turn"], hi: ["ओवरटेक करने की अनुमति है", "केवल सावधानी के साथ ओवरटेक करने की अनुमति है", "लाइन को ओवरटेक करना या पार करना सख्त वर्जित है", "आप यू-टर्न ले सकते हैं"] }, correctAnswer: { en: "Overtaking or crossing the line is strictly prohibited", hi: "लाइन को ओवरटेक करना या पार करना सख्त वर्जित है" } },
    { question: { en: "At an unmanned railway crossing, the driver must:", hi: "एक मानव रहित रेलवे क्रॉसिंग पर, ड्राइवर को:" }, options: { en: ["Stop, look both ways, listen, and then cross if safe", "Slow down and cross", "Honk continuously and cross", "Cross at high speed"], hi: ["रुकें, दोनों तरफ देखें, सुनें, और फिर सुरक्षित होने पर पार करें", "धीमे चलें और पार करें", "लगातार हॉर्न बजाएं और पार करें", "तेज गति से पार करें"] }, correctAnswer: { en: "Stop, look both ways, listen, and then cross if safe", hi: "रुकें, दोनों तरफ देखें, सुनें, और फिर सुरक्षित होने पर पार करें" } },
    { question: { en: "What is the validity of a Learner's License?", hi: "लर्नर लाइसेंस की वैधता क्या है?" }, options: { en: ["3 months", "6 months", "1 year", "Until a permanent license is obtained"], hi: ["3 महीने", "6 महीने", "1 साल", "जब तक स्थायी लाइसेंस प्राप्त नहीं हो जाता"] }, correctAnswer: { en: "6 months", hi: "6 महीने" } },
    { question: { en: "When should you use hazard lights?", hi: "आपको हैजर्ड लाइट का उपयोग कब करना चाहिए?" }, options: { en: ["When driving in fog", "When driving slowly in traffic", "When your vehicle is stationary and causing an obstruction", "When parking illegally"], hi: ["कोहरे में गाड़ी चलाते समय", "ट्रैफिक में धीरे-धीरे गाड़ी चलाते समय", "जब आपका वाहन स्थिर हो और बाधा उत्पन्न कर रहा हो", "अवैध रूप से पार्किंग करते समय"] }, correctAnswer: { en: "When your vehicle is stationary and causing an obstruction", hi: "जब आपका वाहन स्थिर हो और बाधा उत्पन्न कर रहा हो" } },
    { question: { en: "What is the legal Blood Alcohol Concentration (BAC) limit for a non-commercial vehicle driver in India?", hi: "भारत में एक गैर-व्यावसायिक वाहन चालक के लिए कानूनी रक्त अल्कोहल सांद्रता (बीएसी) की सीमा क्या है?" }, options: { en: ["0.05%", "30 mg per 100 ml of blood", "0.08%", "No limit"], hi: ["0.05%", "30 मिलीग्राम प्रति 100 मिलीलीटर रक्त", "0.08%", "कोई सीमा नहीं"] }, correctAnswer: { en: "30 mg per 100 ml of blood", hi: "30 मिलीग्राम प्रति 100 मिलीलीटर रक्त" } },
    { question: { en: "You can use a mobile phone while driving if:", hi: "आप गाड़ी चलाते समय मोबाइल फोन का उपयोग कर सकते हैं यदि:" }, options: { en: ["It is an emergency", "You are using a hands-free system for navigation only", "The road is empty", "You must not use a mobile phone for calls while driving"], hi: ["यह एक आपात स्थिति है", "आप केवल नेविगेशन के लिए हैंड्स-फ्री सिस्टम का उपयोग कर रहे हैं", "सड़क खाली है", "आपको गाड़ी चलाते समय कॉल के लिए मोबाइल फोन का उपयोग नहीं करना चाहिए"] }, correctAnswer: { en: "You are using a hands-free system for navigation only", hi: "आप केवल नेविगेशन के लिए हैंड्स-फ्री सिस्टम का उपयोग कर रहे हैं" } },
    { question: { en: "The registration certificate (RC) of a private vehicle is valid for:", hi: "एक निजी वाहन का पंजीकरण प्रमाणपत्र (आरसी) कितने समय के लिए वैध है:" }, options: { en: ["10 years", "15 years", "20 years", "Lifetime"], hi: ["10 साल", "15 साल", "20 साल", "आजीवन"] }, correctAnswer: { en: "15 years", hi: "15 साल" } },
    { question: { en: "Who has the right-of-way at a roundabout?", hi: "गोलचक्कर पर किसका रास्ता पहले है?" }, options: { en: ["Vehicles entering the roundabout", "Vehicles already in the roundabout", "The larger vehicle", "The faster vehicle"], hi: ["गोलचक्कर में प्रवेश करने वाले वाहन", "गोलचक्कर में पहले से मौजूद वाहन", "बड़ा वाहन", "तेज वाहन"] }, correctAnswer: { en: "Vehicles already in the roundabout", hi: "गोलचक्कर में पहले से मौजूद वाहन" } },
    { question: { en: "What is the minimum age for obtaining a license for a geared motorcycle?", hi: "गियर वाली मोटरसाइकिल के लिए लाइसेंस प्राप्त करने की न्यूनतम आयु क्या है?" }, options: { en: ["16 years", "18 years", "20 years", "21 years"], hi: ["16 साल", "18 साल", "20 साल", "21 साल"] }, correctAnswer: { en: "18 years", hi: "18 साल" } },
    { question: { en: "When are you allowed to use the horn in a 'No Honking' zone?", hi: "'नो हॉन्किंग' क्षेत्र में आपको हॉर्न का उपयोग करने की अनुमति कब है?" }, options: { en: ["To greet a friend", "To signal overtaking", "Only to avoid an imminent accident", "Never"], hi: ["किसी दोस्त को नमस्कार करने के लिए", "ओवरटेक करने का संकेत देने के लिए", "केवल एक आसन्न दुर्घटना से बचने के लिए", "कभी नहीं"] }, correctAnswer: { en: "Only to avoid an imminent accident", hi: "केवल एक आसन्न दुर्घटना से बचने के लिए" } },
    { question: { en: "A Pollution Under Control (PUC) certificate is valid for how long for a new car?", hi: "एक नई कार के लिए प्रदूषण नियंत्रण (पीयूसी) प्रमाणपत्र कितने समय के लिए वैध है?" }, options: { en: ["6 months", "1 year", "2 years", "3 months"], hi: ["6 महीने", "1 साल", "2 साल", "3 महीने"] }, correctAnswer: { en: "1 year", hi: "1 साल" } },
    { question: { en: "When can a U-turn be made?", hi: "यू-टर्न कब लिया जा सकता है?" }, options: { en: ["On any road", "On a busy road", "When there is no 'No U-turn' sign and it is safe", "At a traffic light"], hi: ["किसी भी सड़क पर", "एक व्यस्त सड़क पर", "जब 'नो यू-टर्न' का कोई चिह्न न हो और यह सुरक्षित हो", "एक ट्रैफिक लाइट पर"] }, correctAnswer: { en: "When there is no 'No U-turn' sign and it is safe", hi: "जब 'नो यू-टर्न' का कोई चिह्न न हो और यह सुरक्षित हो" } },
    { question: { en: "What document is not mandatory to carry while driving?", hi: "गाड़ी चलाते समय कौन सा दस्तावेज़ ले जाना अनिवार्य नहीं है?" }, options: { en: ["Driving License", "Registration Certificate (RC)", "Insurance Certificate", "Vehicle's Invoice"], hi: ["ड्राइविंग लाइसेंस", "पंजीकरण प्रमाणपत्र (आरसी)", "बीमा प्रमाणपत्र", "वाहन का चालान"] }, correctAnswer: { en: "Vehicle's Invoice", hi: "वाहन का चालान" } },
    { question: { en: "When approaching a junction, who has the right of way if you are on the main road?", hi: "एक जंक्शन पर पहुँचते समय, यदि आप मुख्य सड़क पर हैं तो किसका रास्ता पहले है?" }, options: { en: ["Vehicles from the left", "Vehicles from the right", "You have the right of way over traffic from minor roads", "The vehicle that arrives first"], hi: ["बाईं ओर से वाहन", "दाईं ओर से वाहन", "आपका छोटी सड़कों से आने वाले यातायात पर अधिकार है", "जो वाहन पहले आता है"] }, correctAnswer: { en: "You have the right of way over traffic from minor roads", hi: "आपका छोटी सड़कों से आने वाले यातायात पर अधिकार है" } },
    { question: { en: "In which lane should you drive on a multi-lane highway?", hi: "एक बहु-लेन राजमार्ग पर आपको किस लेन में गाड़ी चलानी चाहिए?" }, options: { en: ["The rightmost lane", "The leftmost lane", "Any lane", "The middle lane"], hi: ["सबसे दाहिनी लेन", "सबसे बाईं लेन", "कोई भी लेन", "बीच की लेन"] }, correctAnswer: { en: "The leftmost lane", hi: "सबसे बाईं लेन" } },
    { question: { en: "What is the purpose of a zebra crossing?", hi: "जेब्रा क्रॉसिंग का उद्देश्य क्या है?" }, options: { en: ["For drivers to stop", "For pedestrians to cross the road", "For parking", "To slow down traffic"], hi: ["ड्राइवरों के रुकने के लिए", "पैदल चलने वालों के सड़क पार करने के लिए", "पार्किंग के लिए", "यातायात को धीमा करने के लिए"] }, correctAnswer: { en: "For pedestrians to cross the road", hi: "पैदल चलने वालों के सड़क पार करने के लिए" } },
    { question: { en: "Can you park your vehicle in front of a hospital entrance?", hi: "क्या आप अपना वाहन अस्पताल के प्रवेश द्वार के सामने पार्क कर सकते हैं?" }, options: { en: ["Yes", "No", "Only for a short time", "If you are a doctor"], hi: ["हाँ", "नहीं", "केवल थोड़े समय के लिए", "यदि आप एक डॉक्टर हैं"] }, correctAnswer: { en: "No", hi: "नहीं" } },
    { question: { en: "The hand signal for 'slowing down' is:", hi: "'धीमा करने' के लिए हाथ का संकेत है:" }, options: { en: ["Extending arm horizontally", "Raising arm vertically", "Extending arm and rotating it in an anti-clockwise direction", "Extending arm and repeatedly moving it up and down"], hi: ["हाथ को क्षैतिज रूप से फैलाना", "हाथ को लंबवत रूप से ऊपर उठाना", "हाथ को फैलाना और इसे वामावर्त दिशा में घुमाना", "हाथ को फैलाना और इसे बार-बार ऊपर और नीचे ले जाना"] }, correctAnswer: { en: "Extending arm and repeatedly moving it up and down", hi: "हाथ को फैलाना और इसे बार-बार ऊपर और नीचे ले जाना" } },
    { question: { en: "What should be the color of the number plate for a private car?", hi: "एक निजी कार के लिए नंबर प्लेट का रंग क्या होना चाहिए?" }, options: { en: ["Yellow background with black letters", "White background with black letters", "Black background with yellow letters", "Green background with white letters"], hi: ["पीला बैकग्राउंड और काले अक्षर", "सफेद बैकग्राउंड और काले अक्षर", "काला बैकग्राउंड और पीले अक्षर", "हरा बैकग्राउंड और सफेद अक्षर"] }, correctAnswer: { en: "White background with black letters", hi: "सफेद बैकग्राउंड और काले अक्षर" } },
    { question: { en: "What does 'tailgating' mean?", hi: "'टेलगेटिंग' का क्या मतलब है?" }, options: { en: ["Following another vehicle too closely", "Driving with a broken tail light", "Attaching a trailer", "Using the tailgate for seating"], hi: ["दूसरे वाहन के बहुत करीब चलना", "टूटी हुई टेल लाइट के साथ गाड़ी चलाना", "एक ट्रेलर संलग्न करना", "बैठने के लिए टेलगेट का उपयोग करना"] }, correctAnswer: { en: "Following another vehicle too closely", hi: "दूसरे वाहन के बहुत करीब चलना" } },
    { question: { en: "When can you overtake a vehicle from its left side?", hi: "आप किसी वाहन को उसकी बाईं ओर से कब ओवरटेक कर सकते हैं?" }, options: { en: ["When the vehicle ahead is turning right", "On a narrow road", "On a hill", "Never"], hi: ["जब आगे का वाहन दाईं ओर मुड़ रहा हो", "एक संकरी सड़क पर", "एक पहाड़ी पर", "कभी नहीं"] }, correctAnswer: { en: "When the vehicle ahead is turning right", hi: "जब आगे का वाहन दाईं ओर मुड़ रहा हो" } },
    { question: { en: "Is it permissible to use a red light on top of your private vehicle?", hi: "क्या आपके निजी वाहन के ऊपर लाल बत्ती का उपयोग करना अनुमेय है?" }, options: { en: ["Yes, for style", "Yes, in an emergency", "No, it is not permissible", "Only on highways"], hi: ["हाँ, स्टाइल के लिए", "हाँ, एक आपात स्थिति में", "नहीं, यह अनुमेय नहीं है", "केवल राजमार्गों पर"] }, correctAnswer: { en: "No, it is not permissible", hi: "नहीं, यह अनुमेय नहीं है" } },
    { question: { en: "On a road where there is no footpath, pedestrians should walk on:", hi: "एक सड़क पर जहाँ कोई फुटपाथ नहीं है, पैदल चलने वालों को चलना चाहिए:" }, options: { en: ["The left side of the road", "The right side of the road, facing oncoming traffic", "The middle of the road", "Anywhere they want"], hi: ["सड़क के बाईं ओर", "सड़क के दाईं ओर, आने वाले यातायात का सामना करते हुए", "सड़क के बीच में", "कहीं भी वे चाहें"] }, correctAnswer: { en: "The right side of the road, facing oncoming traffic", hi: "सड़क के दाईं ओर, आने वाले यातायात का सामना करते हुए" } },
    { question: { en: "What is the maximum permissible speed for a car in a city like Delhi, unless specified otherwise?", hi: "दिल्ली जैसे शहर में एक कार के लिए अधिकतम अनुमेय गति क्या है, जब तक कि अन्यथा निर्दिष्ट न हो?" }, options: { en: ["40 km/h", "50 km/h", "60 km/h", "70 km/h"], hi: ["40 किमी/घंटा", "50 किमी/घंटा", "60 किमी/घंटा", "70 किमी/घंटा"] }, correctAnswer: { en: "50 km/h", hi: "50 किमी/घंटा" } },
    { question: { en: "The driver of a vehicle may overtake:", hi: "एक वाहन का चालक ओवरटेक कर सकता है:" }, options: { en: ["When the road ahead is not clearly visible", "On a bend or corner", "If the road is wide enough and it is safe", "When approaching a pedestrian crossing"], hi: ["जब आगे की सड़क स्पष्ट रूप से दिखाई न दे", "एक मोड़ या कोने पर", "यदि सड़क पर्याप्त चौड़ी है और यह सुरक्षित है", "एक पैदल यात्री क्रॉसिंग पर पहुँचते समय"] }, correctAnswer: { en: "If the road is wide enough and it is safe", hi: "यदि सड़क पर्याप्त चौड़ी है और यह सुरक्षित है" } },
    { question: { en: "What is the fine for driving without a valid driving license?", hi: "बिना वैध ड्राइविंग लाइसेंस के गाड़ी चलाने पर क्या जुर्माना है?" }, options: { en: ["₹500", "₹1,000", "₹2,000", "₹5,000"], hi: ["₹500", "₹1,000", "₹2,000", "₹5,000"] }, correctAnswer: { en: "₹5,000", hi: "₹5,000" } },
    { question: { en: "If an ambulance is approaching from behind, you should:", hi: "यदि एक एम्बुलेंस पीछे से आ रही है, तो आपको:" }, options: { en: ["Speed up", "Maintain your speed", "Move to the side of the road and let it pass", "Block its path"], hi: ["गति बढ़ाएं", "अपनी गति बनाए रखें", "सड़क के किनारे हट जाएं और उसे गुजरने दें", "उसका रास्ता रोकें"] }, correctAnswer: { en: "Move to the side of the road and let it pass", hi: "सड़क के किनारे हट जाएं और उसे गुजरने दें" } },
    { question: { en: "You should not park your vehicle:", hi: "आपको अपना वाहन पार्क नहीं करना चाहिए:" }, options: { en: ["On a steep hill", "Near a bus stop", "On a one-way street", "In a designated parking lot"], hi: ["एक खड़ी पहाड़ी पर", "एक बस स्टॉप के पास", "एक-तरफ़ा सड़क पर", "एक निर्दिष्ट पार्किंग स्थल में"] }, correctAnswer: { en: "Near a bus stop", hi: "एक बस स्टॉप के पास" } },
    { question: { en: "Use of high-beam headlights is prohibited when:", hi: "हाई-बीम हेडलाइट्स का उपयोग कब निषिद्ध है:" }, options: { en: ["Driving on a well-lit street", "A vehicle is approaching from the opposite direction", "You are following another vehicle", "All of the above"], hi: ["एक अच्छी तरह से रोशनी वाली सड़क पर गाड़ी चलाते समय", "एक वाहन विपरीत दिशा से आ रहा है", "आप दूसरे वाहन का पीछा कर रहे हैं", "उपरोक्त सभी"] }, correctAnswer: { en: "All of the above", hi: "उपरोक्त सभी" } },
    { question: { en: "A driver must signal before:", hi: "एक ड्राइवर को संकेत देना चाहिए:" }, options: { en: ["Making a turn", "Changing lanes", "Stopping or slowing down", "All of the above"], hi: ["एक मोड़ लेने से पहले", "लेन बदलने से पहले", "रुकने या धीमा होने से पहले", "उपरोक्त सभी"] }, correctAnswer: { en: "All of the above", hi: "उपरोक्त सभी" } },
    { question: { en: "What does a double solid yellow line mean?", hi: "एक दोहरी ठोस पीली रेखा का क्या मतलब है?" }, options: { en: ["Overtaking is allowed", "Crossing the line is strictly forbidden", "You can cross to make a U-turn", "It is a temporary marking"], hi: ["ओवरटेक करने की अनुमति है", "लाइन पार करना सख्त वर्जित है", "आप यू-टर्न लेने के लिए पार कर सकते हैं", "यह एक अस्थायी अंकन है"] }, correctAnswer: { en: "Crossing the line is strictly forbidden", hi: "लाइन पार करना सख्त वर्जित है" } },
    { question: { en: "What does the term 'aquaplaning' refer to?", hi: "'एक्वाप्लानिंग' शब्द का क्या अर्थ है?" }, options: { en: ["Driving on water", "Skidding on a wet surface due to tires losing contact", "A type of water sport", "Washing your car"], hi: ["पानी पर गाड़ी चलाना", "टायरों के संपर्क खोने के कारण गीली सतह पर फिसलना", "एक प्रकार का जल क्रीड़ा", "अपनी कार धोना"] }, correctAnswer: { en: "Skidding on a wet surface due to tires losing contact", hi: "टायरों के संपर्क खोने के कारण गीली सतह पर फिसलना" } },
    { question: { en: "Before starting the engine of a vehicle, you should:", hi: "एक वाहन का इंजन शुरू करने से पहले, आपको:" }, options: { en: ["Check the fuel", "Adjust your seat and mirrors", "Turn on the AC", "Play music"], hi: ["ईंधन की जाँच करें", "अपनी सीट और शीशे समायोजित करें", "एसी चालू करें", "संगीत चलाएं"] }, correctAnswer: { en: "Adjust your seat and mirrors", hi: "अपनी सीट और शीशे समायोजित करें" } },
    { question: { en: "The law requires that you use your headlights:", hi: "कानून के अनुसार आपको अपनी हेडलाइट्स का उपयोग करना आवश्यक है:" }, options: { en: ["Only after 7 PM", "From sunset to sunrise", "When it is raining", "Both B and C"], hi: ["केवल शाम 7 बजे के बाद", "सूर्यास्त से सूर्योदय तक", "जब बारिश हो रही हो", "बी और सी दोनों"] }, correctAnswer: { en: "Both B and C", hi: "बी और सी दोनों" } },
    { question: { en: "The minimum distance you should keep from the vehicle in front is:", hi: "आपको आगे के वाहन से न्यूनतम दूरी रखनी चाहिए:" }, options: { en: ["1 meter", "2 meters", "A safe distance depending on speed (3-second rule)", "5 meters"], hi: ["1 मीटर", "2 मीटर", "गति के आधार पर एक सुरक्षित दूरी (3-सेकंड का नियम)", "5 मीटर"] }, correctAnswer: { en: "A safe distance depending on speed (3-second rule)", hi: "गति के आधार पर एक सुरक्षित दूरी (3-सेकंड का नियम)" } },
    { question: { en: "What is the first thing you should do after being involved in a minor accident?", hi: "एक छोटी दुर्घटना में शामिल होने के बाद आपको सबसे पहले क्या करना चाहिए?" }, options: { en: ["Run away", "Argue with the other driver", "Stop the vehicle and switch on hazard lights", "Call your family"], hi: ["भाग जाएं", "दूसरे ड्राइवर से बहस करें", "वाहन रोकें और हैजर्ड लाइट चालू करें", "अपने परिवार को फोन करें"] }, correctAnswer: { en: "Stop the vehicle and switch on hazard lights", hi: "वाहन रोकें और हैजर्ड लाइट चालू करें" } },
    { question: { en: "On a foggy day, you should use:", hi: "कोहरे वाले दिन में, आपको उपयोग करना चाहिए:" }, options: { en: ["High-beam headlights", "Low-beam headlights", "Parking lights", "No lights"], hi: ["हाई-बीम हेडलाइट्स", "लो-बीम हेडलाइट्स", "पार्किंग लाइट्स", "कोई लाइट नहीं"] }, correctAnswer: { en: "Low-beam headlights", hi: "लो-बीम हेडलाइट्स" } },
    { question: { en: "What does 'defensive driving' primarily involve?", hi: "'रक्षात्मक ड्राइविंग' में मुख्य रूप से क्या शामिल है?" }, options: { en: ["Driving fast to defend your position", "Always yielding to others", "Anticipating and reacting to hazards", "Using a large, strong vehicle"], hi: ["अपनी स्थिति की रक्षा के लिए तेजी से गाड़ी चलाना", "हमेशा दूसरों को रास्ता देना", "खतरों का अनुमान लगाना और उन पर प्रतिक्रिया करना", "एक बड़े, मजबूत वाहन का उपयोग करना"] }, correctAnswer: { en: "Anticipating and reacting to hazards", hi: "खतरों का अनुमान लगाना और उन पर प्रतिक्रिया करना" } },

    // Safe Driving Practices & Vehicle Maintenance (40 questions)
    { question: { en: "Before changing lanes, you should:", hi: "लेन बदलने से पहले, आपको:" }, options: { en: ["Honk", "Check mirrors and blind spots, then signal", "Only check your rearview mirror", "Increase your speed"], hi: ["हॉर्न बजाएं", "शीशे और ब्लाइंड स्पॉट देखें, फिर सिग्नल दें", "केवल अपना रियरव्यू मिरर देखें", "अपनी गति बढ़ाएं"] }, correctAnswer: { en: "Check mirrors and blind spots, then signal", hi: "शीशे और ब्लाइंड स्पॉट देखें, फिर सिग्नल दें" } },
    { question: { en: "What is defensive driving?", hi: "रक्षात्मक ड्राइविंग क्या है?" }, options: { en: ["Driving aggressively to claim your right of way", "Driving slowly at all times", "Anticipating potential dangers and the mistakes of others", "Using the horn frequently"], hi: ["अपने रास्ते का दावा करने के लिए आक्रामक रूप से गाड़ी चलाना", "हर समय धीरे-धीरे गाड़ी चलाना", "संभावित खतरों और दूसरों की गलतियों का अनुमान लगाना", "बार-बार हॉर्न का उपयोग करना"] }, correctAnswer: { en: "Anticipating potential dangers and the mistakes of others", hi: "संभावित खतरों और दूसरों की गलतियों का अनुमान लगाना" } },
    { question: { en: "When approaching a pedestrian crossing, you should:", hi: "पैदल यात्री क्रॉसिंग पर पहुँचते समय, आपको:" }, options: { en: ["Speed up to cross before the pedestrian", "Slow down, be prepared to stop, and give way to pedestrians", "Honk to warn pedestrians", "Ignore it if there are no pedestrians on the crossing"], hi: ["पैदल यात्री से पहले पार करने के लिए गति बढ़ाएँ", "धीमे चलें, रुकने के लिए तैयार रहें, और पैदल चलने वालों को रास्ता दें", "पैदल चलने वालों को चेतावनी देने के लिए हॉर्न बजाएं", "यदि क्रॉसिंग पर कोई पैदल यात्री नहीं है तो इसे अनदेखा करें"] }, correctAnswer: { en: "Slow down, be prepared to stop, and give way to pedestrians", hi: "धीमे चलें, रुकने के लिए तैयार रहें, और पैदल चलने वालों को रास्ता दें" } },
    { question: { en: "When parking on a downhill slope, you should turn your wheels:", hi: "ढलान पर नीचे की ओर पार्किंग करते समय, आपको अपने पहियों को मोड़ना चाहिए:" }, options: { en: ["Towards the curb", "Away from the curb", "Straight", "It doesn't matter"], hi: ["फुटपाथ की ओर", "फुटपाथ से दूर", "सीधे", "इससे कोई फर्क नहीं पड़ता"] }, correctAnswer: { en: "Towards the curb", hi: "फुटपाथ की ओर" } },
    { question: { en: "What is the '3-second rule' for?", hi: "'3-सेकंड का नियम' किसके लिए है?" }, options: { en: ["The time to wait at a green light", "Calculating a safe following distance", "The maximum time you can park somewhere", "The time to signal before a turn"], hi: ["हरी बत्ती पर प्रतीक्षा करने का समय", "एक सुरक्षित निम्नलिखित दूरी की गणना करना", "कहीं पार्क करने का अधिकतम समय", "मोड़ से पहले सिग्नल देने का समय"] }, correctAnswer: { en: "Calculating a safe following distance", hi: "एक सुरक्षित निम्नलिखित दूरी की गणना करना" } },
    { question: { en: "What should you do if your car starts to skid?", hi: "यदि आपकी कार फिसलने लगे तो आपको क्या करना चाहिए?" }, options: { en: ["Brake hard", "Accelerate", "Steer in the direction of the skid", "Steer opposite to the direction of the skid"], hi: ["जोर से ब्रेक लगाएं", "गति बढ़ाएं", "फिसलन की दिशा में स्टीयर करें", "फिसलन की दिशा के विपरीत स्टीयर करें"] }, correctAnswer: { en: "Steer in the direction of the skid", hi: "फिसलन की दिशा में स्टीयर करें" } },
    { question: { en: "The best way to check your blind spot is to:", hi: "अपने ब्लाइंड स्पॉट की जांच करने का सबसे अच्छा तरीका है:" }, options: { en: ["Use only your rearview mirror", "Use only your side mirrors", "Briefly turn your head to look over your shoulder", "Honk before changing lanes"], hi: ["केवल अपने रियरव्यू मिरर का उपयोग करें", "केवल अपने साइड मिरर का उपयोग करें", "संक्षेप में अपना सिर घुमाकर अपने कंधे के ऊपर देखें", "लेन बदलने से पहले हॉर्न बजाएं"] }, correctAnswer: { en: "Briefly turn your head to look over your shoulder", hi: "संक्षेप में अपना सिर घुमाकर अपने कंधे के ऊपर देखें" } },
    { question: { en: "When driving in heavy rain, you should:", hi: "भारी बारिश में गाड़ी चलाते समय, आपको:" }, options: { en: ["Turn on high-beam headlights", "Increase your speed", "Increase your following distance", "Drive in the middle of the road"], hi: ["हाई-बीम हेडलाइट्स चालू करें", "अपनी गति बढ़ाएं", "अपनी निम्नलिखित दूरी बढ़ाएं", "सड़क के बीच में ड्राइव करें"] }, correctAnswer: { en: "Increase your following distance", hi: "अपनी निम्नलिखित दूरी बढ़ाएं" } },
    { question: { en: "Regularly checking your tire pressure helps to:", hi: "नियमित रूप से अपने टायर के दबाव की जांच करने से मदद मिलती है:" }, options: { en: ["Improve fuel efficiency", "Increase tire life", "Ensure better handling", "All of the above"], hi: ["ईंधन दक्षता में सुधार", "टायर का जीवन बढ़ाएं", "बेहतर हैंडलिंग सुनिश्चित करें", "उपरोक्त सभी"] }, correctAnswer: { en: "All of the above", hi: "उपरोक्त सभी" } },
    { question: { en: "What is the correct hand position on the steering wheel?", hi: "स्टीयरिंग व्हील पर हाथ की सही स्थिति क्या है?" }, options: { en: ["10 and 2 o'clock", "12 o'clock", "9 and 3 o'clock", "6 o'clock"], hi: ["10 और 2 बजे", "12 बजे", "9 और 3 बजे", "6 बजे"] }, correctAnswer: { en: "9 and 3 o'clock", hi: "9 और 3 बजे" } },
    { question: { en: "If you feel drowsy while driving, you should:", hi: "यदि आपको गाड़ी चलाते समय नींद आ रही है, तो आपको:" }, options: { en: ["Turn up the music", "Open the window", "Pull over and rest", "Drink coffee and continue driving"], hi: ["संगीत तेज करें", "खिड़की खोलें", "गाड़ी रोकें और आराम करें", "कॉफी पिएं और गाड़ी चलाना जारी रखें"] }, correctAnswer: { en: "Pull over and rest", hi: "गाड़ी रोकें और आराम करें" } },
    { question: { en: "What does the engine oil warning light indicate?", hi: "इंजन ऑयल चेतावनी प्रकाश क्या दर्शाता है?" }, options: { en: ["Low fuel", "Low engine oil pressure", "Engine is too hot", "Time for an oil change"], hi: ["कम ईंधन", "कम इंजन तेल का दबाव", "इंजन बहुत गर्म है", "तेल बदलने का समय"] }, correctAnswer: { en: "Low engine oil pressure", hi: "कम इंजन तेल का दबाव" } },
    { question: { en: "When parking on an uphill slope with a curb, you should turn your wheels:", hi: "फुटपाथ के साथ ऊपर की ओर ढलान पर पार्किंग करते समय, आपको अपने पहियों को मोड़ना चाहिए:" }, options: { en: ["Towards the curb", "Away from the curb", "Straight", "It doesn't matter"], hi: ["फुटपाथ की ओर", "फुटपाथ से दूर", "सीधे", "इससे कोई फर्क नहीं पड़ता"] }, correctAnswer: { en: "Away from the curb", hi: "फुटपाथ से दूर" } },
    { question: { en: "What is the primary cause of most traffic accidents?", hi: "अधिकांश यातायात दुर्घटनाओं का प्राथमिक कारण क्या है?" }, options: { en: ["Bad weather", "Mechanical failure", "Human error", "Poor road conditions"], hi: ["खराब मौसम", "यांत्रिक विफलता", "मानव त्रुटि", "खराब सड़क की स्थिति"] }, correctAnswer: { en: "Human error", hi: "मानव त्रुटि" } },
    { question: { en: "The 'Engine Temperature' gauge should normally be:", hi: "'इंजन तापमान' गेज सामान्य रूप से होना चाहिए:" }, options: { en: ["In the 'H' (Hot) zone", "In the 'C' (Cold) zone", "In the middle of the range", "It doesn't matter"], hi: ["'H' (गर्म) क्षेत्र में", "'C' (ठंडा) क्षेत्र में", "सीमा के बीच में", "इससे कोई फर्क नहीं पड़ता"] }, correctAnswer: { en: "In the middle of the range", hi: "सीमा के बीच में" } },
    { question: { en: "Before a long journey, it is wise to check:", hi: "एक लंबी यात्रा से पहले, यह जांचना बुद्धिमानी है:" }, options: { en: ["Engine oil and coolant levels", "Tire pressure", "Lights and wipers", "All of the above"], hi: ["इंजन तेल और कूलेंट का स्तर", "टायर का दबाव", "लाइट्स और वाइपर", "उपरोक्त सभी"] }, correctAnswer: { en: "All of the above", hi: "उपरोक्त सभी" } },
    { question: { en: "If your brakes fail while driving, you should first:", hi: "यदि गाड़ी चलाते समय आपके ब्रेक फेल हो जाएं, तो आपको सबसे पहले:" }, options: { en: ["Jump out of the car", "Pump the brake pedal rapidly", "Switch off the engine", "Pull the handbrake hard"], hi: ["कार से बाहर कूदें", "ब्रेक पेडल को तेजी से पंप करें", "इंजन बंद कर दें", "हैंडब्रेक को जोर से खींचें"] }, correctAnswer: { en: "Pump the brake pedal rapidly", hi: "ब्रेक पेडल को तेजी से पंप करें" } },
    { question: { en: "The minimum tread depth for a car tire in India is:", hi: "भारत में एक कार टायर के लिए न्यूनतम ट्रेड गहराई है:" }, options: { en: ["1.0 mm", "1.6 mm", "2.0 mm", "2.5 mm"], hi: ["1.0 मिमी", "1.6 मिमी", "2.0 मिमी", "2.5 मिमी"] }, correctAnswer: { en: "1.6 mm", hi: "1.6 मिमी" } },
    { question: { en: "When being overtaken by another vehicle, you should:", hi: "जब कोई अन्य वाहन आपको ओवरटेक कर रहा हो, तो आपको:" }, options: { en: ["Speed up", "Maintain your speed and stay in your lane", "Move to the right", "Honk"], hi: ["गति बढ़ाएं", "अपनी गति बनाए रखें और अपनी लेन में रहें", "दाईं ओर हटें", "हॉर्न बजाएं"] }, correctAnswer: { en: "Maintain your speed and stay in your lane", hi: "अपनी गति बनाए रखें और अपनी लेन में रहें" } },
    { question: { en: "What is the safest way to carry a child under 12 in a car?", hi: "एक कार में 12 साल से कम उम्र के बच्चे को ले जाने का सबसे सुरक्षित तरीका क्या है?" }, options: { en: ["In the front seat", "On an adult's lap", "In a child restraint system (car seat) in the back", "In the boot"], hi: ["आगे की सीट पर", "एक वयस्क की गोद में", "पीछे की सीट पर एक बाल निरोधक प्रणाली (कार सीट) में", "बूट में"] }, correctAnswer: { en: "In a child restraint system (car seat) in the back", hi: "पीछे की सीट पर एक बाल निरोधक प्रणाली (कार सीट) में" } },
    { question: { en: "What does ABS stand for in vehicles?", hi: "वाहनों में एबीएस का क्या मतलब है?" }, options: { en: ["Anti-Braking System", "Automatic Brake-force System", "Anti-lock Braking System", "Advanced Braking Support"], hi: ["एंटी-ब्रेकिंग सिस्टम", "ऑटोमैटिक ब्रेक-फोर्स सिस्टम", "एंटी-लॉक ब्रेकिंग सिस्टम", "एडवांस्ड ब्रेकिंग सपोर्ट"] }, correctAnswer: { en: "Anti-lock Braking System", hi: "एंटी-लॉक ब्रेकिंग सिस्टम" } },
    { question: { en: "When reversing, you should primarily look:", hi: "रिवर्स करते समय, आपको मुख्य रूप से देखना चाहिए:" }, options: { en: ["In your rearview mirror", "In your side mirrors", "Over your shoulder through the rear window", "At your dashboard camera"], hi: ["अपने रियरव्यू मिरर में", "अपने साइड मिरर में", "अपने कंधे के ऊपर से पीछे की खिड़की से", "अपने डैशबोर्ड कैमरे पर"] }, correctAnswer: { en: "Over your shoulder through the rear window", hi: "अपने कंधे के ऊपर से पीछे की खिड़की से" } },
    { question: { en: "It is dangerous to drive with a cracked windshield because:", hi: "एक टूटी हुई विंडशील्ड के साथ गाड़ी चलाना खतरनाक है क्योंकि:" }, options: { en: ["It looks bad", "It impairs vision and reduces structural integrity", "It is illegal", "All of the above"], hi: ["यह खराब दिखता है", "यह दृष्टि को बाधित करता है और संरचनात्मक अखंडता को कम करता है", "यह अवैध है", "उपरोक्त सभी"] }, correctAnswer: { en: "All of the above", hi: "उपरोक्त सभी" } },
    { question: { en: "The correct way to use a seatbelt is:", hi: "सीटबेल्ट का सही तरीके से उपयोग करना है:" }, options: { en: ["With the lap belt low over your hips and the shoulder belt across your chest", "With the shoulder belt under your arm", "Loosely fitted", "Only on highways"], hi: ["लैप बेल्ट को अपने कूल्हों पर नीचे और शोल्डर बेल्ट को अपनी छाती पर", "शोल्डर बेल्ट को अपनी बांह के नीचे", "ढीले-ढाले", "केवल राजमार्गों पर"] }, correctAnswer: { en: "With the lap belt low over your hips and the shoulder belt across your chest", hi: "लैप बेल्ट को अपने कूल्हों पर नीचे और शोल्डर बेल्ट को अपनी छाती पर" } },
    { question: { en: "What should you do if a tire blows out while driving?", hi: "गाड़ी चलाते समय टायर फट जाए तो क्या करना चाहिए?" }, options: { en: ["Brake hard immediately", "Accelerate to maintain control", "Grip the steering wheel firmly and steer straight", "Turn the steering wheel sharply"], hi: ["तुरंत जोर से ब्रेक लगाएं", "नियंत्रण बनाए रखने के लिए गति बढ़ाएं", "स्टीयरिंग व्हील को मजबूती से पकड़ें और सीधे स्टीयर करें", "स्टीयरिंग व्हील को तेजी से घुमाएं"] }, correctAnswer: { en: "Grip the steering wheel firmly and steer straight", hi: "स्टीयरिंग व्हील को मजबूती से पकड़ें और सीधे स्टीयर करें" } },
    { question: { en: "When are you allowed to cross a solid yellow line?", hi: "आपको एक ठोस पीली रेखा को कब पार करने की अनुमति है?" }, options: { en: ["To overtake", "To make a U-turn", "To turn into a driveway on the other side", "Never"], hi: ["ओवरटेक करने के लिए", "यू-टर्न लेने के लिए", "दूसरी तरफ एक ड्राइववे में मुड़ने के लिए", "कभी नहीं"] }, correctAnswer: { en: "To turn into a driveway on the other side", hi: "दूसरी तरफ एक ड्राइववे में मुड़ने के लिए" } },
    { question: { en: "If you approach a traffic light and it turns yellow, you should:", hi: "यदि आप एक ट्रैफिक लाइट पर पहुँचते हैं और वह पीली हो जाती है, तो आपको:" }, options: { en: ["Speed up to cross it", "Stop if it is safe to do so", "Continue at the same speed", "Reverse"], hi: ["इसे पार करने के लिए गति बढ़ाएं", "यदि ऐसा करना सुरक्षित है तो रुकें", "उसी गति से जारी रखें", "रिवर्स करें"] }, correctAnswer: { en: "Stop if it is safe to do so", hi: "यदि ऐसा करना सुरक्षित है तो रुकें" } },
    { question: { en: "It is important to check engine coolant levels to:", hi: "इंजन कूलेंट के स्तर की जांच करना महत्वपूर्ण है:" }, options: { en: ["Prevent the engine from overheating", "Improve mileage", "Make the AC colder", "Increase engine power"], hi: ["इंजन को ओवरहीटिंग से बचाने के लिए", "माइलेज में सुधार करने के लिए", "एसी को और ठंडा करने के लिए", "इंजन की शक्ति बढ़ाने के लिए"] }, correctAnswer: { en: "Prevent the engine from overheating", hi: "इंजन को ओवरहीटिंग से बचाने के लिए" } },
    { question: { en: "The hand signal for turning right is:", hi: "'दाईं ओर मुड़ने' के लिए हाथ का संकेत है:" }, options: { en: ["Extending arm horizontally", "Extending arm and rotating it in a clockwise direction", "Raising arm vertically", "Pointing to the right"], hi: ["हाथ को क्षैतिज रूप से फैलाना", "हाथ को फैलाना और इसे दक्षिणावर्त दिशा में घुमाना", "हाथ को लंबवत रूप से ऊपर उठाना", "दाईं ओर इशारा करना"] }, correctAnswer: { en: "Extending arm horizontally", hi: "हाथ को क्षैतिज रूप से फैलाना" } },
    { question: { en: "When should you check your mirrors?", hi: "आपको अपने शीशे कब जांचने चाहिए?" }, options: { en: ["Only when changing lanes", "Every 5-8 seconds", "Before stopping or turning", "All of the above"], hi: ["केवल लेन बदलते समय", "हर 5-8 सेकंड में", "रुकने या मुड़ने से पहले", "उपरोक्त सभी"] }, correctAnswer: { en: "All of the above", hi: "उपरोक्त सभी" } },
    { question: { en: "What is hydroplaning?", hi: "हाइड्रोप्लानिंग क्या है?" }, options: { en: ["A type of car", "When tires ride on a thin layer of water instead of the road", "Driving in water", "A special driving technique"], hi: ["एक प्रकार की कार", "जब टायर सड़क के बजाय पानी की एक पतली परत पर चलते हैं", "पानी में गाड़ी चलाना", "एक विशेष ड्राइविंग तकनीक"] }, correctAnswer: { en: "When tires ride on a thin layer of water instead of the road", hi: "जब टायर सड़क के बजाय पानी की एक पतली परत पर चलते हैं" } },
    { question: { en: "You should not use a clutch when braking in an emergency because:", hi: "आपको एक आपात स्थिति में ब्रेक लगाते समय क्लच का उपयोग नहीं करना चाहिए क्योंकि:" }, options: { en: ["It can damage the clutch", "It reduces the effect of engine braking", "It's difficult to do both", "The car will stall"], hi: ["यह क्लच को नुकसान पहुंचा सकता है", "यह इंजन ब्रेकिंग के प्रभाव को कम करता है", "दोनों करना मुश्किल है", "कार रुक जाएगी"] }, correctAnswer: { en: "It reduces the effect of engine braking", hi: "यह इंजन ब्रेकिंग के प्रभाव को कम करता है" } },
    { question: { en: "What does the 'Check Engine' light mean?", hi: "'चेक इंजन' लाइट का क्या मतलब है?" }, options: { en: ["The engine is off", "There is a problem with the engine or emissions system", "The engine needs more oil", "The engine is running perfectly"], hi: ["इंजन बंद है", "इंजन या उत्सर्जन प्रणाली में कोई समस्या है", "इंजन को और तेल की आवश्यकता है", "इंजन पूरी तरह से चल रहा है"] }, correctAnswer: { en: "There is a problem with the engine or emissions system", hi: "इंजन या उत्सर्जन प्रणाली में कोई समस्या है" } },
    { question: { en: "When another driver is acting aggressively, you should:", hi: "जब कोई अन्य ड्राइवर आक्रामक रूप से व्यवहार कर रहा हो, तो आपको:" }, options: { en: ["Respond aggressively", "Challenge them", "Avoid eye contact and give them space", "Block their way"], hi: ["आक्रामक रूप से प्रतिक्रिया दें", "उन्हें चुनौती दें", "आंखों के संपर्क से बचें और उन्हें जगह दें", "उनका रास्ता रोकें"] }, correctAnswer: { en: "Avoid eye contact and give them space", hi: "आंखों के संपर्क से बचें और उन्हें जगह दें" } },
    { question: { en: "What is the purpose of the headrest?", hi: "हेडरेस्ट का उद्देश्य क्या है?" }, options: { en: ["To rest your head", "To prevent whiplash in a collision", "For style", "To hang things on"], hi: ["अपना सिर आराम करने के लिए", "एक टक्कर में व्हिपलैश को रोकने के लिए", "स्टाइल के लिए", "चीजें लटकाने के लिए"] }, correctAnswer: { en: "To prevent whiplash in a collision", hi: "एक टक्कर में व्हिपलैश को रोकने के लिए" } },
    { question: { en: "How often should you check your engine oil?", hi: "आपको अपने इंजन तेल की जांच कितनी बार करनी चाहिए?" }, options: { en: ["Every year", "Every month", "Every week", "Never"], hi: ["हर साल", "हर महीने", "हर हफ्ते", "कभी नहीं"] }, correctAnswer: { en: "Every week", hi: "हर हफ्ते" } },
    { question: { en: "What does a blind spot refer to?", hi: "एक 'ब्लाइंड स्पॉट' क्या संदर्भित करता है?" }, options: { en: ["A spot on the road you can't see", "An area around your vehicle not visible in the mirrors", "A dark spot on the windshield", "A type of parking"], hi: ["सड़क पर एक स्थान जिसे आप नहीं देख सकते", "आपके वाहन के चारों ओर एक क्षेत्र जो शीशों में दिखाई नहीं देता है", "विंडशील्ड पर एक अंधेरा स्थान", "एक प्रकार की पार्किंग"] }, correctAnswer: { en: "An area around your vehicle not visible in the mirrors", hi: "आपके वाहन के चारों ओर एक क्षेत्र जो शीशों में दिखाई नहीं देता है" } },
    { question: { en: "You must wear a helmet when riding a two-wheeler:", hi: "आपको दोपहिया वाहन चलाते समय हेलमेट पहनना चाहिए:" }, options: { en: ["Only on highways", "At all times", "Only during the day", "When you feel like it"], hi: ["केवल राजमार्गों पर", "हर समय", "केवल दिन के दौरान", "जब आपका मन करे"] }, correctAnswer: { en: "At all times", hi: "हर समय" } },
    { question: { en: "What does 'engine braking' mean?", hi: "'इंजन ब्रेकिंग' का क्या मतलब है?" }, options: { en: ["Using the handbrake", "Switching off the engine", "Slowing down by releasing the accelerator and downshifting", "Applying brakes very hard"], hi: ["हैंडब्रेक का उपयोग करना", "इंजन बंद करना", "एक्सीलरेटर जारी करके और डाउनशिफ्ट करके धीमा करना", "बहुत जोर से ब्रेक लगाना"] }, correctAnswer: { en: "Slowing down by releasing the accelerator and downshifting", hi: "एक्सीलरेटर जारी करके और डाउनशिफ्ट करके धीमा करना" } },

    // Miscellaneous (30 questions)
    { question: { en: "The document that proves ownership of a vehicle is the:", hi: "एक वाहन के स्वामित्व को साबित करने वाला दस्तावेज़ है:" }, options: { en: ["Driving License", "Insurance Policy", "Registration Certificate (RC)", "PUC Certificate"], hi: ["ड्राइविंग लाइसेंस", "बीमा पॉलिसी", "पंजीकरण प्रमाणपत्र (आरसी)", "पीयूसी प्रमाणपत्र"] }, correctAnswer: { en: "Registration Certificate (RC)", hi: "पंजीकरण प्रमाणपत्र (आरसी)" } },
    { question: { en: "What is the full form of PUC in the context of vehicles?", hi: "वाहनों के संदर्भ में पीयूसी का पूर्ण रूप क्या है?" }, options: { en: ["Pollution Under Control", "Public Utility Car", "Private Use Certificate", "Pollution Under Curfew"], hi: ["प्रदूषण नियंत्रण में", "सार्वजनिक उपयोगिता कार", "निजी उपयोग प्रमाणपत्र", "कर्फ्यू के तहत प्रदूषण"] }, correctAnswer: { en: "Pollution Under Control", hi: "प्रदूषण नियंत्रण में" } },
    { question: { en: "Which of these is a temporary registration?", hi: "इनमें से कौन सा एक अस्थायी पंजीकरण है?" }, options: { en: ["A white plate with black numbers", "A yellow plate with black numbers", "A red plate with white numbers", "A green plate with white numbers"], hi: ["काले नंबरों वाली एक सफेद प्लेट", "काले नंबरों वाली एक पीली प्लेट", "सफेद नंबरों वाली एक लाल प्लेट", "सफेद नंबरों वाली एक हरी प्लेट"] }, correctAnswer: { en: "A red plate with white numbers", hi: "सफेद नंबरों वाली एक लाल प्लेट" } },
    { question: { en: "Form 20 is an application for:", hi: "फॉर्म 20 एक आवेदन है:" }, options: { en: ["Registration of a motor vehicle", "A driving license", "Renewal of registration", "Transfer of ownership"], hi: ["एक मोटर वाहन के पंजीकरण के लिए", "एक ड्राइविंग लाइसेंस के लिए", "पंजीकरण के नवीनीकरण के लिए", "स्वामित्व के हस्तांतरण के लिए"] }, correctAnswer: { en: "Registration of a motor vehicle", hi: "एक मोटर वाहन के पंजीकरण के लिए" } },
    { question: { en: "In which situation is it most important to check for motorcyclists?", hi: "किस स्थिति में मोटरसाइकिल चालकों की जांच करना सबसे महत्वपूर्ण है?" }, options: { en: ["On a highway", "In a parking lot", "At junctions and when changing lanes", "In a residential area"], hi: ["एक राजमार्ग पर", "एक पार्किंग स्थल में", "जंक्शनों पर और लेन बदलते समय", "एक आवासीय क्षेत्र में"] }, correctAnswer: { en: "At junctions and when changing lanes", hi: "जंक्शनों पर और लेन बदलते समय" } },
    { question: { en: "Third-party insurance is:", hi: "तृतीय-पक्ष बीमा है:" }, options: { en: ["Optional for all vehicles", "Compulsory for all vehicles", "Only for commercial vehicles", "Only for old vehicles"], hi: ["सभी वाहनों के लिए वैकल्पिक", "सभी वाहनों के लिए अनिवार्य", "केवल वाणिज्यिक वाहनों के लिए", "केवल पुराने वाहनों के लिए"] }, correctAnswer: { en: "Compulsory for all vehicles", hi: "सभी वाहनों के लिए अनिवार्य" } },
    { question: { en: "If you are involved in an accident causing injury to a person, you must:", hi: "यदि आप किसी व्यक्ति को चोट पहुंचाने वाली दुर्घटना में शामिल हैं, तो आपको:" }, options: { en: ["Report to the nearest police station within 24 hours", "Drive away immediately", "Wait for the police to arrive", "Only help if you are a doctor"], hi: ["24 घंटे के भीतर निकटतम पुलिस स्टेशन को रिपोर्ट करें", "तुरंत भाग जाएं", "पुलिस के आने का इंतजार करें", "केवल तभी मदद करें जब आप एक डॉक्टर हों"] }, correctAnswer: { en: "Report to the nearest police station within 24 hours", hi: "24 घंटे के भीतर निकटतम पुलिस स्टेशन को रिपोर्ट करें" } },
    { question: { en: "What is the validity of an International Driving Permit (IDP)?", hi: "एक अंतर्राष्ट्रीय ड्राइविंग परमिट (आईडीपी) की वैधता क्या है?" }, options: { en: ["6 months", "1 year", "5 years", "Same as the domestic license"], hi: ["6 महीने", "1 साल", "5 साल", "घरेलू लाइसेंस के समान"] }, correctAnswer: { en: "1 year", hi: "1 साल" } },
    { question: { en: "The numbers on a yellow number plate are what color?", hi: "एक पीली नंबर प्लेट पर संख्याएं किस रंग की होती हैं?" }, options: { en: ["White", "Yellow", "Black", "Red"], hi: ["सफेद", "पीला", "काला", "लाल"] }, correctAnswer: { en: "Black", hi: "काला" } },
    { question: { en: "What does HSRP stand for?", hi: "एचएसआरपी का क्या मतलब है?" }, options: { en: ["High Speed Road Permit", "High Security Registration Plate", "Heavy Safety Road Panel", "Highway Speed Regulation Program"], hi: ["हाई स्पीड रोड परमिट", "हाई सिक्योरिटी रजिस्ट्रेशन प्लेट", "हैवी सेफ्टी रोड पैनल", "हाईवे स्पीड रेगुलेशन प्रोग्राम"] }, correctAnswer: { en: "High Security Registration Plate", hi: "हाई सिक्योरिटी रजिस्ट्रेशन प्लेट" } },
    { question: { en: "What is the purpose of FASTag?", hi: "फास्टैग का उद्देश्य क्या है?" }, options: { en: ["For paying for fuel", "For automatic toll collection", "For tracking vehicle speed", "For parking payments"], hi: ["ईंधन के लिए भुगतान करने के लिए", "स्वचालित टोल संग्रह के लिए", "वाहन की गति को ट्रैक करने के लिए", "पार्किंग भुगतान के लिए"] }, correctAnswer: { en: "For automatic toll collection", hi: "स्वचालित टोल संग्रह के लिए" } },
    { question: { en: "Driving a vehicle without a valid insurance can lead to:", hi: "बिना वैध बीमा के वाहन चलाने पर हो सकता है:" }, options: { en: ["A warning", "Imprisonment up to 3 months, or a fine of ₹2,000, or both", "A fine of ₹500", "Suspension of license only"], hi: ["एक चेतावनी", "3 महीने तक का कारावास, या ₹2,000 का जुर्माना, या दोनों", "₹500 का जुर्माना", "केवल लाइसेंस का निलंबन"] }, correctAnswer: { en: "Imprisonment up to 3 months, or a fine of ₹2,000, or both", hi: "3 महीने तक का कारावास, या ₹2,000 का जुर्माना, या दोनों" } },
    { question: { en: "To drive a transport vehicle, a driver must be at least:", hi: "एक परिवहन वाहन चलाने के लिए, एक ड्राइवर की आयु कम से कम होनी चाहिए:" }, options: { en: ["18 years old", "20 years old", "21 years old", "25 years old"], hi: ["18 साल", "20 साल", "21 साल", "25 साल"] }, correctAnswer: { en: "20 years old", hi: "20 साल" } },
    { question: { en: "The 'Good Samaritan' law protects:", hi: "'गुड सेमेरिटन' कानून बचाता है:" }, options: { en: ["Drivers who cause accidents", "People who help accident victims", "Police officers at an accident scene", "Insurance companies"], hi: ["दुर्घटना करने वाले ड्राइवरों को", "दुर्घटना पीड़ितों की मदद करने वाले लोगों को", "एक दुर्घटना स्थल पर पुलिस अधिकारियों को", "बीमा कंपनियों को"] }, correctAnswer: { en: "People who help accident victims", hi: "दुर्घटना पीड़ितों की मदद करने वाले लोगों को" } },
    { question: { en: "Which color number plate is used for electric vehicles?", hi: "इलेक्ट्रिक वाहनों के लिए किस रंग की नंबर प्लेट का उपयोग किया जाता है?" }, options: { en: ["Yellow", "Blue", "Green", "Red"], hi: ["पीला", "नीला", "हरा", "लाल"] }, correctAnswer: { en: "Green", hi: "हरा" } },
    { question: { en: "What is a 'Challan'?", hi: "एक 'चालान' क्या है?" }, options: { en: ["A driving license", "A vehicle registration document", "A traffic violation ticket", "A tax receipt"], hi: ["एक ड्राइविंग लाइसेंस", "एक वाहन पंजीकरण दस्तावेज़", "एक यातायात उल्लंघन टिकट", "एक कर रसीद"] }, correctAnswer: { en: "A traffic violation ticket", hi: "एक यातायात उल्लंघन टिकट" } },
    { question: { en: "When can a learner's license holder drive a vehicle?", hi: "एक लर्नर लाइसेंस धारक कब वाहन चला सकता है?" }, options: { en: ["Anytime", "Only during the day", "When accompanied by a permanent license holder", "Only on empty roads"], hi: ["किसी भी समय", "केवल दिन के दौरान", "जब एक स्थायी लाइसेंस धारक के साथ हो", "केवल खाली सड़कों पर"] }, correctAnswer: { en: "When accompanied by a permanent license holder", hi: "जब एक स्थायी लाइसेंस धारक के साथ हो" } },
    { question: { en: "The 'L' symbol on a plate on a vehicle indicates:", hi: "'L' प्रतीक एक वाहन पर एक प्लेट पर इंगित करता है:" }, options: { en: ["The driver is a 'Learner'", "The vehicle is from Lucknow", "It is a 'Luxury' vehicle", "The vehicle is on 'Loan'"], hi: ["ड्राइवर एक 'लर्नर' है", "वाहन लखनऊ से है", "यह एक 'लक्जरी' वाहन है", "वाहन 'लोन' पर है"] }, correctAnswer: { en: "The driver is a 'Learner'", hi: "ड्राइवर एक 'लर्नर' है" } },
    { question: { en: "What is the primary function of an airbag?", hi: "एक एयरबैग का प्राथमिक कार्य क्या है?" }, options: { en: ["To act as a soft cushion in a collision", "To alert the driver", "To automatically brake the car", "To replace seatbelts"], hi: ["एक टक्कर में एक नरम कुशन के रूप में कार्य करना", "ड्राइवर को सचेत करना", "कार को स्वचालित रूप से ब्रेक लगाना", "सीटबेल्ट को बदलना"] }, correctAnswer: { en: "To act as a soft cushion in a collision", hi: "एक टक्कर में एक नरम कुशन के रूप में कार्य करना" } },
    { question: { en: "What is the 'Golden Hour' in the context of road accidents?", hi: "'गोल्डन आवर' सड़क दुर्घटनाओं के संदर्भ में क्या है?" }, options: { en: ["The hour after sunset", "The first hour after a traumatic injury, when emergency treatment is most likely to be successful", "The hour when traffic is heaviest", "The hour of the accident"], hi: ["सूर्यास्त के बाद का घंटा", "एक दर्दनाक चोट के बाद का पहला घंटा, जब आपातकालीन उपचार सबसे अधिक सफल होने की संभावना है", "वह घंटा जब यातायात सबसे भारी होता है", "दुर्घटना का घंटा"] }, correctAnswer: { en: "The first hour after a traumatic injury, when emergency treatment is most likely to be successful", hi: "एक दर्दनाक चोट के बाद का पहला घंटा, जब आपातकालीन उपचार सबसे अधिक सफल होने की संभावना है" } },
    { question: { en: "What is a 'blind spot' in driving?", hi: "ड्राइविंग में 'ब्लाइंड स्पॉट' क्या है?" }, options: { en: ["A spot on the road with no light", "An area around the vehicle that cannot be seen in the mirrors", "A dark patch on the windshield", "A place where parking is prohibited"], hi: ["सड़क पर बिना रोशनी वाला स्थान", "आपके वाहन के चारों ओर का क्षेत्र जो शीशों में दिखाई नहीं देता", "विंडशील्ड पर एक गहरा धब्बा", "एक जगह जहाँ पार्किंग निषिद्ध है"] }, correctAnswer: { en: "An area around the vehicle that cannot be seen in the mirrors", hi: "आपके वाहन के चारों ओर का क्षेत्र जो शीशों में दिखाई नहीं देता" } },
    { question: { en: "What does the odometer in a vehicle measure?", hi: "एक वाहन में ओडोमीटर क्या मापता है?" }, options: { en: ["Speed", "Total distance traveled", "Fuel level", "Engine RPM"], hi: ["गति", "कुल तय की गई दूरी", "ईंधन स्तर", "इंजन आरपीएम"] }, correctAnswer: { en: "Total distance traveled", hi: "कुल तय की गई दूरी" } },
    { question: { en: "Which of these is NOT a legitimate document to show as ID?", hi: "इनमें से कौन सा आईडी के रूप में दिखाने के लिए एक वैध दस्तावेज नहीं है?" }, options: { en: ["Aadhaar Card", "PAN Card", "Credit Card", "Passport"], hi: ["आधार कार्ड", "पैन कार्ड", "क्रेडिट कार्ड", "पासपोर्ट"] }, correctAnswer: { en: "Credit Card", hi: "क्रेडिट कार्ड" } },
    { question: { en: "The fine for using a mobile phone while driving is:", hi: "गाड़ी चलाते समय मोबाइल फोन का उपयोग करने पर जुर्माना है:" }, options: { en: ["Up to ₹1,000", "Up to ₹5,000", "Up to ₹10,000", "A warning"], hi: ["₹1,000 तक", "₹5,000 तक", "₹10,000 तक", "एक चेतावनी"] }, correctAnswer: { en: "Up to ₹5,000", hi: "₹5,000 तक" } },
    { question: { en: "What does 'tailgating' mean in driving terms?", hi: "ड्राइविंग की भाषा में 'टेलगेटिंग' का क्या मतलब है?" }, options: { en: ["Driving very close behind another vehicle", "Having a party at the back of a truck", "Driving with a broken tail light", "Following a GPS route"], hi: ["दूसरे वाहन के बहुत करीब गाड़ी चलाना", "एक ट्रक के पीछे पार्टी करना", "टूटी हुई टेल लाइट के साथ गाड़ी चलाना", "जीपीएस मार्ग का अनुसरण करना"] }, correctAnswer: { en: "Driving very close behind another vehicle", hi: "दूसरे वाहन के बहुत करीब गाड़ी चलाना" } },
    { question: { en: "What should you do if your vehicle breaks down on a highway?", hi: "यदि आपका वाहन एक राजमार्ग पर खराब हो जाता है तो आपको क्या करना चाहिए?" }, options: { en: ["Leave it in the middle of the road", "Push it to the side, turn on hazard lights, and place a warning triangle", "Try to repair it in the lane", "Call a friend"], hi: ["इसे सड़क के बीच में छोड़ दें", "इसे किनारे पर धकेलें, हैजर्ड लाइट चालू करें, और एक चेतावनी त्रिकोण रखें", "इसे लेन में सुधारने का प्रयास करें", "एक दोस्त को फोन करें"] }, correctAnswer: { en: "Push it to the side, turn on hazard lights, and place a warning triangle", hi: "इसे किनारे पर धकेलें, हैजर्ड लाइट चालू करें, और एक चेतावनी त्रिकोण रखें" } },
    { question: { en: "A driver should maintain a minimum distance from the vehicle ahead of:", hi: "एक ड्राइवर को आगे के वाहन से न्यूनतम दूरी बनाए रखनी चाहिए:" }, options: { en: ["1 meter", "5 meters", "A distance that allows for safe stopping", "10 meters"], hi: ["1 मीटर", "5 मीटर", "एक दूरी जो सुरक्षित रुकने की अनुमति देती है", "10 मीटर"] }, correctAnswer: { en: "A distance that allows for safe stopping", hi: "एक दूरी जो सुरक्षित रुकने की अनुमति देती है" } },
    { question: { en: "What is the purpose of a catalytic converter?", hi: "एक उत्प्रेरक कनवर्टर का उद्देश्य क्या है?" }, options: { en: ["To increase engine power", "To reduce harmful emissions", "To improve mileage", "To cool the engine"], hi: ["इंजन की शक्ति बढ़ाने के लिए", "हानिकारक उत्सर्जन को कम करने के लिए", "माइलेज में सुधार करने के लिए", "इंजन को ठंडा करने के लिए"] }, correctAnswer: { en: "To reduce harmful emissions", hi: "हानिकारक उत्सर्जन को कम करने के लिए" } },
    { question: { en: "When two vehicles approach an uncontrolled intersection at the same time, who has the right-of-way?", hi: "जब दो वाहन एक ही समय में एक अनियंत्रित चौराहे पर पहुँचते हैं, तो किसका रास्ता पहले है?" }, options: { en: ["The vehicle on the left", "The vehicle on the right", "The larger vehicle", "The faster vehicle"], hi: ["बाईं ओर का वाहन", "दाईं ओर का वाहन", "बड़ा वाहन", "तेज वाहन"] }, correctAnswer: { en: "The vehicle on the right", hi: "दाईं ओर का वाहन" } },
    { question: { en: "Wearing a seatbelt is mandatory for:", hi: "सीटबेल्ट पहनना अनिवार्य है:" }, options: { en: ["Only the driver", "Only front seat passengers", "All occupants of the vehicle", "Only on long journeys"], hi: ["केवल ड्राइवर के लिए", "केवल आगे की सीट के यात्रियों के लिए", "वाहन के सभी निवासियों के लिए", "केवल लंबी यात्राओं पर"] }, correctAnswer: { en: "All occupants of the vehicle", hi: "वाहन के सभी निवासियों के लिए" } },
];

async function seedInitialQuizSets() {
    if (!db) return;
    try {
        const quizSetsCollection = collection(db, 'quizSets');
        const snapshot = await getDocs(query(quizSetsCollection, limit(1)));
        
        // Only seed if the collection is empty
        if (!snapshot.empty) {
            console.log("Quiz sets already exist in Firestore. Skipping seed.");
            return;
        }

        console.log("Seeding initial quiz sets to Firestore...");
        const batch = writeBatch(db);
        
        for (let i = 0; i < 10; i++) {
            const shuffledQuestions = [...allMockQuestions].sort(() => 0.5 - Math.random());
            const newSet: Omit<QuizSet, 'id'> = {
                title: `Practice Set ${i + 1}`,
                questions: shuffledQuestions.slice(0, 15).map((q, j) => ({
                    ...q,
                    id: `set${i + 1}-q${j + 1}`
                }))
            };
            const setRef = doc(quizSetsCollection);
            batch.set(setRef, newSet);
        }
        await batch.commit();
        console.log("Successfully seeded 10 quiz sets.");
    } catch (error) {
        console.error("Error seeding quiz sets:", error);
    }
}
// Call the seeding function when the server starts up if the DB is configured.
if (isFirebaseConfigured()) {
    seedInitialQuizSets();
}


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
    if (!isFirebaseConfigured() || !db) return callback([]);
    return onSnapshot(collection(db, 'quizSets'), (snapshot) => {
      if (snapshot.empty) {
        callback([]); // Let the seeding logic handle it
      } else {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizSet)));
      }
    }, (error) => {
        console.error("Error listening to quiz sets:", error);
        callback([]);
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
    if (!isFirebaseConfigured() || !db) return callback([]);
    const q = query(collection(db, 'blogPosts'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({...doc.data(), slug: doc.id } as BlogPost)));
    }, (error) => {
        console.error("Error listening to blog posts:", error);
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
    if (!isFirebaseConfigured() || !db) return null;
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
    if (!isFirebaseConfigured() || !db) return [];
    try {
        const snapshot = await getDocs(collection(db!, "quizSets"));
        if (snapshot.empty) {
            console.warn("No quiz sets found in Firestore, returning mock data.");
            return [];
        }
        const sets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as QuizSet);
        return sets;
    } catch (error: any) {
        console.error("Error fetching quiz sets:", error);
        return [];
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


    

    
