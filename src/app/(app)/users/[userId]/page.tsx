
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchUserById } from '@/lib/mock-data';
import type { UserProfile } from '@/types';
import { User, Mail, Phone, MapPin, FileText, CalendarDays, Fingerprint, Car, ShieldCheck, X, FileType, FileSpreadsheet, Users as GenderIcon } from 'lucide-react'; // Added X, FileType, FileSpreadsheet, GenderIcon
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      fetchUserById(userId)
        .then((data) => {
          setUser(data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Failed to fetch user details:", error);
          toast({
            title: "Error",
            description: "Could not load user details.",
            variant: "destructive",
          });
          setIsLoading(false);
        });
    }
  }, [userId, toast]);

  const handleDownload = (type: 'PDF' | 'Excel') => {
    if (!user) return;
    
    const filename = `${user.name.replace(/\s+/g, '_')}_details.${type === 'PDF' ? 'pdf' : 'xlsx'}`;
    let content = "";
    let blobType = "";

    if (type === 'PDF') {
      // For PDF, create a simple text representation
      content = `User Details: ${user.name}\n\n`;
      content += `User ID: ${user.uniqueId}\n`;
      content += `Internal ID: ${user.id}\n`;
      content += `Contact: ${user.contact}\n`;
      content += `Location: ${user.location}\n`;
      content += `Registration: ${user.registrationTimestamp}\n`;
      content += `Subscription: ${user.subscriptionPlan}\n`;
      content += `Vehicle Info: ${user.vehicleInfo || 'N/A'}\n`;
      content += `Approval Status: ${user.approvalStatus}\n`;
      // Add more fields as needed
      blobType = 'application/pdf'; // Technically this isn't a PDF, but for simulation it's okay.
                                  // Real PDF generation needs a library.
    } else { // Excel (CSV for simplicity)
      const headers = "Field,Value\n";
      const rows = [
        `User ID,"${user.uniqueId}"`,
        `Internal ID,"${user.id}"`,
        `Name,"${user.name}"`,
        `Contact,"${user.contact}"`,
        `Location,"${user.location}"`,
        `Registration Date,"${user.registrationTimestamp}"`,
        `Subscription Plan,"${user.subscriptionPlan}"`,
        `Vehicle Info,"${user.vehicleInfo || 'N/A'}"`,
        `Approval Status,"${user.approvalStatus}"`,
      ];
      content = headers + rows.join("\n");
      blobType = 'text/csv;charset=utf-8;'; // Correct MIME for CSV
    }
    
    const blob = new Blob([content], { type: blobType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast({
      title: `${type} Download Started`,
      description: `Simulated download of ${filename}.`,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl p-4 py-8 sm:p-6 lg:p-8">
        <Card className="shadow-xl">
          <CardHeader className="bg-muted/30 p-6 border-b">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <Skeleton className="h-6 w-1/3 mb-2" />
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-5 w-5 mt-0.5" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="bg-muted/30 p-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-3xl p-4 py-8 sm:p-6 lg:p-8 text-center">
        <Card className="shadow-xl inline-block">
          <CardHeader>
            <CardTitle className="text-destructive">User Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The user details could not be loaded or the user does not exist.</p>
            <Button onClick={() => window.history.back()} className="mt-4">Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const isCustomer = user.uniqueId.startsWith('CU');

  return (
    <div className="container mx-auto max-w-3xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 p-6 border-b">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Image 
              src={isCustomer ? "https://placehold.co/100x100.png" : "https://placehold.co/100x100.png"} 
              alt={user.name} 
              width={100} 
              height={100} 
              className="rounded-full border-4 border-primary shadow-md"
              data-ai-hint={isCustomer ? "customer avatar" : "instructor avatar"}
            />
            <div className="text-center sm:text-left">
              <CardTitle className="font-headline text-3xl font-bold text-primary">{user.name}</CardTitle>
              <CardDescription className="text-md text-muted-foreground mt-1">
                {isCustomer ? "Customer Profile" : "Trainer Profile"} | ID: {user.uniqueId}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-3 border-b pb-2 flex items-center">
              <User className="mr-2 h-5 w-5 text-primary" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <InfoItem icon={Fingerprint} label="Internal ID" value={user.id} />
              <InfoItem icon={Mail} label="Contact Email" value={user.contact} />
              {/* Add phone here if available and desired */}
              {/* <InfoItem icon={Phone} label="Phone Number" value={user.phone || 'N/A'} /> */}
              <InfoItem icon={MapPin} label="Location" value={user.location} />
              <InfoItem icon={CalendarDays} label="Registration Date" value={user.registrationTimestamp} />
              {/* Add gender here if available and desired */}
              {/* <InfoItem icon={GenderIcon} label="Gender" value={user.gender || 'N/A'} /> */}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-foreground mt-4 mb-3 border-b pb-2 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" /> Account & Role Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <InfoItem 
                icon={user.approvalStatus === 'Approved' ? ShieldCheck : user.approvalStatus === 'Rejected' ? X : FileText} 
                label="Approval Status" 
                value={user.approvalStatus}
                valueClassName={
                    user.approvalStatus === 'Approved' ? 'text-green-600 font-bold' :
                    user.approvalStatus === 'Rejected' ? 'text-red-600 font-bold' :
                    'text-yellow-500 font-bold'
                }
              />
              <InfoItem icon={FileText} label={isCustomer ? "Subscription Plan" : "Role"} value={user.subscriptionPlan} />
              <InfoItem icon={Car} label={isCustomer ? "Vehicle Preference" : "Training Vehicle"} value={user.vehicleInfo || 'N/A'} />
              
              {/* Customer Specific (Example: DL Info) */}
              {isCustomer && (user as any).dlStatus && (
                <>
                  <InfoItem icon={FileText} label="DL Status" value={(user as any).dlStatus} />
                  {(user as any).dlStatus === 'Already Have DL' && (
                    <>
                      <InfoItem icon={Fingerprint} label="DL Number" value={(user as any).dlNumber || 'N/A'} />
                      <InfoItem icon={Car} label="DL Type Held" value={(user as any).dlTypeHeld || 'N/A'} />
                    </>
                  )}
                </>
              )}

              {/* Trainer Specific (Example: Experience) */}
              {!isCustomer && (user as any).yearsOfExperience !== undefined && (
                 <InfoItem icon={CalendarDays} label="Years of Experience" value={(user as any).yearsOfExperience} />
              )}
              {!isCustomer && (user as any).specialization && (
                 <InfoItem icon={Car} label="Specialization" value={(user as any).specialization} />
              )}
            </div>
          </div>
          
        </CardContent>
        <CardFooter className="bg-muted/30 p-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button variant="outline" onClick={() => window.close()} className="w-full sm:w-auto order-last sm:order-first">Close Tab</Button>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button onClick={() => handleDownload('PDF')} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <FileType className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button onClick={() => handleDownload('Excel')} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Excel
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number | undefined;
  valueClassName?: string;
}

function InfoItem({ icon: Icon, label, value, valueClassName }: InfoItemProps) {
  return (
    <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
      <Icon className="h-5 w-5 text-primary mt-1 shrink-0" />
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={cn("font-semibold text-foreground break-words", valueClassName)}>{value !== undefined && value !== null && value !== '' ? String(value) : 'N/A'}</p>
      </div>
    </div>
  );
}

