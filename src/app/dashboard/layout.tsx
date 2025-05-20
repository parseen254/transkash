
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/'); // Redirect to landing if not authenticated and not loading
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // Show a loading state or a minimal layout while checking auth / redirecting
    return (
      <div className="flex min-h-screen w-full">
        {/* Minimal sidebar placeholder */}
        <div className="hidden md:flex flex-col w-64 border-r bg-muted/40 p-4 space-y-4">
            <Skeleton className="h-10 w-32"/>
            <Skeleton className="h-8 w-full"/>
            <Skeleton className="h-8 w-full"/>
            <Skeleton className="h-8 w-full"/>
        </div>
        <div className="flex flex-1 flex-col">
          {/* Minimal header placeholder */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 md:px-6 justify-end">
             <Skeleton className="h-8 w-8 rounded-full"/>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-secondary/30">
            <div className="space-y-4">
              <Skeleton className="h-12 w-1/2" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-secondary/30">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
