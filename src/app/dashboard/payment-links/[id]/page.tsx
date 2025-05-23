
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Edit, Trash2, Copy, DollarSign, CalendarDays, FileText, LinkIcon as LinkIconLucide, MoreHorizontal, ChevronLeft, ChevronRight, RotateCcw, Play, Pause, Loader2, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import type { PaymentLink, Transaction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, orderBy, onSnapshot, Timestamp, serverTimestamp } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ITEMS_PER_PAGE = 5;

const PaymentLinkDetailsPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id: paymentLinkIdString } = params;
  const paymentLinkId = paymentLinkIdString as string;
  const { toast } = useToast();
  const { user, loading: authLoading, initialLoadComplete } = useAuth();

  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingLinkDetails, setLoadingLinkDetails] = useState(true);
  const [loadingLinkTransactions, setLoadingLinkTransactions] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isQrCodeDialogOpen, setIsQrCodeDialogOpen] = useState(false);

  const fullShareableUrl = useMemo(() => {
    if (paymentLink?.shortUrl && typeof window !== 'undefined') {
      return `${window.location.origin}${paymentLink.shortUrl}`;
    }
    return '';
  }, [paymentLink]);


  useEffect(() => {
    if (!initialLoadComplete) return;

    if (!user) {
      router.push('/login');
      return;
    }
    if (!paymentLinkId) {
        router.push('/dashboard/payment-links');
        return;
    }

    setLoadingLinkDetails(true);
    const linkDocRef = doc(db, 'paymentLinks', paymentLinkId);
    const unsubscribeLink = onSnapshot(linkDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const linkData = { id: docSnap.id, ...docSnap.data() } as PaymentLink;
        if (linkData.userId !== user.uid) {
          toast({ title: "Access Denied", description: "You do not have permission to view this link.", variant: "destructive" });
          router.push('/dashboard/payment-links');
          return;
        }
        setPaymentLink(linkData);
      } else {
        toast({ title: "Error", description: "Payment link not found.", variant: "destructive" });
        router.push('/dashboard/payment-links');
      }
      setLoadingLinkDetails(false);
    }, (error) => {
      console.error("Error fetching payment link:", error);
      toast({ title: "Error", description: "Could not load payment link.", variant: "destructive" });
      setLoadingLinkDetails(false);
    });

    setLoadingLinkTransactions(true);
    const transactionsCollection = collection(db, 'transactions');
    const q = query(
        transactionsCollection, 
        where('userId', '==', user.uid), 
        where('paymentLinkId', '==', paymentLinkId), 
        orderBy('createdAt', 'desc') // Changed from 'date' to 'createdAt' for consistency
    );
    const unsubscribeTransactions = onSnapshot(q, (querySnapshot) => {
      const fetchedTransactions: Transaction[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedTransactions.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
      });
      setTransactions(fetchedTransactions);
      setLoadingLinkTransactions(false);
    }, (error) => {
      console.error("Error fetching transactions:", error);
      toast({ title: "Error", description: "Could not load transactions.", variant: "destructive" });
      setLoadingLinkTransactions(false);
    });

    return () => {
      unsubscribeLink();
      unsubscribeTransactions();
    };
  }, [paymentLinkId, user, initialLoadComplete, router, toast]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return transactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [transactions, currentPage]);

  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);

  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleCopyLink = (urlToCopy: string) => {
    navigator.clipboard.writeText(urlToCopy);
    toast({ title: "Link Copied!", description: `Shareable link ${urlToCopy} copied to clipboard.` });
  };

  const handleToggleStatus = async () => {
    if (!paymentLink || !user) return;
    const newStatus = paymentLink.status === 'Active' ? 'Disabled' : 'Active';
    try {
      const linkDocRef = doc(db, 'paymentLinks', paymentLink.id);
      await updateDoc(linkDocRef, { status: newStatus, updatedAt: serverTimestamp() });
      toast({ title: "Status Updated", description: `Link status changed to ${newStatus}.` });
    } catch (error) {
      console.error("Error updating link status:", error);
      toast({ title: "Error", description: "Could not update link status.", variant: "destructive" });
    }
  };
  
  const handleDeleteLink = async () => {
    if (!paymentLink || !user) return;
    try {
      await deleteDoc(doc(db, 'paymentLinks', paymentLink.id));
      toast({ title: "Link Deleted", description: `Payment link ${paymentLink.linkName} deleted.`});
      router.push('/dashboard/payment-links');
    } catch (error) {
      console.error("Error deleting payment link:", error);
      toast({ title: "Error", description: "Could not delete payment link.", variant: "destructive"});
    }
    setIsDeleteAlertOpen(false);
  };

  const formatDate = (dateValue: Timestamp | Date | string | undefined | null, includeTime = false) => {
    if (!dateValue) return 'N/A';
    const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue as any);
    return format(date, includeTime ? 'PPP p' : 'PPP');
  };

  const isLoading = authLoading || !initialLoadComplete || loadingLinkDetails || loadingLinkTransactions;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4 mt-2" /></CardHeader>
          <CardContent className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
            <div className="flex gap-2 mt-4"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-24" /></div>
          </CardContent>
        </Card>
        <Skeleton className="h-8 w-1/3 mt-6" />
        <Card><CardContent className="p-0"><Table><TableHeader><TableRow>{[...Array(5)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}</TableRow></TableHeader>
              <TableBody>{[...Array(ITEMS_PER_PAGE)].map((_, i) => (<TableRow key={i}>{[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>))}</TableBody>
        </Table></CardContent></Card>
         <div className="flex items-center justify-between mt-4"><Skeleton className="h-10 w-24" /><Skeleton className="h-5 w-20" /><Skeleton className="h-10 w-24" /></div>
      </div>
    );
  }

  if (!paymentLink) {
    return <div className="text-center py-10"><p className="text-muted-foreground">Payment link not found or you do not have access.</p><Button onClick={() => router.push('/dashboard/payment-links')} className="mt-4">Back to Payment Links</Button></div>;
  }

  const InfoItem = ({ icon: Icon, label, value, isLink }: { icon: React.ElementType, label: string, value?: string | React.ReactNode, isLink?: boolean }) => (
    <div className="flex items-start space-x-3"> <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div> <p className="text-sm text-muted-foreground">{label}</p>
        {isLink && typeof value === 'string' && value.startsWith('/') ? ( <Link href={fullShareableUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline break-all">{fullShareableUrl}</Link> ) : 
        ( <p className="text-sm font-medium text-foreground break-all">{value || 'N/A'}</p> )}
      </div>
    </div>
  );

  return (
    <Dialog open={isQrCodeDialogOpen} onOpenChange={setIsQrCodeDialogOpen}>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <div className="space-y-6">
          <Link href="/dashboard/payment-links" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-0">
              <ArrowLeft className="h-4 w-4" /> Back to Payment Links
          </Link>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div><CardTitle className="text-2xl mb-1">{paymentLink.linkName}</CardTitle><CardDescription>Details for payment link: {paymentLink.reference}</CardDescription></div>
                <div className="mt-4 sm:mt-0 flex space-x-2">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Actions <MoreHorizontal className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/payment-links/edit/${paymentLink.id}`)}><Edit className="mr-2 h-4 w-4" /> Edit Link</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyLink(fullShareableUrl)}><Copy className="mr-2 h-4 w-4" /> Copy Shareable Link</DropdownMenuItem>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setIsQrCodeDialogOpen(true)}><Share2 className="mr-2 h-4 w-4" /> Share / QR Code</DropdownMenuItem>
                          </DialogTrigger>
                          <DropdownMenuItem onClick={handleToggleStatus}>
                              {paymentLink.status === 'Active' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                              {paymentLink.status === 'Active' ? 'Deactivate' : 'Activate'} Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => setIsDeleteAlertOpen(true)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Link
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
              <InfoItem icon={DollarSign} label="Amount" value={`${paymentLink.currency} ${paymentLink.amount.toFixed(2)}`} />
              <InfoItem icon={FileText} label="Reference" value={paymentLink.reference} />
              <InfoItem icon={FileText} label="Purpose" value={paymentLink.purpose} />
              <div className="flex items-start space-x-3"> <RotateCcw className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div><p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={paymentLink.status === 'Active' ? 'default' : 'secondary'}
                            className={cn( paymentLink.status === 'Active' && 'bg-green-100 text-green-700 border-green-300', paymentLink.status === 'Paid' && 'bg-blue-100 text-blue-700 border-blue-300', (paymentLink.status === 'Expired' || paymentLink.status === 'Disabled') && 'bg-gray-100 text-gray-700 border-gray-300' )}>
                          {paymentLink.status}
                      </Badge>
                  </div>
              </div>
              <InfoItem icon={CalendarDays} label="Creation Date" value={formatDate(paymentLink.creationDate, true)} />
              {paymentLink.hasExpiry && paymentLink.expiryDate && ( <InfoItem icon={CalendarDays} label="Expiry Date" value={formatDate(paymentLink.expiryDate, true)} /> )}
              <InfoItem icon={LinkIconLucide} label="Shareable Link" value={paymentLink.shortUrl} isLink />
            </CardContent>
          </Card>

          <h2 className="text-xl font-semibold text-foreground mt-8">Transactions for this Link</h2>
          {transactions.length > 0 ? (
            <Card className="rounded-xl border border-border"> <CardContent className="p-0"> <div className="overflow-x-auto">
                <Table><TableHeader><TableRow className="hover:bg-card">
                      <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Date</TableHead>
                      <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Customer</TableHead>
                      <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Amount</TableHead>
                      <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Status</TableHead>
                      <TableHead className="px-4 py-3 text-sm font-medium text-foreground">Reference</TableHead>
                </TableRow></TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((txn) => (
                      <TableRow key={txn.id} className="h-[60px]">
                        <TableCell className="px-4 py-2 text-sm text-muted-foreground">{formatDate(txn.createdAt)}</TableCell> 
                        <TableCell className="px-4 py-2 text-sm font-normal text-foreground">{txn.customer}</TableCell>
                        <TableCell className="px-4 py-2 text-sm text-muted-foreground">{txn.currency} {txn.amount.toFixed(2)}</TableCell>
                        <TableCell className="px-4 py-2">
                          <Badge variant="secondary" className={cn( "rounded-full h-7 px-3 text-xs font-medium justify-center", txn.status === 'Completed' && 'bg-green-100 text-green-700 border-green-300', txn.status === 'Pending' && 'bg-yellow-100 text-yellow-700 border-yellow-300', txn.status === 'Failed' && 'bg-red-100 text-red-700 border-red-300' )}>
                            {txn.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-2 text-sm text-muted-foreground">{txn.reference}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div></CardContent></Card>
          ) : (
            <Card className="rounded-xl border border-border"><CardContent className="p-6 text-center text-muted-foreground">No transactions found for this payment link yet.</CardContent></Card>
          )}

          {transactions.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between mt-4">
              <Button variant="outline" onClick={handlePreviousPage} disabled={currentPage === 1}><ChevronLeft className="mr-2 h-4 w-4" /> Previous</Button>
              <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" onClick={handleNextPage} disabled={currentPage === totalPages}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          )}
        </div>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone. This will permanently delete the payment link &quot;{paymentLink?.linkName}&quot; and all its associated data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteLink} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share: {paymentLink?.linkName}</DialogTitle>
          <DialogDescription>
            Scan the QR code or copy the link below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          {fullShareableUrl ? (
            <QRCodeSVG 
              value={fullShareableUrl} 
              size={220} // Increased size
              bgColor={"#ffffff"} 
              fgColor={"#000000"} 
              level={"Q"} 
              className="rounded-lg border border-border p-2 bg-white" // Added some padding and bg
            />
          ) : (
            <p className="text-muted-foreground">Generating QR code...</p>
          )}
          <div className="w-full space-y-2 pt-2">
            <Label htmlFor="shareable-link-url-qr" className="text-xs text-muted-foreground text-center block">Shareable Link</Label>
            <Input
              id="shareable-link-url-qr"
              readOnly
              value={fullShareableUrl}
              className="text-sm text-center bg-secondary border-secondary"
            />
            <Button
              variant="default"
              className="w-full"
              onClick={() => handleCopyLink(fullShareableUrl)}
              disabled={!fullShareableUrl}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy Link
            </Button>
          </div>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button type="button" variant="outline" onClick={() => setIsQrCodeDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentLinkDetailsPage;
