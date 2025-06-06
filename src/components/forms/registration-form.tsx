
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
  PhotoIdTypeOptions, // Added PhotoIdTypeOptions
  type CustomerRegistrationFormValues,
  type TrainerRegistrationFormValues,
} from '@/types';
import { addCustomer, addTrainer } from '@/lib/mock-data'; // Import add functions
import { User, UserCog, Car, Bike, FileText, ShieldCheck, ScanLine, UserSquare2, Fuel, Users, Contact, BadgePercent, FileUp, CreditCard } from 'lucide-react'; 
import { useMemo } from 'react';

interface RegistrationFormProps {
  userRole: 'customer' | 'trainer';
}

export default function RegistrationForm({ userRole }: RegistrationFormProps) {
  const { toast } = useToast();

  const defaultValues = useMemo((): RegistrationFormValues => {
    const base = {
      userRole: userRole,
      name: '',
      email: '',
      phone: '',
      location: '',
      gender: '', 
    };
    if (userRole === 'customer') {
      return {
        ...base,
        subscriptionPlan: '', 
        vehiclePreference: undefined,
        dlStatus: '',
        dlNumber: '',
        dlTypeHeld: '',
        dlFileCopy: undefined,
        photoIdType: '', // Default for select
        photoIdNumber: '',
        photoIdFile: undefined,
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
        trainerCertificateFile: undefined, 
        aadhaarCardNumber: '',
        aadhaarCardFile: undefined, 
        drivingLicenseNumber: '',
        drivingLicenseFile: undefined, 
      } as TrainerRegistrationFormValues;
    }
  }, [userRole]);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(RegistrationFormSchema),
    defaultValues,
    mode: 'onChange', // To enable watching fields and re-validating
  });

  const dlStatus = form.watch('dlStatus'); // Watch for changes in dlStatus for customers

  function onSubmit(data: RegistrationFormValues) {
    console.log('Registration Data:', data);

    let registrationMessage = "";

    if (data.userRole === 'customer') {
      const customerData = data as CustomerRegistrationFormValues;
      const newCustomer = addCustomer(customerData);
      registrationMessage = `${newCustomer.name} (ID: ${newCustomer.uniqueId}) has been successfully registered as a customer.`;
      console.log('Customer DL File (if any):', customerData.dlFileCopy?.[0]?.name);
      console.log('Customer Photo ID Type:', customerData.photoIdType);
      console.log('Customer Photo ID Number:', customerData.photoIdNumber);
      console.log('Customer Photo ID File:', customerData.photoIdFile?.[0]?.name);
    } else if (data.userRole === 'trainer') {
      const newTrainer = addTrainer(data as TrainerRegistrationFormValues);
      registrationMessage = `${newTrainer.name} (ID: ${newTrainer.uniqueId}) has been successfully registered as a trainer.`;
      console.log('Trainer Certificate File:', (data as TrainerRegistrationFormValues).trainerCertificateFile?.[0]?.name);
      console.log('Aadhaar Card File:', (data as TrainerRegistrationFormValues).aadhaarCardFile?.[0]?.name);
      console.log('Driving License File:', (data as TrainerRegistrationFormValues).drivingLicenseFile?.[0]?.name);
    }

    toast({
      title: `${userRole === 'customer' ? 'Customer' : 'Trainer'} Registered!`,
      description: registrationMessage,
    });
    form.reset(defaultValues); // Reset form after submission with memoized default values
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-primary" />Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Contact className="mr-2 h-4 w-4 text-primary" />Email Address</FormLabel>
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
                <FormControl>
                  <Input type="tel" placeholder="Enter phone number" {...field} />
                </FormControl>
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
                <FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4 text-primary" />Location</FormLabel>
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
                <FormLabel className="flex items-center"><Users className="mr-2 h-4 w-4 text-primary" />Gender</FormLabel>
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
            <FormField
              control={form.control}
              name="subscriptionPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><BadgePercent className="mr-2 h-4 w-4 text-primary" />Subscription Plan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
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
            <FormField
              control={form.control}
              name="vehiclePreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Bike className="mr-2 h-4 w-4 text-primary" />Vehicle Preference</FormLabel>
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
            
            <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Driving License Details</h3>
            <FormField
              control={form.control}
              name="dlStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><UserSquare2 className="mr-2 h-4 w-4 text-primary" />Driving License Status</FormLabel>
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
                <FormField
                    control={form.control}
                    name="dlFileCopy"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload DL Copy</FormLabel>
                        <FormControl>
                            <Input 
                              type="file" 
                              {...fieldProps} 
                              onChange={(event) => onChange(event.target.files)}
                              accept=".pdf,.jpg,.jpeg,.png"
                            />
                        </FormControl>
                        <FormDescription>PDF, JPG, PNG accepted.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              </>
            )}

            <h3 className="text-lg font-medium leading-6 text-foreground pt-4 border-b pb-2 mb-6">Photo ID Verification</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                <FormField
                    control={form.control}
                    name="photoIdType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center"><CreditCard className="mr-2 h-4 w-4 text-primary" />Photo ID Type</FormLabel>
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
                        <FormLabel className="flex items-center"><ScanLine className="mr-2 h-4 w-4 text-primary" />Photo ID Number</FormLabel>
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
                    <FormLabel className="flex items-center"><FileUp className="mr-2 h-4 w-4 text-primary" />Upload Photo ID Document</FormLabel>
                    <FormControl>
                        <Input 
                            type="file" 
                            {...fieldProps} 
                            onChange={(event) => onChange(event.target.files)}
                            accept=".pdf,.jpg,.jpeg,.png"
                        />
                    </FormControl>
                    <FormDescription>PDF, JPG, PNG accepted. This is required.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
          </>
        )}

        {userRole === 'trainer' && (
          <>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                <FormField
                control={form.control}
                name="yearsOfExperience"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center"><ShieldCheck className="mr-2 h-4 w-4 text-primary" />Years of Experience</FormLabel>
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
                    <FormLabel className="flex items-center"><Bike className="mr-2 h-4 w-4 text-primary" />Specialization</FormLabel>
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
                        <FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4 text-primary" />Type of Vehicle Used for Training</FormLabel>
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
                        <FormLabel className="flex items-center"><ScanLine className="mr-2 h-4 w-4 text-primary" />Vehicle Registration Number</FormLabel>
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
                    <FormLabel className="flex items-center"><Fuel className="mr-2 h-4 w-4 text-primary" />Type of Fuel</FormLabel>
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

            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                <FormField
                    control={form.control}
                    name="trainerCertificateNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><ShieldCheck className="mr-2 h-4 w-4 text-primary" />Trainer Certificate No.</FormLabel>
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
                        <FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Trainer Certificate</FormLabel>
                        <FormControl>
                            <Input 
                              type="file" 
                              {...fieldProps} 
                              onChange={(event) => onChange(event.target.files)}
                              accept=".pdf,.jpg,.jpeg,.png"
                            />
                        </FormControl>
                        <FormDescription>PDF, JPG, PNG accepted.</FormDescription>
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
                        <FormLabel className="flex items-center"><ScanLine className="mr-2 h-4 w-4 text-primary" />Aadhaar Card No.</FormLabel>
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
                        <FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Aadhaar Card</FormLabel>
                        <FormControl>
                            <Input 
                              type="file" 
                              {...fieldProps} 
                              onChange={(event) => onChange(event.target.files)}
                              accept=".pdf,.jpg,.jpeg,.png"
                            />
                        </FormControl>
                         <FormDescription>PDF, JPG, PNG accepted.</FormDescription>
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
                        <FormLabel className="flex items-center"><UserSquare2 className="mr-2 h-4 w-4 text-primary" />Driving License No.</FormLabel>
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
                        <FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Driving License</FormLabel>
                        <FormControl>
                           <Input 
                              type="file" 
                              {...fieldProps} 
                              onChange={(event) => onChange(event.target.files)}
                              accept=".pdf,.jpg,.jpeg,.png"
                            />
                        </FormControl>
                         <FormDescription>PDF, JPG, PNG accepted.</FormDescription>
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

