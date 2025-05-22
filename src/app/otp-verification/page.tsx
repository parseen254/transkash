
"use client";

import type { NextPage } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useEffect, useState, Suspense } from 'react'; // Import Suspense
import Link from 'next/link';

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

// This component contains the logic using useSearchParams
const OtpVerificationFormContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams(); // The hook is used here
  const { toast } = useToast();
  const [email, setEmail] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    setInfoMessage("This OTP verification page is not currently used for standard email/password or Google sign-in flows. Firebase handles email verification directly via email links.");
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setEmail(queryEmail);
    }
  }, [searchParams]);

  const form = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const onSubmit = async (data: OTPFormValues) => {
    console.log('OTP data (currently not processed):', data);
    toast({
      title: "OTP Submitted (Placeholder)",
      description: "This OTP verification is a placeholder and not connected to a backend service.",
    });
    const reason = searchParams.get('reason');
    if (reason === 'custom_flow') {
      router.push('/dashboard');
    }
  };

  return (
    <>
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
    </>
  );
};

const OTPVerificationPage: NextPage = () => {
  return (
    <CenteredCardLayout title="OTP Verification (Under Review)">
      <Suspense fallback={<div className="text-center text-muted-foreground p-6">Loading verification details...</div>}>
        <OtpVerificationFormContent />
      </Suspense>
    </CenteredCardLayout>
  );
};

export default OTPVerificationPage;
