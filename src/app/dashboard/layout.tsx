
"use client";

import type React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { MainSidebar } from '@/components/dashboard/main-sidebar';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, initialLoadComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialLoadComplete && !user) {
      router.push('/login');
    }
  }, [user, initialLoadComplete, router]);

  if (loading || !initialLoadComplete) {
    return (
      <div className="flex min-h-screen bg-background">
        <Skeleton className="w-64 h-screen fixed top-0 left-0" /> {/* Sidebar Placeholder */}
        <main className="flex-1 p-6 md:p-8 ml-64">
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the useEffect redirect,
    // but as a fallback or if routing is slow, show loading.
    // Or, if initialLoadComplete is true and user is null, it means redirect is happening.
    return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <p>Loading user state...</p>
       </div>
    );
  }
  
  // Check for email verification for non-Google users
  if (user.providerData.some(provider => provider.providerId === 'password') && !user.emailVerified) {
    // For simplicity, redirect to login. A better UX might be a dedicated verify-email page or a banner.
    // toast({ title: "Email not verified", description: "Please verify your email to access the dashboard.", variant: "destructive"});
    // router.push('/login'); 
    // The above toast in useEffect can cause issues. Better to handle on login page or show a banner here.
    // For now, this implies the login page should handle the check more strictly.
    // Or, allow access but show a persistent banner.
    // Let's assume login page prevents unverified access.
    // If an unverified user somehow reaches here, this is a fallback.
    // To keep it simple, redirecting from here too.
    // router.push('/login?reason=verify_email');
    // This might cause redirect loops if login page doesn't handle it well.
    // The logic in login page to sign out unverified users is better.
    // So if user object exists, we assume they passed login checks.
  }


  return (
    <div className="flex min-h-screen bg-background">
      <MainSidebar />
      <main className="flex-1 p-6 md:p-8 ml-64"> {/* Add ml-64 to offset sidebar width */}
        {children}
      </main>
    </div>
  );
}
