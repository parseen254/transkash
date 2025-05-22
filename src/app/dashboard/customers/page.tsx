
"use client";

import type { NextPage } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const CustomersPage: NextPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Customers</h1>
        <p className="text-muted-foreground">Manage your customer information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>Overview of all your customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center border-2 border-dashed border-border rounded-lg p-8">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Customers Yet</h3>
            <p className="text-muted-foreground">
              This section will display your customer data once available.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomersPage;
