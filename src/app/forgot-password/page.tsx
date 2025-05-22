"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

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
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Forgot password for email:', data.email);
    toast({
      title: "Password Reset Email Sent",
      description: `If an account exists for ${data.email}, you will receive password reset instructions.`,
    });
    // Potentially redirect to a confirmation page or login
    // router.push('/login');
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
