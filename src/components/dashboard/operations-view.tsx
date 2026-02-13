
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Users, UserPlus, Repeat, ShieldCheck, 
    Settings2, PlayCircle, AlertCircle, RefreshCw,
    ClipboardCheck, Search, HardDriveDownload
} from 'lucide-react';
import UserTable from '@/components/dashboard/user-table';
import RequestTable from '@/components/dashboard/request-table';
import RescheduleRequestTable from '@/components/dashboard/reschedule-request-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { AdminDashboardData, DrivingSession } from '@/types';

interface OperationsViewProps {
    data: AdminDashboardData | null;
    sessions: DrivingSession[];
    isLoading: boolean;
    onActioned: () => void;
}

export default function OperationsView({ data, sessions, isLoading, onActioned }: OperationsViewProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        if (!data?.allUsers) return [];
        return data.allUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.contact.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data?.allUsers, searchTerm]);

    const pendingCustomers = filteredUsers.filter(u => 
        u.uniqueId.startsWith('CU') && 
        u.subscriptionPlan !== 'None' && 
        (u.approvalStatus === 'Pending' || u.approvalStatus === 'In Progress')
    );

    const pendingTrainers = filteredUsers.filter(u => 
        u.uniqueId.startsWith('TR') && 
        (u.approvalStatus === 'Pending' || u.approvalStatus === 'In Progress')
    );

    const renderManualOverrides = () => (
        <Card className="shadow-lg border-primary">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" />
                    Session Manual Overrides
                </CardTitle>
                <CardDescription>Force-complete or cancel sessions in case of technical issues.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Trainer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Start Time</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sessions.filter(s => s.status === 'Active' || s.status === 'Scheduled').map(session => (
                            <TableRow key={session.id}>
                                <TableCell className="font-medium">{session.studentName}</TableCell>
                                <TableCell>{session.trainerName}</TableCell>
                                <TableCell>
                                    <Badge className={cn(
                                        session.status === 'Active' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                    )}>
                                        {session.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs">
                                    {session.startTime ? format(parseISO(session.startTime), 'PPp') : 'Not Started'}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" className="h-8">Manual Complete</Button>
                                    <Button variant="destructive" size="sm" className="h-8">Abort Session</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {sessions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No active sessions found for override.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-headline text-2xl font-bold">Operations Management</h1>
                    <p className="text-muted-foreground text-sm">Oversee trainer assignments and session fulfillment.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="icon" onClick={onActioned} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                    <Button className="bg-primary">
                        <HardDriveDownload className="mr-2 h-4 w-4" /> Export Logs
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="assignments" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                    <TabsTrigger value="requests">Lesson Requests</TabsTrigger>
                    <TabsTrigger value="reassignments">Reassignments</TabsTrigger>
                    <TabsTrigger value="overrides">Overrides</TabsTrigger>
                    <TabsTrigger value="verifications">Verifications</TabsTrigger>
                </TabsList>

                <TabsContent value="assignments" className="space-y-8">
                    <UserTable
                        title="Pending Trainer Assignments"
                        users={pendingCustomers}
                        isLoading={isLoading}
                        onUserActioned={onActioned}
                        actionType="new-customer"
                    />
                </TabsContent>

                <TabsContent value="requests" className="space-y-8">
                    <RequestTable
                        title="Active Lesson Requests"
                        requests={data?.lessonRequests || []}
                        isLoading={isLoading}
                    />
                </TabsContent>

                <TabsContent value="reassignments" className="space-y-8">
                    <RescheduleRequestTable
                        title="Reschedule & Reassignment Requests"
                        requests={data?.rescheduleRequests || []}
                        isLoading={isLoading}
                        onActioned={onActioned}
                    />
                </TabsContent>

                <TabsContent value="overrides">
                    {renderManualOverrides()}
                </TabsContent>

                <TabsContent value="verifications" className="space-y-8">
                    <UserTable
                        title="Trainer Onboarding Verifications"
                        users={pendingTrainers}
                        isLoading={isLoading}
                        onUserActioned={onActioned}
                        actionType="new-trainer"
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
