"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CenteredCardLayout } from '@/components/layouts/centered-card-layout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Login data:', data);
    toast({
      title: "Login Successful",
      description: "Redirecting to dashboard...",
    });
    router.push('/otp-verification?reason=login'); // Or to dashboard after OTP
  };

  return (
    <CenteredCardLayout title="Login to Your Account">
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center text-sm">
        <Link href="/forgot-password" legacyBehavior>
          <a className="font-medium text-primary hover:underline">Forgot Password?</a>
        </Link>
      </div>
      <div className="mt-4 text-center text-sm">
        New to SwitchLink?{' '}
        <Link href="/signup" legacyBehavior>
          <a className="font-medium text-primary hover:underline">Create an account</a>
        </Link>
      </div>
    </CenteredCardLayout>
  );
};

export default LoginPage;
