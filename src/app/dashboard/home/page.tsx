
"use client";

import type { NextPage } from 'next';
import { ArrowUp, RefreshCw, BarChartHorizontalBig, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { LineChart, BarChart, CartesianGrid, XAxis, YAxis, Line, Bar, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
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


const DashboardHomePage: NextPage = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your business performance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statData.map((stat) => (
          <Card key={stat.title} className="bg-secondary shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>{stat.title}</CardDescription>
              <CardTitle className="text-3xl font-bold">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xs ${stat.positiveChange ? 'text-green-600' : 'text-destructive'} flex items-center`}>
                {stat.positiveChange && <ArrowUp className="h-4 w-4 mr-1" />}
                {stat.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transactions */}
      <Card className="bg-secondary shadow-sm">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell className="font-medium">{transaction.customer}</TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.status === 'Completed' ? 'default' : 'outline'}
                           className={transaction.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sales Trends */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Sales Trends</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Monthly Revenue */}
          <Card className="bg-secondary shadow-sm">
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>$12,500 <span className="text-xs text-green-600">(Last 12 Months +10%)</span></CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] p-0">
              <ChartContainer config={monthlyRevenueChartConfig} className="h-full w-full">
                <LineChart data={monthlyRevenueChartData} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
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
          <Card className="bg-secondary shadow-sm">
            <CardHeader>
              <CardTitle>Quarterly Sales</CardTitle>
              <CardDescription>$37,500 <span className="text-xs text-green-600">(Last 4 Quarters +15%)</span></CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] p-0">
               <ChartContainer config={quarterlySalesChartConfig} className="h-full w-full">
                <BarChart data={quarterlySalesChartData} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
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
          <Card className="bg-secondary shadow-sm">
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Product A <span className="text-xs text-green-600">(This Quarter +5%)</span></CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {topSellingProductsData.map((product) => (
                <div key={product.name}>
                  <div className="flex justify-between text-sm mb-1">
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
      <Card className="border-dashed border-2 border-border bg-card shadow-none">
        <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[200px]">
            {/* <BarChartHorizontalBig className="h-12 w-12 text-muted-foreground mb-4" /> */}
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No Data Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
                There is currently no data to display for this chart. Please check back later.
            </p>
            <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
            </Button>
        </CardContent>
      </Card>

    </div>
  );
};

export default DashboardHomePage;
