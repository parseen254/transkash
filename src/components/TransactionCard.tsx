import type { Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, CalendarDays, Phone, PoundSterling, CheckCircle2, Clock, Loader2, XCircle, AlertCircle } from 'lucide-react';
import MpesaLogo from '@/components/icons/MpesaLogo'; // Assuming an MPESA logo component exists
import { format } from 'date-fns';

interface TransactionCardProps {
  transaction: Transaction;
}

const statusIcons: Record<Transaction['status'], React.ElementType> = {
  PENDING_STRIPE: Clock,
  PAYMENT_SUCCESSFUL: CheckCircle2,
  PROCESSING_MPESA: Loader2,
  COMPLETED: CheckCircle2,
  FAILED_MPESA: XCircle,
  CANCELED_STRIPE: AlertCircle,
};

const statusColors: Record<Transaction['status'], string> = {
  PENDING_STRIPE: 'bg-yellow-500 hover:bg-yellow-500',
  PAYMENT_SUCCESSFUL: 'bg-blue-500 hover:bg-blue-500',
  PROCESSING_MPESA: 'bg-purple-500 hover:bg-purple-500',
  COMPLETED: 'bg-green-500 hover:bg-green-500',
  FAILED_MPESA: 'bg-red-500 hover:bg-red-500',
  CANCELED_STRIPE: 'bg-gray-500 hover:bg-gray-500',
};

const statusText: Record<Transaction['status'], string> = {
  PENDING_STRIPE: 'Pending Stripe Payment',
  PAYMENT_SUCCESSFUL: 'Payment Successful',
  PROCESSING_MPESA: 'Processing MPESA',
  COMPLETED: 'Completed',
  FAILED_MPESA: 'MPESA Failed',
  CANCELED_STRIPE: 'Stripe Canceled',
};

export default function TransactionCard({ transaction }: TransactionCardProps) {
  const StatusIcon = statusIcons[transaction.status] || AlertCircle;

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center">
              <ArrowRightLeft className="mr-2 h-5 w-5 text-primary" />
              Transfer to {transaction.recipientPhone}
            </CardTitle>
            <CardDescription className="text-xs">
              ID: {transaction.id}
            </CardDescription>
          </div>
          <Badge variant="outline" className={`${statusColors[transaction.status]} text-primary-foreground px-3 py-1 text-xs`}>
            <StatusIcon className={`mr-1 h-3 w-3 ${transaction.status === 'PROCESSING_MPESA' ? 'animate-spin' : ''}`} />
            {statusText[transaction.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center"><PoundSterling className="mr-1 h-4 w-4" /> Amount:</span>
          <span className="font-semibold">{transaction.amount.toFixed(2)} {transaction.currency}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center"><MpesaLogo className="mr-1 h-5 w-auto" /> Recipient:</span>
          <span className="font-semibold">{transaction.recipientPhone}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center"><CalendarDays className="mr-1 h-4 w-4" /> Date:</span>
          <span className="font-semibold">{format(new Date(transaction.createdAt), 'MMM d, yyyy p')}</span>
        </div>
        {transaction.status === 'FAILED_MPESA' && (
          <p className="text-xs text-destructive">The MPESA transfer could not be completed. Please check details or contact support.</p>
        )}
      </CardContent>
    </Card>
  );
}
