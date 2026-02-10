
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const ResetPasswordSchema = z.object({
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof ResetPasswordSchema>;

function ResetPasswordForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Handle both 'token' (user prompt) and 'oobCode' (Firebase standard)
  const code = searchParams.get('token') || searchParams.get('oobCode');
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const { formState: { isSubmitting } } = form;

  useEffect(() => {
    if (!code) {
      setIsVerifying(false);
      return;
    }

    verifyPasswordResetCode(auth, code)
      .then((userEmail) => {
        setEmail(userEmail);
        setIsValidCode(true);
        setIsVerifying(false);
      })
      .catch((error) => {
        console.error("Token verification error:", error);
        setIsVerifying(false);
      });
  }, [code]);

  async function onSubmit(data: ResetPasswordValues) {
    if (!code) return;

    try {
      await confirmPasswordReset(auth, code, data.password);
      setIsSuccess(true);
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been updated. You can now log in with your new password.',
      });
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Could not reset password. The link may have expired.",
        variant: "destructive",
      });
    }
  }

  if (isVerifying) {
    return (
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Verifying reset link...</p>
        </CardContent>
      </Card>
    );
  }

  if (!code || !isValidCode) {
    return (
      <Card className="w-full max-w-md shadow-xl border-t-4 border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex items-center justify-center rounded-full bg-destructive/10 p-3 w-fit">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle>Invalid or Expired Link</CardTitle>
          <CardDescription>
            This password reset link is invalid, has already been used, or has expired.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/forgot-password">Request New Link</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md shadow-xl border-t-4 border-green-500">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex items-center justify-center rounded-full bg-green-100 p-3 w-fit">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle>Password Reset Complete</CardTitle>
          <CardDescription>
            Successfully updated password for <strong>{email}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">Redirecting you to login page...</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10 p-3 w-fit">
          <KeyRound className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Choose a new strong password for <strong>{email}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <Label>New Password</Label>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-primary"
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
                  <Label>Confirm New Password</Label>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Updating...</> : 'Reset Password'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center p-4 min-h-[calc(100vh-10rem)]">
      <Suspense fallback={
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
