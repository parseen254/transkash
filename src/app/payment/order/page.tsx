
"use client";

import type { NextPage } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { HelpCircle, Smartphone, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/shared/app-logo';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import type { PaymentLink } from '@/lib/types';
import { format } from 'date-fns';

// Dummy Data for Payment Links (simulates fetching from a backend)
const dummyPaymentLinks: PaymentLink[] = [
  { id: 'pl_1', linkName: 'Invoice #1234', reference: 'INV001', amount: '5000', currency: 'KES', purpose: 'Consultation Services', creationDate: new Date('2023-10-01').toISOString(), expiryDate: new Date().setDate(new Date().getDate() + 15), status: 'Active', payoutAccountId: 'acc_1', shortUrl: '/payment/order?paymentLinkId=pl_1', hasExpiry: true },
  { id: 'pl_2', linkName: 'Product Sale - T-Shirt', reference: 'PROD050', amount: '1500', currency: 'KES', purpose: 'Online Store Purchase', creationDate: new Date('2023-10-05').toISOString(), expiryDate: new Date().setDate(new Date().getDate() + 30), status: 'Active', payoutAccountId: 'acc_1', shortUrl: '/payment/order?paymentLinkId=pl_2', hasExpiry: true },
  { id: 'pl_3', linkName: 'Monthly Subscription', reference: 'SUB003', amount: '2000', currency: 'KES', purpose: 'SaaS Subscription', creationDate: new Date('2023-09-20').toISOString(), status: 'Active', payoutAccountId: 'acc_2', shortUrl: '/payment/order?paymentLinkId=pl_3', hasExpiry: false },
];


interface PaymentOption {
  value: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

const paymentOptions: PaymentOption[] = [
  { value: 'mpesa', name: 'M-Pesa', description: 'Pay with M-Pesa', icon: Smartphone },
  { value: 'card', name: 'Card Transfer', description: 'Pay with Card Transfer', icon: CreditCard },
];

const PaymentForOrderContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [currentPaymentLink, setCurrentPaymentLink] = useState<PaymentLink | null>(null);
  const [loadingLink, setLoadingLink] = useState(true);
  const [errorLoadingLink, setErrorLoadingLink] = useState<string | null>(null);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const paymentLinkId = searchParams.get('paymentLinkId');
    if (paymentLinkId) {
      setLoadingLink(true);
      setErrorLoadingLink(null);
      // Simulate API call
      setTimeout(() => {
        const foundLink = dummyPaymentLinks.find(link => link.id === paymentLinkId);
        if (foundLink) {
          // Check if link is expired (if it has an expiryDate)
          if (foundLink.hasExpiry && foundLink.expiryDate && new Date(foundLink.expiryDate) < new Date()) {
            setErrorLoadingLink(`Payment link "${foundLink.linkName}" has expired.`);
            setCurrentPaymentLink(null);
          } else if (foundLink.status !== 'Active') {
            setErrorLoadingLink(`Payment link "${foundLink.linkName}" is not currently active. Status: ${foundLink.status}`);
            setCurrentPaymentLink(null);
          } else {
            setCurrentPaymentLink(foundLink);
          }
        } else {
          setErrorLoadingLink("Payment link not found or is invalid.");
          setCurrentPaymentLink(null);
        }
        setLoadingLink(false);
      }, 700);
    } else {
      setErrorLoadingLink("No payment link ID provided.");
      setCurrentPaymentLink(null);
      setLoadingLink(false);
    }
  }, [searchParams]);


  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: "Selection Required",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }
    if (!currentPaymentLink) {
      toast({
        title: "Error",
        description: "Payment link details are missing.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    toast({
      title: "Processing Payment",
      description: "Please wait...",
    });

    await new Promise(resolve => setTimeout(resolve, 2000)); 

    let paymentSuccessful = false;
    const numericAmount = parseFloat(currentPaymentLink.amount);

    if (selectedPaymentMethod === 'mpesa') {
      try {
        const response = await fetch('/api/mpesa/initiate-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: "254712345678", 
            amount: numericAmount,
            accountReference: currentPaymentLink.reference,
            transactionDesc: currentPaymentLink.purpose
          }),
        });
        if (response.ok) {
          const result = await response.json();
          if (result.ResponseCode === "0") {
            paymentSuccessful = true;
          } else {
             toast({ title: "M-Pesa Error", description: result.CustomerMessage || result.errorMessage || "Failed to initiate M-Pesa payment.", variant: "destructive" });
          }
        } else {
            const errorData = await response.json().catch(() => ({errorMessage: "Unknown M-Pesa API error"}));
            toast({ title: "M-Pesa API Error", description: errorData.errorMessage || "Failed to connect to M-Pesa service.", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "M-Pesa Request Failed", description: "Could not reach M-Pesa service.", variant: "destructive" });
      }
    } else if (selectedPaymentMethod === 'card') {
       try {
        const response = await fetch('/api/card/authorize-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardNumber: "************1234",
            expiryMonth: "12",
            expiryYear: "2025",
            cvv: "123",
            amount: numericAmount,
            currency: currentPaymentLink.currency || 'KES'
          }),
        });
        if (response.ok) {
          const result = await response.json();
          if (result.result === "SUCCESS") {
             paymentSuccessful = true;
          } else {
             toast({ title: "Card Payment Failed", description: result.error?.explanation || "Card transaction declined.", variant: "destructive" });
          }
        } else {
           const errorData = await response.json().catch(() => ({error: {explanation: "Unknown card API error"}}));
           toast({ title: "Card API Error", description: errorData.error?.explanation || "Failed to connect to card service.", variant: "destructive" });
        }
      } catch (error) {
         toast({ title: "Card Request Failed", description: "Could not reach card payment service.", variant: "destructive" });
      }
    }

    setIsProcessing(false);

    if (paymentSuccessful) {
      router.push('/payment/successful');
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

  return (
    <div className="w-full max-w-md space-y-8">
      <h1 className="text-3xl font-semibold text-center text-foreground">
        Payment for your order
      </h1>

      <div className="space-y-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Order from</span>
          <span className="font-medium text-foreground">{currentPaymentLink.linkName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Reference #</span>
          <span className="font-medium text-foreground">{currentPaymentLink.reference}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Purpose</span>
          <span className="font-medium text-foreground">{currentPaymentLink.purpose}</span>
        </div>
        <hr className="border-border my-2" />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-medium text-foreground text-lg">{currentPaymentLink.currency} {parseFloat(currentPaymentLink.amount).toFixed(2)}</span>
        </div>
        {currentPaymentLink.hasExpiry && currentPaymentLink.expiryDate && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Due by</span>
            <span className="font-medium text-foreground">{format(new Date(currentPaymentLink.expiryDate), 'PPP')}</span>
          </div>
        )}
      </div>

      <RadioGroup
        value={selectedPaymentMethod}
        onValueChange={setSelectedPaymentMethod}
        className="space-y-3"
        aria-label="Payment method"
      >
        {paymentOptions.map((option) => (
          <Label
            key={option.value}
            htmlFor={option.value}
            className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors
              ${selectedPaymentMethod === option.value ? 'border-primary ring-2 ring-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}
          >
            <RadioGroupItem value={option.value} id={option.value} className="shrink-0" />
            <div className="flex-grow flex items-center space-x-2">
              <option.icon className={`h-6 w-6 ${selectedPaymentMethod === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <p className={`font-medium ${selectedPaymentMethod === option.value ? 'text-primary' : 'text-foreground'}`}>{option.name}</p>
                <p className={`text-xs ${selectedPaymentMethod === option.value ? 'text-primary/80' : 'text-muted-foreground'}`}>{option.description}</p>
              </div>
            </div>
          </Label>
        ))}
      </RadioGroup>

      <Button 
        onClick={handlePayment} 
        className="w-full h-12 text-base rounded-lg" 
        disabled={!selectedPaymentMethod || isProcessing}
      >
        {isProcessing ? <Spinner className="mr-2" /> : null}
        {isProcessing ? 'Processing...' : `Pay Now (${currentPaymentLink.currency} ${parseFloat(currentPaymentLink.amount).toFixed(2)})`}
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
