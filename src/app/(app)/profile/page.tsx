'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { fetchUserById, updateUserProfile, changeUserPassword } from '@/lib/mock-data';
import type { UserProfile, UserProfileUpdateValues, ChangePasswordValues } from '@/types';
import { UserProfileUpdateSchema, ChangePasswordSchema } from '@/types';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import Loading from '@/app/loading';
import { User, KeyRound, Mail, Phone, MapPin, Loader2, Camera } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Locations } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from 'next/image';

function ProfileUpdateForm({ profile }: { profile: UserProfile }) {
  const { toast } = useToast();
  const { logInUser } = useAuth();
  const [preview, setPreview] = useState<string | null>(profile.photoURL || null);

  const form = useForm<UserProfileUpdateValues>({
    resolver: zodResolver(UserProfileUpdateSchema),
    defaultValues: {
      name: profile.name || '',
      email: profile.contact || '',
      phone: profile.phone || '',
      location: profile.location || '',
      photo: undefined,
    },
  });

  async function onSubmit(data: UserProfileUpdateValues) {
    const updatedProfile = await updateUserProfile(profile.id, data);
    if (updatedProfile) {
      toast({
        title: "Profile Updated",
        description: "Your personal information has been successfully updated.",
      });
      // Re-login user to update session/context data like displayName and photoURL
      logInUser(updatedProfile, false); 
    } else {
      toast({
        title: "Update Failed",
        description: "Could not update your profile. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('photo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <Card className="shadow-lg">
       <CardHeader>
        <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5 text-primary" /> Personal Information</CardTitle>
        <CardDescription>Update your personal details and profile picture here.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-md">
                <AvatarImage src={preview || undefined} alt={profile.name} />
                <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <FormField
                control={form.control}
                name="photo"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <Button asChild variant="outline" className="relative">
                        <label htmlFor="photo-upload" className="cursor-pointer">
                          <Camera className="mr-2 h-4 w-4" />
                          Change Photo
                          <Input 
                            id="photo-upload"
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer sr-only"
                            accept="image/png, image/jpeg"
                            onChange={handlePhotoChange}
                          />
                        </label>
                      </Button>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4" />Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4" />Email Address</FormLabel>
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
                  <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4" />Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4" />Location</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PasswordChangeForm({ userId }: { userId: string }) {
  const { toast } = useToast();
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  async function onSubmit(data: ChangePasswordValues) {
    const success = await changeUserPassword(userId, data.currentPassword, data.newPassword);
    if (success) {
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      });
      form.reset();
    } else {
      toast({
        title: "Error",
        description: "Your current password was incorrect. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5 text-primary" /> Change Password</CardTitle>
        <CardDescription>Update your login password here.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your current password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter a new password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirm your new password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                 {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      setLoading(true);
      fetchUserById(user.uid).then(userProfile => {
        if (userProfile) {
          setProfile(userProfile);
        }
        setLoading(false);
      });
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  if (loading || authLoading) {
    return <Loading />;
  }

  if (!profile) {
    return <div className="text-center p-8">User profile not found. Please try logging in again.</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8 space-y-8">
      <ProfileUpdateForm profile={profile} />
      <PasswordChangeForm userId={profile.id} />
    </div>
  );
}
