"use client";

import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Used for payment reason display
import { CenteredCardLayout } from '@/components/layouts/centered-card-layout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PaymentDetailsCard, PaymentDetailsDisplay } from '@/components/payment/payment-details-card';
import type { PaymentDetails } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Dummy payment details
const paymentInfo: PaymentDetails = {
  reference: 'LNK123XYZ',
  name: 'Sample Merchant Ltd.',
  amount: 'KES 750.00',
  date: '2023-10-28',
  paymentReason: 'Payment for Graphics Design Services (INV-2023-088)',
};

// This page mostly displays info and has a "Pay Now" button.
// No form needed if payment details are already captured.
// If additional info is needed for this specific payment, a form can be added.
// For now, focusing on displaying information and Pay Now action.

const CompletePaymentLinkPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const handlePayNow = async () => {
    // Simulate API call for payment processing
    toast({
      title: "Processing Payment",
      description: "Please wait while we process your transaction.",
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate payment success/failure
    const isSuccess = Math.random() > 0.2; // 80% chance of success
    if (isSuccess) {
      router.push('/payment/successful');
    } else {
      router.push('/payment/failed');
    }
  };

  return (
    <CenteredCardLayout title="Payment via Link">
      <Card className="w-full">
        <CardHeader>
           <CardTitle>Confirm Payment Details</CardTitle>
           <CardDescription>Review the information below before proceeding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <PaymentDetailsDisplay details={paymentInfo} />
            <Button onClick={handlePayNow} className="w-full">
                Pay Now ({paymentInfo.amount})
            </Button>
        </CardContent>
      </Card>
    </CenteredCardLayout>
  );
};

export default CompletePaymentLinkPage;
