
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllTransactions } from '@/lib/actions';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ListFilter, Search, PlusCircle, ArrowRightLeft, CalendarDays, Smartphone, PoundSterling, CheckCircle2, Clock, Loader2, XCircle, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

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
  PENDING_STRIPE: 'Pending Stripe',
  PAYMENT_SUCCESSFUL: 'Payment OK',
  PROCESSING_MPESA: 'Processing MPESA',
  COMPLETED: 'Completed',
  FAILED_MPESA: 'MPESA Failed',
  CANCELED_STRIPE: 'Stripe Canceled',
};


export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      const fetchedTransactions = await getAllTransactions();
      setTransactions(fetchedTransactions);
      setLoading(false);
    }
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions
    .filter(txn => 
      (txn.recipientPhone.toLowerCase().includes(searchTerm.toLowerCase()) || 
       txn.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
       txn.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       txn.senderEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       txn.amount.toString().includes(searchTerm))
    )
    .filter(txn => statusFilter === 'all' || txn.status === statusFilter);

  const handleRowClick = (transactionId: string) => {
    router.push(`/dashboard/transfer/status/${transactionId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
        <Link href="/dashboard/transfer/new">
          <Button className="shadow-md hover:shadow-lg transition-shadow">
            <PlusCircle className="mr-2 h-5 w-5" /> New Transfer
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-card shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by ID, phone, name, email, amount..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <ListFilter className="h-5 w-5 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING_STRIPE">Pending Stripe</SelectItem>
              <SelectItem value="PAYMENT_SUCCESSFUL">Payment Successful</SelectItem>
              <SelectItem value="PROCESSING_MPESA">Processing MPESA</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED_MPESA">MPESA Failed</SelectItem>
              <SelectItem value="CANCELED_STRIPE">Stripe Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">ID</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : filteredTransactions.length > 0 ? (
        <div className="rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px] hidden md:table-cell">Transaction ID</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((txn) => {
                const StatusIcon = statusIcons[txn.status] || AlertCircle;
                return (
                  <TableRow 
                    key={txn.id} 
                    onClick={() => handleRowClick(txn.id)} 
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium hidden md:table-cell">{txn.id.substring(0,12)}...</TableCell>
                    <TableCell>
                        <div className="font-medium">{txn.senderName || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground hidden md:block">{txn.senderEmail}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Smartphone className="mr-2 h-4 w-4 text-muted-foreground" />
                        {txn.recipientPhone}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                           <PoundSterling className="mr-1 h-4 w-4 text-muted-foreground" /> 
                           {txn.amount.toFixed(2)} {txn.currency}
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${statusColors[txn.status]} text-primary-foreground px-2 py-1 text-xs`}>
                        <StatusIcon className={`mr-1 h-3 w-3 ${txn.status === 'PROCESSING_MPESA' ? 'animate-spin' : ''}`} />
                        {statusText[txn.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {format(new Date(txn.createdAt), 'PPp')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-10 border rounded-lg bg-card shadow-sm">
          <p className="text-xl text-muted-foreground">No transactions found.</p>
          { (searchTerm || statusFilter !== 'all') && 
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filter criteria.</p> 
          }
        </div>
      )}
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-3/4" /></TableCell>
      <TableCell>
        <Skeleton className="h-5 w-2/3 mb-1" />
        <Skeleton className="h-3 w-1/2 hidden md:block" />
      </TableCell>
      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
      <TableCell className="text-right hidden sm:table-cell"><Skeleton className="h-5 w-3/4 ml-auto" /></TableCell>
    </TableRow>
  )
}

