
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Terms and Conditions | Drivergy',
    description: "Read the official Terms and Conditions for using the Drivergy platform. Understand your rights and responsibilities as a user.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="text-center p-6 bg-muted/30">
          <div className="p-3 bg-background rounded-full mb-3 w-fit mx-auto">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-headline text-4xl font-bold text-primary">Terms and Conditions</h1>
          <p className="text-muted-foreground">Last Updated: July 22, 2024</p>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6 prose prose-stone dark:prose-invert max-w-none">
          
          <p>
            Please read these Terms and Conditions ("Terms", "Terms and Conditions") carefully before using the Drivergy website and mobile application (the "Service") operated by Drivergy ("us", "we", or "our").
          </p>

          <section>
            <h2 className="font-semibold text-xl text-foreground">1. Acceptance of Terms</h2>
            <p>
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
            </p>
          </section>
          
          <section>
            <h2 className="font-semibold text-xl text-foreground">2. Accounts</h2>
            <p>
              When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
            </p>
          </section>

           <section>
            <h2 className="font-semibold text-xl text-foreground">3. Subscriptions and Payments</h2>
            <p>
              Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). By submitting payment information, you automatically authorize Drivergy to charge all subscription fees incurred through your account to any such payment instruments. For more details on refunds, please see our <Link href="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-foreground">4. User Responsibilities</h2>
            <ul>
                <li><strong>Customers:</strong> You are responsible for attending scheduled lessons on time. You must hold a valid Learner's License if required by law in your jurisdiction to undertake driving lessons.</li>
                <li><strong>Trainers:</strong> You are responsible for providing professional, safe, and punctual driving instruction. You must maintain all necessary licenses, permits, and vehicle insurance required to operate as a driving instructor.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="font-semibold text-xl text-foreground">5. Termination</h2>
            <p>
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

           <section>
            <h2 className="font-semibold text-xl text-foreground">6. Limitation Of Liability</h2>
            <p>
              In no event shall Drivergy, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-foreground">7. Changes to Terms</h2>
            <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-foreground">8. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us through our <Link href="/contact" className="text-primary hover:underline">Contact Page</Link>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
