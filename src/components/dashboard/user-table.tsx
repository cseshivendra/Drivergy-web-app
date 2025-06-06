
import type { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/types';
import { User, Phone, MapPin, FileText, CalendarDays, AlertCircle, Fingerprint } from 'lucide-react';

interface UserTableProps {
  title: ReactNode; // Changed from string to ReactNode
  users: UserProfile[];
  isLoading: boolean;
}

export default function UserTable({ title, users, isLoading }: UserTableProps) {
  const renderSkeletons = () => (
    Array(3).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell> {/* ID column */}
        <TableCell><Skeleton className="h-5 w-32" /></TableCell> {/* Name column */}
        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <Card className="shadow-lg border border-primary transition-shadow duration-300">
      <CardHeader>
        {/* CardTitle now renders ReactNode directly */}
        <CardTitle className="font-headline text-2xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]"><Fingerprint className="inline-block mr-2 h-4 w-4" />ID</TableHead>
                <TableHead className="w-[200px]"><User className="inline-block mr-2 h-4 w-4" />Name</TableHead>
                <TableHead><Phone className="inline-block mr-2 h-4 w-4" />Contact</TableHead>
                <TableHead><MapPin className="inline-block mr-2 h-4 w-4" />Location</TableHead>
                <TableHead><FileText className="inline-block mr-2 h-4 w-4" />Subscription</TableHead>
                <TableHead><CalendarDays className="inline-block mr-2 h-4 w-4" />Registered At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? renderSkeletons() : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{user.uniqueId}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.contact}</TableCell>
                    <TableCell>{user.location}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.subscriptionPlan === 'Premium' ? 'bg-primary/20 text-primary-foreground' :
                        user.subscriptionPlan === 'Gold' ? 'bg-yellow-400/20 text-yellow-700' :
                        'bg-gray-400/20 text-gray-700'
                      } dark:text-foreground`}>
                        {user.subscriptionPlan}
                      </span>
                    </TableCell>
                    <TableCell>{user.registrationTimestamp}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center"> {/* Updated colSpan to 6 */}
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-lg">No users found.</p>
                      <p className="text-sm">Try adjusting your filters or check back later.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

