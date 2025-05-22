
import Link from 'next/link';
import { AppLogo } from './app-logo';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <AppLogo />
            <p className="mt-2 text-sm text-muted-foreground">
              Seamless payments with PesiX.
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/terms-conditions" legacyBehavior className="text-sm text-muted-foreground hover:text-primary">Terms & Conditions</Link>
                </li>
                <li>
                  <Link href="/privacy-policy" legacyBehavior className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Company</h3>
              <ul className="mt-4 space-y-2">
                 <li>
                  <Link href="/how-it-works" legacyBehavior><a className="text-sm text-muted-foreground hover:text-primary">How It Works</a></Link>
                </li>
                <li>
                  <Link href="/about-us" legacyBehavior className="text-sm text-muted-foreground hover:text-primary">About Us</Link>
                </li>
                <li>
                  <Link href="/contact" legacyBehavior className="text-sm text-muted-foreground hover:text-primary">Contact Us</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Resources</h3>
              <ul className="mt-4 space-y-2">
                 <li>
                  <Link href="/faq" legacyBehavior className="text-sm text-muted-foreground hover:text-primary">FAQ</Link>
                </li>
                 <li>
                  <Link href="/support" legacyBehavior className="text-sm text-muted-foreground hover:text-primary">Support</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} PesiX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
