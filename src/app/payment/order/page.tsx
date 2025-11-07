
"use client";

import type { NextPage } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { HelpCircle, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/shared/app-logo';
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import type { PaymentLink } from '@/lib/types';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';

// Payment is now handled via MITO's hosted payment page
// Customer will select payment method on MITO's secure page

const PaymentForOrderContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [currentPaymentLink, setCurrentPaymentLink] = useState<PaymentLink | null>(null);
  const [loadingLink, setLoadingLink] = useState(true);
  const [errorLoadingLink, setErrorLoadingLink] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [useTestMode, setUseTestMode] = useState(false); // Test mode for UAT

  useEffect(() => {
    const paymentLinkId = searchParams.get('paymentLinkId');
    if (paymentLinkId) {
      setLoadingLink(true);
      setErrorLoadingLink(null);
      
      const fetchLinkDetails = async () => {
        try {
          const linkDocRef = doc(db, 'paymentLinks', paymentLinkId);
          const docSnap = await getDoc(linkDocRef);

          if (docSnap.exists()) {
            const linkData = { id: docSnap.id, ...docSnap.data() } as PaymentLink;
            
            if (linkData.status !== 'Active') {
              setErrorLoadingLink(`This payment link ("${linkData.linkName}") is currently ${linkData.status.toLowerCase()} and cannot be paid.`);
              setCurrentPaymentLink(null);
            } else if (linkData.hasExpiry && linkData.expiryDate && linkData.expiryDate instanceof Timestamp && linkData.expiryDate.toDate() < new Date()) {
              setErrorLoadingLink(`Payment link "${linkData.linkName}" expired on ${format(linkData.expiryDate.toDate(), 'PPP')}.`);
              setCurrentPaymentLink(null);
            } else {
              setCurrentPaymentLink(linkData);
            }
          } else {
            setErrorLoadingLink("Payment link not found or is invalid.");
            setCurrentPaymentLink(null);
          }
        } catch (err) {
          console.error("Error fetching payment link:", err);
          setErrorLoadingLink("An error occurred while fetching payment link details.");
          setCurrentPaymentLink(null);
        } finally {
          setLoadingLink(false);
        }
      };
      fetchLinkDetails();
    } else {
      setErrorLoadingLink("No payment link ID provided. Please use a valid payment link.");
      setCurrentPaymentLink(null);
      setLoadingLink(false);
    }
  }, [searchParams]);

  const handlePayment = async () => {
    if (!currentPaymentLink) {
      toast({ title: "Error", description: "Payment details missing.", variant: "destructive" });
      return;
    }

    // Validate customer information
    if (!customerName.trim()) {
      toast({ title: "Error", description: "Please enter your name.", variant: "destructive" });
      return;
    }

    if (!customerEmail.trim() || !customerEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({ title: "Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setIsSubmittingPayment(true);
    toast({ title: "Initiating Payment", description: "Please wait while we set up your payment..." });

    try {
      // Call our API to initiate payment (test or real)
      const apiEndpoint = useTestMode ? '/api/test-payment' : '/api/mito/initiate-payment';
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentLinkId: currentPaymentLink.id,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          ...(useTestMode && { simulate: 'success' }), // Test mode simulation
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      // Redirect to MITO's hosted payment page
      toast({ 
        title: "Redirecting to Payment", 
        description: "You will be redirected to complete your payment securely.",
      });

      // Small delay to show the toast, then redirect
      setTimeout(() => {
        window.location.href = data.paymentUrl;
      }, 1000);

    } catch (error: any) {
      console.error("Error initiating payment:", error);
      toast({
        title: "Payment Initiation Failed",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
      setIsSubmittingPayment(false);
    }
  };


  if (loadingLink) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow p-4 sm:p-8">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="mt-4 text-muted-foreground">Loading payment details...</p>
      </div>
    );
  }

  if (errorLoadingLink || !currentPaymentLink) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow p-4 sm:p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Unable to Load Payment</h2>
        <p className="text-muted-foreground max-w-md">{errorLoadingLink || "The payment link is invalid or could not be loaded."}</p>
         <Button onClick={() => router.push('/')} className="mt-6">Go to Homepage</Button>
      </div>
    );
  }

  const pageTitle = "Payment for your order";
  const payButtonText = `Pay ${currentPaymentLink.currency} ${currentPaymentLink.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="w-full max-w-md space-y-6">
      <h1 className="text-3xl font-semibold text-center text-foreground">
        {pageTitle}
      </h1>

      <div className="space-y-2 text-sm p-4 border border-border rounded-lg bg-secondary/30">
        <p className="text-base font-medium text-foreground">Payment Details</p>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Order from</span>
          <span className="font-medium text-foreground">{currentPaymentLink.linkName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Order #</span>
          <span className="font-medium text-foreground">{currentPaymentLink.reference}</span>
        </div>
         {currentPaymentLink.purpose && (
          <div className="flex justify-between text-right">
            <span className="text-muted-foreground">Purpose</span>
            <span className="font-medium text-foreground ">{currentPaymentLink.purpose}</span>
          </div>
        )}
        <hr className="border-border my-2 !mt-3 !mb-3" />
        <div className="flex justify-between items-baseline">
          <span className="text-muted-foreground">Total</span>
          <span className="font-bold text-foreground text-xl">{currentPaymentLink.currency} {currentPaymentLink.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        {currentPaymentLink.hasExpiry && currentPaymentLink.expiryDate && currentPaymentLink.expiryDate instanceof Timestamp && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Due by</span>
            <span className="font-medium text-muted-foreground">{format(currentPaymentLink.expiryDate.toDate(), 'PPP p')}</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-base font-medium text-foreground">Your Information</p>
        <div>
          <Label htmlFor="customerName" className="text-sm font-medium text-muted-foreground">Full Name *</Label>
          <Input 
            id="customerName" 
            type="text" 
            placeholder="Enter your full name" 
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-1 bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" 
            disabled={isSubmittingPayment}
          />
        </div>
        <div>
          <Label htmlFor="customerEmail" className="text-sm font-medium text-muted-foreground">Email Address *</Label>
          <Input 
            id="customerEmail" 
            type="email" 
            placeholder="your.email@example.com" 
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="mt-1 bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" 
            disabled={isSubmittingPayment}
          />
        </div>
        <div>
          <Label htmlFor="customerPhone" className="text-sm font-medium text-muted-foreground">Phone Number (Optional)</Label>
          <Input 
            id="customerPhone" 
            type="tel" 
            placeholder="e.g., 0712345678" 
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="mt-1 bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" 
            disabled={isSubmittingPayment}
          />
        </div>
        
        {/* Test Mode Toggle for UAT */}
        {process.env.NODE_ENV === 'development' && (
          <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <input
              type="checkbox"
              id="testMode"
              checked={useTestMode}
              onChange={(e) => setUseTestMode(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="testMode" className="text-sm text-amber-900 dark:text-amber-100 cursor-pointer">
              <span className="font-semibold">Test Mode</span> - Skip MITO, simulate payment instantly
            </label>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          {useTestMode 
            ? 'Test mode enabled: Payment will be simulated without connecting to payment provider.' 
            : 'You will be redirected to a secure payment page to complete your payment using M-Pesa, card, or other available methods.'}
        </p>
      </div>

      <Button 
        onClick={handlePayment} 
        className="w-full h-12 text-base rounded-lg"
        disabled={isSubmittingPayment || !customerName.trim() || !customerEmail.trim()}
      >
        {isSubmittingPayment ? <Spinner className="mr-2" /> : <CreditCard className="mr-2 h-5 w-5" />}
        {isSubmittingPayment ? 'Processing...' : payButtonText}
      </Button>
    </div>
  );
};


const PaymentForOrderPage: NextPage = () => {
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
            <div className="flex flex-col items-center justify-center flex-grow p-4 sm:p-8">
              <Spinner className="h-10 w-10 text-primary" />
              <p className="mt-4 text-muted-foreground">Loading payment form...</p>
            </div>
          }>
          <PaymentForOrderContent />
        </Suspense>
      </main>
    </div>
  );
};

export default PaymentForOrderPage;

    