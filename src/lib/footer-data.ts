/**
 * Static data for the footer to ensure Pure Render architecture
 * and zero hydration mismatches.
 */
import { ShieldCheck, CreditCard, Store, Shield, Award, ShoppingBag } from 'lucide-react';

export const SOCIAL_LINKS = [
  { id: 'fb', name: 'Facebook', href: 'https://www.facebook.com/drivergyofficial' },
  { id: 'tw', name: 'Twitter', href: 'https://x.com/DIndia720' },
  { id: 'ig', name: 'Instagram', href: 'https://www.instagram.com/drivergyofficial' },
  { id: 'ln', name: 'LinkedIn', href: 'https://www.linkedin.com/company/drivergy' },
  { id: 'yt', name: 'Youtube', href: 'https://youtube.com' },
];

export const FOOTER_NAV_LINKS = [
  { id: 'blog', name: 'Blog', href: '/blog' },
  { id: 'faq', name: 'FAQ', href: '/faq' },
  { id: 'privacy', name: 'Privacy Policy', href: '/privacy-policy' },
  { id: 'terms', name: 'Terms & Conditions', href: '/terms-and-conditions' },
  { id: 'refund', name: 'Refund Policy', href: '/refund-policy' },
];

export const TRUST_BADGES = [
  {
    id: 'secure-payments',
    label: 'Secure Payments',
    sublabel: '100% encrypted & safe',
    icon: ShieldCheck,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
  {
    id: 'payment-partner',
    label: 'Payment Partner',
    sublabel: 'Powered by PhonePe',
    icon: CreditCard,
    color: '#6739B7',
    bgColor: 'rgba(103, 57, 183, 0.1)',
  },
  {
    id: 'amazon-partner',
    label: 'Store Partner',
    sublabel: 'Amazon Associate',
    icon: Store,
    color: '#FF9900',
    bgColor: 'rgba(255, 153, 0, 0.1)',
  },
  {
    id: 'flipkart-partner',
    label: 'Store Partner',
    sublabel: 'Flipkart Partner',
    icon: ShoppingBag,
    color: '#2874F0',
    bgColor: 'rgba(40, 116, 240, 0.1)',
  },
  {
    id: 'safe-secure',
    label: 'Safe & Secure',
    sublabel: 'Verified Platform',
    icon: Shield,
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)',
  },
  {
    id: 'certified-trainers',
    label: 'Certified Trainers',
    sublabel: 'Authorized RTO School',
    icon: Award,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
];
