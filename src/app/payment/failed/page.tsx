
"use client";

import type { NextPage } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { XCircle, HelpCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/shared/app-logo';
import { Spinner } from '@/components/ui/spinner';
import type { PaymentLink } from '@/lib/types';
import { format } from 'date-fns';

// Define dummyPaymentLinks here or import from a shared location
const dummyPaymentLinks: PaymentLink[] = [
  { id: 'pl_1', linkName: 'Invoice #1234 (The Coffee Shop)', reference: 'ORD1234567890', amount: '25.00', currency: 'KES', purpose: 'Coffee and Snacks', creationDate: new Date('2023-10-01').toISOString(), expiryDate: new Date(new Date().setDate(new Date().getDate() + 15)), status: 'Active', payoutAccountId: 'acc_1', shortUrl: '/payment/order?paymentLinkId=pl_1', hasExpiry: true },
  { id: 'pl_2', linkName: 'Product Sale - T-Shirt', reference: 'PROD050', amount: '1500', currency: 'KES', purpose: 'Online Store Purchase', creationDate: new Date('2023-10-05').toISOString(), expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)), status: 'Active', payoutAccountId: 'acc_1', shortUrl: '/payment/order?paymentLinkId=pl_2', hasExpiry: true },
  { id: 'pl_3', linkName: 'Monthly Subscription', reference: 'SUB003', amount: '2000', currency: 'KES', purpose: 'SaaS Subscription', creationDate: new Date('2023-09-20').toISOString(), status: 'Active', payoutAccountId: 'acc_2', shortUrl: '/payment/order?paymentLinkId=pl_3', hasExpiry: false },
];

const PaymentFailedContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentLinkIdForRetry, setPaymentLinkIdForRetry] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('paymentLinkId');
    setPaymentLinkIdForRetry(id); 
    if (id) {
      setLoading(true);
      setTimeout(() => {
        const foundLink = dummyPaymentLinks.find(link => link.id === id);
        if (foundLink) {
          setPaymentLink(foundLink);
        } else {
          setError("Payment link details not found for this transaction attempt.");
        }
        setLoading(false);
      }, 500);
    } else {
      setError("Payment link ID not provided.");
      setLoading(false);
    }
  }, [searchParams]);

  const handleRetry = () => {
    if (paymentLinkIdForRetry) {
      router.push(`/payment/order?paymentLinkId=${paymentLinkIdForRetry}`);
    } else {
      // Fallback or error, ideally this shouldn't happen if link was fetched
      router.push('/'); 
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spinner className="h-12 w-12 text-primary" />
        <p className="mt-4 text-muted-foreground">Loading payment status...</p>
      </div>
    );
  }
  
  // Forcing a reason for demo purposes if link is found
  const failureReason = paymentLink ? "Transaction declined by your bank." : "Could not retrieve payment details.";


  return (
    <div className="w-full max-w-md mx-auto text-center space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Payment Failed</h1>
      <XCircle className="mx-auto h-24 w-24 text-destructive" />
      <p className="text-muted-foreground text-lg">
        Unfortunately, your payment could not be processed.
      </p>
      
      {paymentLink ? (
        <div className="text-left space-y-3 p-6 bg-secondary/30 rounded-lg border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-3">Payment Attempt Details</h2>
           <div className="flex justify-between">
            <span className="text-muted-foreground">Order from</span>
            <span className="font-medium text-foreground">{paymentLink.linkName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order #</span>
            <span className="font-medium text-foreground">{paymentLink.reference}</span>
          </div>
           {paymentLink.purpose && (
             <div className="flex justify-between">
              <span className="text-muted-foreground">Purpose</span>
              <span className="font-medium text-foreground text-right">{paymentLink.purpose}</span>
             </div>
           )}
          <hr className="border-border my-2"/>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-bold text-foreground text-lg">
              {paymentLink.currency} {parseFloat(paymentLink.amount).toFixed(2)}
            </span>
          </div>
           {failureReason && (
            <div className="pt-2">
              <p className="text-sm text-destructive">{failureReason}</p>
            </div>
           )}
        </div>
      ) : (
         <div className="text-center space-y-4 p-6 bg-destructive/10 rounded-lg border border-destructive/50">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <p className="text-destructive font-medium">{error || "Could not load payment details for this attempt."}</p>
        </div>
      )}

      <Button 
        onClick={handleRetry} 
        className="w-full h-12 rounded-lg text-base"
        variant={paymentLink ? "default" : "secondary"} 
        disabled={!paymentLinkIdForRetry}
      >
        Try Again
      </Button>
       <Button 
        onClick={() => router.push('/')} 
        className="w-full h-12 rounded-lg text-base"
        variant="outline"
      >
        Go to Homepage
      </Button>
    </div>
  );
};

const PaymentFailedPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between p-6 border-b border-border">
        <AppLogo />
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-6 w-6" />
        </Button>
      </header>
      <main className="flex flex-col items-center justify-center flex-grow p-4 sm:p-8">
         <Suspense fallback={
          <div className="flex flex-col items-center justify-center flex-grow">
            <Spinner className="h-10 w-10 text-primary" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        }>
          <PaymentFailedContent />
        </Suspense>
      </main>
    </div>
  );
};

export default PaymentFailedPage;

    