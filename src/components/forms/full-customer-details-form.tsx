

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useFormState } from 'react-dom';
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
  VehiclePreferenceOptions,
  SubscriptionPlans,
  DLStatusOptions,
  PhotoIdTypeOptions,
  TrainerPreferenceOptions,
  IndianStates,
  DistrictsByState,
  type UserProfile,
} from '@/types';
import { completeCustomerProfileAction } from '@/lib/server-actions';
import { UserCheck as UserCheckIcon, Home, MapPin, CalendarIcon as CalendarIconLucid, Loader2, Gift, Car, Bike, BadgePercent, ScanLine, CreditCard, FileUp } from 'lucide-react'; 
import { useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { useAuth } from '@/context/auth-context';

interface FullCustomerDetailsFormProps {
  user: UserProfile;
  plan: string;
  onFormSubmit: () => void;
}

export default function FullCustomerDetailsForm({ user, plan, onFormSubmit }: FullCustomerDetailsFormProps) {
  const { toast } = useToast();
  const { logInUser } = useAuth();

  const [state, formAction] = useFormState(completeCustomerProfileAction, { success: false, error: undefined, user: undefined });

  const form = useForm<FullCustomerDetailsValues>({
    resolver: zodResolver(FullCustomerDetailsSchema),
    defaultValues: {
        userId: user.id, // Include user ID in the form data
        subscriptionPlan: plan || '',
        vehiclePreference: '',
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
        photoIdFile: undefined,
        subscriptionStartDate: undefined,
        referralCode: '',
    },
    mode: 'onChange',
  });

  const dlStatus = form.watch('dlStatus');
  const selectedState = form.watch('state');

  useEffect(() => {
    if (state.success && state.user) {
        toast({
            title: "Profile Complete!",
            description: "Your details have been saved. You can now proceed to payment.",
        });
        logInUser(state.user, false); // Update user data in context
        onFormSubmit(); // Signal to the parent component that the profile is complete
    } else if (state.error) {
        toast({
            title: "Update Failed",
            description: state.error,
            variant: "destructive",
        });
    }
  }, [state, toast, onFormSubmit, logInUser]);


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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onClientSubmit)} className="space-y-8">
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
                    {SubscriptionPlans.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
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
                  <FormLabel className="flex items-center"><CalendarIconLucid className="mr-2 h-4 w-4 text-primary" />Subscription Start Date<span className="text-destructive ml-1">*</span></FormLabel>
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
                          <CalendarIconLucid className="ml-auto h-4 w-4 opacity-50" />
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
              <FormLabel className="flex items-center"><UserCheckIcon className="mr-2 h-4 w-4 text-primary" />Driving License Status<span className="text-destructive ml-1">*</span></FormLabel>
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

        <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Photo ID & Referral</h3>
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
          <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving Details...</> : "Continue to Payment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    