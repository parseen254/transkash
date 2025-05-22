
"use client";

import type React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { MainSidebar } from '@/components/dashboard/main-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { AppLogo } from '@/components/shared/app-logo';
import { ThemeToggleButton } from '@/components/shared/theme-toggle-button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, initialLoadComplete } = useAuth();
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (initialLoadComplete && !user) {
      router.push('/login');
    }
  }, [user, initialLoadComplete, router]);

  if (loading || !initialLoadComplete) {
    return (
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar Placeholder */}
        <Skeleton className="hidden md:block w-64 h-screen fixed top-0 left-0" /> 
        {/* Mobile Header Placeholder */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b z-20 flex items-center px-4 justify-between">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-8 w-8" />
        </div>
        <main className="flex-1 p-6 md:p-8 md:ml-64 mt-16 md:mt-0">
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
    return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <p>Redirecting to login...</p>
       </div>
    );
  }

  return (
    <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar - Fixed */}
        <div className="hidden md:flex fixed top-0 left-0 h-screen w-64 z-30 border-r border-sidebar-border">
          <MainSidebar />
        </div>

        <main className="flex-1 md:ml-64 flex flex-col w-full overflow-x-hidden">
          {/* Mobile Header - Sticky */}
          <header className="md:hidden p-4 border-b flex items-center justify-between sticky top-0 bg-background z-20 h-[65px]">
            <SheetTrigger asChild>
               <Button variant="ghost" size="icon">
                 <Menu className="h-6 w-6" />
                 <span className="sr-only">Open menu</span>
               </Button>
            </SheetTrigger>
            <div className="absolute left-1/2 transform -translate-x-1/2">
                <AppLogo />
            </div>
            <ThemeToggleButton /> 
          </header>
           
          {/* Main Page Content */}
          <div className="p-6 md:p-8 flex-grow">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Sidebar Sheet Content (Portal part) */}
      <SheetContent side="left" className="p-0 w-[270px] bg-sidebar border-r-0" showCloseButton={false}>
        <MainSidebar onLinkClick={() => setIsMobileSidebarOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
