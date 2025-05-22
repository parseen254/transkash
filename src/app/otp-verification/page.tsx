"use client";

import type { NextPage } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CenteredCardLayout } from '@/components/layouts/centered-card-layout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const otpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits.' }).regex(/^\d+$/, {message: "OTP must be numeric"}),
});

type OTPFormValues = z.infer<typeof otpSchema>;

const OTPVerificationPage: NextPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState<string | null>(null); // Or phone

  useEffect(() => {
    // In a real app, get the email/phone from context, state, or query param for display
    setEmail("user@example.com"); // Placeholder
  }, []);

  const form = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const onSubmit = async (data: OTPFormValues) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('OTP data:', data);
    
    const reason = searchParams.get('reason');
    if (reason === 'signup' || reason === 'login') {
      toast({
        title: "Verification Successful!",
        description: "Redirecting to your dashboard...",
      });
      router.push('/dashboard');
    } else if (reason === 'password_reset') {
      toast({
        title: "Verification Successful!",
        description: "You can now reset your password.",
      });
      router.push('/reset-password'); // Hypothetical page
    } else {
       toast({
        title: "Verification Successful!",
      });
      router.push('/dashboard'); // Default redirect
    }
  };

  return (
    <CenteredCardLayout title="Verify Your Account">
      <p className="text-center text-muted-foreground mb-6">
        Enter the 6-digit code sent to {email || "your registered email/phone"}.
      </p>
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
                    className="text-center text-2xl tracking-[0.5em]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Verifying...' : 'Continue'}
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center text-sm">
        Didn't receive the code?{' '}
        <Button variant="link" className="p-0 h-auto text-primary">
          Resend Code
        </Button>
      </div>
    </CenteredCardLayout>
  );
};

export default OTPVerificationPage;
