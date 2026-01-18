import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function DeprecatedPaymentStatusPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 bg-destructive/10">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                </div>
                <CardTitle className="text-2xl font-bold">
                    Page Unavailable
                </CardTitle>
                <CardDescription>
                    This payment status page is no longer in use.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>Our payment system has been updated. Please check your dashboard or the success/failure page for your payment status.</p>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href="/dashboard">
                       Go to Dashboard
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
