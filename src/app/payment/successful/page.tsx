"use client";

import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CenteredCardLayout } from '@/components/layouts/centered-card-layout';
import { PaymentDetailsDisplay } from '@/components/payment/payment-details-card';
import type { PaymentDetails } from '@/lib/types';

// Dummy data
const successfulPayment: PaymentDetails = {
  reference: 'PMT123456',
  name: 'SwitchLink Services',
  amount: 'KES 10,000.00',
  date: '2023-10-28',
  status: 'Successful',
};

const PaymentSuccessfulPage: NextPage = () => {
  const router = useRouter();

  const handleViewReceipt = () => {
    // Navigate to a receipt page or open a PDF
    alert('Viewing receipt for ' + successfulPayment.reference);
  };

  return (
    <CenteredCardLayout showLogo={false} cardClassName="border-green-500">
      <div className="flex flex-col items-center text-center space-y-6">
        <CheckCircle2 className="h-20 w-20 text-green-500" />
        <h2 className="text-3xl font-semibold text-green-600">Payment Successful!</h2>
        <p className="text-muted-foreground">
          Your payment has been processed successfully. Thank you!
        </p>
        
        <div className="w-full border rounded-md p-4 bg-green-500/5">
           <PaymentDetailsDisplay details={successfulPayment} />
        </div>

        <Button onClick={handleViewReceipt} className="w-full bg-green-600 hover:bg-green-700 text-white">
          View Receipt
        </Button>
         <Button onClick={() => router.push('/dashboard')} className="w-full" variant="outline">
          Go to Dashboard
        </Button>
      </div>
    </CenteredCardLayout>
  );
};

export default PaymentSuccessfulPage;
