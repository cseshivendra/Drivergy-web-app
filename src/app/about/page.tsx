
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Info, Users, Target, Car } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-48 w-full sm:h-64">
          <Image 
            src="https://placehold.co/1200x400.png" 
            alt="Driving school banner" 
            layout="fill" 
            objectFit="cover"
            data-ai-hint="driving school road"
          />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center">
              <Car className="h-16 w-16 text-primary mx-auto mb-2" />
              <h1 className="font-headline text-4xl font-bold text-white">About DriveView</h1>
              <p className="text-lg text-primary-foreground/90 mt-1">Your Partner in Safe Driving Education</p>
            </div>
          </div>
        </div>
        <CardContent className="p-6 space-y-8">
          <section>
            <h2 className="font-headline text-2xl font-semibold text-primary mb-3 flex items-center">
              <Info className="mr-2 h-6 w-6" />
              Our Mission
            </h2>
            <p className="text-lg text-foreground leading-relaxed">
              At DriveView, our mission is to revolutionize driving education by providing a seamless,
              efficient, and transparent platform for both students and instructors. We aim to empower
              learners with the skills and confidence needed for safe driving, while supporting instructors
              with robust tools to manage their services.
            </p>
          </section>

          <section>
            <h2 className="font-headline text-2xl font-semibold text-primary mb-3 flex items-center">
              <Users className="mr-2 h-6 w-6" />
              Who We Are
            </h2>
            <p className="text-foreground leading-relaxed">
              DriveView is a dedicated team of technology enthusiasts and road safety advocates.
              We believe that learning to drive should be an accessible and positive experience.
              Our platform is built with cutting-edge technology to connect aspiring drivers
              with qualified instructors, simplifying the journey from beginner to licensed driver.
            </p>
          </section>
          
          <section>
            <h2 className="font-headline text-2xl font-semibold text-primary mb-3 flex items-center">
              <Target className="mr-2 h-6 w-6" />
              What We Offer
            </h2>
            <ul className="list-disc list-inside space-y-2 text-foreground leading-relaxed">
              <li>Easy scheduling and booking of driving lessons.</li>
              <li>Verified and professional driving instructors.</li>
              <li>Comprehensive tracking of progress for students.</li>
              <li>A user-friendly dashboard for instructors to manage their bookings and students.</li>
              <li>Secure payment processing and subscription management.</li>
              <li>Dedicated support for all users of the platform.</li>
            </ul>
          </section>

           <section className="text-center pt-4">
            <p className="text-muted-foreground">
              Thank you for choosing DriveView. Let's hit the road to safer driving, together!
            </p>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}
