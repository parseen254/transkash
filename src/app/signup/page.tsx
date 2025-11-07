
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/shared/app-logo';
import { HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const signUpSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUpPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { signUp } = useAuth();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      await signUp(data.email, data.password, data.displayName);
      
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account before logging in.",
        duration: 7000,
      });
      router.push('/please-verify-email');
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      let errorMessage = "An error occurred during sign up.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak.";
      }
      
      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

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
          <h1 className="text-3xl font-semibold text-center text-foreground">
            Create your account
          </h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="displayName" render={({ field }) => ( <FormItem><FormControl><Input placeholder="Full Name" {...field} className="bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormControl><Input type="email" placeholder="Email" {...field} className="bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormControl><Input type="password" placeholder="Password" {...field} className="bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormControl><Input type="password" placeholder="Confirm Password" {...field} className="bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" /></FormControl><FormMessage /></FormItem> )} />

              <Button type="submit" className="w-full h-12 rounded-lg text-base" disabled={form.formState.isSubmitting} variant="default">
                {form.formState.isSubmitting ? 'Signing up...' : 'Sign up'}
              </Button>
            </form>
          </Form>
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" legacyBehavior>
              <a className="font-medium text-primary hover:underline">Log in</a>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUpPage;
