"use client";

import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CenteredCardLayout } from '@/components/layouts/centered-card-layout';
import { PaymentDetailsDisplay } from '@/components/payment/payment-details-card';
import type { PaymentDetails } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Dummy order details
const orderInfo: PaymentDetails = {
  reference: 'ORD987ABC',
  name: 'Your Recent Order',
  amount: 'KES 3,200.00',
  date: '2023-10-28',
};

const PaymentForOrderPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const handlePayNow = async () => {
    // Simulate API call for payment processing
    toast({
      title: "Processing Order Payment",
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
    <CenteredCardLayout title="Payment for Your Order">
      <Card className="w-full">
        <CardHeader>
           <CardTitle>Order Payment</CardTitle>
           <CardDescription>Please confirm the details for your order payment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <PaymentDetailsDisplay details={orderInfo} />
            <Button onClick={handlePayNow} className="w-full">
                Pay Now ({orderInfo.amount})
            </Button>
        </CardContent>
      </Card>
    </CenteredCardLayout>
  );
};

export default PaymentForOrderPage;
