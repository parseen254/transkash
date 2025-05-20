
'use client';

import Link from 'next/link';
import { SidebarTrigger } from '@/components/ui/sidebar';
import AppLogo from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AppHeader() {
  const { user, loading, signInWithGoogle } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="hidden md:block">
        <Link href="/dashboard">
          <AppLogo iconOnly />
        </Link>
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          {/* Placeholder for search or other actions */}
        </div>
        {/* User avatar and sign-out moved to AppSidebar */}
        {!user && !loading && (
           <Button onClick={signInWithGoogle} variant="outline">
            <LogIn className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
        )}
         {!user && loading && (
           <Button variant="ghost" size="icon" className="rounded-full" disabled>
            <Loader2 className="h-6 w-6 animate-spin" />
          </Button>
         )}
      </div>
    </header>
  );
}
