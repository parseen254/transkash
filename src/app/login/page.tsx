
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { signInWithEmailAndPassword, signInWithRedirect, sendEmailVerification, getRedirectResult } from 'firebase/auth';
import { auth, googleAuthProvider, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'; // Removed FormLabel as per design
import { useToast } from '@/hooks/use-toast';
import { HelpCircle } from 'lucide-react'; // Added HelpCircle
import React, { useEffect, useState } from 'react';
import { AppLogo } from '@/components/shared/app-logo'; // Added AppLogo
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    const processRedirect = async () => {
      setIsProcessingRedirect(true);
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          toast({
            title: "Google Sign-In Successful",
            description: "Processing your details...",
          });

          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              provider: 'google.com',
            });
          } else {
            await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
          }
          toast({
            title: "Login Successful",
            description: "Redirecting to dashboard...",
          });
          router.push('/dashboard');
        }
      } catch (error: any) {
        console.error('Google Sign-In redirect error:', error);
        let errorMessage = error.message || "An error occurred with Google Sign-In. Please try again.";
        if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = "An account already exists with this email address using a different sign-in method.";
        }
        toast({
          title: "Google Sign-In Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsProcessingRedirect(false);
      }
    };
    processRedirect();
  }, [router, toast]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmittingManual(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (user && !user.emailVerified) {
        await auth.signOut();
        await sendEmailVerification(user);
        toast({
          title: "Email Not Verified",
          description: "Your email address is not verified. We've sent a new verification link to your email. Please check your inbox (and spam folder).",
          variant: "destructive",
          duration: 9000,
        });
        form.reset();
        return;
      }
      
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });

      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
        ? "Invalid email or password. Please try again."
        : "An error occurred during login. Please try again.";
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmittingManual(true); // Also indicate loading for Google sign-in start
    try {
      await signInWithRedirect(auth, googleAuthProvider);
      toast({
        title: "Redirecting to Google...",
        description: "Please complete the sign-in with Google."
      });
    } catch (error: any) {
        console.error('Google Sign-In initiation error:', error);
        toast({
          title: "Google Sign-In Failed",
          description: error.message || "Could not initiate Google Sign-In. Please try again.",
          variant: "destructive",
        });
        setIsSubmittingManual(false);
    }
  };
  
  if (isProcessingRedirect) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const isFormSubmitting = form.formState.isSubmitting || isSubmittingManual;

  return (
    <div className="relative min-h-screen bg-background">
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
        <AppLogo />
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-6 w-6" />
        </Button>
      </header>

      <main className="flex min-h-screen flex-col items-center justify-center p-4 pt-20"> {/* Added pt-20 for header spacing */}
        <div className="w-full max-w-sm space-y-8">
          <h1 className="text-3xl font-semibold text-center text-foreground">
            Welcome back
          </h1>
          
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    {/* No FormLabel as per design */}
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
              <div className="text-right">
                <Link href="/forgot-password" legacyBehavior>
                  <a className="text-sm text-muted-foreground hover:text-primary hover:underline">
                    Forgot password?
                  </a>
                </Link>
              </div>
              <Button type="submit" className="w-full h-12 rounded-lg text-base" disabled={isFormSubmitting} variant="default">
                {isFormSubmitting ? 'Logging in...' : 'Log in'}
              </Button>
            </form>
          </Form>

          <div className="flex items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="mx-4 text-xs text-muted-foreground uppercase">Or continue with</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <Button 
            variant="secondary" 
            className="w-full h-12 rounded-lg text-base text-foreground" 
            onClick={handleGoogleSignIn} 
            disabled={isFormSubmitting}
          >
            {/* ChromeIcon removed as per design */}
            Google
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/signup" legacyBehavior>
              <a className="font-medium text-primary hover:underline">Sign up</a>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

    