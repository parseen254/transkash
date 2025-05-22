
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CenteredCardLayout } from '@/components/layouts/centered-card-layout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: NextPage = () => {
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      await sendPasswordResetEmail(auth, data.email);
      toast({
        title: "Password Reset Email Sent",
        description: `If an account exists for ${data.email}, you will receive password reset instructions. Please check your inbox (and spam folder).`,
        duration: 9000,
      });
      form.reset();
    } catch (error: any) {
      console.error('Forgot password error:', error);
      let errorMessage = "An error occurred. Please try again.";
      if (error.code === 'auth/user-not-found') {
        // Still show generic message for security, but log specific error
         toast({
            title: "Password Reset Email Sent",
            description: `If an account exists for ${data.email}, you will receive password reset instructions. Please check your inbox (and spam folder).`,
            duration: 9000,
        });
        return;
      }
      toast({
        title: "Error Sending Reset Email",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <CenteredCardLayout title="Forgot Your Password?">
      <p className="text-center text-muted-foreground mb-6">
        Enter your email address and we'll send you a link to reset your password.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center text-sm">
        Remember your password?{' '}
        <Link href="/login" legacyBehavior>
          <a className="font-medium text-primary hover:underline">Login</a>
        </Link>
      </div>
    </CenteredCardLayout>
  );
};

export default ForgotPasswordPage;
