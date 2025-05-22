
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LinkIcon as LinkIconLucide, Settings, Landmark, LogOut, Users } from 'lucide-react'; // Renamed LinkIcon to LinkIconLucide
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/shared/app-logo';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/payment-links', label: 'Payment Links', icon: LinkIconLucide },
  { href: '/dashboard/payouts', label: 'Payout Accounts', icon: Landmark },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/settings', label: 'Profile Settings', icon: Settings },
];

interface MainSidebarProps {
  onLinkClick?: () => void; // Optional: Callback for when a nav link is clicked, e.g., to close mobile sidebar
  className?: string;
}

export function MainSidebar({ onLinkClick, className }: MainSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout Failed',
        description: 'An error occurred during logout. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name[0] || 'U';
  };
  
  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <div className={cn("h-full bg-sidebar text-sidebar-foreground flex flex-col", className)}>
      <div className="p-4 border-b border-sidebar-border flex items-center justify-center h-[65px] shrink-0">
        <Link href="/dashboard" legacyBehavior>
          <a onClick={handleLinkClick} className="flex items-center">
            <AppLogo />
          </a>
        </Link>
      </div>
      
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border shrink-0">
        <Avatar className="h-10 w-10">
          {user?.photoURL ? (
            <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
          ) : (
             <AvatarImage src="https://placehold.co/100x100.png" alt={user?.displayName || "User"} data-ai-hint="user avatar" />
          )}
          <AvatarFallback>{user ? getInitials(user.displayName) : 'U'}</AvatarFallback>
        </Avatar>
        <div>
          {loading ? (
            <>
              <div className="text-sm font-semibold text-sidebar-primary-foreground animate-pulse bg-sidebar-accent rounded w-24 h-4"></div>
              <div className="text-xs text-sidebar-foreground/80 animate-pulse bg-sidebar-accent rounded w-32 h-3 mt-1"></div>
            </>
          ) : user ? (
            <>
              <p className="text-sm font-semibold text-sidebar-primary-foreground truncate" title={user.displayName || "User Name"}>{user.displayName || 'User Name'}</p>
              <p className="text-xs text-sidebar-foreground/80 truncate" title={user.email || ""}>{user.email}</p>
            </>
          ) : (
             <>
              <p className="text-sm font-semibold text-sidebar-primary-foreground">Guest User</p>
              <p className="text-xs text-sidebar-foreground/80">Not logged in</p>
            </>
          )}
        </div>
      </div>

      <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = (item.href === '/dashboard' && pathname === item.href) || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link href={item.href} key={item.label} legacyBehavior>
              <a
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-secondary-foreground' // Active state from design
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-secondary-foreground" : "text-sidebar-foreground")} />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border shrink-0" />
      
      <div className="p-4 mt-auto shrink-0">
         <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => {
              handleLogout();
              if (onLinkClick) onLinkClick();
            }}
            disabled={loading}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
        </Button>
      </div>
    </div>
  );
}
