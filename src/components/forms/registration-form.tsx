
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import {
    RegistrationFormSchema,
    type RegistrationFormValues,
    Locations,
    SpecializationOptions,
    TrainerVehicleTypeOptions,
    FuelTypeOptions,
    GenderOptions,
    type TrainerRegistrationFormValues,
    type UserProfile,
    type CustomerRegistrationFormValues,
} from '@/types';
import { addCustomer, addTrainer } from '@/lib/actions';
import { User, UserCog, Car, Bike, ShieldCheck, ScanLine, UserSquare2, Fuel, Users, Contact, FileUp, MapPin, KeyRound, AtSign, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RegistrationFormProps {
    userRole: 'customer' | 'trainer';
}

export default function RegistrationForm({ userRole }: RegistrationFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const defaultValues = useMemo((): RegistrationFormValues => {
        const base = {
            userRole: userRole,
            username: '',
            password: '',
            confirmPassword: '',
            name: '',
            email: '',
            phone: '',
            gender: '',
        };
        if (userRole === 'customer') {
            return base as CustomerRegistrationFormValues;
        } else { // trainer
            return {
                ...base,
                location: '',
                yearsOfExperience: undefined,
                specialization: undefined,
                trainerVehicleType: undefined,
                fuelType: undefined,
                vehicleNumber: '',
                trainerCertificateNumber: '',
                aadhaarCardNumber: '',
                drivingLicenseNumber: '',
                trainerCertificateFile: undefined,
                drivingLicenseFile: undefined,
                aadhaarCardFile: undefined,
            } as TrainerRegistrationFormValues;
        }
    }, [userRole]);

    const form = useForm<RegistrationFormValues>({
        resolver: zodResolver(RegistrationFormSchema),
        defaultValues,
        mode: 'onChange',
    });

    async function onSubmit(data: RegistrationFormValues) {
        try {
            let newUser: UserProfile | null = null;

            if (data.userRole === 'customer') {
                newUser = await addCustomer(data as CustomerRegistrationFormValues);
            } else if (data.userRole === 'trainer') {
                newUser = await addTrainer(data as TrainerRegistrationFormValues);
            }

            if (newUser) {
                toast({
                    title: "Registration Successful!",
                    description: "Your account has been created. Please log in to continue.",
                });
                router.push('/login');
            } else {
                throw new Error("Registration failed: No user data returned.");
            }
        } catch (error) {
            console.error('Registration failed:', error);
            toast({
                title: "Registration Failed",
                description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Login Credentials</h3>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center"><AtSign className="mr-2 h-4 w-4 text-primary" />Username<span className="text-destructive ml-1">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Create a username" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-primary" />Full Name<span className="text-destructive ml-1">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter full name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-primary" />Password<span className="text-destructive ml-1">*</span></FormLabel>
                                <div className="relative">
                                    <FormControl>
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Create a password"
                                            {...field}
                                            className="pr-10"
                                        />
                                    </FormControl>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-primary"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-primary" />Confirm Password<span className="text-destructive ml-1">*</span></FormLabel>
                                <div className="relative">
                                    <FormControl>
                                        <Input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="Confirm your password"
                                            {...field}
                                            className="pr-10"
                                        />
                                    </FormControl>
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-primary"
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Personal & Contact Information</h3>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center"><Contact className="mr-2 h-4 w-4 text-primary" />Email Address<span className="text-destructive ml-1">*</span></FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="you@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center"><UserSquare2 className="mr-2 h-4 w-4 text-primary" />Phone Number</FormLabel>
                                <div className="flex items-center">
                  <span className="inline-flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                    +91
                  </span>
                                    <FormControl>
                                        <Input
                                            type="tel"
                                            placeholder="Enter 10-digit number"
                                            {...field}
                                            className="rounded-l-none"
                                            value={field.value || ''} // Ensure value is controlled, handles undefined
                                        />
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center"><Users className="mr-2 h-4 w-4 text-primary" />Gender<span className="text-destructive ml-1">*</span></FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {GenderOptions.map(option => (
                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {userRole === 'trainer' && (
                    <>
                        <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Professional Details</h3>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-primary" />Location<span className="text-destructive ml-1">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select location" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Locations.map(loc => (
                                                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="yearsOfExperience"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center"><ShieldCheck className="mr-2 h-4 w-4 text-primary" />Years of Experience<span className="text-destructive ml-1">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g., 5" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="specialization"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center"><Bike className="mr-2 h-4 w-4 text-primary" />Specialization<span className="text-destructive ml-1">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select specialization" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {SpecializationOptions.map(spec => (
                                                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="trainerVehicleType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4 text-primary" />Type of Vehicle Used for Training<span className="text-destructive ml-1">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select vehicle type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {TrainerVehicleTypeOptions.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="vehicleNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center"><ScanLine className="mr-2 h-4 w-4 text-primary" />Vehicle Registration Number<span className="text-destructive ml-1">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., MH01AB1234" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fuelType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center"><Fuel className="mr-2 h-4 w-4 text-primary" />Type of Fuel<span className="text-destructive ml-1">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select fuel type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {FuelTypeOptions.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>


                        <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Documents & Verification</h3>
                        <p className="text-sm text-muted-foreground">Please provide the following document numbers and upload their respective files for verification.</p>

                        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="trainerCertificateNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center"><ShieldCheck className="mr-2 h-4 w-4 text-primary" />Trainer Certificate No.<span className="text-destructive ml-1">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter certificate number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="trainerCertificateFile"
                                render={({ field: { value, onChange, ...fieldProps } }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center"><FileUp className="mr-2 h-4 w-4 text-primary" />Upload Certificate<span className="text-destructive ml-1">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="file" {...fieldProps} onChange={(event) => onChange(event.target.files?.[0])} accept=".pdf,.jpg,.jpeg,.png" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="drivingLicenseNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center"><UserSquare2 className="mr-2 h-4 w-4 text-primary" />Driving License No.<span className="text-destructive ml-1">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter DL number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="drivingLicenseFile"
                                render={({ field: { value, onChange, ...fieldProps } }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center"><FileUp className="mr-2 h-4 w-4 text-primary" />Upload Driving License<span className="text-destructive ml-1">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="file" {...fieldProps} onChange={(event) => onChange(event.target.files?.[0])} accept=".pdf,.jpg,.jpeg,.png" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="aadhaarCardNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center"><ScanLine className="mr-2 h-4 w-4 text-primary" />Aadhaar Card No.<span className="text-destructive ml-1">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter 12-digit Aadhaar number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="aadhaarCardFile"
                                render={({ field: { value, onChange, ...fieldProps } }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center"><FileUp className="mr-2 h-4 w-4 text-primary" />Upload Aadhaar Card<span className="text-destructive ml-1">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="file" {...fieldProps} onChange={(event) => onChange(event.target.files?.[0])} accept=".pdf,.jpg,.jpeg,.png" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </>
                )}

                <div className="flex justify-end pt-4">
                    <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> :
                            userRole === 'customer' ? <><User className="mr-2 h-4 w-4" /> Register Customer</> : <><UserCog className="mr-2 h-4 w-4" /> Register Trainer</>}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
