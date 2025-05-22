
"use client";

import type { NextPage } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { HelpCircle, Smartphone, CreditCard, ListChecks, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/shared/app-logo';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import type { PaymentLink } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Dummy Data for Payment Links (simulates fetching from a backend)
const dummyPaymentLinks: PaymentLink[] = [
  { id: 'pl_1', linkName: 'Invoice #1234 (The Coffee Shop)', reference: 'ORD1234567890', amount: '25.00', currency: 'KES', purpose: 'Coffee and Snacks', creationDate: new Date('2023-10-01').toISOString(), expiryDate: new Date(new Date().setDate(new Date().getDate() + 15)), status: 'Active', payoutAccountId: 'acc_1', shortUrl: '/payment/order?paymentLinkId=pl_1', hasExpiry: true },
  { id: 'pl_2', linkName: 'Product Sale - T-Shirt', reference: 'PROD050', amount: '1500', currency: 'KES', purpose: 'Online Store Purchase', creationDate: new Date('2023-10-05').toISOString(), expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)), status: 'Active', payoutAccountId: 'acc_1', shortUrl: '/payment/order?paymentLinkId=pl_2', hasExpiry: true },
  { id: 'pl_3', linkName: 'Monthly Subscription', reference: 'SUB003', amount: '2000', currency: 'KES', purpose: 'SaaS Subscription', creationDate: new Date('2023-09-20').toISOString(), status: 'Active', payoutAccountId: 'acc_2', shortUrl: '/payment/order?paymentLinkId=pl_3', hasExpiry: false },
];


interface PaymentOption {
  value: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

const paymentOptions: PaymentOption[] = [
  { value: 'mpesa_stk', name: 'M-Pesa (STK Push)', description: 'Pay with M-Pesa STK Push', icon: Smartphone },
  { value: 'mpesa_paybill', name: 'M-Pesa (Paybill)', description: 'Pay using M-Pesa Paybill', icon: ListChecks },
  { value: 'card', name: 'Card Transfer', description: 'Pay with Card Transfer', icon: CreditCard },
];

const MOCK_PAYBILL_NUMBER = "888888";

const PaymentForOrderContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [currentPaymentLink, setCurrentPaymentLink] = useState<PaymentLink | null>(null);
  const [loadingLink, setLoadingLink] = useState(true);
  const [errorLoadingLink, setErrorLoadingLink] = useState<string | null>(null);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | undefined>(undefined);
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const paymentLinkId = searchParams.get('paymentLinkId');
    if (paymentLinkId) {
      setLoadingLink(true);
      setErrorLoadingLink(null);
      setTimeout(() => {
        const foundLink = dummyPaymentLinks.find(link => link.id === paymentLinkId);
        if (foundLink) {
          if (foundLink.hasExpiry && foundLink.expiryDate && new Date(foundLink.expiryDate) < new Date()) {
            setErrorLoadingLink(`Payment link "${foundLink.linkName}" has expired on ${format(new Date(foundLink.expiryDate), 'PPP')}.`);
            setCurrentPaymentLink(null);
          } else if (foundLink.status !== 'Active') {
            setErrorLoadingLink(`Payment link "${foundLink.linkName}" is not currently active. Status: ${foundLink.status}.`);
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
    if (!selectedPaymentMethod || !currentPaymentLink) {
      toast({ title: "Error", description: "Payment details missing.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    toast({ title: "Processing Payment", description: "Please wait..." });
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX

    let paymentSuccessful = false;
    const numericAmount = parseFloat(currentPaymentLink.amount);

    if (selectedPaymentMethod === 'mpesa_stk') {
      if (!mpesaPhoneNumber.match(/^(?:\+?254|0)?(7\d{8})$/)) {
        toast({ title: "Invalid Phone Number", description: "Please enter a valid M-Pesa phone number.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }
      try {
        const response = await fetch('/api/mpesa/initiate-payment', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: mpesaPhoneNumber, amount: numericAmount, accountReference: currentPaymentLink.reference, transactionDesc: currentPaymentLink.purpose }),
        });
        if (response.ok) {
          const result = await response.json();
          paymentSuccessful = result.ResponseCode === "0";
          if (!paymentSuccessful) toast({ title: "M-Pesa Error", description: result.CustomerMessage || result.errorMessage || "Failed to initiate M-Pesa STK push.", variant: "destructive" });
        } else {
          const errorData = await response.json().catch(() => ({errorMessage: "Unknown M-Pesa API error"}));
          toast({ title: "M-Pesa API Error", description: errorData.errorMessage || "Failed to connect to M-Pesa service.", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "M-Pesa Request Failed", description: "Could not reach M-Pesa service.", variant: "destructive" });
      }
    } else if (selectedPaymentMethod === 'mpesa_paybill') {
      try {
        const response = await fetch('/api/mpesa/confirm-c2b', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentLinkId: currentPaymentLink.id, amount: numericAmount, currency: currentPaymentLink.currency || 'KES' }),
        });
        if (response.ok) {
            const result = await response.json();
            paymentSuccessful = result.ResultCode === "0";
            if (!paymentSuccessful) toast({ title: "Paybill Confirmation Failed", description: result.ResultDesc || "Could not confirm payment.", variant: "destructive" });
        } else {
            const errorData = await response.json().catch(() => ({ResultDesc: "Unknown Paybill API error"}));
            toast({ title: "Paybill API Error", description: errorData.ResultDesc || "Failed to connect to Paybill confirmation service.", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Paybill Request Failed", description: "Could not reach Paybill confirmation service.", variant: "destructive" });
      }
    } else if (selectedPaymentMethod === 'card') {
       try {
        const response = await fetch('/api/card/authorize-payment', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardNumber: "************1234", expiryMonth: "12", expiryYear: "2025", cvv: "123", amount: numericAmount, currency: currentPaymentLink.currency || 'KES' }),
        });
        if (response.ok) {
          const result = await response.json();
          paymentSuccessful = result.result === "SUCCESS";
          if(!paymentSuccessful) toast({ title: "Card Payment Failed", description: result.error?.explanation || "Card transaction declined.", variant: "destructive" });
        } else {
           const errorData = await response.json().catch(() => ({error: {explanation: "Unknown card API error"}}));
           toast({ title: "Card API Error", description: errorData.error?.explanation || "Failed to connect to card service.", variant: "destructive" });
        }
      } catch (error) {
         toast({ title: "Card Request Failed", description: "Could not reach card payment service.", variant: "destructive" });
      }
    }

    setIsProcessing(false);
    if (paymentSuccessful) router.push('/payment/successful');
    // else router.push('/payment/failed'); // Optionally redirect to failure page
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
  
  const pageTitle = selectedPaymentMethod ? "Complete Payment" : "Payment for your order";

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
        <hr className="border-border my-2 !mt-3 !mb-3" />
        <div className="flex justify-between items-baseline">
          <span className="text-muted-foreground">Total</span>
          <span className="font-bold text-foreground text-xl">{currentPaymentLink.currency} {parseFloat(currentPaymentLink.amount).toFixed(2)}</span>
        </div>
        {currentPaymentLink.hasExpiry && currentPaymentLink.expiryDate && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Due by</span>
            <span className="font-medium text-muted-foreground">{format(new Date(currentPaymentLink.expiryDate), 'PPP')}</span>
          </div>
        )}
      </div>

      {!selectedPaymentMethod && (
         <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod} className="space-y-3" aria-label="Payment method">
            {paymentOptions.map((option) => (
            <Label key={option.value} htmlFor={option.value}
                className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors
                ${selectedPaymentMethod === option.value ? 'border-primary ring-2 ring-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}>
                <RadioGroupItem value={option.value} id={option.value} className="shrink-0" />
                <div className="flex-grow flex items-center space-x-3">
                <option.icon className={`h-6 w-6 ${selectedPaymentMethod === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                    <p className={`font-medium ${selectedPaymentMethod === option.value ? 'text-primary' : 'text-foreground'}`}>{option.name}</p>
                    <p className={`text-xs ${selectedPaymentMethod === option.value ? 'text-primary/80' : 'text-muted-foreground'}`}>{option.description}</p>
                </div>
                </div>
            </Label>
            ))}
        </RadioGroup>
      )}

      {selectedPaymentMethod === 'mpesa_stk' && (
        <div className="space-y-4">
            <p className="text-base font-medium text-foreground">M-Pesa STK Push Details</p>
            <div>
                <Label htmlFor="mpesaPhoneNumber" className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                <Input id="mpesaPhoneNumber" type="tel" placeholder="Enter phone number (e.g., 0712345678)" value={mpesaPhoneNumber}
                    onChange={(e) => setMpesaPhoneNumber(e.target.value)}
                    className="mt-1 bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" />
            </div>
            <Button onClick={handlePayment} className="w-full h-12 text-base rounded-lg" disabled={isProcessing || !mpesaPhoneNumber}>
                {isProcessing ? <Spinner className="mr-2" /> : <Smartphone className="mr-2 h-5 w-5" />}
                {isProcessing ? 'Processing...' : `Pay with M-Pesa (STK Push)`}
            </Button>
        </div>
      )}

      {selectedPaymentMethod === 'mpesa_paybill' && (
        <div className="space-y-4">
            <p className="text-base font-medium text-foreground">M-Pesa Paybill Instructions</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground bg-secondary/50 p-4 rounded-md">
                <li>Go to your M-Pesa Menu</li>
                <li>Select Lipa na M-Pesa, then Pay Bill</li>
                <li>Enter Business Number: <strong className="text-foreground">{MOCK_PAYBILL_NUMBER}</strong></li>
                <li>Enter Account Number: <strong className="text-foreground">{currentPaymentLink.reference}</strong></li>
                <li>Enter Amount: <strong className="text-foreground">{currentPaymentLink.currency} {parseFloat(currentPaymentLink.amount).toFixed(2)}</strong></li>
                <li>Enter your M-Pesa PIN and confirm</li>
            </ul>
            <Button onClick={handlePayment} className="w-full h-12 text-base rounded-lg" disabled={isProcessing}>
                {isProcessing ? <Spinner className="mr-2" /> : <ListChecks className="mr-2 h-5 w-5" />}
                {isProcessing ? 'Confirming...' : "I've sent the money"}
            </Button>
        </div>
      )}

      {selectedPaymentMethod === 'card' && (
        <div className="space-y-4 text-center">
           <p className="text-muted-foreground">You've selected to pay by card.</p>
            <Button onClick={handlePayment} className="w-full h-12 text-base rounded-lg" disabled={isProcessing}>
                {isProcessing ? <Spinner className="mr-2" /> : <CreditCard className="mr-2 h-5 w-5" />}
                {isProcessing ? 'Processing...' : `Pay with Card`}
            </Button>
        </div>
      )}

       {selectedPaymentMethod && (
         <Button variant="link" onClick={() => setSelectedPaymentMethod(undefined)} 
            className="w-full text-muted-foreground hover:text-primary" disabled={isProcessing}>
            Change payment method
        </Button>
       )}
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
