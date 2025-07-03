
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import {
  RegistrationFormSchema,
  type RegistrationFormValues,
  Locations,
  SubscriptionPlans,
  VehiclePreferenceOptions,
  SpecializationOptions,
  TrainerVehicleTypeOptions,
  FuelTypeOptions,
  GenderOptions,
  DLStatusOptions,
  PhotoIdTypeOptions,
  TrainerPreferenceOptions, 
  type CustomerRegistrationFormValues,
  type TrainerRegistrationFormValues,
  IndianStates,
  DistrictsByState,
  type UserProfile,
} from '@/types';
import { addCustomer, addTrainer } from '@/lib/mock-data'; 
import { User, UserCog, Car, Bike, FileText, ShieldCheck, ScanLine, UserSquare2, Fuel, Users, Contact, BadgePercent, FileUp, CreditCard, UserCheck as UserCheckIcon, Home, MapPin, KeyRound, AtSign, Eye, EyeOff, CalendarIcon } from 'lucide-react'; 
import { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';

interface RegistrationFormProps {
  userRole: 'customer' | 'trainer';
}

export default function RegistrationForm({ userRole }: RegistrationFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const price = searchParams.get('price');
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
      location: '',
      gender: '', 
    };
    if (userRole === 'customer') {
      return {
        ...base,
        vehiclePreference: undefined,
        subscriptionPlan: plan || '', // Pre-fill plan from URL params
        trainerPreference: '', 
        flatHouseNumber: '',
        street: '',
        district: '',
        state: '',
        pincode: '',
        dlStatus: '',
        dlNumber: '',
        dlTypeHeld: '',
        photoIdType: '', 
        photoIdNumber: '',
        subscriptionStartDate: undefined,
      } as CustomerRegistrationFormValues;
    } else { // trainer
      return {
        ...base,
        yearsOfExperience: undefined, 
        specialization: undefined, 
        trainerVehicleType: undefined, 
        fuelType: undefined,
        vehicleNumber: '',
        trainerCertificateNumber: '',
        aadhaarCardNumber: '',
        drivingLicenseNumber: '',
      } as TrainerRegistrationFormValues;
    }
  }, [userRole, plan]);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(RegistrationFormSchema),
    defaultValues,
    mode: 'onChange', 
  });

  const dlStatus = form.watch('dlStatus'); 
  const selectedState = form.watch('state');

  const availableDistricts = useMemo(() => {
    if (selectedState && DistrictsByState[selectedState]) {
      return DistrictsByState[selectedState];
    }
    return [];
  }, [selectedState]);

  // When the state changes, reset the district field to prevent invalid combinations
  useEffect(() => {
    form.setValue('district', '');
  }, [selectedState, form]);

  async function onSubmit(data: RegistrationFormValues) {
    console.log('Registration Data:', data);

    let newUser: UserProfile | undefined;

    if (data.userRole === 'customer') {
      newUser = await addCustomer(data);
    } else if (data.userRole === 'trainer') {
      newUser = await addTrainer(data);
    }

    if (newUser) {
       toast({
        title: "Registration Successful!",
        description: "Please log in to continue.",
      });

      // Redirect to payment page if coming from subscription flow, otherwise redirect to login
      if (plan && price) {
        // Need to log the user in first, then redirect to payment.
        // For simulation, we'll just redirect to login and have them log in manually.
        const redirectUrl = encodeURIComponent(`/site/payment?plan=${plan}&price=${price}`);
        router.push(`/login?redirect=${redirectUrl}`);
      } else {
        router.push('/login');
      }
    } else {
       form.reset(defaultValues); 
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
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4 text-primary" />Location<span className="text-destructive ml-1">*</span></FormLabel>
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

        {userRole === 'customer' && (
          <>
            <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Address Details</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="flatHouseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Home className="mr-2 h-4 w-4 text-primary" />Flat / House No.<span className="text-destructive ml-1">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A-101, Flat 4B" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-primary" />Road / Street Name<span className="text-destructive ml-1">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., M.G. Road" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-primary" />State<span className="text-destructive ml-1">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
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
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ''}
                        disabled={!selectedState || availableDistricts.length === 0}
                      >
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
                                <SelectItem value="disabled" disabled>First select a state</SelectItem>
                              )}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-primary" />Pincode<span className="text-destructive ml-1">*</span></FormLabel>
                    <FormControl>
                      <Input type="text" maxLength={6} placeholder="Enter 6-digit pincode" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Course & License Details</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="vehiclePreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Bike className="mr-2 h-4 w-4 text-primary" />Vehicle Preference<span className="text-destructive ml-1">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VehiclePreferenceOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option === 'Two-Wheeler' && <Bike className="inline-block mr-2 h-4 w-4" />}
                            {option === 'Four-Wheeler' && <Car className="inline-block mr-2 h-4 w-4" />}
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subscriptionPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><BadgePercent className="mr-2 h-4 w-4 text-primary" />Subscription Plan<span className="text-destructive ml-1">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={!!plan}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SubscriptionPlans.map(plan => (
                          <SelectItem key={plan} value={plan}>{plan}</SelectItem>
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
                name="trainerPreference"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center"><UserCheckIcon className="mr-2 h-4 w-4 text-primary" />Trainer Preference<span className="text-destructive ml-1">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select trainer preference" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {TrainerPreferenceOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                  control={form.control}
                  name="subscriptionStartDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                      <FormLabel className="flex items-center"><CalendarIcon className="mr-2 h-4 w-4 text-primary" />Subscription Start Date<span className="text-destructive ml-1">*</span></FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Your lesson plan will start from this date.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <FormField
              control={form.control}
              name="dlStatus"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel className="flex items-center"><UserSquare2 className="mr-2 h-4 w-4 text-primary" />Driving License Status<span className="text-destructive ml-1">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Select DL status" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      {DLStatusOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
            />

            {(dlStatus === 'Already Have DL' || (form.getValues() as CustomerRegistrationFormValues).dlStatus === 'Already Have DL') && (
              <>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="dlNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><ScanLine className="mr-2 h-4 w-4 text-primary" />DL Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter DL number" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dlTypeHeld"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4 text-primary" />Type of DL Held</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., LMV, MCWG" {...field} value={field.value || ''}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Photo ID Verification</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                <FormField
                    control={form.control}
                    name="photoIdType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center"><CreditCard className="mr-2 h-4 w-4 text-primary" />Photo ID Type<span className="text-destructive ml-1">*</span></FormLabel>
                         <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ID type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PhotoIdTypeOptions.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="photoIdNumber"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center"><ScanLine className="mr-2 h-4 w-4 text-primary" />Photo ID Number<span className="text-destructive ml-1">*</span></FormLabel>
                        <FormControl>
                        <Input placeholder="Enter ID Number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
          </>
        )}

        {userRole === 'trainer' && (
          <>
            <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Professional Details</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
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
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
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
            </div>
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

            <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Documents & Verification</h3>
            <p className="text-sm text-muted-foreground">Please provide the following document numbers for verification purposes. Uploading files is not required at this time.</p>

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
            </div>
          </>
        )}

        <div className="flex justify-end pt-4">
          <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Submitting...' :
              userRole === 'customer' ? <><User className="mr-2 h-4 w-4" /> Register Customer</> : <><UserCog className="mr-2 h-4 w-4" /> Register Trainer</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}
