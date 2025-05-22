"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, Edit, Trash2, Copy, MoreHorizontal } from 'lucide-react';
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
import type { PaymentLink } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

// Dummy data
const paymentLinks: PaymentLink[] = [
  { id: 'pl_1', linkName: 'Invoice #INV001 Payment', reference: 'INV001', amount: 'KES 5,000', purpose: 'Consultation Services', creationDate: '2023-10-01', expiryDate: '2023-10-15', status: 'Active' },
  { id: 'pl_2', linkName: 'Product Sale - T-Shirt', reference: 'PROD050', amount: 'KES 1,500', purpose: 'Online Store Purchase', creationDate: '2023-10-05', expiryDate: '2023-11-05', status: 'Paid' },
  { id: 'pl_3', linkName: 'Monthly Subscription', reference: 'SUB003', amount: 'KES 2,000', purpose: 'SaaS Subscription', creationDate: '2023-09-20', expiryDate: '2023-10-20', status: 'Expired' },
];

const PaymentLinksPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    alert(`Deleting payment link ${id}`);
    // Implement actual delete logic
  };

  const handleCopy = (id: string) => {
    const linkToCopy = `https://switch.link/pay/${id}`; // Example link
    navigator.clipboard.writeText(linkToCopy);
    toast({ title: "Link Copied!", description: "Payment link copied to clipboard." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment Links</h1>
          <p className="text-muted-foreground">Create and manage your shareable payment links.</p>
        </div>
        <Link href="/dashboard/payment-links/create" legacyBehavior>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Link
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Payment Links</CardTitle>
          <CardDescription>List of all generated payment links.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Link Name</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.linkName}</TableCell>
                  <TableCell>{link.reference}</TableCell>
                  <TableCell>{link.amount}</TableCell>
                  <TableCell>{link.purpose}</TableCell>
                  <TableCell>{link.creationDate}</TableCell>
                  <TableCell>{link.expiryDate}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        link.status === 'Active' ? 'default' : 
                        link.status === 'Paid' ? 'secondary' : // Using secondary for 'Paid', can be custom.
                        link.status === 'Expired' ? 'outline' : 
                        'destructive'
                      }
                      className={link.status === 'Paid' ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                    >
                      {link.status}
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
                        <DropdownMenuItem onClick={() => handleCopy(link.id)}>
                          <Copy className="mr-2 h-4 w-4" /> Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/payment-links/edit/${link.id}`)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(link.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {paymentLinks.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No payment links found. Create your first link to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentLinksPage;
