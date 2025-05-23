
"use client";

import type { NextPage } from 'next';
import { ArrowUp, RefreshCw, Info, Loader2, PieChart as PieChartIcon, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { LineChart, BarChart, CartesianGrid, XAxis, YAxis, Line, Bar, Tooltip as RechartsTooltip, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Transaction, PaymentLink } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp, getDocs, startOfDay, endOfDay, subDays, startOfYear, endOfYear, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StatCardData {
  title: string;
  value: string;
  periodDescription?: string; // e.g., "Last Year", "Last 30 Days"
}

interface AggregatedProductData {
  name: string;
  value: number; // Percentage for progress bar
  displayValue?: string; // Actual monetary value or count
}

interface TransactionStatusData {
  name: string;
  value: number;
  fill: string;
}

type DateRangePreset = "last7" | "last30" | "last90" | "lastYear" | "allTime";

const initialStatData: StatCardData[] = [
  { title: 'Total Revenue', value: 'KES 0.00', periodDescription: 'N/A' },
  { title: 'Total Completed Transactions', value: '0', periodDescription: 'N/A' },
  { title: 'Active Payment Links', value: '0', periodDescription: 'N/A' },
];

const monthlyRevenueChartConfig = { revenue: { label: "Revenue", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;
const quarterlySalesChartConfig = { sales: { label: "Sales", color: "hsl(var(--chart-2))" } } satisfies ChartConfig;
const transactionStatusChartConfig = {
  Completed: { label: "Completed", color: "hsl(var(--chart-1))" },
  Pending: { label: "Pending", color: "hsl(var(--chart-3))" },
  Failed: { label: "Failed", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

const NoChartDataDisplay = ({ onRefreshClick, className }: { onRefreshClick?: () => void; className?: string }) => (
  <div className={cn("flex flex-col items-center justify-center text-center h-full gap-2 min-h-[180px]", className)}>
    <Info className="h-10 w-10 text-muted-foreground" />
    <h3 className="text-md font-semibold text-foreground">No Data Available</h3>
    <p className="text-xs text-muted-foreground max-w-[280px]">
      There is currently no data to display for this chart.
    </p>
    {onRefreshClick && (
        <Button
            variant="secondary"
            size="sm"
            className="rounded-full px-3 h-8 text-xs"
            onClick={onRefreshClick}
        >
            <RefreshCw className="mr-1.5 h-3 w-3" />
            Refresh
        </Button>
    )}
  </div>
);

const DashboardPage: NextPage = () => {
  const { user, loading: authLoading, initialLoadComplete } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loadingRecentTransactions, setLoadingRecentTransactions] = useState(true);

  const [statData, setStatData] = useState<StatCardData[]>(initialStatData);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [quarterlySalesData, setQuarterlySalesData] = useState<{ name: string; sales: number }[]>([]);
  const [topSellingProductsData, setTopSellingProductsData] = useState<AggregatedProductData[]>([]);
  const [transactionStatusData, setTransactionStatusData] = useState<TransactionStatusData[]>([]);
  
  const [userPaymentLinks, setUserPaymentLinks] = useState<PaymentLink[]>([]);
  const [allUserTransactionsData, setAllUserTransactionsData] = useState<Transaction[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [loadingTransactionsForStats, setLoadingTransactionsForStats] = useState(true);

  const [selectedDateRangePreset, setSelectedDateRangePreset] = useState<DateRangePreset>("lastYear");

  const loadingStatsAndCharts = authLoading || !initialLoadComplete || loadingLinks || loadingTransactionsForStats;

  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (selectedDateRangePreset) {
      case "last7":
        return { start: startOfDay(subDays(now, 6)), end: endOfDay(now), description: "Last 7 Days" };
      case "last30":
        return { start: startOfDay(subDays(now, 29)), end: endOfDay(now), description: "Last 30 Days" };
      case "last90":
        return { start: startOfDay(subDays(now, 89)), end: endOfDay(now), description: "Last 90 Days" };
      case "lastYear":
        return { start: startOfYear(now), end: endOfYear(now), description: "This Year" };
      case "allTime":
      default:
        return { start: new Date(0), end: endOfDay(now), description: "All Time" };
    }
  }, [selectedDateRangePreset]);


  useEffect(() => {
    if (!initialLoadComplete || !user) {
      setLoadingRecentTransactions(!initialLoadComplete || authLoading);
      if (initialLoadComplete && !user && !authLoading) router.push('/login');
      return;
    }

    setLoadingRecentTransactions(true);
    const transactionsCollectionRef = collection(db, 'transactions');
    const q = query(
      transactionsCollectionRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedTransactions: Transaction[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedTransactions.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
      });
      setRecentTransactions(fetchedTransactions);
      setLoadingRecentTransactions(false);
    }, (error) => {
      console.error("Error fetching recent transactions: ", error);
      toast({title: "Error", description: "Could not load recent transactions.", variant: "destructive"})
      setLoadingRecentTransactions(false);
    });

    return () => unsubscribe();
  }, [user, initialLoadComplete, authLoading, router, toast]);


  const processDashboardData = useCallback((transactions: Transaction[], paymentLinks: PaymentLink[]) => {
    if (!user) return;

    const { description: currentPeriodDescription } = getDateRange();
    const completedTransactions = transactions.filter(txn => txn.status === 'Completed');

    let totalRevenue = 0;
    completedTransactions.forEach(txn => { totalRevenue += txn.amount; });
    const totalCompletedTransactionsCount = completedTransactions.length;
    const activePaymentLinksCount = paymentLinks.filter(link => link.status === 'Active').length;

    setStatData([
      { title: 'Total Revenue', value: `KES ${totalRevenue.toFixed(2)}`, periodDescription: currentPeriodDescription },
      { title: 'Total Completed Transactions', value: totalCompletedTransactionsCount.toString(), periodDescription: currentPeriodDescription },
      { title: 'Active Payment Links', value: activePaymentLinksCount.toString(), periodDescription: "Currently" },
    ]);
    
    const last12MonthsKeys: string[] = [];
    const last12MonthLabels: string[] = [];
    const baseDateForMonthly = new Date(); // Use current date as base for "last 12 months"
    for (let i = 11; i >= 0; i--) {
        const d = new Date(baseDateForMonthly);
        d.setDate(1); // Start of the month
        d.setMonth(baseDateForMonthly.getMonth() - i);
        last12MonthsKeys.push(format(d, 'yyyy-MM'));
        last12MonthLabels.push(format(d, 'MMM'));
    }
    const monthlyAgg: { [key: string]: number } = {};
    last12MonthsKeys.forEach(key => monthlyAgg[key] = 0);

    completedTransactions.forEach(txn => {
      if (txn.createdAt instanceof Timestamp) {
        const date = txn.createdAt.toDate();
        const monthKey = format(date, 'yyyy-MM');
        if (monthlyAgg.hasOwnProperty(monthKey)) {
          monthlyAgg[monthKey] += txn.amount;
        }
      }
    });
    setMonthlyRevenueData(last12MonthsKeys.map((key, index) => ({
        month: last12MonthLabels[index],
        revenue: monthlyAgg[key] || 0
    })));


    const quarterlyAgg: { [key: string]: { sales: number; quarterLabel: string } } = {};
    const baseDateForQuarterly = new Date();
    const currentYear = baseDateForQuarterly.getFullYear();
    const currentMonth = baseDateForQuarterly.getMonth(); 
    const currentQuarterNum = Math.floor(currentMonth / 3) + 1; 

    for (let i = 3; i >= 0; i--) { // Iterate for the last 4 quarters including current
        let yearForQuarter = currentYear;
        let qNumForQuarterCalc = currentQuarterNum - i;

        if (qNumForQuarterCalc <= 0) {
            qNumForQuarterCalc += 4;
            yearForQuarter -=1;
        }
        const quarterKey = `${yearForQuarter}-Q${qNumForQuarterCalc}`;
        quarterlyAgg[quarterKey] = { sales: 0, quarterLabel: `Q${qNumForQuarterCalc} '${String(yearForQuarter).slice(-2)}` };
    }
    
    completedTransactions.forEach(txn => {
      if (txn.createdAt instanceof Timestamp) {
        const date = txn.createdAt.toDate();
        const year = date.getFullYear();
        const qNum = Math.floor(date.getMonth() / 3) + 1;
        const quarterKey = `${year}-Q${qNum}`;
        if (quarterlyAgg.hasOwnProperty(quarterKey)) {
          quarterlyAgg[quarterKey].sales += txn.amount;
        }
      }
    });
    setQuarterlySalesData(Object.keys(quarterlyAgg).sort().map(key => ({ name: quarterlyAgg[key].quarterLabel.split(' ')[0], sales: quarterlyAgg[key].sales || 0 })));


    const productSales: { [linkName: string]: number } = {};
    completedTransactions.forEach(txn => {
      const link = paymentLinks.find(pl => pl.id === txn.paymentLinkId);
      if (link && link.linkName) {
        productSales[link.linkName] = (productSales[link.linkName] || 0) + txn.amount;
      }
    });
    const sortedProducts = Object.entries(productSales).sort(([, a], [, b]) => b - a).slice(0, 3);
    let maxProductRevenue = sortedProducts.length > 0 ? sortedProducts[0][1] : 0;
    if (maxProductRevenue === 0 && sortedProducts.length > 0) maxProductRevenue = 1; // Avoid division by zero if all revenues are 0
    
    setTopSellingProductsData(sortedProducts.map(([name, revenue]) => ({
      name,
      value: maxProductRevenue > 0 ? (revenue / maxProductRevenue) * 100 : 0,
      displayValue: `KES ${revenue.toFixed(2)}`
    })));


    const statusCounts = { Completed: 0, Pending: 0, Failed: 0 };
    transactions.forEach(txn => {
      if (txn.status === 'Completed') statusCounts.Completed++;
      else if (txn.status === 'Pending') statusCounts.Pending++;
      else if (txn.status === 'Failed') statusCounts.Failed++;
    });
    setTransactionStatusData([
      { name: 'Completed', value: statusCounts.Completed, fill: 'hsl(var(--chart-1))' },
      { name: 'Pending', value: statusCounts.Pending, fill: 'hsl(var(--chart-3))' },
      { name: 'Failed', value: statusCounts.Failed, fill: 'hsl(var(--chart-5))' },
    ].filter(d => d.value > 0));

  }, [user, getDateRange]);


  useEffect(() => {
    if (!user || !initialLoadComplete) {
        setLoadingLinks(!initialLoadComplete || authLoading);
        return;
    }
    setLoadingLinks(true);
    const { start: startDate } = getDateRange(); // Get current start date for filtering
    const paymentLinksQuery = query(
      collection(db, 'paymentLinks'), 
      where('userId', '==', user.uid),
      where('creationDate', '>=', Timestamp.fromDate(startDate)) // Only fetch links relevant to the date range
    );

    const unsubscribe = onSnapshot(paymentLinksQuery,
      (linksSnapshot) => {
        const fetchedLinks: PaymentLink[] = [];
        linksSnapshot.forEach(doc => {
          fetchedLinks.push({ id: doc.id, ...doc.data() } as PaymentLink);
        });
        setUserPaymentLinks(fetchedLinks);
        setLoadingLinks(false);
      },
      (error) => {
        console.error("Error fetching payment links for dashboard:", error);
        toast({ title: "Error", description: "Could not load payment link data.", variant: "destructive" });
        setLoadingLinks(false);
      }
    );
    return () => unsubscribe();
  }, [user, initialLoadComplete, authLoading, toast, getDateRange]);


  useEffect(() => {
    if (!user || !initialLoadComplete) {
        setLoadingTransactionsForStats(!initialLoadComplete || authLoading);
        return;
    }
    setLoadingTransactionsForStats(true);
    const { start: startDate, end: endDate } = getDateRange();

    const allTransactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(allTransactionsQuery,
      (transactionsSnapshot) => {
        const fetchedTxns: Transaction[] = [];
        transactionsSnapshot.forEach(doc => {
          fetchedTxns.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setAllUserTransactionsData(fetchedTxns);
        setLoadingTransactionsForStats(false);
      },
      (error) => {
        console.error("Error fetching transactions for dashboard stats:", error);
        toast({ title: "Error", description: "Could not load transaction data for stats.", variant: "destructive" });
        setLoadingTransactionsForStats(false);
      }
    );
    return () => unsubscribe();
  }, [user, initialLoadComplete, authLoading, toast, getDateRange]);


  useEffect(() => {
    if (authLoading || !initialLoadComplete || !user || loadingLinks || loadingTransactionsForStats) {
      return; 
    }
    processDashboardData(allUserTransactionsData, userPaymentLinks);
  }, [allUserTransactionsData, userPaymentLinks, user, initialLoadComplete, authLoading, loadingLinks, loadingTransactionsForStats, processDashboardData]);


  const handleRefreshAllData = () => {
     toast({title: "Data is Live", description: "Dashboard analytics update in real-time."})
  };


  if (authLoading || !initialLoadComplete || (!user && initialLoadComplete)) {
    return (
        <div className="flex justify-center items-center h-full p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const formatDateDisplay = (dateValue: Timestamp | Date | string | undefined | null) => {
    if (!dateValue) return 'N/A';
    const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue as any);
    return format(date, 'yyyy-MM-dd');
  };

  const currentTopProductInfo = useMemo(() => {
    if (topSellingProductsData.length > 0) {
      return { name: topSellingProductsData[0].name, displayValue: topSellingProductsData[0].displayValue };
    }
    return { name: "N/A", displayValue: "N/A" };
  }, [topSellingProductsData]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-[32px] font-bold tracking-light text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Overview of your business performance</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={selectedDateRangePreset} onValueChange={(value) => setSelectedDateRangePreset(value as DateRangePreset)}>
                <SelectTrigger className="w-full sm:w-[180px] h-10 bg-secondary border-border">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="last7">Last 7 Days</SelectItem>
                    <SelectItem value="last30">Last 30 Days</SelectItem>
                    <SelectItem value="last90">Last 90 Days</SelectItem>
                    <SelectItem value="lastYear">This Year</SelectItem>
                    <SelectItem value="allTime">All Time</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={handleRefreshAllData} disabled={loadingStatsAndCharts} className="h-10">
                <RefreshCw className={cn("mr-2 h-4 w-4", loadingStatsAndCharts && "animate-spin")} />
                {loadingStatsAndCharts ? "Loading..." : "Refresh"}
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loadingStatsAndCharts ? (
            [...Array(3)].map((_,i) => (
                <Card key={i} className="bg-secondary shadow-sm rounded-xl"><CardHeader className="pb-2 p-6">
                    <Skeleton className="h-5 w-3/4 mb-1" /><Skeleton className="h-8 w-1/2" />
                </CardHeader><CardContent className="p-6 pt-0"><Skeleton className="h-5 w-1/4" /></CardContent></Card>
            ))
        ) : statData.map((stat) => (
          <Card key={stat.title} className="bg-secondary shadow-sm rounded-xl">
            <CardHeader className="pb-2 p-6">
                <CardDescription className="text-base font-medium text-foreground">{stat.title}</CardDescription>
                <CardTitle className="text-2xl font-bold tracking-light">{stat.value}</CardTitle>
            </CardHeader>
            {stat.periodDescription && (
                 <CardContent className="p-6 pt-0">
                    <div className={`text-sm font-normal text-muted-foreground flex items-center`}>
                        {stat.periodDescription}
                    </div>
                </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Card className="bg-card shadow-sm rounded-xl border border-border">
        <CardHeader className="p-4 pt-5 pb-3"><CardTitle className="text-[22px] font-bold tracking-[-0.015em]">Recent Transactions</CardTitle></CardHeader>
        <CardContent className="px-4 py-3">
          {loadingRecentTransactions ? (
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
                      <TableCell className="px-4 py-2 text-sm text-muted-foreground">{formatDateDisplay(transaction.createdAt)}</TableCell>
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
                {loadingStatsAndCharts ? <Skeleton className="h-8 w-3/4 mt-1" /> : <CardDescription className="text-[32px] font-bold tracking-light text-foreground truncate pt-1">{statData[0].value}</CardDescription>}
                <div className="flex gap-1 pt-1">
                    <p className="text-base text-muted-foreground font-normal">{statData[0].periodDescription === "This Year" ? "Last 12 Months" : statData[0].periodDescription}</p>
                </div>
            </CardHeader>
            <CardContent className="h-[250px] p-4">
              {loadingStatsAndCharts ? <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div> :
               monthlyRevenueData.length > 0 && monthlyRevenueData.some(d => d.revenue > 0) ? (
                <ChartContainer config={monthlyRevenueChartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyRevenueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <RechartsTooltip cursor={false} content={<ChartTooltipContent indicator="line" hideLabel />} />
                        <Line dataKey="revenue" type="monotone" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <NoChartDataDisplay onRefreshClick={handleRefreshAllData} />
              )}
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm rounded-xl border border-border">
            <CardHeader className="p-6">
                <CardTitle className="text-base font-medium text-foreground">Quarterly Sales</CardTitle>
                {loadingStatsAndCharts ? <Skeleton className="h-8 w-3/4 mt-1" /> : <CardDescription className="text-[32px] font-bold tracking-light text-foreground truncate pt-1">{statData[0].value}</CardDescription> }
                <div className="flex gap-1 pt-1">
                    <p className="text-base text-muted-foreground font-normal">{statData[0].periodDescription === "This Year" ? "Last 4 Quarters" : statData[0].periodDescription}</p>
                </div>
            </CardHeader>
            <CardContent className="h-[250px] p-4">
                {loadingStatsAndCharts ? <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div> :
                 quarterlySalesData.length > 0 && quarterlySalesData.some(d => d.sales > 0) ? (
                    <ChartContainer config={quarterlySalesChartConfig} className="h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={quarterlySalesData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                            <RechartsTooltip cursor={false} content={<ChartTooltipContent indicator="dot" hideLabel />} />
                            <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                ) : (
                     <NoChartDataDisplay onRefreshClick={handleRefreshAllData} />
                )}
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm rounded-xl border border-border">
             <CardHeader className="p-6">
                <CardTitle className="text-base font-medium text-foreground">Top Selling Payment Links</CardTitle>
                {loadingStatsAndCharts ? <Skeleton className="h-8 w-3/4 mt-1" /> : <CardDescription className="text-[32px] font-bold tracking-light text-foreground truncate pt-1">{currentTopProductInfo.name}</CardDescription>}
                <div className="flex gap-1 pt-1">
                    <p className="text-base text-muted-foreground font-normal">By Revenue ({getDateRange().description})</p>
                </div>
            </CardHeader>
            <CardContent className="p-6 pt-2 min-h-[210px]">
                {loadingStatsAndCharts ? <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div> :
                 topSellingProductsData.length > 0 ? (
                    <div className="space-y-6">
                        {topSellingProductsData.map((product) => (
                            <div key={product.name}>
                                <div className="flex justify-between text-[13px] font-bold text-muted-foreground tracking-[0.015em] mb-1">
                                    <span className="truncate" title={product.name}>{product.name}</span>
                                     <span className="text-xs text-foreground">{product.displayValue}</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full">
                                    <div className="h-2 bg-primary rounded-full" style={{ width: `${product.value}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <NoChartDataDisplay className="py-6" onRefreshClick={handleRefreshAllData} />
                )}
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm rounded-xl border border-border">
            <CardHeader className="p-6">
              <CardTitle className="text-base font-medium text-foreground">Transaction Status Breakdown</CardTitle>
              {loadingStatsAndCharts ? <Skeleton className="h-8 w-3/4 mt-1" /> : <CardDescription className="text-[32px] font-bold tracking-light text-foreground truncate pt-1">{allUserTransactionsData.length} Total</CardDescription>}
              <div className="flex gap-1 pt-1">
                    <p className="text-base text-muted-foreground font-normal">{getDateRange().description}</p>
                </div>
            </CardHeader>
            <CardContent className="h-[250px] p-4">
              {loadingStatsAndCharts ? <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div> :
               transactionStatusData.length > 0 ? (
                <ChartContainer config={transactionStatusChartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                      <Pie data={transactionStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {transactionStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Legend wrapperStyle={{fontSize: "12px"}} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <NoChartDataDisplay onRefreshClick={handleRefreshAllData} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;


    