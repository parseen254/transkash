"use client";

import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CenteredCardLayout } from '@/components/layouts/centered-card-layout';
import { PaymentDetailsDisplay } from '@/components/payment/payment-details-card';
import type { PaymentDetails } from '@/lib/types';

// Dummy data
const failedPayment: PaymentDetails = {
  reference: 'PMT789012',
  name: 'John Doe Services',
  amount: 'KES 2,500.00',
  date: '2023-10-28',
  status: 'Failed',
};

const PaymentFailedPage: NextPage = () => {
  const router = useRouter();

  const handleRetry = () => {
    // Navigate to a retry URL or previous payment page
    // For now, let's go to a generic complete payment page
    router.push('/payment/complete-basic'); 
  };

  return (
    <CenteredCardLayout showLogo={false} cardClassName="border-destructive">
      <div className="flex flex-col items-center text-center space-y-6">
        <XCircle className="h-20 w-20 text-destructive" />
        <h2 className="text-3xl font-semibold text-destructive">Payment Failed</h2>
        <p className="text-muted-foreground">
          Unfortunately, your payment could not be processed. Please find the details below.
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
