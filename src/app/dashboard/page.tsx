
"use client";

import type { NextPage } from 'next';
import { ArrowUp, RefreshCw, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { LineChart, BarChart, CartesianGrid, XAxis, YAxis, Line, Bar, Tooltip as RechartsTooltip } from 'recharts';
import type { Transaction } from '@/lib/types';

// Dummy Data Structures
interface StatCardData {
  title: string;
  value: string;
  change: string;
  positiveChange: boolean;
}

const statData: StatCardData[] = [
  { title: 'Total Revenue', value: '$12,500', change: '+10%', positiveChange: true },
  { title: 'Average Transaction Value', value: '$75', change: '+5%', positiveChange: true },
  { title: 'Customer Retention Rate', value: '85%', change: '+2%', positiveChange: true },
];

const recentTransactions: Transaction[] = [
  { id: '1', date: '2024-07-26', customer: 'Olivia Bennett', amount: '$50', status: 'Completed', userId: '', currency: 'USD', linkName:'', purpose:'', creationDate: new Date(), reference: '' },
  { id: '2', date: '2024-07-25', customer: 'Noah Hayes', amount: '$100', status: 'Completed', userId: '', currency: 'USD', linkName:'', purpose:'', creationDate: new Date(), reference: '' },
  { id: '3', date: '2024-07-24', customer: 'Chloe Foster', amount: '$75', status: 'Pending', userId: '', currency: 'USD', linkName:'', purpose:'', creationDate: new Date(), reference: '' },
  { id: '4', date: '2024-07-23', customer: 'Lucas Carter', amount: '$25', status: 'Completed', userId: '', currency: 'USD', linkName:'', purpose:'', creationDate: new Date(), reference: '' },
  { id: '5', date: '2024-07-22', customer: 'Ava Mitchell', amount: '$150', status: 'Completed', userId: '', currency: 'USD', linkName:'', purpose:'', creationDate: new Date(), reference: '' },
];

const monthlyRevenueChartData = [
  { month: 'Jan', revenue: 1500 }, { month: 'Feb', revenue: 1800 }, { month: 'Mar', revenue: 1300 },
  { month: 'Apr', revenue: 2200 }, { month: 'May', revenue: 2000 }, { month: 'Jun', revenue: 2800 },
  { month: 'Jul', revenue: 2500 },
];

const quarterlySalesChartData = [
  { name: 'Q1', sales: 8000 }, { name: 'Q2', sales: 12000 },
  { name: 'Q3', sales: 9500 }, { name: 'Q4', sales: 15000 },
];

interface TopProductData {
  name: string;
  value: number; // Represents the bar length (e.g., percentage 0-100)
  displayValue?: string; // e.g. "$1.2k"
}
const topSellingProductsData: TopProductData[] = [
  { name: 'Product A', value: 80, displayValue: "80%" },
  { name: 'Product B', value: 60, displayValue: "60%" },
  { name: 'Product C', value: 40, displayValue: "40%" },
];


const monthlyRevenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const quarterlySalesChartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;


const DashboardPage: NextPage = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold tracking-light text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your business performance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statData.map((stat) => (
          <Card key={stat.title} className="bg-secondary shadow-sm rounded-xl">
            <CardHeader className="pb-2 p-6">
              <CardDescription className="text-base font-medium text-foreground">{stat.title}</CardDescription>
              <CardTitle className="text-2xl font-bold tracking-light">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className={`text-base font-medium ${stat.positiveChange ? 'text-green-600' : 'text-destructive'} flex items-center`}>
                {stat.positiveChange && <ArrowUp className="h-4 w-4 mr-1" />}
                {stat.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transactions */}
      <Card className="bg-card shadow-sm rounded-xl border border-border">
        <CardHeader className="p-4 pt-5 pb-3">
          <CardTitle className="text-[22px] font-bold tracking-[-0.015em]">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-3">
          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-card hover:bg-card">
                  <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Date</TableHead>
                  <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Customer</TableHead>
                  <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Amount</TableHead>
                  <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="h-[72px]">
                    <TableCell className="px-4 py-2 text-sm text-muted-foreground">{transaction.date}</TableCell>
                    <TableCell className="px-4 py-2 text-sm font-normal text-foreground">{transaction.customer}</TableCell>
                    <TableCell className="px-4 py-2 text-sm text-muted-foreground">{transaction.amount}</TableCell>
                    <TableCell className="px-4 py-2 text-sm">
                       <Badge 
                        variant="secondary" 
                        className="rounded-full h-8 px-4 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full justify-center max-w-[150px]"
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Sales Trends */}
      <div>
        <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-foreground px-4 pb-3 pt-5">Sales Trends</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 px-4 py-6"> {/* Updated to lg:grid-cols-2 */}
          {/* Monthly Revenue */}
          <Card className="bg-card shadow-sm rounded-xl border border-border">
            <CardHeader className="p-6">
              <CardTitle className="text-base font-medium text-foreground">Monthly Revenue</CardTitle>
              <CardDescription className="text-[32px] font-bold tracking-light text-foreground truncate pt-1">$12,500</CardDescription>
               <div className="flex gap-1 pt-1">
                  <p className="text-base text-muted-foreground font-normal">Last 12 Months</p>
                  <p className="text-base text-green-600 font-medium">+10%</p>
                </div>
            </CardHeader>
            <CardContent className="h-[250px] p-4">
              <ChartContainer config={monthlyRevenueChartConfig} className="h-full w-full">
                <LineChart data={monthlyRevenueChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <RechartsTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" hideLabel />}
                  />
                  <Line dataKey="revenue" type="monotone" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Quarterly Sales */}
          <Card className="bg-card shadow-sm rounded-xl border border-border">
            <CardHeader className="p-6">
              <CardTitle className="text-base font-medium text-foreground">Quarterly Sales</CardTitle>
               <CardDescription className="text-[32px] font-bold tracking-light text-foreground truncate pt-1">$37,500</CardDescription>
                 <div className="flex gap-1 pt-1">
                  <p className="text-base text-muted-foreground font-normal">Last 4 Quarters</p>
                  <p className="text-base text-green-600 font-medium">+15%</p>
                </div>
            </CardHeader>
            <CardContent className="h-[250px] p-4">
               <ChartContainer config={quarterlySalesChartConfig} className="h-full w-full">
                <BarChart data={quarterlySalesChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                   <RechartsTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" hideLabel />}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Top Selling Products */}
          <Card className="bg-card shadow-sm rounded-xl border border-border">
             <CardHeader className="p-6">
              <CardTitle className="text-base font-medium text-foreground">Top Selling Products</CardTitle>
              <CardDescription className="text-[32px] font-bold tracking-light text-foreground truncate pt-1">Product A</CardDescription>
                <div className="flex gap-1 pt-1">
                  <p className="text-base text-muted-foreground font-normal">This Quarter</p>
                  <p className="text-base text-green-600 font-medium">+5%</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6 pt-2">
              {topSellingProductsData.map((product) => (
                <div key={product.name}>
                  <div className="flex justify-between text-[13px] font-bold text-muted-foreground tracking-[0.015em] mb-1">
                    <span>{product.name}</span>
                    {/* <span className="text-muted-foreground">{product.displayValue}</span> */}
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full">
                    <div
                      className="h-2 bg-primary rounded-full"
                      style={{ width: `${product.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* No Data Available Section */}
      <div className="p-4">
        <Card className="border-dashed border-2 border-border bg-card shadow-none rounded-xl">
          <CardContent className="px-6 py-14 text-center flex flex-col items-center justify-center min-h-[200px] gap-2">
              <Info className="h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] text-foreground mb-0">No Data Available</h3>
              <p className="text-sm text-foreground font-normal leading-normal mb-2 max-w-[480px]">
                  There is currently no data to display for this chart. Please check back later.
              </p>
              <Button variant="secondary" className="rounded-full h-10 px-4 text-sm font-bold tracking-[0.015em] bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
              </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default DashboardPage;

