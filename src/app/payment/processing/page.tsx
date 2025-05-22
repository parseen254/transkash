
"use client";

import type { NextPage } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Smartphone, Receipt, CreditCard, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/shared/app-logo';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';

interface PaymentProcessingContentProps {
  paymentLinkId: string | null;
  method: string | null;
  amount: string | null;
  currency: string | null;
  reference: string | null;
  mpesaPhoneNumber?: string | null; // Full phone number for API
  mpesaPhoneNumberDisplay?: string | null; // Redacted for display
  cardNumber?: string | null; // Full card number for API
  displayCardNumber?: string | null; // Redacted for display
}

const PaymentProcessingContent: React.FC<PaymentProcessingContentProps> = ({
  paymentLinkId,
  method,
  amount,
  currency,
  reference,
  mpesaPhoneNumber,
  mpesaPhoneNumberDisplay,
  cardNumber,
  displayCardNumber,
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [processingMessage, setProcessingMessage] = useState("Processing your payment...");

  useEffect(() => {
    if (!paymentLinkId || !method || !amount || !currency || !reference) {
      toast({ title: "Error", description: "Missing payment details for processing.", variant: "destructive" });
      router.push(`/payment/order${paymentLinkId ? `?paymentLinkId=${paymentLinkId}` : ''}`);
      return;
    }

    const processPayment = async () => {
      let success = false;
      let apiEndpoint = '';
      let requestBody: any = {};

      // Mock Expiry and CVV for card payments, as they are not passed via URL for security
      // THIS IS A MOCK SCENARIO ONLY. Real apps would handle this server-side or via tokenization.
      const mockCardExpiryMonth = "12"; 
      const mockCardExpiryYear = "2028"; 
      const mockCardCvv = "123";

      if (method === 'mpesa_stk') {
        if (!mpesaPhoneNumber) {
            toast({ title: "Error", description: "M-Pesa phone number not provided for STK Push.", variant: "destructive" });
            router.push(`/payment/failed?paymentLinkId=${paymentLinkId}&amount=${amount}&currency=${currency}&reference=${reference}&method=${method}`);
            return;
        }
        setProcessingMessage("STK Push sent. Please enter your M-Pesa PIN on your phone to complete the payment.");
        await new Promise(resolve => setTimeout(resolve, 8000)); 
        apiEndpoint = '/api/mpesa/initiate-payment';
        requestBody = { phoneNumber: mpesaPhoneNumber, amount: parseFloat(amount), accountReference: reference, transactionDesc: `Payment for ${reference}` };
      } else if (method === 'mpesa_paybill') {
        setProcessingMessage("Confirming your Paybill payment...");
        apiEndpoint = '/api/mpesa/confirm-c2b';
        requestBody = { paymentLinkId, amount: parseFloat(amount), currency };
      } else if (method === 'card') {
        if (!cardNumber) {
            toast({ title: "Error", description: "Card details not provided for payment processing.", variant: "destructive" });
            router.push(`/payment/failed?paymentLinkId=${paymentLinkId}&amount=${amount}&currency=${currency}&reference=${reference}&method=${method}`);
            return;
        }
        setProcessingMessage("Authorizing your card...");
        apiEndpoint = '/api/card/authorize-payment';
        requestBody = {
            cardNumber, 
            expiryMonth: mockCardExpiryMonth, 
            expiryYear: mockCardExpiryYear, 
            cvv: mockCardCvv,
            amount: parseFloat(amount), 
            currency
        };
      } else {
        toast({ title: "Error", description: "Invalid payment method specified.", variant: "destructive" });
        router.push(`/payment/failed?paymentLinkId=${paymentLinkId}&amount=${amount}&currency=${currency}&reference=${reference}&method=${method}`);
        return;
      }

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        const result = await response.json();

        if (response.ok) {
            if (method === 'mpesa_stk' && result.ResponseCode === "0") success = true;
            else if (method === 'mpesa_paybill' && result.ResultCode === "0") success = true;
            else if (method === 'card' && result.result === "SUCCESS") success = true;
            else {
                 const errorMsg = result.errorMessage || result.ResultDesc || result.error?.explanation || "Payment processing failed.";
                 toast({ title: "Payment Failed", description: errorMsg, variant: "destructive" });
            }
        } else {
            const errorMsg = result.errorMessage || result.ResultDesc || result.error?.explanation || `Payment processing failed with status ${response.status}.`;
            toast({ title: "Payment Failed", description: errorMsg, variant: "destructive" });
        }

      } catch (error) {
        console.error("Payment processing API call error:", error);
        toast({ title: "Error", description: "An error occurred while connecting to the payment service.", variant: "destructive" });
      }

      if (success) {
        router.push(`/payment/successful?paymentLinkId=${paymentLinkId}&amount=${amount}&currency=${currency}&reference=${reference}&method=${method}`);
      } else {
        router.push(`/payment/failed?paymentLinkId=${paymentLinkId}&amount=${amount}&currency=${currency}&reference=${reference}&method=${method}`);
      }
    };

    processPayment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  let MethodIcon = CreditCard;
  let displayIdentifier = displayCardNumber;
  if (method === 'mpesa_stk') {
    MethodIcon = Smartphone;
    displayIdentifier = mpesaPhoneNumberDisplay;
  } else if (method === 'mpesa_paybill') {
    MethodIcon = Receipt;
    displayIdentifier = "Paybill";
  }


  return (
    <div className="w-full max-w-md text-center space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">{processingMessage}</h1>
      <Spinner className="mx-auto h-16 w-16 text-primary" />
      <div className="text-left space-y-2 p-4 bg-secondary/30 rounded-lg border border-border text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount:</span>
          <span className="font-medium text-foreground">{currency} {parseFloat(amount || "0").toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Order Ref:</span>
          <span className="font-medium text-foreground">{reference}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Method:</span>
          <span className="font-medium text-foreground flex items-center gap-1">
            <MethodIcon className="h-4 w-4" />
            {method?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
        {displayIdentifier && method !== 'mpesa_paybill' && (
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{method === 'card' ? 'Card:' : 'Phone:'}</span>
                <span className="font-medium text-foreground">{displayIdentifier}</span>
            </div>
        )}
      </div>
      <p className="text-muted-foreground text-xs">Please do not close or refresh this page.</p>
    </div>
  );
};

const PaymentProcessingPageWrapper: React.FC = () => {
  const searchParams = useSearchParams();
  const paymentLinkId = searchParams.get('paymentLinkId');
  const method = searchParams.get('method');
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency');
  const reference = searchParams.get('reference');

  // Payment method specific params
  const mpesaPhoneNumber = searchParams.get('mpesaPhoneNumber');
  const mpesaPhoneNumberDisplay = searchParams.get('mpesaPhoneNumberDisplay');
  const cardNumber = searchParams.get('cardNumber');
  const displayCardNumber = searchParams.get('displayCardNumber');
  // CVV and Expiry are intentionally NOT read from query params for security

  return (
    <PaymentProcessingContent
      paymentLinkId={paymentLinkId}
      method={method}
      amount={amount}
      currency={currency}
      reference={reference}
      mpesaPhoneNumber={mpesaPhoneNumber}
      mpesaPhoneNumberDisplay={mpesaPhoneNumberDisplay}
      cardNumber={cardNumber}
      displayCardNumber={displayCardNumber}
    />
  );
};


const PaymentProcessingPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between p-6 border-b border-border">
        <AppLogo />
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-6 w-6" />
        </Button>
      </header>
      <main className="flex flex-col items-center justify-center flex-grow p-4 sm:p-8">
        <Suspense fallback={<div className="text-center"><Spinner className="h-12 w-12 text-primary" /><p className="mt-2 text-muted-foreground">Loading payment processor...</p></div>}>
          <PaymentProcessingPageWrapper />
        </Suspense>
      </main>
    </div>
  );
};

export default PaymentProcessingPage;

