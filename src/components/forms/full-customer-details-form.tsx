
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useFormState, useFormStatus } from 'react-dom';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import {
  FullCustomerDetailsSchema,
  type FullCustomerDetailsValues,
  DLStatusOptions,
  PhotoIdTypeOptions,
  IndianStates,
  DistrictsByState,
  SubscriptionPlans,
  VehiclePreferenceOptions,
  TrainerPreferenceOptions,
} from '@/types';
import { completeCustomerProfileAction } from '@/lib/server-actions';
import { Home, MapPin, Loader2, Gift, Car, ScanLine, CreditCard, FileUp, ShieldCheck, UserCheck, CalendarDays, Bike } from 'lucide-react'; 
import { useMemo, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving Details...</> : "Save and Finish"}
        </Button>
    );
}

export default function FullCustomerDetailsForm() {
  const { toast } = useToast();
  const { user, logInUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get('plan');

  const [state, formAction] = useFormState(completeCustomerProfileAction, { success: false, error: undefined, user: undefined });

  const form = useForm<FullCustomerDetailsValues>({
    resolver: zodResolver(FullCustomerDetailsSchema),
    defaultValues: {
        userId: user?.id || '',
        subscriptionPlan: planFromUrl && SubscriptionPlans.includes(planFromUrl as any) ? planFromUrl as any : undefined,
        vehiclePreference: undefined,
        trainerPreference: undefined,
        subscriptionStartDate: new Date(),
        flatHouseNumber: '',
        street: '',
        district: '',
        state: '',
        pincode: '',
        dlStatus: undefined,
        dlNumber: '',
        dlTypeHeld: '',
        photoIdType: undefined,
        photoIdNumber: '',
        photoIdFile: undefined,
        referralCode: '',
    },
    mode: 'onChange',
  });
  
  const { watch } = form;
  const dlStatus = watch('dlStatus');
  const selectedState = watch('state');
  const selectedGender = user?.gender;

  const trainerOptions = useMemo(() => {
    if (selectedGender === 'Male') return ['Male', 'Any'];
    if (selectedGender === 'Female') return ['Female', 'Any'];
    return TrainerPreferenceOptions.slice();
  }, [selectedGender]);


  // This effect ensures the form has the correct userId, especially after a fresh registration.
  useEffect(() => {
    if (!user) {
        router.push('/login');
        return;
    }
    form.setValue('userId', user.id);
  }, [user, router, form]);


  useEffect(() => {
    if (state.success && state.user) {
        toast({
            title: "Profile Complete!",
            description: "Your details have been saved. Welcome to your dashboard!",
        });
        logInUser(state.user, false); 
        router.push('/dashboard');
    } else if (state.error) {
        toast({
            title: "Update Failed",
            description: state.error,
            variant: "destructive",
        });
    }
  }, [state, toast, logInUser, router]);


  const availableDistricts = useMemo(() => {
    if (selectedState && DistrictsByState[selectedState as keyof typeof DistrictsByState]) {
      return DistrictsByState[selectedState as keyof typeof DistrictsByState];
    }
    return [];
  }, [selectedState]);

  useEffect(() => {
    const currentDistrict = form.getValues('district');
    if (selectedState && currentDistrict && !availableDistricts.includes(currentDistrict)) {
      form.setValue('district', '');
    }
  }, [selectedState, form, availableDistricts]);

  const onClientSubmit = (data: FullCustomerDetailsValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else if (value !== null && value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });
    formAction(formData);
  };

  if (!user) {
      return <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onClientSubmit)} className="space-y-8">
        
        <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Plan & Preferences</h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
            <FormField
                control={form.control}
                name="subscriptionPlan"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center"><ShieldCheck className="mr-2 h-4 w-4 text-primary" />Subscription Plan<span className="text-destructive ml-1">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} name={field.name} disabled={!!planFromUrl}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select your plan" /></SelectTrigger></FormControl>
                    <SelectContent>{SubscriptionPlans.map(option => ( <SelectItem key={option} value={option}>{option}</SelectItem> ))}</SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="vehiclePreference"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4 text-primary" />Vehicle Preference<span className="text-destructive ml-1">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} name={field.name}><FormControl><SelectTrigger><SelectValue placeholder="Select vehicle type" /></SelectTrigger></FormControl><SelectContent>{VehiclePreferenceOptions.map(option => ( <SelectItem key={option} value={option}>{option}</SelectItem> ))}</SelectContent></Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="trainerPreference"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center"><UserCheck className="mr-2 h-4 w-4 text-primary" />Trainer Preference<span className="text-destructive ml-1">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} name={field.name} disabled={!selectedGender}><FormControl><SelectTrigger><SelectValue placeholder={!selectedGender ? "Select gender first" : "Select trainer preference"} /></SelectTrigger></FormControl><SelectContent>{trainerOptions.map(option => ( <SelectItem key={option} value={option}>{option}</SelectItem> ))}</SelectContent></Select>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="subscriptionStartDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" />Preferred Start Date<span className="text-destructive ml-1">*</span></FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">License Details</h3>
         <FormField
          control={form.control}
          name="dlStatus"
          render={({ field }) => (
              <FormItem>
              <FormLabel className="flex items-center">Driving License Status<span className="text-destructive ml-1">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
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

        {(dlStatus === 'Already Have DL') && (
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
        
        <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Address & ID Details</h3>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                    value={field.value}
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

        <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Photo ID & Referral</h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
            <FormField
                control={form.control}
                name="photoIdType"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center"><CreditCard className="mr-2 h-4 w-4 text-primary" />Photo ID Type<span className="text-destructive ml-1">*</span></FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
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
         <FormField
            control={form.control}
            name="photoIdFile"
            render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                <FormLabel className="flex items-center"><FileUp className="mr-2 h-4 w-4 text-primary" />Upload Photo ID<span className="text-destructive ml-1">*</span></FormLabel>
                <FormControl>
                    <Input
                    type="file"
                    {...fieldProps}
                    onChange={(event) => {
                       const file = event.target.files?.[0];
                       if (file) {
                           onChange(file);
                       }
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    />
                </FormControl>
                <FormDescription>
                    Upload a clear copy of your selected Photo ID (PDF, JPG, PNG).
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
        />
         <FormField
            control={form.control}
            name="referralCode"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center"><Gift className="mr-2 h-4 w-4 text-primary" />Referral Code (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="Enter referral code if you have one" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <div className="flex justify-end pt-4 border-t">
          <SubmitButton />
        </div>
      </form>
    </Form>
  );
}
