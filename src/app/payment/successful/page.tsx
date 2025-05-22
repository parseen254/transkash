
"use client";

import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CenteredCardLayout } from '@/components/layouts/centered-card-layout';
import { PaymentDetailsDisplay } from '@/components/payment/payment-details-card';
import type { PaymentDetails } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Dummy data
const successfulPayment: PaymentDetails = {
  reference: 'PMT123456',
  name: 'Pesi X Services',
  amount: 'KES 10,000.00',
  date: new Date().toLocaleDateString(), // Use current date
  status: 'Successful',
};

const PaymentSuccessfulPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const handleViewReceipt = () => {
    // Navigate to a receipt page or open a PDF
    toast({
      title: "Receipt Generated (Mock)",
      description: `Receipt for transaction ${successfulPayment.reference} would be displayed here.`,
    });
    // In a real app, you might redirect to a receipt page or trigger a download
    // router.push(`/receipt/${successfulPayment.reference}`); 
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

        <Button 
          onClick={handleViewReceipt} 
          className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground"
        >
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
