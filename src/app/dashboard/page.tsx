import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRightLeft, ListChecks, CheckCircle2, TrendingUp } from 'lucide-react';
import TransactionCard from '@/components/TransactionCard';
import type { Transaction } from '@/lib/types';
import { APP_NAME } from '@/lib/constants';

// Mock data for recent transactions
const mockRecentTransactions: Transaction[] = [
  {
    id: 'txn_1P2gHh9jKlMnOpQrStUvWxYz',
    amount: 1500.00,
    currency: 'KES',
    recipientPhone: '+254712345678',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'txn_0P1fGe8iJkLmNoPqRsTuVwXy',
    amount: 750.50,
    currency: 'KES',
    recipientPhone: '+254723456789',
    status: 'PROCESSING_MPESA',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];


export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to {APP_NAME}</h1>
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
            <div className="text-2xl font-bold">125</div>
            <p className="text-xs text-muted-foreground">+10% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Transfers</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">110</div>
            <p className="text-xs text-muted-foreground">95% success rate</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending/Processing</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">View details in transactions</p>
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
        {mockRecentTransactions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {mockRecentTransactions.map((txn) => (
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
