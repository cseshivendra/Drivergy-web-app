'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Car, ExternalLink, FileText, IndianRupee, Receipt, Search, Type, Ticket, CreditCard } from 'lucide-react';
import type { Metadata } from 'next';

export default function RtoServicesPage() {
    // This metadata is now client-side, but good for context
    // For full SEO, this should be a server component with exported metadata
    
    return (
        <div className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8">
            <head>
                <title>Online RTO Services - Drivergy</title>
                <meta name="description" content="Access official Indian RTO services like applying for a driving license, checking challan status, paying fines, and more, directly via Drivergy." />
            </head>
            <Card className="shadow-lg overflow-hidden mb-12 bg-muted/30">
                <div className="flex flex-col items-center justify-center text-center p-6">
                    <div className="p-3 bg-background rounded-full mb-3 shadow-md">
                        <Car className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Online RTO Services</h1>
                    <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Access official RTO services directly from the Parivahan Sewa portal.
                    </p>
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
                                <CardTitle as="h2" className="font-headline text-xl text-primary">{service.title}</CardTitle>
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
    );
}

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
    },
    {
        title: "Recharge Your FASTag",
        description: "Easily recharge your FASTag for any vehicle through the official IHMCL portal or your issuing bank.",
        icon: CreditCard,
        link: "https://fastag.ihmcl.com/",
        imageHint: "fastag recharge car"
    }
];
