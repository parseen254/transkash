
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { PlusCircle, Edit, Trash2, Copy, MoreHorizontal, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

// Dummy data - updated statuses
const allPaymentLinks: PaymentLink[] = [
  { id: 'pl_1', linkName: 'Invoice #1234', reference: 'INV001', amount: 'KES 5,000', purpose: 'Consultation Services', creationDate: '2023-10-01', expiryDate: '2023-10-15', status: 'Active' },
  { id: 'pl_2', linkName: 'Product Sale - T-Shirt', reference: 'PROD050', amount: 'KES 1,500', purpose: 'Online Store Purchase', creationDate: '2023-10-05', expiryDate: '2023-11-05', status: 'Paid' },
  { id: 'pl_3', linkName: 'Monthly Subscription', reference: 'SUB003', amount: 'KES 2,000', purpose: 'SaaS Subscription', creationDate: '2023-09-20', expiryDate: '2023-10-20', status: 'Expired' },
  { id: 'pl_4', linkName: 'Workshop Fee', reference: 'WKSHP01', amount: 'KES 10,000', purpose: 'Advanced JS Workshop', creationDate: '2023-11-01', expiryDate: '2023-11-10', status: 'Active' },
  { id: 'pl_5', linkName: 'Donation Drive', reference: 'DON001', amount: 'KES 500', purpose: 'Charity Fundraiser', creationDate: '2023-11-05', status: 'Active' },
  { id: 'pl_6', linkName: 'Old Service Retainer', reference: 'RET002', amount: 'KES 2,500', purpose: 'Past Retainer', creationDate: '2023-05-10', status: 'Disabled' },
  { id: 'pl_7', linkName: 'Paid Invoice #9101', reference: 'INV9101', amount: 'KES 750', purpose: 'Past Project', creationDate: '2023-07-20', status: 'Paid' },
  { id: 'pl_8', linkName: 'Expired Order #1121', reference: 'ORD1121', amount: 'KES 300', purpose: 'Old Order', creationDate: '2023-07-15', status: 'Expired' },
];

const PaymentLinksTable: React.FC<{ links: PaymentLink[], title: string }> = ({ links, title }) => {
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    alert(`Simulating delete for link ${id}. Implement actual delete logic.`);
    // To fully implement: remove from state/DB and re-filter
    toast({ title: "Action Required", description: "Implement actual delete logic." });
  };

  const handleCopy = (id: string) => {
    const linkToCopy = `https://switch.link/pay/${id}`; // Example link
    navigator.clipboard.writeText(linkToCopy);
    toast({ title: "Link Copied!", description: "Payment link copied to clipboard." });
  };

  if (links.length === 0) {
    return (
      <div className="py-4">
        <h2 className="text-xl font-semibold text-foreground mb-3">{title}</h2>
        <p className="text-muted-foreground text-sm">No payment links found in this category.</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-foreground mb-3">{title}</h2>
      <Card className="rounded-xl border border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-card">
                <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Name</TableHead>
                <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Status</TableHead>
                <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Amount</TableHead>
                <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Created</TableHead>
                <TableHead className="px-4 py-3 text-sm font-medium text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.id} className="h-[60px]">
                  <TableCell className="px-4 py-2 text-sm font-normal text-foreground">{link.linkName}</TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge
                      variant="secondary"
                      className="rounded-full h-7 px-3 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/90 justify-center"
                    >
                      {link.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-sm text-muted-foreground">{link.amount}</TableCell>
                  <TableCell className="px-4 py-2 text-sm text-muted-foreground">{link.creationDate.toString()}</TableCell>
                  <TableCell className="px-4 py-2 text-right">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/payment-links/edit/${link.id}`)}>
                          <Edit className="mr-2 h-4 w-4" /> View / Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopy(link.id)}>
                          <Copy className="mr-2 h-4 w-4" /> Copy Link
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
        </CardContent>
      </Card>
    </div>
  );
};


const PaymentLinksPage: NextPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLinks = useMemo(() => {
    return allPaymentLinks.filter(link =>
      link.linkName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const activeLinks = useMemo(() =>
    filteredLinks.filter(link => link.status === 'Active'),
    [filteredLinks]
  );

  const inactiveLinks = useMemo(() =>
    filteredLinks.filter(link => link.status !== 'Active'), // Groups 'Paid', 'Expired', 'Disabled'
    [filteredLinks]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment Links</h1>
        <Link href="/dashboard/payment-links/create" legacyBehavior>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Link
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search payment links by name, reference, or purpose"
          className="w-full bg-secondary border-secondary rounded-lg h-12 pl-10 pr-4 text-base focus-visible:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <PaymentLinksTable links={activeLinks} title="Active" />
      <PaymentLinksTable links={inactiveLinks} title="Inactive" />
      
      {filteredLinks.length === 0 && searchTerm && (
         <div className="text-center py-10 text-muted-foreground">
            No payment links found matching your search term "{searchTerm}".
        </div>
      )}
    </div>
  );
};

export default PaymentLinksPage;
