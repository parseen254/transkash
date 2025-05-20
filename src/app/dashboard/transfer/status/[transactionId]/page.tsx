'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getTransactionById, updateTransactionStatus } from '@/lib/actions';
import type { Transaction } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, Loader2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import MpesaLogo from '@/components/icons/MpesaLogo';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const statusDetails: Record<Transaction['status'], { icon: React.ElementType; text: string; color: string; description: string }> = {
  PENDING_STRIPE: { icon: Clock, text: 'Pending Stripe Payment', color: 'text-yellow-500', description: 'Waiting for payment completion via Stripe.' },
  PAYMENT_SUCCESSFUL: { icon: CheckCircle2, text: 'Payment Successful', color: 'text-blue-500', description: 'Your payment with Stripe was successful. Preparing MPESA transfer.' },
  PROCESSING_MPESA: { icon: Loader2, text: 'Processing MPESA Transfer', color: 'text-purple-500', description: 'Your funds are being transferred to the recipient\'s MPESA account.' },
  COMPLETED: { icon: CheckCircle2, text: 'Transfer Completed', color: 'text-green-500', description: 'Funds successfully sent to the recipient\'s MPESA account.' },
  FAILED_MPESA: { icon: XCircle, text: 'MPESA Transfer Failed', color: 'text-red-500', description: 'The MPESA transfer could not be completed. Please contact support.' },
  CANCELED_STRIPE: { icon: AlertCircle, text: 'Stripe Payment Canceled', color: 'text-gray-500', description: 'The Stripe payment was canceled or failed.' },
};

function TransactionStatusContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const transactionId = params.transactionId as string;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTransaction() {
      if (!transactionId) return;
      setLoading(true);
      setError(null);
      try {
        const fetchedTransaction = await getTransactionById(transactionId);
        if (fetchedTransaction) {
          setTransaction(fetchedTransaction);
          // Simulate Stripe payment success if redirected from form
          if (searchParams.get('stripe_sim') === 'true' && fetchedTransaction.status === 'PENDING_STRIPE') {
            setTimeout(async () => {
              const updatedTxn = await updateTransactionStatus(transactionId, 'PAYMENT_SUCCESSFUL');
              if (updatedTxn) setTransaction(updatedTxn);
              toast({ title: "Stripe Payment Processed", description: "Payment confirmed (simulated)." });
            }, 2000); // Simulate Stripe processing time
          }
        } else {
          setError('Transaction not found.');
        }
      } catch (e) {
        setError('Failed to load transaction details.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchTransaction();
  }, [transactionId, searchParams, toast]);

  // Simulate MPESA processing after Stripe payment is successful
  useEffect(() => {
    if (transaction?.status === 'PAYMENT_SUCCESSFUL') {
      const timer = setTimeout(async () => {
        const updatedTxn = await updateTransactionStatus(transactionId, 'PROCESSING_MPESA');
        if (updatedTxn) setTransaction(updatedTxn);
      }, 3000); // Simulate delay before MPESA processing starts
      return () => clearTimeout(timer);
    }
    if (transaction?.status === 'PROCESSING_MPESA') {
      const timer = setTimeout(async () => {
        // Simulate random success/failure for MPESA
        const isSuccess = Math.random() > 0.2; // 80% chance of success
        const newStatus = isSuccess ? 'COMPLETED' : 'FAILED_MPESA';
        const updatedTxn = await updateTransactionStatus(transactionId, newStatus);
         if (updatedTxn) setTransaction(updatedTxn);
        toast({
          title: `MPESA Transfer ${isSuccess ? 'Completed' : 'Failed'}`,
          description: `The MPESA transfer is now ${newStatus.toLowerCase()}. (simulated)`,
          variant: isSuccess ? 'default' : 'destructive',
        });
      }, 5000); // Simulate MPESA processing time
      return () => clearTimeout(timer);
    }
  }, [transaction?.status, transactionId, toast]);


  if (loading) {
    return <StatusSkeleton />;
  }

  if (error) {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
        <CardFooter>
          <Link href="/dashboard">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (!transaction) {
    return <StatusSkeleton message="Transaction not found."/>;
  }

  const currentStatusDetails = statusDetails[transaction.status] || statusDetails.CANCELED_STRIPE; // Fallback
  const StatusIcon = currentStatusDetails.icon;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <StatusIcon className={`h-16 w-16 ${currentStatusDetails.color} ${transaction.status === 'PROCESSING_MPESA' ? 'animate-spin' : ''}`} />
        </div>
        <CardTitle className={`text-3xl font-bold ${currentStatusDetails.color}`}>{currentStatusDetails.text}</CardTitle>
        <CardDescription className="text-md text-muted-foreground">{currentStatusDetails.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-t border-b py-4 space-y-2">
          <InfoRow label="Transaction ID:" value={transaction.id} />
          <InfoRow label="Amount:" value={`${transaction.amount.toFixed(2)} ${transaction.currency}`} />
          <InfoRow label="Recipient:" value={transaction.recipientPhone} icon={<MpesaLogo className="h-5 w-auto inline mr-1" />} />
          {transaction.senderName && <InfoRow label="Sender Name:" value={transaction.senderName} />}
          {transaction.senderEmail && <InfoRow label="Sender Email:" value={transaction.senderEmail} />}
          <InfoRow label="Date Initiated:" value={format(new Date(transaction.createdAt), 'MMM d, yyyy p')} />
          <InfoRow label="Last Updated:" value={format(new Date(transaction.updatedAt), 'MMM d, yyyy p')} />
        </div>
        {transaction.status === 'COMPLETED' && transaction.mpesaTransactionId && (
           <InfoRow label="MPESA Confirmation:" value={transaction.mpesaTransactionId} className="font-semibold text-green-600" />
        )}
        {(transaction.status === 'PROCESSING_MPESA' || transaction.status === 'PAYMENT_SUCCESSFUL') && (
          <p className="text-sm text-center text-muted-foreground">This page will update automatically. SMS notifications will be sent upon completion or failure.</p>
        )}
        {transaction.status === 'FAILED_MPESA' && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-center">
            <p className="text-destructive text-sm">We encountered an issue with the MPESA transfer. Our team has been notified. Please contact support if the issue persists.</p>
          </div>
        )}

      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <Link href="/dashboard/transfer/new">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> New Transfer</Button>
        </Link>
        <Link href="/dashboard/transactions">
          <Button variant="default">View All Transactions</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function InfoRow({ label, value, icon, className }: { label: string; value: string | number; icon?: React.ReactNode; className?: string }) {
  return (
    <div className={`flex justify-between items-center text-sm ${className}`}>
      <span className="text-muted-foreground flex items-center">{icon}{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function StatusSkeleton({ message = "Loading transaction details..."}: {message?: string}) {
  return (
     <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-full mx-auto mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-t border-b py-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
         <Skeleton className="h-6 w-3/4 mx-auto" />
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-44" />
      </CardFooter>
    </Card>
  )
}

export default function TransactionStatusPage() {
  return (
    <Suspense fallback={<StatusSkeleton />}>
      <TransactionStatusContent />
    </Suspense>
  )
}
