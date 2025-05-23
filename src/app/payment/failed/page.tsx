
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
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';


const PaymentFailedContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentLinkIdForRetry, setPaymentLinkIdForRetry] = useState<string | null>(null);
  // Updated default failure reason to be more generic
  const [failureReason, setFailureReason] = useState<string | null>("Your payment could not be processed.");

  useEffect(() => {
    const id = searchParams.get('paymentLinkId');
    const reasonFromQuery = searchParams.get('reason'); // Optional reason from query
    
    setPaymentLinkIdForRetry(id); 
    if (reasonFromQuery) {
      setFailureReason(reasonFromQuery);
    } // If no reasonFromQuery, the generic default will be used.

    if (id) {
      setLoading(true);
      setError(null);
      const fetchLinkDetails = async () => {
        try {
          const linkDocRef = doc(db, 'paymentLinks', id);
          const docSnap = await getDoc(linkDocRef);

          if (docSnap.exists()) {
            setPaymentLink({ id: docSnap.id, ...docSnap.data() } as PaymentLink);
          } else {
            setError("Payment link details not found for this transaction attempt.");
            setPaymentLink(null); // Ensure paymentLink is null if not found
          }
        } catch (err) {
          console.error("Error fetching payment link for failure page:", err);
          setError("An error occurred while fetching payment details.");
          setPaymentLink(null); // Ensure paymentLink is null on error
        } finally {
          setLoading(false);
        }
      };
      fetchLinkDetails();
    } else {
      setError("Payment link ID not provided.");
      setLoading(false);
      setPaymentLink(null); // Ensure paymentLink is null if no ID
    }
  }, [searchParams]);

  const handleRetry = () => {
    if (paymentLinkIdForRetry) {
      router.push(`/payment/order?paymentLinkId=${paymentLinkIdForRetry}`);
    } else {
      // If no paymentLinkIdForRetry, perhaps redirect to a general help page or homepage
      router.push('/'); 
    }
  };

  const formatDate = (dateValue: Timestamp | Date | string | undefined | null) => {
    if (!dateValue) return 'N/A';
    const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue as any);
    return format(date, 'PPP');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spinner className="h-12 w-12 text-primary" />
        <p className="mt-4 text-muted-foreground">Loading payment status...</p>
      </div>
    );
  }
  
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
              {paymentLink.currency} {paymentLink.amount.toFixed(2)}
            </span>
          </div>
           {failureReason && (
            <div className="pt-2">
              <p className="text-sm text-destructive font-medium">Reason: {failureReason}</p>
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
        disabled={!paymentLinkIdForRetry && !paymentLink} // Disable if no link details to retry with
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
