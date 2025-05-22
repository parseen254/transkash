
import type { NextPage } from 'next';
import Head from 'next/head';
import { AppLogo } from '@/components/shared/app-logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const HowItWorksPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>How PesiX Works - PesiX</title>
      </Head>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
            <AppLogo />
             <Link href="/" passHref legacyBehavior>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </Link>
          </div>
        </header>
        <main className="container mx-auto max-w-4xl py-12 px-4 md:px-6">
          <h1 className="mb-8 text-3xl font-bold tracking-tight text-center md:text-4xl">
            How PesiX Works
          </h1>
          <div className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl dark:prose-invert mx-auto space-y-6 text-foreground">
            <p>
              Welcome to PesiX! We aim to simplify your payment processes, whether you&apos;re an individual
              or a business. Here&apos;s a brief overview of how our platform helps you manage payments seamlessly.
            </p>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">For Businesses & Creators</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Easy Payment Link Creation:</strong> Generate unique payment links for your invoices, products,
                  services, or subscriptions. Customize details like amount, reference, and purpose.
                </li>
                <li>
                  <strong>Multiple Payment Methods:</strong> Your customers can pay using various popular methods,
                  including M-Pesa (STK Push & Paybill) and Card Payments. We handle the integration.
                </li>
                <li>
                  <strong>Dashboard Overview:</strong> Get a clear view of your total revenue, transaction trends, and
                  recent payments all in one place.
                </li>
                <li>
                  <strong>Transaction Management:</strong> Keep track of all transactions, view their statuses (Completed,
                  Pending, Failed), and access details for each.
                </li>
                <li>
                  <strong>Secure Payouts:</strong> Configure your bank or M-Pesa accounts to receive payouts from
                  the funds collected through PesiX.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">For Customers Making Payments</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Simple & Secure Checkout:</strong> When you receive a PesiX payment link, you&apos;ll be
                  directed to a clear and secure payment page.
                </li>
                <li>
                  <strong>Choose Your Preferred Method:</strong> Select from available payment options like M-Pesa
                  or Card to complete your transaction.
                </li>
                <li>
                  <strong>Instant Confirmation:</strong> Receive immediate feedback on whether your payment was
                  successful or if there were any issues.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-2">Getting Started</h2>
              <p>
                Signing up for PesiX is straightforward. Once registered, you can immediately start creating
                payment links or configure your payout accounts from your dashboard.
              </p>
              <p>
                Our platform is designed to be intuitive, but if you have any questions, our help resources
                (coming soon!) or contact support will be available to assist you.
              </p>
            </section>

            <p className="mt-8 text-center text-muted-foreground">
              More detailed guides and feature explanations are coming soon!
            </p>
          </div>
        </main>
      </div>
    </>
  );
};

export default HowItWorksPage;

    