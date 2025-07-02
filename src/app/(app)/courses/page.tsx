
'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Users, Award, Clock, PlayCircle, BookOpen, Car, Bike, FileText } from 'lucide-react';

const courses = [
    {
        id: 'course1',
        title: 'Comprehensive Car Program',
        description: 'From basics to advanced maneuvers, this course prepares you for confident city and highway driving.',
        icon: Car,
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
        icon: Bike,
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
        icon: FileText,
        totalEnrolled: 210,
        totalCertified: 195,
        image: 'https://placehold.co/600x400/d92525/ffffff.png',
        modules: [
        { id: 'c3m1', title: 'Theory and Signals', description: 'Covering all traffic signs and rules.', duration: '3 hours', recordedLectureLink: '#' },
        { id: 'c3m2', title: 'Practical Test Simulation', description: 'Simulating the official test environment.', duration: '2 hours', recordedLectureLink: '#' },
        ],
    },
];

export default function CoursesPage() {
  return (
    <div className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center justify-center bg-primary/10 text-primary p-4 rounded-full mb-4">
            <BookOpen className="h-12 w-12" />
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Explore Our Driving Courses</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Whether you're a beginner or looking to ace your RTO exam, we have the perfect course for you.
        </p>
      </header>
      
      {courses.length === 0 ? (
        <p className="text-center text-muted-foreground text-xl">No courses available at the moment. Please check back later.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {courses.map((course) => (
            <Card key={course.id} className="shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out flex flex-col overflow-hidden rounded-xl border border-border/70 h-full">
              {course.image && (
                <div className="relative h-48 w-full">
                  <Image 
                    src={course.image} 
                    alt={course.title} 
                    layout="fill" 
                    objectFit="cover" 
                    data-ai-hint={course.title.toLowerCase().split(' ').slice(0,2).join(' ')} 
                  />
                   {course.icon && (
                    <div className="absolute top-4 right-4 bg-background/80 p-2 rounded-full shadow-md">
                       <course.icon className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="font-headline text-2xl font-semibold text-primary">{course.title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground pt-1 min-h-[3.5rem]">{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 flex-grow">
                <div className="grid grid-cols-2 gap-4 text-center border-t border-b border-border/50 py-3">
                  <div>
                    <Users className="h-6 w-6 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Enrolled</p>
                    <p className="text-xl font-bold text-foreground">{course.totalEnrolled}</p>
                  </div>
                  <div>
                    <Award className="h-6 w-6 text-accent mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Certified</p>
                    <p className="text-xl font-bold text-foreground">{course.totalCertified}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Course Modules:</h3>
                  {course.modules.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {course.modules.map((module) => (
                        <AccordionItem value={module.id} key={module.id} className="border-border/50">
                          <AccordionTrigger className="text-sm hover:no-underline py-3 px-1">
                            {module.title}
                          </AccordionTrigger>
                          <AccordionContent className="text-xs px-1 pb-3">
                            <p className="text-muted-foreground mb-2">{module.description}</p>
                            <div className="flex items-center justify-between text-muted-foreground">
                                <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1.5" />
                                    <span>{module.duration}</span>
                                </div>
                                {module.recordedLectureLink && (
                                <Button variant="link" size="sm" className="p-0 h-auto text-primary hover:underline text-xs" asChild>
                                    <a href={module.recordedLectureLink} target="_blank" rel="noopener noreferrer">
                                    <PlayCircle className="h-3 w-3 mr-1" /> View Lecture
                                    </a>
                                </Button>
                                )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                     <p className="text-sm text-muted-foreground text-center py-4">No modules listed for this course.</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="mt-auto bg-muted/30 p-4 border-t border-border/50">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  View Course Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
