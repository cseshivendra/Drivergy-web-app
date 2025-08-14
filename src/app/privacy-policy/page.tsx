
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Privacy Policy | Drivergy',
    description: "Read the official Privacy Policy for Drivergy. Understand how we collect, use, and protect your personal data when you use our driving school platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="text-center p-6 bg-muted/30">
          <div className="p-3 bg-background rounded-full mb-3 w-fit mx-auto">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-headline text-4xl font-bold text-primary">Privacy Policy</h1>
          <p className="text-muted-foreground">Last Updated: July 22, 2024</p>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6 prose prose-stone dark:prose-invert max-w-none">
          <p>
            Welcome to Drivergy ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
          </p>

          <section>
            <h2 className="font-semibold text-xl text-foreground">1. Information We Collect</h2>
            <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
            <ul>
              <li>
                <strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, phone number, and demographic information (like your gender and location), that you voluntarily give to us when you register with the Site or when you choose to participate in various activities related to the Site, such as chat and message boards.
              </li>
               <li>
                <strong>Trainer-Specific Data:</strong> If you register as a trainer, we will collect professional information, including years of experience, specialization, vehicle details, and government-issued identification numbers (like Aadhaar, Driving License, and Trainer Certificate numbers) and their corresponding document uploads for verification purposes.
              </li>
               <li>
                <strong>Customer-Specific Data:</strong> If you register as a customer and subscribe to a plan, we will collect information necessary to facilitate your lessons, including your address for pickup, driving license status, and photo ID details for verification.
              </li>
              <li>
                <strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.
              </li>
            </ul>
          </section>
          
          <section>
            <h2 className="font-semibold text-xl text-foreground">2. Use of Your Information</h2>
            <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
            <ul>
              <li>Create and manage your account.</li>
              <li>Connect customers with appropriate driving trainers based on location, vehicle, and gender preference.</li>
              <li>Process payments and subscriptions.</li>
              <li>Email you regarding your account or order.</li>
              <li>Enable user-to-user communications (e.g., between a student and their assigned trainer).</li>
              <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
              <li>Notify you of updates to the Site.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-foreground">3. Disclosure of Your Information</h2>
            <p>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
            <ul>
                <li>
                    <strong>To Your Assigned Partner:</strong> If you are a customer, we will share necessary information (like your name, contact number, and pickup address) with your assigned driving trainer to schedule and conduct lessons. If you are a trainer, we will share your professional details with students assigned to you.
                </li>
                 <li>
                    <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
                </li>
            </ul>
          </section>

           <section>
            <h2 className="font-semibold text-xl text-foreground">4. Security of Your Information</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-foreground">5. Policy for Children</h2>
            <p>
              We do not knowingly solicit information from or market to children under the age of 18. If you become aware of any data we have collected from children under age 18, please contact us using the contact information provided below.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-foreground">6. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date of this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-foreground">7. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us through our <Link href="/contact" className="text-primary hover:underline">Contact Page</Link>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
