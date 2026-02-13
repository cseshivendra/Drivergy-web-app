import type { Metadata } from 'next';
import ContactClient from './contact-client';

export const metadata: Metadata = {
  title: 'Contact Support | Drivergy Driving School',
  description: "Have an issue or feedback? Contact the Drivergy support team. We're here to help you with your driving lesson queries and platform issues.",
  openGraph: {
    title: 'Contact Drivergy Support',
    description: 'We are here to help you. Reach out for any queries.',
    url: 'https://drivergy.in/contact',
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
