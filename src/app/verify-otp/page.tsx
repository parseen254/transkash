
"use client";

import type { NextPage } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/shared/app-logo';
import { HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const otpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits.' }).regex(/^\d+$/, {message: "OTP must be numeric"}),
});

type OTPFormValues = z.infer<typeof otpSchema>;

const OTPVerificationContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth(); // Get current Firebase user
  const [email, setEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setEmail(queryEmail);
    } else if (user?.email) { // Fallback to authenticated user's email if no query param
        setEmail(user.email);
    }
  }, [searchParams, user]);

  const form = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const onSubmit = async (data: OTPFormValues) => {
    setIsSubmitting(true);
    console.log("User-entered OTP:", data.otp);
    console.log("Backend Action Needed: Verify OTP for email:", email, "with entered OTP:", data.otp);

    // Simulate backend OTP verification
    // In a real app, this would be an API call to your backend (e.g., Firebase Function)
    // The backend would check the OTP against the one stored for the user.
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    const MOCK_VALID_OTP = "123456"; // For demo purposes

    if (data.otp === MOCK_VALID_OTP) {
      toast({
        title: "OTP Verified",
        description: "You are being redirected to the dashboard.",
      });
      // In a real app, the backend might set a custom claim or session flag
      // For now, we assume if OTP is good, they proceed.
      router.push('/dashboard');
    } else {
      toast({
        title: "OTP Verification Failed",
        description: "The OTP you entered is incorrect. Please try again.",
        variant: "destructive",
      });
      form.setError("otp", { type: "manual", message: "Invalid OTP."});
    }
    setIsSubmitting(false);
  };

  const handleResendOtp = async () => {
    if (!email) {
        toast({ title: "Error", description: "Email address not found.", variant: "destructive"});
        return;
    }
    console.log("Backend Action Needed: Resend OTP to email:", email);
    // Simulate backend call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
        title: "OTP Resent",
        description: "A new OTP has been sent to your email address (simulated).",
    });
  };


  if (!email && !user) {
    return (
        <div className="text-center text-muted-foreground p-6">
            <p>Loading user information or invalid access...</p>
            <Link href="/login" className="text-primary hover:underline mt-2 block">Go to Login</Link>
        </div>
    )
  }


  return (
    <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground">
            Verify Your Identity
        </h1>
        <p className="mt-2 text-muted-foreground">
            An OTP has been sent to {email || "your email address"}. Please enter it below.
        </p>
        </div>
        
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="sr-only">OTP Code</FormLabel>
                <FormControl>
                    <Input
                    placeholder="123456"
                    {...field}
                    maxLength={6}
                    className="bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base text-center tracking-[0.3em]"
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" className="w-full h-12 rounded-lg text-base" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </Button>
        </form>
        </Form>

        <div className="text-center text-sm">
            <Button variant="link" onClick={handleResendOtp} className="text-primary p-0 h-auto hover:underline" disabled={isSubmitting}>
                Didn't receive the code? Resend OTP
            </Button>
        </div>
        <div className="text-center text-sm">
            <Link href="/login" legacyBehavior>
            <a className="font-medium text-primary hover:underline">Back to Login</a>
            </Link>
        </div>
         <p className="mt-4 text-xs text-center text-muted-foreground">
            For demonstration, use OTP: <strong>123456</strong>
        </p>
    </div>
  );
};


const VerifyOTPPage: NextPage = () => {
  return (
    <div className="relative min-h-screen bg-background">
        <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
            <AppLogo />
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-6 w-6" />
            </Button>
        </header>
        <main className="flex min-h-screen flex-col items-center justify-center p-4 pt-20">
            <Suspense fallback={<div className="text-center text-muted-foreground p-6">Loading OTP form...</div>}>
                <OTPVerificationContent />
            </Suspense>
        </main>
    </div>
  );
};

export default VerifyOTPPage;
