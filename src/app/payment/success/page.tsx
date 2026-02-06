
'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, ShoppingBag, Fingerprint, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getOrderDetails } from '@/lib/server-actions';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const orderId = searchParams.get('orderId');
    const [orderData, setOrderData] = useState<any>(null);
    const [loadingOrder, setLoadingOrder] = useState(true);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    useEffect(() => {
        if (orderId) {
            getOrderDetails(orderId).then(data => {
                setOrderData(data);
                setLoadingOrder(false);
            });
        }
    }, [orderId]);

    // Handle automatic redirection to profile completion
    useEffect(() => {
        if (!authLoading && user && orderData?.plan) {
            const timer = setTimeout(() => {
                router.push(`/dashboard/complete-profile?plan=${encodeURIComponent(orderData.plan)}`);
            }, 3000); // 3-second delay to show success message
            return () => clearTimeout(timer);
        }
    }, [user, authLoading, orderData, router]);

    const handleDownloadReceipt = useCallback(async () => {
        if (!orderData) return;
        setIsGeneratingPdf(true);

        const doc = new jsPDF();
        
        // 1. Header: Branded Logo and Company Info
        // Draw stylized crosshair icon manually using circles and lines
        doc.setDrawColor(239, 68, 68); // Red
        doc.setLineWidth(1);
        doc.circle(25, 20, 8); // Outer
        doc.circle(25, 20, 4); // Inner
        doc.line(25, 10, 25, 30); // Vertical
        doc.line(15, 20, 35, 20); // Horizontal

        doc.setFontSize(22);
        doc.setTextColor(239, 68, 68); // Red
        doc.setFont('helvetica', 'bold');
        doc.text('DRIVERGY', 40, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Muted foreground
        doc.setFont('helvetica', 'normal');
        doc.text('LEARN. DRIVE. LIVE.', 40, 26);

        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        doc.text('Gurugram Sector 33, Haryana, India', 190, 15, { align: 'right' });
        doc.text('support@drivergy.in | www.drivergy.in', 190, 21, { align: 'right' });

        doc.setDrawColor(226, 232, 240);
        doc.line(20, 35, 190, 35);

        // 2. Invoice Details
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.text('TAX INVOICE', 20, 50);

        doc.setFontSize(10);
        doc.text(`Invoice No: ${orderId?.slice(-8).toUpperCase()}`, 20, 60);
        doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, 20, 66);
        doc.text(`Transaction ID: ${orderData.transactionId || orderId}`, 20, 72);

        // 3. Customer Billing Info
        doc.setFontSize(12);
        doc.text('Bill To:', 20, 85);
        doc.setFont('helvetica', 'normal');
        doc.text(orderData.customerName || 'N/A', 20, 92);
        doc.text(orderData.customerEmail || 'N/A', 20, 98);
        doc.text(`Phone: ${orderData.customerPhone || 'N/A'}`, 20, 104);

        // 4. Product Table
        autoTable(doc, {
            startY: 115,
            head: [['Description', 'Qty', 'Unit Price', 'Amount']],
            body: [
                [`${orderData.plan} Driving Program Subscription`, '1', `INR ${orderData.amount}`, `INR ${orderData.amount}`],
            ],
            theme: 'striped',
            headStyles: { fillStyle: 'fill', fillColor: [239, 68, 68], textColor: [255, 255, 255] },
            columnStyles: {
                0: { cellWidth: 100 },
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right' }
            }
        });

        // 5. Summary Section - Fixed Alignment
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Subtotal:', 140, finalY);
        doc.setFont('helvetica', 'normal');
        doc.text(`INR ${orderData.amount}.00`, 190, finalY, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.text('Tax (0% GST):', 140, finalY + 7);
        doc.setFont('helvetica', 'normal');
        doc.text('INR 0.00', 190, finalY + 7, { align: 'right' });

        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.5);
        doc.line(140, finalY + 10, 190, finalY + 10);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Total Amount:', 140, finalY + 18);
        doc.setTextColor(239, 68, 68);
        doc.text(`INR ${orderData.amount}.00`, 190, finalY + 18, { align: 'right' });

        // 6. Footer
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'italic');
        doc.text('Thank you for choosing Drivergy! Your safe driving journey starts here.', 105, 280, { align: 'center' });
        doc.text('This is a computer-generated invoice and does not require a signature.', 105, 286, { align: 'center' });

        doc.save(`Drivergy_Invoice_${orderId}.pdf`);
        setIsGeneratingPdf(false);
    }, [orderData, orderId]);

    if (loadingOrder) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p>Retrieving your order details...</p>
            </div>
        );
    }

    return (
        <Card className="w-full max-w-lg text-center shadow-2xl border-t-4 border-green-500">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="text-3xl font-bold">
                    Payment Successful!
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground pt-2">
                    Thank you for your purchase. Redirecting you to finalize your profile...
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>Your enrollment for the <strong>{orderData?.plan}</strong> plan is confirmed. You will be redirected shortly.</p>
                {orderId && (
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2">
                        <Fingerprint className="h-4 w-4 text-gray-500" />
                        <span className="font-mono text-gray-700 dark:text-gray-300">{orderId}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4">
                <Button 
                    onClick={handleDownloadReceipt} 
                    className="w-full" 
                    variant="outline"
                    disabled={isGeneratingPdf}
                >
                    {isGeneratingPdf ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : <><Download className="mr-2 h-4 w-4" />Download Receipt</>}
                </Button>
                <Button asChild className="w-full">
                    <Link href={`/dashboard/complete-profile?plan=${encodeURIComponent(orderData?.plan || '')}`}>
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Complete Now
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function PaymentSuccessPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-primary" />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
