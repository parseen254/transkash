
'use client'; // Make this a client component to use useAuth and fetch data

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRightLeft, ListChecks, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react';
import TransactionCard from '@/components/TransactionCard';
import type { Transaction } from '@/lib/types';
import { APP_NAME } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { getAllTransactions } from '@/lib/actions'; // Assuming this will be adapted for client-side if needed
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, successful: 0, pending: 0 });

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user || authLoading) return;
      setTransactionsLoading(true);
      try {
        const allTxns = await getAllTransactions(user.uid);
        setRecentTransactions(allTxns.slice(0, 2)); // Get first 2 for "Recent"

        // Calculate stats
        const total = allTxns.length;
        const successful = allTxns.filter(t => t.status === 'COMPLETED').length;
        const pending = allTxns.filter(t => 
          t.status === 'PENDING_STRIPE' || 
          t.status === 'PAYMENT_SUCCESSFUL' || 
          t.status === 'PROCESSING_MPESA'
        ).length;
        setStats({ total, successful, pending });

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // Handle error (e.g., show toast)
      } finally {
        setTransactionsLoading(false);
      }
    }
    fetchDashboardData();
  }, [user, authLoading]);

  if (authLoading || (!user && !authLoading)) { // Show skeleton if auth is loading or no user (layout handles redirect)
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome{user?.displayName ? `, ${user.displayName}` : ''} to {APP_NAME}
        </h1>
        <p className="text-muted-foreground">
          Easily manage your Stripe to MPESA transfers. Start a new transfer or view your transaction history.
        </p>
        <div>
          <Link href="/dashboard/transfer/new">
            <Button size="lg" className="shadow-md hover:shadow-lg transition-shadow">
              <ArrowRightLeft className="mr-2 h-5 w-5" />
              Start New Transfer
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {transactionsLoading ? <Skeleton className="h-8 w-1/2 mb-1"/> : <div className="text-2xl font-bold">{stats.total}</div>}
            {/* <p className="text-xs text-muted-foreground">+10% from last month</p> */}
             {transactionsLoading ? <Skeleton className="h-3 w-1/3"/> : <p className="text-xs text-muted-foreground">All your transactions</p>}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Transfers</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {transactionsLoading ? <Skeleton className="h-8 w-1/2 mb-1"/> : <div className="text-2xl font-bold">{stats.successful}</div>}
             {transactionsLoading ? <Skeleton className="h-3 w-1/3"/> : <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? `${((stats.successful / stats.total) * 100).toFixed(0)}% success rate` : 'No transfers yet'}
              </p>}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending/Processing</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {transactionsLoading ? <Skeleton className="h-8 w-1/2 mb-1"/> : <div className="text-2xl font-bold">{stats.pending}</div>}
            {transactionsLoading ? <Skeleton className="h-3 w-1/3"/> : <p className="text-xs text-muted-foreground">Currently in progress</p>}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Recent Transactions</h2>
          <Link href="/dashboard/transactions">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        {transactionsLoading ? (
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            <RecentTransactionSkeleton />
            <RecentTransactionSkeleton />
          </div>
        ) : recentTransactions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {recentTransactions.map((txn) => (
              <TransactionCard key={txn.id} transaction={txn} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              You have no recent transactions.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}


function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <div>
          <Skeleton className="h-12 w-48" />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-1" />
              <Skeleton className="h-3 w-1/4" />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <RecentTransactionSkeleton />
          <RecentTransactionSkeleton />
        </div>
      </section>
    </div>
  );
}

function RecentTransactionSkeleton() {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-6 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
         <div className="flex items-center justify-between text-sm">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
         <div className="flex items-center justify-between text-sm">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </CardContent>
    </Card>
  );
}
