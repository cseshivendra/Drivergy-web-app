import type { Metadata } from 'next';
import CareerClient from './career-client';

export const metadata: Metadata = {
  title: 'Careers at Drivergy | Driving Instructor Jobs in India',
  description: "Join the Drivergy team! We're hiring driving instructors, customer support executives, and marketing managers. Drive your career forward with India's leading driving school platform.",
  openGraph: {
    title: 'Careers at Drivergy',
    description: 'Work with the top driving school platform in India.',
    url: 'https://drivergy.in/career',
  },
};

export default function CareerPage() {
  return <CareerClient />;
}
