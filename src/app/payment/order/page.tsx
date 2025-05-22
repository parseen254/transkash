
"use client";

import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { HelpCircle, Smartphone, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/shared/app-logo';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';

// Dummy order details
const orderDetails = {
  merchantName: 'The Coffee Shop',
  orderId: '1234567890',
  dueDate: '12/31/2024',
  amount: '$25.00',
  currency: 'USD', // Assuming USD for the example amount
  numericAmount: 25.00,
};

interface PaymentOption {
  value: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

const paymentOptions: PaymentOption[] = [
  { value: 'mpesa', name: 'M-Pesa', description: 'Pay with M-Pesa', icon: Smartphone },
  { value: 'card', name: 'Card Transfer', description: 'Pay with Card Transfer', icon: CreditCard },
  // { value: 'crypto', name: 'Crypto Wallet', description: 'Pay with Crypto Wallet', icon: Wallet }, // Crypto option removed for now
];

const PaymentForOrderPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: "Selection Required",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    toast({
      title: "Processing Payment",
      description: "Please wait...",
    });

    // Simulate API call based on selected method
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

    let paymentSuccessful = false;

    if (selectedPaymentMethod === 'mpesa') {
      try {
        const response = await fetch('/api/mpesa/initiate-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: "254712345678", // Dummy phone
            amount: orderDetails.numericAmount,
            accountReference: orderDetails.orderId,
            transactionDesc: `Payment for order ${orderDetails.orderId}`
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
            cardNumber: "************1234", // Dummy card
            expiryMonth: "12",
            expiryYear: "2025",
            cvv: "123",
            amount: orderDetails.numericAmount,
            currency: orderDetails.currency
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
    } else {
      // router.push('/payment/failed'); // Toast already shown for specific errors
      // Keep user on page to retry or choose different method if error was shown via toast
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between p-6 border-b border-border">
        <AppLogo />
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-6 w-6" />
        </Button>
      </header>

      <main className="flex flex-col items-center justify-center flex-grow p-4 sm:p-8">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-3xl font-semibold text-center text-foreground">
            Payment for your order
          </h1>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order from</span>
              <span className="font-medium text-foreground">{orderDetails.merchantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order #</span>
              <span className="font-medium text-foreground">{orderDetails.orderId}</span>
            </div>
            <hr className="border-border my-2" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium text-foreground">{orderDetails.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due by</span>
              <span className="font-medium text-foreground">{orderDetails.dueDate}</span>
            </div>
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
            {isProcessing ? 'Processing...' : `Pay Now (${orderDetails.amount})`}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default PaymentForOrderPage;
