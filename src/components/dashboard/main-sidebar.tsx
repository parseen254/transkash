"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CreditCard, Link as LinkIcon, Settings, Landmark, LogOut, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/shared/app-logo';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/dashboard/payment-links', label: 'Payment Links', icon: LinkIcon },
  { href: '/dashboard/payouts', label: 'Payout Accounts', icon: Landmark },
  { href: '/dashboard/settings', label: 'Profile Settings', icon: Settings },
];


export function MainSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-sidebar text-sidebar-foreground flex flex-col fixed top-0 left-0 shadow-lg">
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" legacyBehavior>
          <a className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-sidebar-primary"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            <h1 className="text-xl font-bold text-sidebar-primary-foreground">SwitchLink</h1>
          </a>
        </Link>
      </div>
      
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <Avatar className="h-10 w-10">
          <AvatarImage src="https://placehold.co/100x100.png" alt="User" data-ai-hint="user avatar" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-sidebar-primary-foreground">User Name</p>
          <p className="text-xs text-sidebar-foreground/80">user@example.com</p>
        </div>
      </div>

      <nav className="flex-grow p-4 space-y-2">
        {navItems.map((item) => (
          <Link href={item.href} key={item.label} legacyBehavior>
            <a
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </a>
          </Link>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />
      
      <div className="p-4 mt-auto">
         <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="mr-2 h-5 w-5" />
            Logout
        </Button>
      </div>
    </aside>
  );
}
