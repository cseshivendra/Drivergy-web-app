'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCheck, CheckCircle, XCircle, Lightbulb, Clock, RefreshCw, User, LogIn, UserPlus, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Loading from '@/app/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


// Define the structure for a single question
interface Question {
  id: string;
  question: { [language: string]: string };
  options: { [language: string]: string[] };
  correctAnswer: { [language: string]: string };
}

// Define the structure for a quiz set
interface QuizSet {
  id: string;
  title: string;
  questions: Question[];
}

const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी (Hindi)' },
];

// A base set of 15 questions with translations for English, Hindi, and Marathi
const baseQuestions: Omit<Question, 'id'>[] = [
  {
    question: {
      en: 'A red traffic light indicates that you must:',
      hi: 'एक लाल ट्रैफिक लाइट इंगित करती है कि आपको:',
      mr: 'लाल वाहतूक दिवा सूचित करतो की तुम्ही:',
    },
    options: {
      en: ['Stop behind the line', 'Slow down', 'Proceed with caution', 'Go if the way is clear'],
      hi: ['रेखा के पीछे रुकें', 'धीमे हो जाएं', 'सावधानी से आगे बढ़ें', 'रास्ता साफ हो तो जाएं'],
      mr: ['रेषेच्या मागे थांबा', 'हळू व्हा', 'सावधगिरीने पुढे जा', 'रस्ता मोकळा असल्यास जा'],
    },
    correctAnswer: {
      en: 'Stop behind the line',
      hi: 'रेखा के पीछे रुकें',
      mr: 'रेषेच्या मागे थांबा',
    },
  },
  {
    question: {
      en: 'A triangular sign with a red border is a:',
      hi: 'लाल बॉर्डर वाला एक त्रिकोणीय संकेत है:',
      mr: 'लाल बॉर्डर असलेले त्रिकोणी चिन्ह आहे:',
    },
    options: {
      en: ['Mandatory sign', 'Warning sign', 'Informatory sign', 'Regulatory sign'],
      hi: ['अनिवार्य संकेत', 'चेतावनी संकेत', 'सूचनात्मक संकेत', 'नियामक संकेत'],
      mr: ['अनिवार्य चिन्ह', 'चेतावणी चिन्ह', 'माहिती चिन्ह', 'नियामक चिन्ह'],
    },
    correctAnswer: {
      en: 'Warning sign',
      hi: 'चेतावनी संकेत',
      mr: 'चेतावणी चिन्ह',
    },
  },
  {
    question: {
      en: 'When is overtaking prohibited?',
      hi: 'ओवरटेक करना कब प्रतिबंधित है?',
      mr: 'ओव्हरटेक करण्यास मनाई केव्हा आहे?',
    },
    options: {
      en: ['On a wide road', 'When the road ahead is not clearly visible', 'During the daytime', 'On a one-way street'],
      hi: ['चौड़ी सड़क पर', 'जब आगे का रास्ता साफ दिखाई न दे', 'दिन के समय', 'एक तरफा सड़क पर'],
      mr: ['रुंद रस्त्यावर', 'जेव्हा पुढचा रस्ता स्पष्ट दिसत नाही', 'दिवसा', 'एकेरी वाहतुकीच्या रस्त्यावर'],
    },
    correctAnswer: {
      en: 'When the road ahead is not clearly visible',
      hi: 'जब आगे का रास्ता साफ दिखाई न दे',
      mr: 'जेव्हा पुढचा रस्ता स्पष्ट दिसत नाही',
    },
  },
  {
    question: {
      en: 'A blue circular sign with a white bicycle symbol indicates:',
      hi: 'एक सफेद साइकिल प्रतीक वाला नीला गोलाकार संकेत इंगित करता है:',
      mr: 'पांढऱ्या सायकल चिन्हासह निळे गोलाकार चिन्ह सूचित करते:',
    },
    options: {
      en: ['Bicycles are not allowed', 'Parking for bicycles', 'Compulsory pedal cycle track', 'Bicycle repair shop ahead'],
      hi: ['साइकिल की अनुमति नहीं है', 'साइकिल के लिए पार्किंग', 'अनिवार्य पेडल साइकिल ट्रैक', 'आगे साइकिल मरम्मत की दुकान'],
      mr: ['सायकलला परवानगी नाही', 'सायकलसाठी पार्किंग', 'अनिवार्य पेडल सायकल ट्रॅक', 'पुढे सायकल दुरुस्तीचे दुकान'],
    },
    correctAnswer: {
      en: 'Compulsory pedal cycle track',
      hi: 'अनिवार्य पेडल साइकिल ट्रैक',
      mr: 'अनिवार्य पेडल सायकल ट्रॅक',
    },
  },
  {
    question: {
      en: 'What is the minimum age for obtaining a license for a motorcycle with gears?',
      hi: 'गियर वाली मोटरसाइकिल के लिए लाइसेंस प्राप्त करने की न्यूनतम आयु क्या है?',
      mr: 'गिअर असलेल्या मोटरसायकलसाठी परवाना मिळविण्याचे किमान वय काय आहे?',
    },
    options: {
      en: ['16 years', '18 years', '20 years', '21 years'],
      hi: ['16 साल', '18 साल', '20 साल', '21 साल'],
      mr: ['१६ वर्षे', '१८ वर्षे', '२० वर्षे', '२१ वर्षे'],
    },
    correctAnswer: {
      en: '18 years',
      hi: '18 साल',
      mr: '१८ वर्षे',
    },
  },
  {
    question: {
      en: 'What does a flashing yellow traffic light mean?',
      hi: 'एक चमकती पीली ट्रैफिक लाइट का क्या मतलब है?',
      mr: 'चमकणाऱ्या पिवळ्या वाहतूक दिव्याचा अर्थ काय?',
    },
    options: {
      en: ['Stop completely', 'Speed up', 'Slow down and proceed with caution', 'The light is about to turn red'],
      hi: ['पूरी तरह से रुकें', 'गति बढ़ाएं', 'धीमे चलें और सावधानी से आगे बढ़ें', 'लाइट लाल होने वाली है'],
      mr: ['पूर्णपणे थांबा', 'वेग वाढवा', 'हळू जा आणि सावधगिरीने पुढे जा', 'दिवा लाल होणार आहे'],
    },
    correctAnswer: {
      en: 'Slow down and proceed with caution',
      hi: 'धीमे चलें और सावधानी से आगे बढ़ें',
      mr: 'हळू जा आणि सावधगिरीने पुढे जा',
    },
  },
  {
    question: {
      en: 'If you are approached by an ambulance with its siren on, you should:',
      hi: 'यदि आपके पास सायरन बजाती हुई एम्बुलेंस आती है, तो आपको:',
      mr: 'जर तुमच्याकडे सायरन वाजवत रुग्णवाहिका येत असेल, तर तुम्ही:',
    },
    options: {
      en: ['Increase your speed', 'Allow passage by moving to the left', 'Continue at the same speed', 'Stop in the middle of the road'],
      hi: ['अपनी गति बढ़ाएं', 'बाईं ओर हटकर रास्ता दें', 'उसी गति से चलते रहें', 'सड़क के बीच में रुक जाएं'],
      mr: ['तुमचा वेग वाढवा', 'डावीकडे सरकून रस्ता द्या', 'त्याच वेगाने पुढे जा', 'रस्त्याच्या मधोमध थांबा'],
    },
    correctAnswer: {
      en: 'Allow passage by moving to the left',
      hi: 'बाईं ओर हटकर रास्ता दें',
      mr: 'डावीकडे सरकून रस्ता द्या',
    },
  },
  {
    question: {
      en: 'What does the sign showing a horn with a red slash across it mean?',
      hi: 'जिस संकेत में हॉर्न पर लाल स्लैश होता है, उसका क्या मतलब है?',
      mr: 'हॉर्नवर लाल रेघ असलेल्या चिन्हाचा अर्थ काय?',
    },
    options: {
      en: ['Honking is compulsory', 'You may honk softly', 'Horn prohibited', 'Hospital nearby'],
      hi: ['हॉर्न बजाना अनिवार्य है', 'आप धीरे से हॉर्न बजा सकते हैं', 'हॉर्न प्रतिबंधित है', 'पास में अस्पताल है'],
      mr: ['हॉर्न वाजवणे अनिवार्य आहे', 'तुम्ही हळू हॉर्न वाजवू शकता', 'हॉर्न वाजवण्यास मनाई आहे', 'जवळ रुग्णालय आहे'],
    },
    correctAnswer: {
      en: 'Horn prohibited',
      hi: 'हॉर्न प्रतिबंधित है',
      mr: 'हॉर्न वाजवण्यास मनाई आहे',
    },
  },
  {
    question: {
      en: 'While driving, using a mobile phone is:',
      hi: 'ड्राइविंग करते समय, मोबाइल फोन का उपयोग करना:',
      mr: 'ड्रायव्हिंग करताना मोबाईल फोन वापरणे:',
    },
    options: {
      en: ['Allowed if using a hands-free device', 'Allowed for short calls', 'Prohibited', 'Allowed only when stopped'],
      hi: ['हैंड्स-फ्री डिवाइस का उपयोग करने पर अनुमति है', 'छोटी कॉल के लिए अनुमति है', 'प्रतिबंधित है', 'केवल रुकने पर अनुमति है'],
      mr: ['हँड्स-फ्री डिव्हाइस वापरत असल्यास परवानगी आहे', 'थोड्या कॉलसाठी परवानगी आहे', 'प्रतिबंधित आहे', 'फक्त थांबल्यावर परवानगी आहे'],
    },
    correctAnswer: {
      en: 'Prohibited',
      hi: 'प्रतिबंधित है',
      mr: 'प्रतिबंधित आहे',
    },
  },
  {
    question: {
      en: "The validity of a Learner's License is:",
      hi: "एक लर्नर लाइसेंस की वैधता है:",
      mr: "शिकाऊ परवान्याची वैधता आहे:",
    },
    options: {
      en: ['3 months', '6 months', '1 year', 'Until you get a permanent license'],
      hi: ['3 महीने', '6 महीने', '1 साल', 'जब तक आपको स्थायी लाइसेंस नहीं मिल जाता'],
      mr: ['३ महिने', '६ महिने', '१ वर्ष', 'तुम्हाला कायमचा परवाना मिळेपर्यंत'],
    },
    correctAnswer: {
      en: '6 months',
      hi: '6 महीने',
      mr: '६ महिने',
    },
  },
  {
    question: {
      en: 'When parking a vehicle facing downhill, the front wheels should be turned:',
      hi: 'ढलान पर वाहन पार्क करते समय, आगे के पहियों को मोड़ना चाहिए:',
      mr: 'उतारावर वाहन पार्क करताना, पुढची चाके वळवावीत:',
    },
    options: {
      en: ['Towards the right', 'Straight ahead', 'Towards the kerb or side of the road', 'It does not matter'],
      hi: ['दाईं ओर', 'सीधे आगे', 'फुटपाथ या सड़क के किनारे की ओर', 'इससे कोई फर्क नहीं पड़ता'],
      mr: ['उजवीकडे', 'सरळ पुढे', 'फुटपाथ किंवा रस्त्याच्या कडेला', 'त्याने काही फरक पडत नाही'],
    },
    correctAnswer: {
      en: 'Towards the kerb or side of the road',
      hi: 'फुटपाथ या सड़क के किनारे की ओर',
      mr: 'फुटपाथ किंवा रस्त्याच्या कडेला',
    },
  },
  {
    question: {
      en: 'Which of these documents must be carried while driving a vehicle?',
      hi: 'वाहन चलाते समय इनमें से कौन से दस्तावेज ले जाने चाहिए?',
      mr: 'वाहन चालवताना यापैकी कोणती कागदपत्रे सोबत बाळगावीत?',
    },
    options: {
      en: ['Driving license, registration, insurance, PUC', 'Aadhaar card and PAN card', 'Vehicle purchase invoice', 'Your birth certificate'],
      hi: ['ड्राइविंग लाइसेंस, पंजीकरण, बीमा, पीयूसी', 'आधार कार्ड और पैन कार्ड', 'वाहन खरीद चालान', 'आपका जन्म प्रमाण पत्र'],
      mr: ['ड्रायव्हिंग लायसन्स, नोंदणी, विमा, पीयूसी', 'आधार कार्ड आणि पॅन कार्ड', 'वाहन खरेदी बीजक', 'तुमचा जन्म दाखला'],
    },
    correctAnswer: {
      en: 'Driving license, registration, insurance, PUC',
      hi: 'ड्राइविंग लाइसेंस, पंजीकरण, बीमा, पीयूसी',
      mr: 'ड्रायव्हिंग लायसन्स, नोंदणी, विमा, पीयूसी',
    },
  },
  {
    question: {
      en: "What does the term 'tailgating' mean in driving?",
      hi: "ड्राइविंग में 'टेलगेटिंग' शब्द का क्या अर्थ है?",
      mr: "ड्रायव्हिंगमध्ये 'टेलगेटिंग' या शब्दाचा अर्थ काय आहे?",
    },
    options: {
      en: ['Following another vehicle too closely', 'Checking your tail lights', 'Driving with the trunk open', 'Overtaking from the left'],
      hi: ['दूसरे वाहन का बहुत करीब से पीछा करना', 'अपनी टेल लाइट की जाँच करना', 'ट्रंक खुला रखकर गाड़ी चलाना', 'बाईं ओर से ओवरटेक करना'],
      mr: ['दुसऱ्या वाहनाच्या अगदी जवळून जाणे', 'तुमचे टेल लाइट तपासणे', 'ट्रंक उघडे ठेवून गाडी चालवणे', 'डावीकडून ओव्हरटेक करणे'],
    },
    correctAnswer: {
      en: 'Following another vehicle too closely',
      hi: 'दूसरे वाहन का बहुत करीब से पीछा करना',
      mr: 'दुसऱ्या वाहनाच्या अगदी जवळून जाणे',
    },
  },
  {
    question: {
      en: 'The hand signal for turning right is:',
      hi: 'दाईं ओर मुड़ने का हाथ का संकेत है:',
      mr: 'उजवीकडे वळण्याचा हाताचा संकेत आहे:',
    },
    options: {
      en: ['Extend the right arm straight out, palm facing forward', 'Rotate the arm in a clockwise circle', 'Extend the right arm and move it up and down', 'Point the arm downwards'],
      hi: ['दाहिना हाथ सीधा बाहर फैलाएं, हथेली आगे की ओर', 'हाथ को दक्षिणावर्त वृत्त में घुमाएं', 'दाहिना हाथ फैलाकर ऊपर-नीचे करें', 'हाथ को नीचे की ओर इंगित करें'],
      mr: ['उजवा हात सरळ बाहेर काढा, तळहात पुढे', 'हात घड्याळाच्या दिशेने वर्तुळात फिरवा', 'उजवा हात पसरवा आणि वर-खाली करा', 'हात खाली दाखवा'],
    },
    correctAnswer: {
      en: 'Extend the right arm straight out, palm facing forward',
      hi: 'दाहिना हाथ सीधा बाहर फैलाएं, हथेली आगे की ओर',
      mr: 'उजवा हात सरळ बाहेर काढा, तळहात पुढे',
    },
  },
  {
    question: {
      en: 'What is the purpose of a pedestrian crossing (Zebra crossing)?',
      hi: 'पैदल यात्री क्रॉसिंग (ज़ेबरा क्रॉसिंग) का उद्देश्य क्या है?',
      mr: 'पादचारी क्रॉसिंग (झेब्रा क्रॉसिंग) चा उद्देश काय आहे?',
    },
    options: {
      en: ['For vehicles to stop', 'For pedestrians to safely cross the road', 'To mark the end of a speed limit', 'For parking'],
      hi: ['वाहनों को रोकने के लिए', 'पैदल चलने वालों को सुरक्षित रूप से सड़क पार करने के लिए', 'गति सीमा के अंत को चिह्नित करने के लिए', 'पार्किंग के लिए'],
      mr: ['वाहनांना थांबण्यासाठी', 'पादचाऱ्यांना सुरक्षितपणे रस्ता ओलांडण्यासाठी', 'वेग मर्यादेचा शेवट चिन्हांकित करण्यासाठी', 'पार्किंगसाठी'],
    },
    correctAnswer: {
      en: 'For pedestrians to safely cross the road',
      hi: 'पैदल चलने वालों को सुरक्षित रूप से सड़क पार करने के लिए',
      mr: 'पादचाऱ्यांना सुरक्षितपणे रस्ता ओलांडण्यासाठी',
    },
  },
];


// Create mock quiz data with 10 sets, each having 15 questions
const quizSets: QuizSet[] = Array.from({ length: 10 }, (_, i) => ({
  id: `set${i + 1}`,
  title: `Set ${i + 1}`,
  questions: baseQuestions.map((q, j) => ({
    id: `q${i + 1}-${j + 1}`,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
  })),
}));

// A component to render a single quiz set
const QuizSetComponent = ({ quizSet, onStart, selectedLanguage }: { quizSet: QuizSet; onStart: () => void; selectedLanguage: string }) => {
  const { toast } = useToast();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds

  const correctAnswersText = {
    en: "correct",
    hi: "सही",
    mr: "बरोबर",
  }

  const congratulationsText = {
    en: "Congratulations! You Passed",
    hi: "बधाई हो! आप पास हो गए",
    mr: "अभिनंदन! तुम्ही उत्तीर्ण झालात"
  }

  const failedText = {
    en: "You Failed",
    hi: "आप फेल हो गए",
    mr: "तुम्ही नापास झालात"
  }

  const correctAnsIsText = {
      en: "Incorrect. The correct answer is:",
      hi: "गलत। सही उत्तर है:",
      mr: "चूक. बरोबर उत्तर आहे:"
  }

  useEffect(() => {
    if (!isStarted || score !== null) {
      return;
    }

    if (timeLeft <= 0) {
      handleSubmit(new Event('submit'), true);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [isStarted, timeLeft, score]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = (e: React.FormEvent | Event, autoSubmitted = false) => {
    if (e) e.preventDefault();
    if (score !== null) return;

    let correctCount = 0;
    quizSet.questions.forEach((q) => {
      if (selectedAnswers[q.id] === (q.correctAnswer[selectedLanguage] || q.correctAnswer['en'])) {
        correctCount++;
      }
    });
    const finalScore = (correctCount / quizSet.questions.length) * 100;
    setScore(finalScore);

    if (autoSubmitted) {
      toast({
        title: "Time's Up!",
        description: `Quiz automatically submitted. You scored ${finalScore.toFixed(0)}%.`,
        variant: finalScore >= 60 ? 'default' : 'destructive',
      });
    } else if (finalScore >= 60) {
      toast({
        title: `${congratulationsText[selectedLanguage] || congratulationsText['en']} ${quizSet.title}!`,
        description: `You scored ${finalScore.toFixed(0)}%. ${correctCount} out of ${quizSet.questions.length} ${correctAnswersText[selectedLanguage] || correctAnswersText['en']}.`,
      });
    } else {
      toast({
        title: `${failedText[selectedLanguage] || failedText['en']} ${quizSet.title}`,
        description: `You scored ${finalScore.toFixed(0)}%. Keep practicing!`,
        variant: 'destructive',
      });
    }
  };
  
  const handleStart = () => {
    onStart(); // This will trigger the auth check
    setIsStarted(true);
    setTimeLeft(30 * 60);
    setSelectedAnswers({});
    setScore(null);
  };

  if (!isStarted) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg shadow-sm bg-muted/50">
        <h3 className="text-xl font-semibold mb-2 text-foreground">Ready for the {quizSet.title} challenge?</h3>
        <p className="text-muted-foreground mb-4">You will have 30 minutes to complete 15 questions.</p>
        <Button size="lg" onClick={handleStart}>
          Start Test
        </Button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex justify-between items-center p-3 border rounded-lg bg-card shadow-sm">
        <h3 className="text-lg font-semibold text-primary">{quizSet.title} in Progress</h3>
        <div className={`flex items-center font-bold text-lg ${timeLeft < 60 ? 'text-destructive' : 'text-foreground'}`}>
          <Clock className="mr-2 h-5 w-5" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {quizSet.questions.map((q, index) => (
        <div key={q.id} className="rounded-lg border p-4 space-y-3 shadow-sm bg-card">
          <p className="font-semibold text-foreground">
            {index + 1}. {q.question[selectedLanguage] || q.question['en']}
          </p>
          <RadioGroup
            value={selectedAnswers[q.id]}
            onValueChange={(value) => handleAnswerChange(q.id, value)}
            className="space-y-2"
            disabled={score !== null}
          >
            {(q.options[selectedLanguage] || q.options['en']).map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                <Label htmlFor={`${q.id}-${option}`} className="cursor-pointer font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {score !== null && (
            <div
              className={`mt-2 flex items-center text-sm p-2 rounded-md ${
                selectedAnswers[q.id] === (q.correctAnswer[selectedLanguage] || q.correctAnswer['en'])
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}
            >
              {selectedAnswers[q.id] === (q.correctAnswer[selectedLanguage] || q.correctAnswer['en']) ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              <span>
                {selectedAnswers[q.id] === (q.correctAnswer[selectedLanguage] || q.correctAnswer['en'])
                  ? 'Correct!'
                  : `${correctAnsIsText[selectedLanguage] || correctAnsIsText['en']} ${q.correctAnswer[selectedLanguage] || q.correctAnswer['en']}`}
              </span>
            </div>
          )}
        </div>
      ))}
      <div className="flex justify-end items-center pt-4 border-t mt-8">
        {score !== null ? (
          <div className="flex flex-col sm:flex-row gap-4 items-center w-full justify-between">
            <p className={`text-xl font-bold ${score >= 60 ? 'text-green-600' : 'text-destructive'}`}>
              Your Score: {score.toFixed(0)}%
            </p>
            <Button type="button" variant="outline" onClick={handleStart}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake Quiz
            </Button>
          </div>
        ) : (
          <Button type="submit">Submit Answers</Button>
        )}
      </div>
    </form>
  )
};

export default function AppRtoQuizPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  if (loading) {
    return <Loading />;
  }

  const handleStartAttempt = () => {
    if (!user) {
      router.push('/login');
    }
  };

  const QuizCardContent = () => (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10 p-3 w-fit">
          <ClipboardCheck className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="font-headline text-3xl font-bold">RTO Test Quiz</CardTitle>
        <CardDescription>
          Prepare for your RTO screening test. Select a set and start the quiz.
        </CardDescription>
        <div className="mx-auto mt-4 w-full max-w-xs">
          <Label htmlFor="language-select" className="mb-2 flex items-center justify-center text-sm font-medium text-muted-foreground">
            <Globe className="mr-2 h-4 w-4" />
            Select Language
          </Label>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger id="language-select">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {user ? (
          <Tabs defaultValue="set1" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
              {quizSets.map((set) => (
                <TabsTrigger key={set.id} value={set.id}>
                  {set.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {quizSets.map((set) => (
              <TabsContent key={set.id} value={set.id} className="pt-6">
                <QuizSetComponent quizSet={set} onStart={handleStartAttempt} selectedLanguage={selectedLanguage} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg shadow-sm bg-muted/50">
            <h3 className="text-xl font-semibold mb-2 text-foreground">Please log in to start the quiz.</h3>
            <p className="text-muted-foreground mb-4">You need an account to track your progress.</p>
            <Button size="lg" onClick={() => router.push('/login')}>
              <LogIn className="mr-2 h-4 w-4" /> Go to Login
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center text-muted-foreground text-sm">
        <Lightbulb className="h-4 w-4 mr-2" />
        <p>Practice all sets to improve your chances of passing the RTO exam.</p>
      </CardFooter>
    </>
  );

  return (
    <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-xl">
        <QuizCardContent />
      </Card>
    </div>
  );
}
