
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { PlusCircle, Edit, Trash2, Copy, MoreHorizontal, Search, Eye } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
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
import { Card, CardContent } from '@/components/ui/card'; // CardHeader, CardTitle removed as not directly used in PaymentLinksTable's new structure
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils'; // Added cn for potential badge styling

// Dummy data - updated statuses and shortUrls
const allPaymentLinks: PaymentLink[] = [
  { id: 'pl_1', linkName: 'Invoice #1234', reference: 'INV001', amount: '5000', currency: 'KES', purpose: 'Consultation Services', creationDate: '2023-10-01', expiryDate: '2023-10-15', status: 'Active', payoutAccountId: 'acc_1', shortUrl: '/payment/order?paymentLinkId=pl_1', hasExpiry: true },
  { id: 'pl_2', linkName: 'Product Sale - T-Shirt', reference: 'PROD050', amount: '1500', currency: 'KES', purpose: 'Online Store Purchase', creationDate: '2023-10-05', expiryDate: '2023-11-05', status: 'Paid', payoutAccountId: 'acc_1', shortUrl: '/payment/order?paymentLinkId=pl_2', hasExpiry: true },
  { id: 'pl_3', linkName: 'Monthly Subscription', reference: 'SUB003', amount: '2000', currency: 'KES', purpose: 'SaaS Subscription', creationDate: '2023-09-20', expiryDate: '2023-10-20', status: 'Expired', payoutAccountId: 'acc_2', shortUrl: '/payment/order?paymentLinkId=pl_3', hasExpiry: true },
  { id: 'pl_4', linkName: 'Workshop Fee', reference: 'WKSHP01', amount: '10000', currency: 'KES', purpose: 'Advanced JS Workshop', creationDate: '2023-11-01', expiryDate: '2023-11-10', status: 'Active', payoutAccountId: 'acc_1', shortUrl: '/payment/order?paymentLinkId=pl_4', hasExpiry: true },
  { id: 'pl_5', linkName: 'Donation Drive', reference: 'DON001', amount: '500', currency: 'KES', purpose: 'Charity Fundraiser', creationDate: '2023-11-05', status: 'Active', payoutAccountId: 'acc_2', shortUrl: '/payment/order?paymentLinkId=pl_5', hasExpiry: false },
  { id: 'pl_6', linkName: 'Old Service Retainer', reference: 'RET002', amount: '2500', currency: 'KES', purpose: 'Past Retainer', creationDate: '2023-05-10', status: 'Disabled', payoutAccountId: 'acc_1', shortUrl: '/payment/order?paymentLinkId=pl_6', hasExpiry: false },
  { id: 'pl_7', linkName: 'Paid Invoice #9101', reference: 'INV9101', amount: '750', currency: 'KES', purpose: 'Past Project', creationDate: '2023-07-20', status: 'Paid', payoutAccountId: 'acc_1', shortUrl: '/payment/order?paymentLinkId=pl_7', hasExpiry: false },
  { id: 'pl_8', linkName: 'Expired Order #1121', reference: 'ORD1121', amount: '300', currency: 'KES', purpose: 'Old Order', creationDate: '2023-07-15', status: 'Expired', payoutAccountId: 'acc_2', shortUrl: '/payment/order?paymentLinkId=pl_8', hasExpiry: false },
];

const PaymentLinksTable: React.FC<{ links: PaymentLink[], title: string, onDelete: (id: string, linkName: string) => void, onCopy: (link: PaymentLink) => void }> = ({ links, title, onDelete, onCopy }) => {
  const router = useRouter();

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
          <div className="overflow-x-auto">
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
                        className={cn(
                            "rounded-full h-7 px-3 text-xs font-medium justify-center",
                            link.status === 'Active' && 'bg-green-100 text-green-700 border-green-300',
                            link.status === 'Paid' && 'bg-blue-100 text-blue-700 border-blue-300',
                            (link.status === 'Expired' || link.status === 'Disabled') && 'bg-gray-100 text-gray-700 border-gray-300'
                          )}
                      >
                        {link.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-sm text-muted-foreground">{link.currency} {link.amount}</TableCell>
                    <TableCell className="px-4 py-2 text-sm text-muted-foreground">
                      {typeof link.creationDate === 'string' ? new Date(link.creationDate).toLocaleDateString() : new Date(link.creationDate as Date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                      <AlertDialog> {/* Moved AlertDialog here to encapsulate trigger and content for each row */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/payment-links/${link.id}`)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/payment-links/edit/${link.id}`)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onCopy(link)}>
                              <Copy className="mr-2 h-4 w-4" /> Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onSelect={(e) => e.preventDefault()} // Prevents DropdownMenu from closing
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Link
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the payment link
                                &quot;{link.linkName}&quot;.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(link.id, link.linkName)} className={buttonVariants({ variant: "destructive" })}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


const PaymentLinksPage: NextPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [linksData, setLinksData] = useState<PaymentLink[]>(allPaymentLinks); // For optimistic delete
  const { toast } = useToast();

  const handleDelete = (id: string, linkName: string) => {
    // Simulate API call for deletion
    setLinksData(prevLinks => prevLinks.filter(link => link.id !== id));
    toast({ 
        title: "Payment Link Deleted", 
        description: `Link "${linkName}" has been deleted (simulated).` 
    });
  };
  
  const handleCopyLink = (link: PaymentLink) => {
    // For testing local paths, construct the full URL.
    // In a real deployment, shortUrl would be a full HTTPS URL.
    const fullUrl = link.shortUrl?.startsWith('/') 
        ? window.location.origin + link.shortUrl
        : link.shortUrl || `No URL available`;
    navigator.clipboard.writeText(fullUrl);
    toast({ title: "Link Copied!", description: `${fullUrl} copied to clipboard.` });
  };


  const filteredLinks = useMemo(() => {
    return linksData.filter(link =>
      link.linkName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, linksData]);

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

        <PaymentLinksTable links={activeLinks} title="Active" onDelete={handleDelete} onCopy={handleCopyLink} />
        <PaymentLinksTable links={inactiveLinks} title="Inactive" onDelete={handleDelete} onCopy={handleCopyLink} />
        
        {filteredLinks.length === 0 && searchTerm && (
          <div className="text-center py-10 text-muted-foreground">
              No payment links found matching your search term "{searchTerm}".
          </div>
        )}
        {linksData.length === 0 && !searchTerm && (
            <Card className="rounded-xl border border-border">
                 <CardContent className="p-6 text-center text-muted-foreground">
                    No payment links created yet. <Link href="/dashboard/payment-links/create" className="text-primary hover:underline">Create your first link!</Link>
                 </CardContent>
            </Card>
        )}
      </div>
  );
};


export default PaymentLinksPage;

