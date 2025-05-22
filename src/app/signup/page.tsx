
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/shared/app-logo';
import { HelpCircle } from 'lucide-react';
import type { UserProfile } from '@/lib/types';

const signUpSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
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

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      
      const userRef = doc(db, "users", user.uid);
      // Explicitly type the object being set to Firestore
      const newUserProfileData: Omit<UserProfile, 'uid' | 'lastLoginAt' | 'updatedAt' | 'phone' | 'businessName' | 'photoURL'> & { uid: string; createdAt: any; provider: string; themePreference: 'system' } = {
        uid: user.uid,
        email: user.email,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: `${data.firstName} ${data.lastName}`,
        createdAt: serverTimestamp(),
        provider: 'password',
        themePreference: 'system', // Default theme preference
      };
      await setDoc(userRef, newUserProfileData);
      
      await sendEmailVerification(user);

      toast({
        title: "Account Created!",
        description: "A verification email has been sent. Please check your inbox to activate your account.",
        duration: 7000,
      });
      router.push(`/please-verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = "An error occurred during sign up. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already in use. Please try a different email or log in.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. Please choose a stronger password.";
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
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="First Name" 
                        {...field} 
                        className="bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="Last Name" 
                        {...field} 
                        className="bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Password" 
                        {...field} 
                        className="bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Confirm Password" 
                        {...field} 
                        className="bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
