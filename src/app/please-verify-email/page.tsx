
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/shared/app-logo';
import { HelpCircle, MailCheck } from 'lucide-react'; // Added MailCheck icon

const PleaseVerifyEmailContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user: currentUser, loading: authLoading } = useAuth(); // Get current Firebase user from context

  const [emailForVerification, setEmailForVerification] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) {
      setEmailForVerification(emailFromQuery);
    } else if (currentUser?.email) {
      setEmailForVerification(currentUser.email);
    }
  }, [searchParams, currentUser]);

  useEffect(() => {
    // If user becomes verified while on this page, redirect to dashboard
    if (currentUser?.emailVerified) {
      toast({ title: "Email Verified!", description: "Redirecting to your dashboard." });
      router.push('/dashboard');
    }
  }, [currentUser, router, toast]);

  const handleResendVerification = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You need to be logged in to resend a verification email. Please try logging in again.",
        variant: "destructive",
      });
      // Optionally redirect to login if user somehow isn't set
      // router.push('/login'); 
      return;
    }

    if (currentUser.emailVerified) {
      toast({ title: "Email Already Verified", description: "Your email is already verified. You can proceed to login." });
      router.push('/login');
      return;
    }
    
    setIsResending(true);
    try {
      await sendEmailVerification(currentUser);
      toast({
        title: "Verification Email Resent",
        description: "A new verification email has been sent. Please check your inbox (and spam folder).",
      });
    } catch (error: any) {
      console.error("Error resending verification email:", error);
      toast({
        title: "Resend Failed",
        description: error.message || "Could not resend verification email. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };
  
  if (authLoading) {
    return <div className="text-center text-muted-foreground p-6">Loading user status...</div>;
  }


  return (
    <div className="w-full max-w-md space-y-8 text-center">
      <MailCheck className="mx-auto h-16 w-16 text-primary" />
      <h1 className="text-3xl font-semibold text-foreground">
        Verify Your Email
      </h1>
      <p className="text-muted-foreground">
        A verification link has been sent to{' '}
        <strong className="text-foreground">{emailForVerification || 'your email address'}</strong>.
        Please click the link in the email to activate your account.
      </p>
      <p className="text-sm text-muted-foreground">
        If you haven't received the email, please check your spam or junk folder.
      </p>
      
      <Button 
        onClick={handleResendVerification} 
        className="w-full h-12 rounded-lg text-base" 
        disabled={isResending || !currentUser || currentUser?.emailVerified}
      >
        {isResending ? 'Resending...' : 'Resend Verification Email'}
      </Button>

      <div className="text-sm">
        <span className="text-muted-foreground">Verified your email? </span>
        <Link href="/login" legacyBehavior>
          <a className="font-medium text-primary hover:underline">Log in</a>
        </Link>
      </div>
    </div>
  );
};


const PleaseVerifyEmailPage: NextPage = () => {
  return (
    <div className="relative min-h-screen bg-background">
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
        <AppLogo />
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-6 w-6" />
        </Button>
      </header>
      <main className="flex min-h-screen flex-col items-center justify-center p-4 pt-20">
        <Suspense fallback={<div className="text-center text-muted-foreground p-6">Loading page content...</div>}>
          <PleaseVerifyEmailContent />
        </Suspense>
      </main>
    </div>
  );
};

export default PleaseVerifyEmailPage;
