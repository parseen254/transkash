
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useRef } from 'react'; 
import { ArrowLeft, Edit, Trash2, Copy, DollarSign, CalendarDays, FileText, MoreHorizontal, ChevronLeft, ChevronRight, RotateCcw, Play, Pause, Loader2, Share2, Share, Download } from 'lucide-react';
import { format, addDays } from 'date-fns';
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
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, orderBy, onSnapshot, Timestamp, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
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
  const [webShareApiSupported, setWebShareApiSupported] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      setWebShareApiSupported(true);
    }
  }, []);

  const fullShareableUrl = useMemo(() => {
    if (paymentLink?.shortUrl && typeof window !== 'undefined') {
      const path = paymentLink.shortUrl.startsWith('/') ? paymentLink.shortUrl : `/${paymentLink.shortUrl}`;
      return `${window.location.origin}${path}`;
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
        orderBy('createdAt', 'desc')
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
    if (!urlToCopy) {
        toast({ title: "Error", description: "Shareable URL not available.", variant: "destructive"});
        return;
    }
    navigator.clipboard.writeText(urlToCopy);
    toast({ title: "Link Copied!", description: `Shareable link copied to clipboard.` });
  };

  const handleToggleStatus = async () => {
    if (!paymentLink || !user) return;
    
    const linkDocRef = doc(db, 'paymentLinks', paymentLink.id);
    let updateData: Partial<PaymentLink> = {
      updatedAt: serverTimestamp() as Timestamp,
    };

    if (paymentLink.status === 'Active') {
      updateData.status = 'Disabled';
    } else { 
      const newExpiryDate = addDays(new Date(), 10);
      updateData.status = 'Active';
      updateData.expiryDate = Timestamp.fromDate(newExpiryDate);
      updateData.hasExpiry = true;
    }

    try {
      await updateDoc(linkDocRef, updateData);
      toast({ title: "Status Updated", description: `Link status changed to ${updateData.status}.` });
    } catch (error) {
      console.error("Error updating link status:", error);
      toast({ title: "Error", description: "Could not update link status.", variant: "destructive" });
    }
  };
  
  const handleDeleteLink = async () => {
    if (!paymentLink || !user) return;
    
    const batch = writeBatch(db);
    const linkDocRef = doc(db, 'paymentLinks', paymentLink.id);

    try {
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('paymentLinkId', '==', paymentLink.id),
        where('userId', '==', user.uid) 
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      transactionsSnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      batch.delete(linkDocRef);
      await batch.commit();
      toast({ title: "Link Deleted", description: `Payment link "${paymentLink.linkName}" and its ${transactionsSnapshot.size} associated transaction(s) deleted.`});
      router.push('/dashboard/payment-links');
    } catch (error: any) {
      console.error("Error deleting payment link and transactions:", error);
      toast({ title: "Error", description: `Could not delete payment link: ${error.message}`, variant: "destructive"});
    }
    setIsDeleteAlertOpen(false);
  };

  const formatDate = (dateValue: Timestamp | Date | string | undefined | null, includeTime = false) => {
    if (!dateValue) return 'N/A';
    const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue as any);
    return format(date, includeTime ? 'PPP p' : 'PPP');
  };

  const handleNativeShare = async () => {
    if (navigator.share && paymentLink && fullShareableUrl) {
      try {
        await navigator.share({
          title: `Payment Link: ${paymentLink.linkName}`,
          text: `Use this link to pay for: ${paymentLink.purpose || paymentLink.linkName}`,
          url: fullShareableUrl,
        });
        toast({ title: "Shared!", description: "Payment link shared." });
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
           toast({ title: "Share Failed", description: "Could not share the link.", variant: "destructive" });
        }
      }
    } else if (!navigator.share) {
      toast({ title: "Not Supported", description: "Web Share API is not supported on this browser or device.", variant: "destructive" });
    }
  };

  const isLoading = authLoading || !initialLoadComplete || loadingLinkDetails || loadingLinkTransactions;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4 mt-2" /></CardHeader>
          <CardContent className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
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

  const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | React.ReactNode }) => (
    <div className="flex items-start space-x-3"> <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div> <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground break-all">{value || 'N/A'}</p>
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
                  <DialogTrigger asChild>
                     <Button variant="default" size="sm">
                        <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                  </DialogTrigger>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Actions <MoreHorizontal className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/payment-links/edit/${paymentLink.id}`)}><Edit className="mr-2 h-4 w-4" /> Edit Link</DropdownMenuItem>
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
              <InfoItem icon={DollarSign} label="Amount" value={`${paymentLink.currency} ${paymentLink.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
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
            </CardContent>
          </Card>

          <h2 className="text-xl font-semibold text-foreground mt-8">Transactions for this Link</h2>
          {loadingLinkTransactions ? (
            <Card className="rounded-xl border border-border">
                 <CardContent className="p-0"><Table><TableHeader><TableRow className="hover:bg-card">{[...Array(5)].map((_, i) => <TableHead key={i} className="px-4 py-3"><Skeleton className="h-5 w-full" /></TableHead>)}</TableRow></TableHeader>
                    <TableBody>{[...Array(ITEMS_PER_PAGE)].map((_, i) => (<TableRow key={i} className="h-[60px]">{[...Array(5)].map((_, j) => <TableCell key={j} className="px-4 py-2"><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>))}</TableBody>
                </Table></CardContent>
            </Card>
          ) : transactions.length > 0 ? (
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
                        <TableCell className="px-4 py-2 text-sm text-muted-foreground">{txn.currency} {txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
              <AlertDialogDescription>This action cannot be undone. This will permanently delete the payment link &quot;{paymentLink?.linkName}&quot; and all its ${transactions.length} associated transactions.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteLink} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share: {paymentLink?.linkName}</DialogTitle>
          <DialogDescription>
            Scan the QR code or use the options below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          {fullShareableUrl ? (
            <div className="inline-block">
              <QRCodeSVG 
                value={fullShareableUrl} 
                size={220}
                bgColor={"#ffffff"} 
                fgColor={"#000000"} 
                level={"Q"} 
                className="rounded-lg border border-border p-2 bg-white"
              />
            </div>
          ) : (
            <div className="h-[220px] w-[220px] flex items-center justify-center bg-muted rounded-lg border border-border">
                 <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
          <div className="w-full space-y-1 pt-2">
            <Label htmlFor="shareable-link-url-qr" className="text-xs text-muted-foreground text-left block">Shareable Link</Label>
            <div className="relative flex items-center">
                <Input
                id="shareable-link-url-qr"
                readOnly
                value={fullShareableUrl || "Generating link..."}
                className="h-10 text-sm bg-secondary border-secondary pr-10 flex-1"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopyLink(fullShareableUrl)}
                    disabled={!fullShareableUrl}
                    aria-label="Copy link"
                >
                    <Copy className="h-4 w-4" />
                </Button>
            </div>
          </div>
          
          {webShareApiSupported && (
            <Button
              variant="default"
              className="w-full mt-4"
              onClick={handleNativeShare}
              disabled={!fullShareableUrl || !paymentLink}
            >
              <Share className="mr-2 h-4 w-4" /> Share via device...
            </Button>
          )}
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

