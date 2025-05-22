
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Edit, Trash2, Copy, Eye, DollarSign, CalendarDays, FileText, LinkIcon as LinkIconLucide, MoreHorizontal, ChevronLeft, ChevronRight, RotateCcw, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import type { PaymentLink, Transaction } from '@/lib/types'; // Make sure Transaction type is available
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Dummy Data (replace with actual data fetching)
const dummyPaymentLinks: PaymentLink[] = [
  { id: 'pl_1', linkName: 'Invoice #1234', reference: 'INV001', amount: '5000', currency: 'KES', purpose: 'Consultation Services', creationDate: new Date('2023-10-01').toISOString(), expiryDate: new Date('2023-10-15').toISOString(), status: 'Active', payoutAccountId: 'acc_1', shortUrl: '/payment/order?paymentLinkId=pl_1', hasExpiry: true },
  { id: 'pl_2', linkName: 'Product Sale - T-Shirt', reference: 'PROD050', amount: '1500', currency: 'KES', purpose: 'Online Store Purchase', creationDate: new Date('2023-10-05').toISOString(), expiryDate: new Date('2023-11-05').toISOString(), status: 'Paid', payoutAccountId: 'acc_1', shortUrl: '/payment/order?paymentLinkId=pl_2', hasExpiry: true },
  { id: 'pl_3', linkName: 'Monthly Subscription', reference: 'SUB003', amount: '2000', currency: 'KES', purpose: 'SaaS Subscription', creationDate: new Date('2023-09-20').toISOString(), status: 'Expired', payoutAccountId: 'acc_2', shortUrl: '/payment/order?paymentLinkId=pl_3', hasExpiry: true, expiryDate: new Date('2023-10-20').toISOString() },
  { id: 'pl_4', linkName: 'Donation Drive', reference: 'DON001', amount: '500', currency: 'KES', purpose: 'Charity Fundraiser', creationDate: new Date('2023-11-05').toISOString(), status: 'Disabled', payoutAccountId: 'acc_1', shortUrl: '/payment/order?paymentLinkId=pl_4', hasExpiry: false },
];

const dummyTransactions: Transaction[] = [
  { id: 'txn_1', paymentLinkId: 'pl_1', date: new Date('2023-10-02').toISOString(), customer: 'John Doe', amount: 'KES 5,000', status: 'Completed', reference: 'MPESA_REF_001', creationDate: new Date('2023-10-02') },
  { id: 'txn_2', paymentLinkId: 'pl_1', date: new Date('2023-10-03').toISOString(), customer: 'Jane Smith', amount: 'KES 5,000', status: 'Pending', reference: 'CARD_REF_002', creationDate: new Date('2023-10-03') },
  { id: 'txn_3', paymentLinkId: 'pl_2', date: new Date('2023-10-06').toISOString(), customer: 'Alice Brown', amount: 'KES 1,500', status: 'Completed', reference: 'MPESA_REF_003', creationDate: new Date('2023-10-06') },
  { id: 'txn_4', paymentLinkId: 'pl_1', date: new Date('2023-10-04').toISOString(), customer: 'Bob Johnson', amount: 'KES 5,000', status: 'Failed', reference: 'CARD_REF_004', creationDate: new Date('2023-10-04') },
  // Add more transactions for pl_1 to test pagination
  { id: 'txn_5', paymentLinkId: 'pl_1', date: new Date('2023-10-05').toISOString(), customer: 'Charlie Davis', amount: 'KES 5,000', status: 'Completed', reference: 'MPESA_REF_005', creationDate: new Date('2023-10-05') },
  { id: 'txn_6', paymentLinkId: 'pl_1', date: new Date('2023-10-06').toISOString(), customer: 'Diana Evans', amount: 'KES 5,000', status: 'Completed', reference: 'MPESA_REF_006', creationDate: new Date('2023-10-06') },
  { id: 'txn_7', paymentLinkId: 'pl_1', date: new Date('2023-10-07').toISOString(), customer: 'Edward Green', amount: 'KES 5,000', status: 'Pending', reference: 'CARD_REF_007', creationDate: new Date('2023-10-07') },
  { id: 'txn_8', paymentLinkId: 'pl_1', date: new Date('2023-10-08').toISOString(), customer: 'Fiona Harris', amount: 'KES 5,000', status: 'Completed', reference: 'MPESA_REF_008', creationDate: new Date('2023-10-08') },
];

const ITEMS_PER_PAGE = 5;

const PaymentLinkDetailsPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();

  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);


  useEffect(() => {
    if (id) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const foundLink = dummyPaymentLinks.find(link => link.id === id);
        if (foundLink) {
          setPaymentLink(foundLink);
          const relatedTransactions = dummyTransactions.filter(txn => txn.paymentLinkId === id);
          setTransactions(relatedTransactions);
        } else {
          toast({ title: "Error", description: "Payment link not found.", variant: "destructive" });
          router.push('/dashboard/payment-links');
        }
        setLoading(false);
      }, 700);
    }
  }, [id, router, toast]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return transactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [transactions, currentPage]);

  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleCopyLink = () => {
    if (paymentLink?.shortUrl) {
      // For testing local paths, construct the full URL.
      // In a real deployment, shortUrl would be a full HTTPS URL.
      const fullUrl = window.location.origin + paymentLink.shortUrl;
      navigator.clipboard.writeText(fullUrl);
      toast({ title: "Link Copied!", description: `Shareable link ${fullUrl} copied to clipboard.` });
    }
  };

  const handleToggleStatus = () => {
    if (paymentLink) {
      const newStatus = paymentLink.status === 'Active' ? 'Disabled' : 'Active';
      setPaymentLink({ ...paymentLink, status: newStatus });
      // In a real app, update this in the backend
      toast({ title: "Status Updated", description: `Link status changed to ${newStatus} (simulated).` });
    }
  };
  
  const handleDeleteLink = () => {
    // Simulate API call for deletion
    console.log("Deleting link (simulated):", paymentLink?.id);
    toast({ title: "Link Deleted", description: `Payment link ${paymentLink?.linkName} deleted (simulated).`});
    router.push('/dashboard/payment-links');
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" /> {/* Back link */}
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4 mt-2" /></CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-8 w-1/3 mt-6" /> {/* Transactions title */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {[...Array(4)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(4)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
         <div className="flex items-center justify-between mt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  if (!paymentLink) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Payment link not found or an error occurred.</p>
        <Button onClick={() => router.push('/dashboard/payment-links')} className="mt-4">
          Back to Payment Links
        </Button>
      </div>
    );
  }

  const InfoItem = ({ icon: Icon, label, value, isLink, linkHref }: { icon: React.ElementType, label: string, value?: string | React.ReactNode, isLink?: boolean, linkHref?: string }) => (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {isLink && value ? (
          <Link href={linkHref || value?.toString() || '#'} legacyBehavior>
            <a target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline break-all">
                {value}
            </a>
          </Link>
        ) : (
          <p className="text-sm font-medium text-foreground break-all">{value || 'N/A'}</p>
        )}
      </div>
    </div>
  );

  return (
    <AlertDialog>
      <div className="space-y-6">
        <Link href="/dashboard/payment-links" legacyBehavior>
          <a className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Payment Links
          </a>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-2xl mb-1">{paymentLink.linkName}</CardTitle>
                <CardDescription>Details for payment link: {paymentLink.reference}</CardDescription>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-2">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            Actions <MoreHorizontal className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/payment-links/edit/${paymentLink.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCopyLink}>
                            <Copy className="mr-2 h-4 w-4" /> Copy Shareable Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleToggleStatus}>
                            {paymentLink.status === 'Active' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                            {paymentLink.status === 'Active' ? 'Deactivate' : 'Activate'} Link
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Link
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                 </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
            <InfoItem icon={DollarSign} label="Amount" value={`${paymentLink.currency || 'KES'} ${paymentLink.amount}`} />
            <InfoItem icon={FileText} label="Reference" value={paymentLink.reference} />
            <InfoItem icon={FileText} label="Purpose" value={paymentLink.purpose} />
            <div className="flex items-start space-x-3">
                <RotateCcw className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={paymentLink.status === 'Active' ? 'default' : 'secondary'}
                           className={cn(
                             paymentLink.status === 'Active' && 'bg-green-100 text-green-700 border-green-300',
                             paymentLink.status === 'Paid' && 'bg-blue-100 text-blue-700 border-blue-300',
                             (paymentLink.status === 'Expired' || paymentLink.status === 'Disabled') && 'bg-gray-100 text-gray-700 border-gray-300'
                           )}
                    >
                        {paymentLink.status}
                    </Badge>
                </div>
            </div>
            <InfoItem icon={CalendarDays} label="Creation Date" value={format(new Date(paymentLink.creationDate as string), 'PPP p')} />
            {paymentLink.hasExpiry && paymentLink.expiryDate && (
              <InfoItem icon={CalendarDays} label="Expiry Date" value={format(new Date(paymentLink.expiryDate as string), 'PPP p')} />
            )}
            <InfoItem icon={LinkIconLucide} label="Shareable Link (Test)" value={paymentLink.shortUrl} isLink />
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold text-foreground mt-8">Transactions for this Link</h2>
        {transactions.length > 0 ? (
          <Card className="rounded-xl border border-border">
            <CardContent className="p-0">
             <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-card">
                    <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Date</TableHead>
                    <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Customer</TableHead>
                    <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Amount</TableHead>
                    <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Status</TableHead>
                    <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((txn) => (
                    <TableRow key={txn.id} className="h-[60px]">
                      <TableCell className="px-4 py-2 text-sm text-muted-foreground">{format(new Date(txn.date), 'PP')}</TableCell>
                      <TableCell className="px-4 py-2 text-sm font-normal text-foreground">{txn.customer}</TableCell>
                      <TableCell className="px-4 py-2 text-sm text-muted-foreground">{txn.amount}</TableCell>
                      <TableCell className="px-4 py-2">
                        <Badge variant="secondary"
                               className={cn(
                                "rounded-full h-7 px-3 text-xs font-medium justify-center",
                                txn.status === 'Completed' && 'bg-green-100 text-green-700 border-green-300',
                                txn.status === 'Pending' && 'bg-yellow-100 text-yellow-700 border-yellow-300',
                                txn.status === 'Failed' && 'bg-red-100 text-red-700 border-red-300'
                               )}
                        >
                          {txn.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-sm text-muted-foreground">{txn.reference}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
             </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-xl border border-border">
            <CardContent className="p-6 text-center text-muted-foreground">
              No transactions found for this payment link yet.
            </CardContent>
          </Card>
        )}

        {transactions.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the payment link
            &quot;{paymentLink?.linkName}&quot; and all its associated data.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLink} className={buttonVariants({ variant: "destructive" })}>
            Delete
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PaymentLinkDetailsPage;

