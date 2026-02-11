
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
  IndianStates,
  DistrictsByState,
} from '@/types';
import { User, UserCog, Car, Bike, ShieldCheck, ScanLine, UserSquare2, Fuel, Users, Contact, FileUp, MapPin, KeyRound, AtSign, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { registerUserAction } from '@/lib/server-actions';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';


interface RegistrationFormProps {
  userRole: 'customer' | 'trainer';
  onSuccess: () => void;
}

export default function RegistrationForm({ userRole, onSuccess }: RegistrationFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { logInUser } = useAuth();
  const [error, setError] = useState<string | undefined>(undefined);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(RegistrationFormSchema),
    defaultValues: {
      userRole: userRole,
      name: '', 
      email: '', 
      username: '', 
      password: '', 
      confirmPassword: '', 
      phone: '',
      gender: undefined,
      state: '',
      district: '',
      specialization: undefined, 
      trainerVehicleType: undefined,
      fuelType: undefined, 
      vehicleNumber: '', 
      drivingLicenseNumber: '',
      yearsOfExperience: undefined,
      drivingSchoolName: '',
      ownerName: '',
      drivingSchoolCertificateNumber: '',
    },
    mode: 'onBlur',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isSubmitting } = form.formState;
  const { watch, setValue } = form;

  const selectedState = watch('state');

  const availableDistricts = useMemo(() => {
    if (selectedState && DistrictsByState[selectedState as keyof typeof DistrictsByState]) {
      return DistrictsByState[selectedState as keyof typeof DistrictsByState];
    }
    return [];
  }, [selectedState]);

  useEffect(() => {
    const currentDistrict = form.getValues('district');
    if (selectedState && currentDistrict && !availableDistricts.includes(currentDistrict)) {
      setValue('district', '');
    }
  }, [selectedState, form, setValue, availableDistricts]);


  const handleSubmit = async (data: RegistrationFormValues) => {
      setError(undefined); // Clear previous errors
      
      const result = await registerUserAction(data);

      if (result.success && result.user) {
          toast({
              title: "Registration Successful!",
              description: "Your account has been created. Redirecting...",
          });
          
          // Log the user in on the client-side after successful server-side creation
          logInUser(result.user, false);
          onSuccess();
          
      } else {
          setError(result.error);
      }
  };

const errorRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
    if (error && errorRef.current) {
        const y = errorRef.current.getBoundingClientRect().top + window.scrollY;

        window.scrollTo({
            top: y - 180,   
            behavior: "smooth",
        });
    }
}, [error]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {error && (
            <div ref={errorRef}>
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Registration Error</AlertTitle>
                <AlertDescription>
                    {error}
                    {error.includes("already registered") && (
                       <> You can <Link href="/login" className="font-bold underline">log in here</Link>.</>
                    )}
                </AlertDescription>
            </Alert>
            </div>
        )}
        
        <input type="hidden" {...form.register('userRole')} value={userRole} />

        <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Login Credentials</h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
            <FormField control={form.control} name="username" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-primary" />Username<span className="text-destructive ml-1">*</span></FormLabel><FormControl><Input placeholder="Create a username" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><AtSign className="mr-2 h-4 w-4 text-primary" />Email Address<span className="text-destructive ml-1">*</span></FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
           <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-primary" />Password<span className="text-destructive ml-1">*</span></FormLabel><div className="relative"><FormControl><Input type={showPassword ? 'text' : 'password'} placeholder="Create a password" {...field} className="pr-10" /></FormControl><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-primary" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-primary" />Confirm Password<span className="text-destructive ml-1">*</span></FormLabel><div className="relative"><FormControl><Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your password" {...field} className="pr-10" /></FormControl><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-primary" aria-label={showConfirmPassword ? "Hide password" : "Show password"}>{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div><FormMessage /></FormItem> )} />
        </div>

        <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Personal & Contact Information</h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-primary" />Full Name<span className="text-destructive ml-1">*</span></FormLabel><FormControl><Input placeholder="Enter full name" {...field} /></FormControl><FormMessage /></FormItem> )} />
           <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><Contact className="mr-2 h-4 w-4 text-primary" />Phone Number<span className="text-destructive ml-1">*</span></FormLabel><div className="flex items-center"><span className="inline-flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">+91</span><FormControl><Input type="tel" placeholder="Enter 10-digit number" {...field} /></FormControl></div><FormMessage /></FormItem> )} />
        </div>
        
        <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel className="flex items-center"><Users className="mr-2 h-4 w-4 text-primary" />Gender<span className="text-destructive ml-1">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} name={field.name}>
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

        {userRole === 'trainer' && (
          <>
            <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Professional Details</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-primary" />State<span className="text-destructive ml-1">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {IndianStates.map(state => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-primary" />District<span className="text-destructive ml-1">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState || availableDistricts.length === 0}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select district" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {availableDistricts.length > 0 ? (
                                availableDistricts.map(district => (
                                    <SelectItem key={district} value={district}>{district}</SelectItem>
                                ))
                                ) : (
                                <SelectItem value="disabled" disabled>Select a state first</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField control={form.control} name="specialization" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><Bike className="mr-2 h-4 w-4 text-primary" />Specialization<span className="text-destructive ml-1">*</span></FormLabel><Select onValueChange={field.onChange} value={field.value} name={field.name}><FormControl><SelectTrigger><SelectValue placeholder="Select specialization" /></SelectTrigger></FormControl><SelectContent>{SpecializationOptions.map(spec => ( <SelectItem key={spec} value={spec}>{spec}</SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem> )} />
            </div>
            <FormField control={form.control} name="yearsOfExperience" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><ShieldCheck className="mr-2 h-4 w-4 text-primary" />Years of Experience<span className="text-destructive ml-1">*</span></FormLabel><FormControl><Input type="number" placeholder="e.g., 5" {...field} onChange={event => field.onChange(+event.target.value)}/></FormControl><FormMessage /></FormItem> )} />
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                <FormField control={form.control} name="trainerVehicleType" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4 text-primary" />Type of Vehicle Used for Training<span className="text-destructive ml-1">*</span></FormLabel><Select onValueChange={field.onChange} value={field.value} name={field.name}><FormControl><SelectTrigger><SelectValue placeholder="Select vehicle type" /></SelectTrigger></FormControl><SelectContent>{TrainerVehicleTypeOptions.map(type => ( <SelectItem key={type} value={type}>{type}</SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="fuelType" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><Fuel className="mr-2 h-4 w-4 text-primary" />Type of Fuel<span className="text-destructive ml-1">*</span></FormLabel><Select onValueChange={field.onChange} value={field.value} name={field.name}><FormControl><SelectTrigger><SelectValue placeholder="Select fuel type" /></SelectTrigger></FormControl><SelectContent>{FuelTypeOptions.map(type => ( <SelectItem key={type} value={type}>{type}</SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem> )} />
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                <FormField control={form.control} name="vehicleNumber" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><ScanLine className="mr-2 h-4 w-4 text-primary" />Vehicle Registration Number<span className="text-destructive ml-1">*</span></FormLabel><FormControl><Input placeholder="e.g., MH01AB1234" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="drivingLicenseNumber" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><UserSquare2 className="mr-2 h-4 w-4 text-primary" />Driving License No.<span className="text-destructive ml-1">*</span></FormLabel><FormControl><Input placeholder="Enter DL number" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Driving School Details (Optional)</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                <FormField control={form.control} name="drivingSchoolName" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4 text-primary" />Driving School Name</FormLabel><FormControl><Input placeholder="Your driving school" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="ownerName" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-primary" />Owner Name</FormLabel><FormControl><Input placeholder="Owner of the school" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField control={form.control} name="drivingSchoolCertificateNumber" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><ShieldCheck className="mr-2 h-4 w-4 text-primary" />Driving School Certificate No.</FormLabel><FormControl><Input placeholder="Certificate number" {...field} /></FormControl><FormMessage /></FormItem> )} />
          </>
        )}

        <div className="flex justify-end pt-4">
           <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {userRole === 'customer' ? <><User className="mr-2 h-4 w-4" /> Register Customer</> : <><UserCog className="mr-2 h-4 w-4" /> Register Trainer</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}
