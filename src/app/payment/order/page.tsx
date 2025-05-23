
"use client";

import type { NextPage } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { HelpCircle, Smartphone, CreditCard, Receipt, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/shared/app-logo';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import type { PaymentLink } from '@/lib/types';
import { format, isFuture, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';

interface PaymentOption {
  value: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

const paymentOptions: PaymentOption[] = [
  { value: 'mpesa_stk', name: 'M-Pesa (STK Push)', description: 'Pay with M-Pesa STK Push', icon: Smartphone },
  { value: 'mpesa_paybill', name: 'M-Pesa (Paybill)', description: 'Pay using M-Pesa Paybill', icon: Receipt },
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
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState(''); 
  const [cvv, setCvv] = useState('');

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

  const isCardFormValid = useCallback(() => {
    const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/; 
    if (!expiryPattern.test(cardExpiry)) return false;
    
    const [monthStr, yearStr] = cardExpiry.split('/');
    const parsedFullYear = parseInt(`20${yearStr}`, 10);
    const parsedMonth = parseInt(monthStr, 10);

    if (isNaN(parsedMonth) || isNaN(parsedFullYear) || parsedMonth < 1 || parsedMonth > 12) return false;

    const expiryDateObject = new Date(parsedFullYear, parsedMonth -1); 
    const lastDayOfExpiryMonth = new Date(expiryDateObject.getFullYear(), expiryDateObject.getMonth() + 1, 0);

    return (
      cardNumber.replace(/\s/g, '').length >= 13 && cardNumber.replace(/\s/g, '').length <=19 &&
      cvv.length >= 3 && cvv.length <= 4 &&
      isValid(lastDayOfExpiryMonth) && 
      isFuture(lastDayOfExpiryMonth)
    );
  }, [cardNumber, cardExpiry, cvv]);

  const handlePayment = async () => {
    if (!selectedPaymentMethod || !currentPaymentLink) {
      toast({ title: "Error", description: "Payment details or method missing.", variant: "destructive" });
      return;
    }

    if (selectedPaymentMethod === 'mpesa_stk' && !mpesaPhoneNumber.match(/^(?:\+?254|0)?([17]\d{8})$/)) {
      toast({ title: "Invalid Phone Number", description: "Please enter a valid M-Pesa phone number (e.g., 07XXXXXXXX).", variant: "destructive" });
      return;
    }

    if (selectedPaymentMethod === 'card' && !isCardFormValid()) {
      toast({ title: "Invalid Card Details", description: "Please check your card information and try again.", variant: "destructive" });
      return;
    }

    setIsSubmittingPayment(true);
    toast({ title: "Initiating Payment", description: "Please wait..." });

    const queryParams = new URLSearchParams({
      paymentLinkId: currentPaymentLink.id,
      creatorUserId: currentPaymentLink.creatorUserId, 
      method: selectedPaymentMethod,
      amount: String(currentPaymentLink.amount),
      currency: currentPaymentLink.currency || 'KES',
      reference: currentPaymentLink.reference,
    });

    if (selectedPaymentMethod === 'mpesa_stk') {
      queryParams.append('mpesaPhoneNumber', mpesaPhoneNumber); 
      const redactedPhone = `${mpesaPhoneNumber.substring(0, mpesaPhoneNumber.length > 7 ? 3 : 2)}****${mpesaPhoneNumber.substring(mpesaPhoneNumber.length - 2)}`;
      queryParams.append('mpesaPhoneNumberDisplay', redactedPhone); 
    } else if (selectedPaymentMethod === 'card') {
      queryParams.append('cardNumber', cardNumber.replace(/\s/g, '')); 
      const displayCardNum = `**** **** **** ${cardNumber.replace(/\s/g, '').slice(-4)}`;
      queryParams.append('displayCardNumber', displayCardNum);
      queryParams.append('cardExpiry', cardExpiry); 
      queryParams.append('cvv', cvv);
    }

    router.push(`/payment/processing?${queryParams.toString()}`);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);

    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    } else if (value.length === 2 && cardExpiry.length === 1 && !cardExpiry.includes('/')) {
      value = `${value}/`;
    }
    setCardExpiry(value);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\s/g, '');
    if (rawValue.length > 19) return;
    const formattedValue = rawValue.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formattedValue);
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
  let payButtonText = `Pay ${currentPaymentLink.currency} ${currentPaymentLink.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  let PayButtonIcon = CreditCard;

  if (selectedPaymentMethod === 'mpesa_stk') {
    payButtonText = `Pay with M-Pesa (STK Push)`;
    PayButtonIcon = Smartphone;
  } else if (selectedPaymentMethod === 'mpesa_paybill') {
    payButtonText = "I've sent the money";
    PayButtonIcon = Receipt;
  } else if (selectedPaymentMethod === 'card') {
    payButtonText = `Pay ${currentPaymentLink.currency} ${currentPaymentLink.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    PayButtonIcon = CreditCard;
  }


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

      {!selectedPaymentMethod && (
         <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod} className="space-y-3" aria-label="Payment method">
            {paymentOptions.map((option) => (
            <Label key={option.value} htmlFor={option.value}
                className={cn(`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors
                ${selectedPaymentMethod === option.value ? 'border-primary ring-2 ring-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`)}>
                <RadioGroupItem value={option.value} id={option.value} className="shrink-0" />
                <div className="flex-grow flex items-center space-x-3">
                <option.icon className={cn(`h-6 w-6 ${selectedPaymentMethod === option.value ? 'text-primary' : 'text-muted-foreground'}`)} />
                <div>
                    <p className={cn(`font-medium ${selectedPaymentMethod === option.value ? 'text-primary' : 'text-foreground'}`)}>{option.name}</p>
                    <p className={cn(`text-xs ${selectedPaymentMethod === option.value ? 'text-primary/80' : 'text-muted-foreground'}`)}>{option.description}</p>
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
                <li>Enter Amount: <strong className="text-foreground">{currentPaymentLink.currency} {currentPaymentLink.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></li>
                <li>Enter your M-Pesa PIN and confirm</li>
            </ul>
        </div>
      )}

      {selectedPaymentMethod === 'card' && (
        <div className="space-y-4">
           <p className="text-base font-medium text-foreground">Card Details</p>
           <div>
                <Label htmlFor="cardNumber" className="text-sm font-medium text-muted-foreground">Card Number</Label>
                <Input id="cardNumber" type="text" placeholder="0000 0000 0000 0000" value={cardNumber}
                    onChange={handleCardNumberChange} maxLength={23} 
                    autoComplete="cc-number"
                    className="mt-1 bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" />
           </div>
           <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="cardExpiry" className="text-sm font-medium text-muted-foreground">Expiry Date (MM/YY)</Label>
                    <Input id="cardExpiry" type="text" placeholder="MM/YY" value={cardExpiry}
                        onChange={handleExpiryChange} maxLength={5}
                        autoComplete="cc-exp"
                        className="mt-1 bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" />
                </div>
                <div>
                    <Label htmlFor="cvv" className="text-sm font-medium text-muted-foreground">CVV</Label>
                    <Input id="cvv" type="text" placeholder="123" value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))} maxLength={4}
                        autoComplete="cc-csc"
                        className="mt-1 bg-secondary border-secondary focus:ring-primary rounded-lg h-12 px-4 text-base" />
                </div>
           </div>
        </div>
      )}

      {selectedPaymentMethod && (
        <>
            <Button onClick={handlePayment} className="w-full h-12 text-base rounded-lg"
                    disabled={isSubmittingPayment || (selectedPaymentMethod === 'mpesa_stk' && !mpesaPhoneNumber.match(/^(?:\+?254|0)?([17]\d{8})$/)) || (selectedPaymentMethod === 'card' && !isCardFormValid())}>
                {isSubmittingPayment ? <Spinner className="mr-2" /> : <PayButtonIcon className="mr-2 h-5 w-5" />}
                {isSubmittingPayment ? 'Processing...' : payButtonText}
            </Button>
            <Button variant="link" onClick={() => setSelectedPaymentMethod(undefined)}
                className="w-full text-muted-foreground hover:text-primary" disabled={isSubmittingPayment}>
                Change payment method
            </Button>
        </>
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

