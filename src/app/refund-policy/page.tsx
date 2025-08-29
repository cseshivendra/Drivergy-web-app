
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Refund & Cancellation Policy | Drivergy',
    description: "Review Drivergy's refund and cancellation policy for driving lesson subscriptions. Understand the terms for cancellations and our refund process.",
};

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="text-center p-6 bg-muted/30">
          <div className="p-3 bg-background rounded-full mb-3 w-fit mx-auto">
            <IndianRupee className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-headline text-4xl font-bold text-primary">Refund & Cancellation Policy</h1>
          <p className="text-muted-foreground">Last Updated: July 22, 2024</p>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6 prose prose-stone dark:prose-invert max-w-none">
          
          <p>
            At Drivergy, we strive to provide a satisfactory experience for all our users. This policy outlines the terms regarding refunds and cancellations for our subscription plans.
          </p>

          <section>
            <h2 className="font-semibold text-xl text-foreground">1. Subscription Fees</h2>
            <p>
                All subscription fees are collected in advance at the time of purchase. These fees grant you access to our platform to book driving lessons and use other features corresponding to your chosen plan for the duration of the subscription.
            </p>
          </section>
          
          <section>
            <h2 className="font-semibold text-xl text-foreground">2. Cancellation by User</h2>
            <ul>
                <li>You may request to cancel your subscription at any time by contacting our support team through the <Link href="/contact" className="text-primary hover:underline">Contact Page</Link>.</li>
                <li>Cancellation requests will be processed within 5-7 business days.</li>
                <li>Please note that simply ceasing to use the service does not constitute a cancellation.</li>
            </ul>
          </section>

           <section>
            <h2 className="font-semibold text-xl text-foreground">3. Refund Policy</h2>
            <p>
              Our refund policy is as follows:
            </p>
            <ul>
                <li><strong>Full Refund:</strong> A full refund may be issued if you cancel your subscription within 48 hours of purchase AND you have not booked or attended any driving lessons.</li>
                <li><strong>Partial Refund:</strong> If you cancel after 48 hours or after attending one or more lessons, a partial refund may be calculated on a pro-rata basis, at the sole discretion of Drivergy. This calculation will account for completed lessons, administrative fees, and any services already rendered.</li>
                <li><strong>No Refund:</strong> No refund will be provided if a user violates our <Link href="/terms-and-conditions" className="text-primary hover:underline">Terms and Conditions</Link>, leading to an account suspension or termination.</li>
                <li><strong>Promotional Offers:</strong> Fees paid under special promotional offers or with discount codes are generally non-refundable.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-foreground">4. Lesson Rescheduling and No-Shows</h2>
            <p>
              Individual lessons must be rescheduled at least 24 hours in advance through your dashboard. Failure to show up for a scheduled lesson ("no-show") without prior notice will result in that lesson being marked as completed, and it will not be eligible for a refund or rescheduling.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-foreground">5. Process for Requesting a Refund</h2>
            <p>
              To request a refund, please contact our support team with your user details and reason for the request. All refund requests are subject to review, and the final decision will be communicated to you via email. Approved refunds will be processed to the original method of payment within 10-15 business days.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-foreground">6. Contact Us</h2>
            <p>
              If you have any questions about our Refund Policy, please contact us through our <Link href="/contact" className="text-primary hover:underline">Contact Page</Link>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
