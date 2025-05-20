import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';
import AppLogo from '@/components/AppLogo';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <AppLogo className="h-8 w-auto" />
          <span className="sr-only">{APP_NAME}</span>
        </Link>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-primary to-accent">
          <div className="container px-4 md:px-6 text-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none text-primary-foreground drop-shadow-md">
                {APP_NAME}
              </h1>
              <p className="mx-auto max-w-[700px] text-primary-foreground/90 md:text-xl drop-shadow-sm">
                {APP_DESCRIPTION} Pay via Stripe, receive via MPESA. Fast, secure, and reliable.
              </p>
              <div>
                <Link href="/dashboard">
                  <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-xl transition-shadow">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:px-10 md:gap-16 md:grid-cols-2 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Why Choose {APP_NAME}?</h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Experience hassle-free international payments to MPESA. Our platform simplifies the process, making it easy for anyone to send money to Kenya.
                </p>
                <ul className="grid gap-2 py-4">
                  <li className="flex items-center">
                    <CheckIcon className="mr-2 h-5 w-5 text-primary" />
                    Secure Stripe Payments
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="mr-2 h-5 w-5 text-primary" />
                    Direct MPESA Transfers
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="mr-2 h-5 w-5 text-primary" />
                    Transparent Transaction Tracking
                  </li>
                </ul>
              </div>
              <div className="flex justify-center">
                <Image
                  src="https://placehold.co/600x400.png"
                  alt="Mobile Payment Illustration"
                  width={600}
                  height={400}
                  className="rounded-xl shadow-xl"
                  data-ai-hint="mobile payment fintech"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4 text-muted-foreground" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4 text-muted-foreground" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
