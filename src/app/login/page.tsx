
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { signInWithEmailAndPassword, signInWithRedirect, getRedirectResult, type User as FirebaseUser } from 'firebase/auth';
import { auth, googleAuthProvider, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { HelpCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AppLogo } from '@/components/shared/app-logo';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/lib/types';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.6402 9.18199C17.6402 8.56379 17.582 7.96379 17.4748 7.38199H9V10.811H13.8438C13.6366 11.9702 13.001 12.923 12.0476 13.5612V15.819H14.9562C16.6582 14.2528 17.6402 11.9456 17.6402 9.18199Z" fill="#4285F4"/>
    <path d="M9.00001 18.0002C11.4307 18.0002 13.4698 17.1932 14.9562 15.8191L12.0476 13.5613C11.2406 14.0853 10.211 14.4205 9.00001 14.4205C6.65592 14.4205 4.67164 12.8374 3.96412 10.71H0.957031V13.0418C2.43823 15.9832 5.48183 18.0002 9.00001 18.0002Z" fill="#34A853"/>
    <path d="M3.96412 10.7098C3.78437 10.1725 3.67612 9.59979 3.67612 8.99989C3.67612 8.39999 3.78437 7.82739 3.96412 7.28989V4.95801H0.957031C0.347841 6.17319 0 7.54789 0 8.99989C0 10.4519 0.347841 11.8266 0.957031 13.0418L3.96412 10.7098Z" fill="#FBBC05"/>
    <path d="M9.00001 3.57955C10.3214 3.57955 11.5076 4.03375 12.4403 4.92555L15.0219 2.344C13.4626 0.891955 11.4235 0 9.00001 0C5.48183 0 2.43823 2.01695 0.957031 4.95805L3.96412 7.29C4.67164 5.16275 6.65592 3.57955 9.00001 3.57955Z" fill="#EA4335"/>
  </svg>
);


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

  const handleSuccessfulLogin = async (user: FirebaseUser) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
    } else { 
      if (user.providerData.some(p => p.providerId === 'google.com')) {
        const newUserProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          provider: 'google.com',
        };
        await setDoc(userRef, newUserProfile);
      }
    }
    
    toast({
      title: "Login Successful",
      description: "Redirecting to dashboard...",
    });
    router.push('/dashboard');
  };


  useEffect(() => {
    const processRedirect = async () => {
      setIsProcessingRedirect(true);
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          if (!user.emailVerified && user.providerData.some(p => p.providerId === 'password')) {
             // This case should ideally not happen often with redirect,
             // as unverified email/password users are handled in onSubmit.
             // But if it does, or for other providers that might need verification:
            router.push(`/please-verify-email?email=${encodeURIComponent(user.email || '')}`);
            return;
          }
          toast({
            title: "Google Sign-In Successful",
            description: "Processing your details...",
          });
          await handleSuccessfulLogin(user);
        }
      } catch (error: any) {
        console.error('Google Sign-In redirect error:', error);
        let errorMessage = error.message || "An error occurred with Google Sign-In. Please try again.";
        if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = "An account already exists with this email address using a different sign-in method.";
        } else if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = "The sign-in window was closed before completing. Please try again.";
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmittingManual(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (user && !user.emailVerified) {
        // User is signed in, but email is not verified. Redirect to verification page.
        // Do NOT sign them out here, so `auth.currentUser` is available on the next page.
        router.push(`/please-verify-email?email=${encodeURIComponent(data.email)}`);
        setIsSubmittingManual(false);
        return;
      }
      
      // If email is verified or it's not an email/password provider that requires it (e.g. Google)
      await handleSuccessfulLogin(user);

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
    setIsSubmittingManual(true); 
    try {
      // For Google, email is typically pre-verified or verification isn't an intermediate step.
      await signInWithRedirect(auth, googleAuthProvider);
      // The redirect result will be handled by the useEffect hook.
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

      <main className="flex min-h-screen flex-col items-center justify-center p-4 pt-20">
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
            className="w-full h-12 rounded-lg text-base text-foreground flex items-center justify-center gap-2" 
            onClick={handleGoogleSignIn} 
            disabled={isFormSubmitting}
          >
            <GoogleIcon />
            Continue with Google
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
    
