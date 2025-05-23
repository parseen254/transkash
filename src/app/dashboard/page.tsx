
"use client";

import type { NextPage } from 'next';
import { ArrowUp, RefreshCw, Info, Loader2, PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { LineChart, BarChart, CartesianGrid, XAxis, YAxis, Line, Bar, Tooltip as RechartsTooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import type { Transaction, PaymentLink } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StatCardData {
  title: string;
  value: string;
  change?: string; // Make change optional as it's often N/A
  positiveChange?: boolean;
}

interface AggregatedProductData {
  name: string;
  value: number; // Percentage for progress bar
  displayValue?: string; // Actual monetary value or count
}

interface TransactionStatusData {
  name: string; // e.g., 'Completed', 'Pending', 'Failed'
  value: number; // count of transactions
  fill: string; // color for the pie chart segment
}

const initialStatData: StatCardData[] = [
  { title: 'Total Revenue', value: 'KES 0.00', change: 'N/A' },
  { title: 'Total Completed Transactions', value: '0', change: 'N/A' },
  { title: 'Active Payment Links', value: '0', change: 'N/A' },
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
  const [loadingStatsAndCharts, setLoadingStatsAndCharts] = useState(true);
  const [fetchedAllUserTransactions, setFetchedAllUserTransactions] = useState<Transaction[]>([]); // New state for all transactions

  // Fetch latest 5 transactions for the table (real-time)
  useEffect(() => {
    if (!initialLoadComplete || !user) {
      if (initialLoadComplete && !user) router.push('/login');
      setLoadingRecentTransactions(!initialLoadComplete || authLoading);
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

  // Fetch and aggregate data for stats and charts (one-time fetch on load/user change/refresh)
  const fetchDataForStatsAndCharts = async () => {
    if (!user) return;
    setLoadingStatsAndCharts(true);

    try {
      // --- Fetch all payment links for the user ---
      const paymentLinksQuery = query(collection(db, 'paymentLinks'), where('userId', '==', user.uid));
      const paymentLinksSnapshot = await getDocs(paymentLinksQuery);
      const userPaymentLinks: PaymentLink[] = [];
      paymentLinksSnapshot.forEach(doc => {
        userPaymentLinks.push({ id: doc.id, ...doc.data() } as PaymentLink);
      });

      // --- Fetch transactions from the last year ---
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const oneYearAgoTimestamp = Timestamp.fromDate(oneYearAgo);

      const allTransactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        where('createdAt', '>=', oneYearAgoTimestamp),
        orderBy('createdAt', 'asc')
      );
      const allTransactionsSnapshot = await getDocs(allTransactionsQuery);
      const allUserTransactions: Transaction[] = []; // Local variable for this function scope
      allTransactionsSnapshot.forEach(doc => {
        allUserTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setFetchedAllUserTransactions(allUserTransactions); // Set state here
      
      const completedTransactions = allUserTransactions.filter(txn => txn.status === 'Completed');

      // --- Aggregate for Stat Cards ---
      let totalRevenue = 0;
      completedTransactions.forEach(txn => { totalRevenue += txn.amount; });
      const totalCompletedTransactionsCount = completedTransactions.length;
      const activePaymentLinksCount = userPaymentLinks.filter(link => link.status === 'Active').length;
      
      setStatData([
        { title: 'Total Revenue', value: `KES ${totalRevenue.toFixed(2)}` },
        { title: 'Total Completed Transactions', value: totalCompletedTransactionsCount.toString() },
        { title: 'Active Payment Links', value: activePaymentLinksCount.toString() },
      ]);

      // --- Aggregate for Monthly Revenue Chart ---
      const last12MonthsKeys: string[] = [];
      const last12MonthLabels: string[] = [];
      for (let i = 11; i >= 0; i--) {
          const d = new Date();
          d.setDate(1); 
          d.setMonth(d.getMonth() - i);
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
      
      // --- Aggregate for Quarterly Sales Chart ---
      const quarterlyAgg: { [key: string]: { sales: number; quarterLabel: string } } = {};
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth(); 
      const currentQuarter = Math.floor(currentMonth / 3); 

      for (let i = 3; i >= 0; i--) { 
          let yearForQuarter = currentYear;
          let qNumForQuarter = currentQuarter - i;
          
          if (qNumForQuarter < 0) {
              qNumForQuarter += 4;
              yearForQuarter -=1;
          }
          const quarterKey = `${yearForQuarter}-Q${qNumForQuarter + 1}`;
          quarterlyAgg[quarterKey] = { sales: 0, quarterLabel: `Q${qNumForQuarter + 1} ${yearForQuarter}` };
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

      // --- Aggregate for Top Selling Products Chart (based on Payment Link Name) ---
      const productSales: { [linkName: string]: number } = {};
      completedTransactions.forEach(txn => {
        const link = userPaymentLinks.find(pl => pl.id === txn.paymentLinkId);
        if (link && link.linkName) {
          productSales[link.linkName] = (productSales[link.linkName] || 0) + txn.amount;
        }
      });
      const sortedProducts = Object.entries(productSales).sort(([, a], [, b]) => b - a).slice(0, 3);
      let maxProductRevenue = sortedProducts.length > 0 ? sortedProducts[0][1] : 0;
      setTopSellingProductsData(sortedProducts.map(([name, revenue]) => ({
        name,
        value: maxProductRevenue > 0 ? (revenue / maxProductRevenue) * 100 : 0,
        displayValue: `KES ${revenue.toFixed(2)}`
      })));

      // --- Aggregate for Transaction Status Pie Chart ---
      const statusCounts = { Completed: 0, Pending: 0, Failed: 0 };
      allUserTransactions.forEach(txn => { // Use allUserTransactions from this scope
        if (txn.status === 'Completed') statusCounts.Completed++;
        else if (txn.status === 'Pending') statusCounts.Pending++;
        else if (txn.status === 'Failed') statusCounts.Failed++;
      });
      setTransactionStatusData([
        { name: 'Completed', value: statusCounts.Completed, fill: 'hsl(var(--chart-1))' },
        { name: 'Pending', value: statusCounts.Pending, fill: 'hsl(var(--chart-3))' },
        { name: 'Failed', value: statusCounts.Failed, fill: 'hsl(var(--chart-5))' },
      ].filter(d => d.value > 0)); 


    } catch (error) {
      console.error("Error aggregating dashboard data:", error);
      toast({ title: "Error", description: "Could not load dashboard analytics.", variant: "destructive" });
    } finally {
      setLoadingStatsAndCharts(false);
    }
  };
  
  useEffect(() => {
    if (user && initialLoadComplete) {
      fetchDataForStatsAndCharts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initialLoadComplete]);


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
  
  const currentTopProductInfo = useMemo(() => topSellingProductsData.length > 0 
    ? { name: topSellingProductsData[0].name, change: "" } 
    : { name: "N/A", change: "N/A" }, [topSellingProductsData]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-[32px] font-bold tracking-light text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Overview of your business performance</p>
        </div>
        <Button onClick={fetchDataForStatsAndCharts} disabled={loadingStatsAndCharts}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loadingStatsAndCharts && "animate-spin")} />
            {loadingStatsAndCharts ? "Refreshing..." : "Refresh Data"}
        </Button>
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
            {stat.change && (
                 <CardContent className="p-6 pt-0">
                    <div className={`text-base font-medium ${stat.positiveChange === undefined ? 'text-muted-foreground' : stat.positiveChange ? 'text-green-600' : 'text-destructive'} flex items-center`}>
                        {stat.positiveChange && <ArrowUp className="h-4 w-4 mr-1" />}
                        {stat.change}
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
                    <p className="text-base text-muted-foreground font-normal">Last 12 Months</p>
                    {loadingStatsAndCharts ? <Skeleton className="h-5 w-12" /> : statData[0].change && <p className={`text-base font-medium ${statData[0].positiveChange ? 'text-green-600' : 'text-muted-foreground'}`}>{statData[0].change}</p>}
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
                <NoChartDataDisplay onRefreshClick={fetchDataForStatsAndCharts} />
              )}
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm rounded-xl border border-border">
            <CardHeader className="p-6">
                <CardTitle className="text-base font-medium text-foreground">Quarterly Sales</CardTitle>
                {loadingStatsAndCharts ? <Skeleton className="h-8 w-3/4 mt-1" /> : <CardDescription className="text-[32px] font-bold tracking-light text-foreground truncate pt-1">{statData[0].value}</CardDescription> }
                <div className="flex gap-1 pt-1">
                    <p className="text-base text-muted-foreground font-normal">Last 4 Quarters</p>
                    {loadingStatsAndCharts ? <Skeleton className="h-5 w-12" /> : statData[0].change && <p className={`text-base font-medium ${statData[0].positiveChange ? 'text-green-600' : 'text-muted-foreground'}`}>{statData[0].change}</p>}
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
                     <NoChartDataDisplay onRefreshClick={fetchDataForStatsAndCharts} />
                )}
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm rounded-xl border border-border">
             <CardHeader className="p-6">
                <CardTitle className="text-base font-medium text-foreground">Top Selling Products</CardTitle>
                {loadingStatsAndCharts ? <Skeleton className="h-8 w-3/4 mt-1" /> : <CardDescription className="text-[32px] font-bold tracking-light text-foreground truncate pt-1">{currentTopProductInfo.name}</CardDescription>}
                <div className="flex gap-1 pt-1">
                    <p className="text-base text-muted-foreground font-normal">This Quarter</p>
                    {loadingStatsAndCharts ? <Skeleton className="h-5 w-12" /> : <p className={`text-base font-medium ${currentTopProductInfo.name !== 'N/A' ? 'text-green-600' : 'text-muted-foreground'}`}>{currentTopProductInfo.change}</p>}
                </div>
            </CardHeader>
            <CardContent className="p-6 pt-2 min-h-[210px]">
                {loadingStatsAndCharts ? <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div> :
                 topSellingProductsData.length > 0 ? (
                    <div className="space-y-6">
                        {topSellingProductsData.map((product) => (
                            <div key={product.name}>
                                <div className="flex justify-between text-[13px] font-bold text-muted-foreground tracking-[0.015em] mb-1">
                                    <span>{product.name}</span>
                                     <span className="text-xs text-foreground">{product.displayValue}</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full">
                                    <div className="h-2 bg-primary rounded-full" style={{ width: `${product.value}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <NoChartDataDisplay className="py-6" onRefreshClick={fetchDataForStatsAndCharts} />
                )}
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm rounded-xl border border-border">
            <CardHeader className="p-6">
              <CardTitle className="text-base font-medium text-foreground">Transaction Status Breakdown</CardTitle>
              {loadingStatsAndCharts ? <Skeleton className="h-8 w-3/4 mt-1" /> : <CardDescription className="text-[32px] font-bold tracking-light text-foreground truncate pt-1">{fetchedAllUserTransactions.length} Total</CardDescription>}
              <div className="flex gap-1 pt-1">
                    <p className="text-base text-muted-foreground font-normal">Last Year</p>
                </div>
            </CardHeader>
            <CardContent className="h-[250px] p-4">
              {loadingStatsAndCharts ? <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div> : 
               transactionStatusData.length > 0 ? (
                <ChartContainer config={transactionStatusChartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip content={<ChartTooltipContent hideLabel />} />
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
                <NoChartDataDisplay onRefreshClick={fetchDataForStatsAndCharts} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;


    