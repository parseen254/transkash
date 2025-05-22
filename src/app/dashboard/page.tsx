
"use client";

import type { NextPage } from 'next';
import { ArrowUp, RefreshCw, Info, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { LineChart, BarChart, CartesianGrid, XAxis, YAxis, Line, Bar, Tooltip as RechartsTooltip } from 'recharts';
import type { Transaction } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardData {
  title: string;
  value: string;
  change: string;
  positiveChange?: boolean; // Made optional as N/A won't have a positive/negative state
}

const statData: StatCardData[] = [
  { title: 'Total Revenue', value: 'KES 0.00', change: 'N/A' },
  { title: 'Avg. Transaction Value', value: 'KES 0.00', change: 'N/A' },
  { title: 'Customer Retention Rate', value: '0%', change: 'N/A' },
];

const monthlyRevenueChartData: { month: string, revenue: number }[] = [
  // { month: 'Jan', revenue: 1500 }, { month: 'Feb', revenue: 1800 }, { month: 'Mar', revenue: 1300 },
  // { month: 'Apr', revenue: 2200 }, { month: 'May', revenue: 2000 }, { month: 'Jun', revenue: 2800 },
  // { month: 'Jul', revenue: 2500 },
];

const quarterlySalesChartData: { name: string, sales: number }[] = [
  // { name: 'Q1', sales: 8000 }, { name: 'Q2', sales: 12000 },
  // { name: 'Q3', sales: 9500 }, { name: 'Q4', sales: 15000 },
];

interface TopProductData {
  name: string;
  value: number;
}
const topSellingProductsData: TopProductData[] = [
  // { name: 'Product A', value: 80 }, { name: 'Product B', value: 60 }, { name: 'Product C', value: 40 },
];

const monthlyRevenueChartConfig = { revenue: { label: "Revenue", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;
const quarterlySalesChartConfig = { sales: { label: "Sales", color: "hsl(var(--chart-2))" } } satisfies ChartConfig;

// Reusable component for "No Data" display within chart cards
const NoChartDataDisplay = ({ onRefreshClick, className }: { onRefreshClick?: () => void; className?: string }) => (
  <div className={cn("flex flex-col items-center justify-center text-center h-full gap-2 min-h-[180px]", className)}>
    <Info className="h-10 w-10 text-muted-foreground" />
    <h3 className="text-md font-semibold text-foreground">No Data Available</h3>
    <p className="text-xs text-muted-foreground max-w-[280px]">
      There is currently no data to display for this chart.
    </p>
    <Button 
      variant="secondary" 
      size="sm" 
      className="rounded-full px-3 h-8 text-xs"
      onClick={onRefreshClick} // In a real app, wire this to a refresh function
    >
      <RefreshCw className="mr-1.5 h-3 w-3" />
      Refresh
    </Button>
  </div>
);


const DashboardPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    setLoadingTransactions(true);
    const transactionsCollection = collection(db, 'transactions');
    const q = query(
      transactionsCollection, 
      where('userId', '==', user.uid), 
      orderBy('createdAt', 'desc'), 
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedTransactions: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        fetchedTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setRecentTransactions(fetchedTransactions);
      setLoadingTransactions(false);
    }, (error) => {
      console.error("Error fetching recent transactions: ", error);
      setLoadingTransactions(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router]);

  if (authLoading || (!user && !authLoading)) {
    return (
        <div className="flex justify-center items-center h-full p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  const formatDate = (dateValue: Timestamp | Date | string | undefined) => {
    if (!dateValue) return 'N/A';
    const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue);
    return format(date, 'yyyy-MM-dd');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[32px] font-bold tracking-light text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your business performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statData.map((stat) => (
          <Card key={stat.title} className="bg-secondary shadow-sm rounded-xl">
            <CardHeader className="pb-2 p-6">
                <CardDescription className="text-base font-medium text-foreground">{stat.title}</CardDescription>
                <CardTitle className="text-2xl font-bold tracking-light">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
                <div className={`text-base font-medium ${stat.positiveChange === undefined ? 'text-muted-foreground' : stat.positiveChange ? 'text-green-600' : 'text-destructive'} flex items-center`}>
                    {stat.positiveChange && <ArrowUp className="h-4 w-4 mr-1" />}
                    {stat.change}
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card shadow-sm rounded-xl border border-border">
        <CardHeader className="p-4 pt-5 pb-3"><CardTitle className="text-[22px] font-bold tracking-[-0.015em]">Recent Transactions</CardTitle></CardHeader>
        <CardContent className="px-4 py-3">
          {loadingTransactions ? (
             <div className="overflow-hidden rounded-xl border border-border">
                <Table>
                  <TableHeader><TableRow className="bg-card hover:bg-card">{[...Array(4)].map((_,i) => <TableHead key={i} className="px-4 py-3"><Skeleton className="h-5 w-full"/></TableHead>)}</TableRow></TableHeader>
                  <TableBody>{[...Array(3)].map((_,i) => <TableRow key={i} className="h-[72px]">{[...Array(4)].map((_,j) => <TableCell key={j} className="px-4 py-2"><Skeleton className="h-5 w-full"/></TableCell>)}</TableRow>)}</TableBody>
                </Table>
             </div>
          ) : recentTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No recent transactions.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader><TableRow className="bg-card hover:bg-card">
                    <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Date</TableHead>
                    <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Customer</TableHead>
                    <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Amount</TableHead>
                    <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="h-[72px]">
                      <TableCell className="px-4 py-2 text-sm text-muted-foreground">{formatDate(transaction.createdAt)}</TableCell>
                      <TableCell className="px-4 py-2 text-sm font-normal text-foreground">{transaction.customer}</TableCell>
                      <TableCell className="px-4 py-2 text-sm text-muted-foreground">{transaction.currency} {transaction.amount.toFixed(2)}</TableCell>
                      <TableCell className="px-4 py-2 text-sm">
                         <Badge variant="secondary" className="rounded-full h-8 px-4 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full justify-center max-w-[150px]">{transaction.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-foreground px-4 pb-3 pt-5">Sales Trends</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 px-4 py-6">
          <Card className="bg-card shadow-sm rounded-xl border border-border">
            <CardHeader className="p-6">
                <CardTitle className="text-base font-medium text-foreground">Monthly Revenue</CardTitle>
                <CardDescription className="text-[32px] font-bold tracking-light text-foreground truncate pt-1">KES 0.00</CardDescription>
                <div className="flex gap-1 pt-1">
                    <p className="text-base text-muted-foreground font-normal">Last 12 Months</p>
                    <p className="text-base text-muted-foreground font-medium">N/A</p>
                </div>
            </CardHeader>
            <CardContent className="h-[250px] p-4">
              {monthlyRevenueChartData.length > 0 ? (
                <ChartContainer config={monthlyRevenueChartConfig} className="h-full w-full">
                    <LineChart data={monthlyRevenueChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <RechartsTooltip cursor={false} content={<ChartTooltipContent indicator="line" hideLabel />} />
                        <Line dataKey="revenue" type="monotone" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                </ChartContainer>
              ) : (
                <NoChartDataDisplay />
              )}
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm rounded-xl border border-border">
            <CardHeader className="p-6">
                <CardTitle className="text-base font-medium text-foreground">Quarterly Sales</CardTitle>
                <CardDescription className="text-[32px] font-bold tracking-light text-foreground truncate pt-1">KES 0.00</CardDescription>
                <div className="flex gap-1 pt-1">
                    <p className="text-base text-muted-foreground font-normal">Last 4 Quarters</p>
                    <p className="text-base text-muted-foreground font-medium">N/A</p>
                </div>
            </CardHeader>
            <CardContent className="h-[250px] p-4">
                {quarterlySalesChartData.length > 0 ? (
                    <ChartContainer config={quarterlySalesChartConfig} className="h-full w-full">
                        <BarChart data={quarterlySalesChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                            <RechartsTooltip cursor={false} content={<ChartTooltipContent indicator="dot" hideLabel />} />
                            <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                ) : (
                     <NoChartDataDisplay />
                )}
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm rounded-xl border border-border">
             <CardHeader className="p-6">
                <CardTitle className="text-base font-medium text-foreground">Top Selling Products</CardTitle>
                <CardDescription className="text-[32px] font-bold tracking-light text-foreground truncate pt-1">N/A</CardDescription>
                <div className="flex gap-1 pt-1">
                    <p className="text-base text-muted-foreground font-normal">This Quarter</p>
                    <p className="text-base text-muted-foreground font-medium">N/A</p>
                </div>
            </CardHeader>
            <CardContent className="p-6 pt-2 min-h-[210px]"> {/* Added min-h to ensure NoChartDataDisplay has space */}
                {topSellingProductsData.length > 0 ? (
                    <div className="space-y-6">
                        {topSellingProductsData.map((product) => (
                            <div key={product.name}>
                                <div className="flex justify-between text-[13px] font-bold text-muted-foreground tracking-[0.015em] mb-1">
                                    <span>{product.name}</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full">
                                    <div className="h-2 bg-primary rounded-full" style={{ width: `${product.value}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <NoChartDataDisplay className="py-6"/> // Added some padding to make it look less cramped
                )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* The redundant "No Data Available" card at the bottom has been removed. */}
    </div>
  );
};

export default DashboardPage;
