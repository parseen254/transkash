"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { PayoutAccount } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

// Dummy data
const payoutAccounts: PayoutAccount[] = [
  { id: '1', accountName: 'Main Business Account', accountNumber: '**** **** **** 1234', bankName: 'Equity Bank Kenya', status: 'Active' },
  { id: '2', accountName: 'Personal Savings', accountNumber: '**** **** **** 5678', bankName: 'KCB Bank', status: 'Active' },
  { id: '3', accountName: 'Project Funds', accountNumber: '**** **** **** 9012', bankName: 'Co-operative Bank', status: 'Pending' },
];

const PayoutAccountsPage: NextPage = () => {
  const handleDelete = (id: string) => {
    alert(`Deleting account ${id}`);
    // Implement actual delete logic
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payout Accounts</h1>
          <p className="text-muted-foreground">Manage your bank accounts for receiving payouts.</p>
        </div>
        <div className="space-x-2">
          <Link href="/dashboard/payouts/add-minimal" legacyBehavior>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Minimal Account
            </Button>
          </Link>
          <Link href="/dashboard/payouts/add-detailed" legacyBehavior>
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Detailed Account
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Payout Accounts</CardTitle>
          <CardDescription>List of all configured payout accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.accountName}</TableCell>
                  <TableCell>{account.accountNumber}</TableCell>
                  <TableCell>{account.bankName}</TableCell>
                  <TableCell>
                    <Badge variant={account.status === 'Active' ? 'default' : account.status === 'Pending' ? 'secondary' : 'destructive'}>
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/payouts/edit/${account.id}`)}> {/* Assume an edit page */}
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(account.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {payoutAccounts.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No payout accounts found. Add your first account to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
// Add router import for edit functionality if needed
import { useRouter } from 'next/navigation'; // Placeholder, already present in other files

export default PayoutAccountsPage;
