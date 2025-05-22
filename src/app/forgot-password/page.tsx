
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
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'; // Removed FormLabel
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/shared/app-logo';
import { HelpCircle } from 'lucide-react';

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
      // For security, always show a generic success-like message, even if user not found
      toast({
        title: "Password Reset Email Sent",
        description: `If an account exists for ${data.email}, you will receive password reset instructions. Please check your inbox (and spam folder).`,
        duration: 9000,
      });
      // Log specific errors for debugging if needed, but don't expose user-not-found to client
      if (error.code !== 'auth/user-not-found') {
         // Optionally log other errors if they are not user-not-found
         console.error('Specific forgot password error (not user-not-found):', error.code);
      }
    }
  };
  
  const isFormSubmitting = form.formState.isSubmitting;

  return (
    <div className="relative min-h-screen bg-background">
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
        <AppLogo />
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-6 w-6" />
        </Button>
      </header>

      <main className="flex min-h-screen flex-col items-center justify-center p-4 pt-20">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-foreground">
              Forgot Password?
            </h1>
            <p className="mt-2 text-muted-foreground">
              No worries, we'll send you reset instructions.
            </p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    {/* No FormLabel as per design */}
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Email" 
                        {...field} 
                        className="bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 rounded-lg text-base" disabled={isFormSubmitting} variant="default">
                {isFormSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Remember your password? </span>
            <Link href="/login" legacyBehavior>
              <a className="font-medium text-primary hover:underline">Log in</a>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;
