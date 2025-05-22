
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const otpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits.' }).regex(/^\d+$/, {message: "OTP must be numeric"}),
});

type OTPFormValues = z.infer<typeof otpSchema>;

const OTPVerificationPage: NextPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState<string | null>(null); 
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    // This page is no longer directly used by the primary email/password + Google auth flow.
    // Firebase handles email verification via links sent to the user's email.
    // This page could be repurposed for other OTP needs (e.g., phone verification) if added later.
    setInfoMessage("This OTP verification page is not currently used for standard email/password or Google sign-in flows. Firebase handles email verification directly via email links.");

    // Example: You might get an email from query params if you redirect here for some custom flow
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setEmail(queryEmail);
    } else {
       // setEmail("user@example.com"); // Placeholder if no email is passed
    }
  }, [searchParams]);

  const form = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const onSubmit = async (data: OTPFormValues) => {
    // This submission logic would need to be implemented based on a specific OTP service
    // if this page were to be actively used.
    console.log('OTP data (currently not processed):', data);
    toast({
      title: "OTP Submitted (Placeholder)",
      description: "This OTP verification is a placeholder and not connected to a backend service.",
    });

    // Example: Redirect based on a 'reason' param, if this page were part of a flow
    const reason = searchParams.get('reason');
    if (reason === 'custom_flow') {
      router.push('/dashboard'); 
    }
  };

  return (
    <CenteredCardLayout title="OTP Verification (Under Review)">
      {infoMessage && (
         <Alert className="mb-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Developer Note</AlertTitle>
          <AlertDescription>
            {infoMessage}
          </AlertDescription>
        </Alert>
      )}
      <p className="text-center text-muted-foreground mb-6">
        If you were expecting to enter an OTP, ensure you are following the correct application flow.
        {email && ` For operations related to ${email}, check your email for instructions.`}
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
                    disabled // Disabled as this page is not fully functional in the current auth flow
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || true}>
            {form.formState.isSubmitting ? 'Verifying...' : 'Continue (Disabled)'}
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center text-sm">
        <Button variant="link" className="p-0 h-auto text-primary" disabled>
          Resend Code (Disabled)
        </Button>
      </div>
       <div className="mt-4 text-center text-sm">
        <Link href="/login" legacyBehavior>
          <a className="font-medium text-primary hover:underline">Back to Login</a>
        </Link>
      </div>
    </CenteredCardLayout>
  );
};

export default OTPVerificationPage;
