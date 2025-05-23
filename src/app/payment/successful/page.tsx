
"use client";

import type { NextPage } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { PartyPopper, HelpCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/shared/app-logo';
import { Spinner } from '@/components/ui/spinner';
import type { PaymentLink } from '@/lib/types';
import { format } from 'date-fns';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const PaymentSuccessfulContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paymentLinkId = searchParams.get('paymentLinkId');
    if (paymentLinkId) {
      setLoading(true);
      setError(null);

      const fetchLinkDetails = async () => {
        try {
          const linkDocRef = doc(db, 'paymentLinks', paymentLinkId);
          const docSnap = await getDoc(linkDocRef);

          if (docSnap.exists()) {
            const linkData = { id: docSnap.id, ...docSnap.data() } as PaymentLink;
            setPaymentLink(linkData);
          } else {
            setError("Payment link details not found for this transaction.");
          }
        } catch (err) {
          console.error("Error fetching payment link for success page:", err);
          setError("An error occurred while fetching payment details.");
        } finally {
          setLoading(false);
        }
      };
      fetchLinkDetails();
    } else {
      setError("Payment link ID not provided.");
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spinner className="h-12 w-12 text-primary" />
        <p className="mt-4 text-muted-foreground">Loading payment confirmation...</p>
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="text-center space-y-4">
        <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-semibold text-destructive">Error Loading Details</h2>
        <p className="text-muted-foreground">{error || "Could not load payment details."}</p>
        <Button onClick={() => router.push('/')}>Go to Homepage</Button>
      </div>
    );
  }

  const formatDate = (dateValue: Timestamp | Date | string | undefined | null) => {
    if (!dateValue) return 'N/A';
    const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue as any);
    return format(date, 'PPP');
  };

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Payment Successful</h1>
      <PartyPopper className="mx-auto h-24 w-24 text-green-500" />
      
      <div className="text-left space-y-3 p-6 bg-secondary/30 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-3">Payment Details</h2>
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
          <span className="text-muted-foreground">Total</span>
          <span className="font-bold text-foreground text-lg">
            {paymentLink.currency} {paymentLink.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paid on</span>
            <span className="font-medium text-muted-foreground">{formatDate(new Date())}</span>
        </div>
      </div>

      <Button 
        onClick={() => router.push('/')} 
        className="w-full h-12 rounded-lg text-base bg-green-500 hover:bg-green-600 text-white"
      >
        Done
      </Button>
    </div>
  );
};

const PaymentSuccessfulPage: NextPage = () => {
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
          <PaymentSuccessfulContent />
        </Suspense>
      </main>
    </div>
  );
};

export default PaymentSuccessfulPage;

