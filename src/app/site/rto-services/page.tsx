'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Car, Facebook, Twitter, Instagram, Linkedin, Youtube, ExternalLink, FileText, IndianRupee, Receipt, Search, Type, Ticket } from 'lucide-react';
import SiteHeader from '@/components/layout/site-header';
import ChatWidget from '@/components/chatbot/chat-widget';

const SiteLogo = () => (
    <Link href="/site" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-ring rounded-md">
      <div className="p-1.5 bg-primary/10 rounded-lg transition-all duration-300">
        <Car className="h-7 w-7 text-primary shrink-0" />
      </div>
      <span className="font-headline text-2xl font-extrabold text-primary tracking-tighter">
        Drivergy
      </span>
    </Link>
);

const rtoServices = [
    {
        title: "Apply for Driving License",
        description: "Start your application for a new Learner's or Permanent Driving License through the official Sarathi Parivahan portal.",
        icon: FileText,
        link: "https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do",
        imageHint: "driving license document"
    },
    {
        title: "Check RTO Fees & Charges",
        description: "Get information on various RTO-related fees, including license application, vehicle registration, and other services.",
        icon: IndianRupee,
        link: "https://parivahan.gov.in/parivahan//en/content/fees-and-user-charges",
        imageHint: "money fees calculation"
    },
    {
        title: "Check Your Challan Status",
        description: "Check the status of any traffic challans issued against your vehicle or driving license using the e-Challan system.",
        icon: Ticket,
        link: "https://echallan.parivahan.gov.in/index/accused-challan",
        imageHint: "traffic ticket search"
    },
    {
        title: "Pay Your Challan Online",
        description: "Conveniently pay your pending traffic challans online through the official government portal.",
        icon: Receipt,
        link: "https://echallan.parivahan.gov.in/index/accused-challan",
        imageHint: "online payment receipt"
    },
    {
        title: "Order High Security Number Plate (HSRP)",
        description: "Book an appointment to get a High Security Registration Plate (HSRP) and color-coded sticker for your vehicle.",
        icon: Type,
        link: "https://www.bookmyhsrp.com/",
        imageHint: "number plate car"
    },
    {
        title: "Check Vehicle Details",
        description: "Find details of any vehicle by entering its registration number on the Vahan portal.",
        icon: Search,
        link: "https://vahan.parivahan.gov.in/nrservices/faces/user/searchstatus.xhtml",
        imageHint: "vehicle search details"
    }
];

export default function RtoServicesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <SiteHeader />

        <main className="flex-grow">
            <div className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8">
                <Card className="shadow-lg overflow-hidden mb-12">
                    <div className="relative h-56 w-full bg-primary/10">
                        <Image 
                            src="https://placehold.co/1200x300.png" 
                            alt="Banner for RTO services" 
                            layout="fill" 
                            objectFit="cover"
                            data-ai-hint="government building india"
                        />
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
                             <div className="p-3 bg-background/80 rounded-full mb-3 backdrop-blur-sm">
                                <Car className="h-10 w-10 text-primary" />
                            </div>
                            <h1 className="font-headline text-4xl md:text-5xl font-bold text-white drop-shadow-md">RTO Services</h1>
                            <p className="mt-2 text-lg text-white/90 max-w-2xl mx-auto drop-shadow-sm">
                                Access official RTO services directly from the Parivahan Sewa portal.
                            </p>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {rtoServices.map((service) => (
                        <Card key={service.title} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <service.icon className="h-7 w-7 text-primary" />
                                    </div>
                                    <CardTitle className="font-headline text-xl text-primary">{service.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground">{service.description}</p>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <a href={service.link} target="_blank" rel="noopener noreferrer">
                                        Go to Service
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                 <div className="mt-12 text-center p-4 border-dashed border-2 border-muted-foreground/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        Please note: You are being redirected to official Government of India websites. Drivergy is not responsible for the content or services provided on external sites.
                    </p>
                </div>
            </div>
        </main>
        
        <footer className="border-t border-border/40 bg-background py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground space-y-4">
                <div className="flex justify-center mb-4">
                    <SiteLogo />
                </div>
                 <div className="flex justify-center items-center gap-6">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Facebook className="h-5 w-5" />
                        <span className="sr-only">Facebook</span>
                    </a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Twitter className="h-5 w-5" />
                        <span className="sr-only">Twitter</span>
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Instagram className="h-5 w-5" />
                        <span className="sr-only">Instagram</span>
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Linkedin className="h-5 w-5" />
                        <span className="sr-only">LinkedIn</span>
                    </a>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Youtube className="h-5 w-5" />
                        <span className="sr-only">Youtube</span>
                    </a>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 pt-4">
                    <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
                      <span className="font-bold" style={{ letterSpacing: '-0.5px' }}>
                          <span className="text-saffron">#startup</span><span className="text-india-blue">i</span><span className="text-foreground">ndia</span>
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                            <rect x="3" y="5" width="18" height="4" fill="#FF9933"/>
                            <rect x="3" y="9" width="18" height="4" fill="white"/>
                            <rect x="3" y="13" width="18" height="4" fill="#138808"/>
                            <circle cx="12" cy="11" r="1.5" stroke="#000080" strokeWidth="0.5" fill="none"/>
                        </svg>
                        <span className="font-semibold text-foreground">Made in India</span>
                    </div>
                </div>
                <p className="text-sm pt-2">
                    &copy; {new Date().getFullYear()} Drivergy. All rights reserved.
                </p>
            </div>
        </footer>
        <ChatWidget />
    </div>
  );
}
