
"use client";

import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CenteredCardLayout } from '@/components/layouts/centered-card-layout';
import { PaymentDetailsDisplay } from '@/components/payment/payment-details-card';
import type { PaymentDetails } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Dummy data
const failedPayment: PaymentDetails = {
  reference: 'PMT789012',
  name: 'Pesi X Services',
  amount: 'KES 2,500.00',
  date: new Date().toLocaleDateString(), // Use current date
  status: 'Failed',
  paymentReason: 'Transaction declined by bank. Insufficient funds.', // Added reason for failure
};

const PaymentFailedPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const handleRetry = () => {
    // Navigate to a retry URL or previous payment page
    // For now, let's go to a generic complete payment page
    // In a real app, you'd likely pass the payment link ID or order ID
    toast({
      title: "Retrying Payment (Mock)",
      description: "Redirecting to payment page...",
    });
    router.push('/payment/complete-basic'); // Example: Redirect to basic payment page
  };

  return (
    <CenteredCardLayout showLogo={false} cardClassName="border-destructive">
      <div className="flex flex-col items-center text-center space-y-6">
        <XCircle className="h-20 w-20 text-destructive" />
        <h2 className="text-3xl font-semibold text-destructive">Payment Failed</h2>
        <p className="text-muted-foreground">
          Unfortunately, your payment could not be processed. 
          {failedPayment.paymentReason ? ` Reason: ${failedPayment.paymentReason}` : "Please try again or contact support."}
        </p>
        
        <div className="w-full border rounded-md p-4 bg-destructive/5">
            <PaymentDetailsDisplay details={failedPayment} />
        </div>

        <Button onClick={handleRetry} className="w-full" variant="destructive">
          Retry Payment
        </Button>
        <Button onClick={() => router.push('/dashboard')} className="w-full" variant="outline">
          Go to Dashboard
        </Button>
      </div>
    </CenteredCardLayout>
  );
};

export default PaymentFailedPage;
