
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/shared/app-logo';
import { HelpCircle } from 'lucide-react';

const signUpSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
  gender: z.enum(['M', 'F']),
  legalEntityType: z.enum(['I', 'B']),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUpPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      gender: 'M',
      legalEntityType: 'I',
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      // The API doesn't seem to have a password field for user creation, which is a major security issue.
      // We will proceed as per the spec, but this needs to be addressed in a real application.
      const response = await api.post('/users', {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        legalEntityType: data.legalEntityType,
      });

      if (response.status === 200 || response.status === 201) {
        toast({
          title: "Account Created!",
          description: "Your account has been successfully created. You can now log in.",
          duration: 7000,
        });
        router.push('/login');
      } else {
        throw new Error(response.data.message || 'Failed to create account.');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      const errorMessage = error.response?.data?.message || "An error occurred during sign up.";
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
              <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormControl><Input placeholder="First Name" {...field} className="bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormControl><Input placeholder="Last Name" {...field} className="bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormControl><Input type="email" placeholder="Email" {...field} className="bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormControl><Input type="password" placeholder="Password" {...field} className="bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormControl><Input type="password" placeholder="Confirm Password" {...field} className="bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" /></FormControl><FormMessage /></FormItem> )} />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="gender" render={({ field }) => ( <FormItem> <FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="M">Male</SelectItem><SelectItem value="F">Female</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="legalEntityType" render={({ field }) => ( <FormItem> <FormLabel>Entity</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select entity" /></SelectTrigger></FormControl><SelectContent><SelectItem value="I">Individual</SelectItem><SelectItem value="B">Business</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
              </div>

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
