'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllTransactions } from '@/lib/actions';
import type { Transaction } from '@/lib/types';
import TransactionCard from '@/components/TransactionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListFilter, Search, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
      (txn.recipientPhone.includes(searchTerm) || txn.id.toLowerCase().includes(searchTerm.toLowerCase()) || txn.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) || txn.senderEmail?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(txn => statusFilter === 'all' || txn.status === statusFilter);

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
            placeholder="Search by ID, phone, name, email..."
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
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredTransactions.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {filteredTransactions.map((txn) => (
            <Link key={txn.id} href={`/dashboard/transfer/status/${txn.id}`} className="block">
                <TransactionCard transaction={txn} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">No transactions found.</p>
          { (searchTerm || statusFilter !== 'all') && 
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filter criteria.</p> 
          }
        </div>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-6 w-3/4 mb-1" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}
