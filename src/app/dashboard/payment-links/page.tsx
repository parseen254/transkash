
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Copy, MoreHorizontal, Search, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { PaymentLink } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, Timestamp, writeBatch, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 5;

const PaymentLinksTable: React.FC<{ 
  links: PaymentLink[], 
  title: string, 
  onDelete: (id: string, linkName: string) => void, 
  onCopy: (link: PaymentLink) => void,
  isLoading: boolean,
  currentPage: number,
  totalPages: number,
  onNextPage: () => void,
  onPreviousPage: () => void
}> = ({ links, title, onDelete, onCopy, isLoading, currentPage, totalPages, onNextPage, onPreviousPage }) => {
  const router = useRouter();

  if (isLoading) {
    return (
       <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">{title}</h2>
        <Card className="rounded-xl border border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-card">
                    {[...Array(5)].map((_, i) => <TableHead key={i} className="px-4 py-3"><Skeleton className="h-5 w-full" /></TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                    <TableRow key={i} className="h-[60px]">
                      {[...Array(5)].map((_, j) => <TableCell key={j} className="px-4 py-2"><Skeleton className="h-5 w-full" /></TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (links.length === 0) {
    return (
      <div className="py-4">
        <h2 className="text-xl font-semibold text-foreground mb-3">{title}</h2>
        <p className="text-muted-foreground text-sm">No payment links found in this category.</p>
      </div>
    );
  }

  const formatDateDisplay = (dateValue: Timestamp | Date | string | undefined | null) => {
    if (!dateValue) return 'N/A';
    const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue as any);
    return format(date, 'PP'); 
  };


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
                    <TableCell className="px-4 py-2 text-sm text-muted-foreground">{link.currency} {link.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="px-4 py-2 text-sm text-muted-foreground">
                      {formatDateDisplay(link.creationDate)}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                      <AlertDialog>
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
                              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Link
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the payment link &quot;{link.linkName}&quot; and all its associated transactions.
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
         {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <Button variant="outline" onClick={onPreviousPage} disabled={currentPage === 1}><ChevronLeft className="mr-2 h-4 w-4" /> Previous</Button>
              <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" onClick={onNextPage} disabled={currentPage === totalPages}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
        )}
      </Card>
    </div>
  );
};


const PaymentLinksPage: NextPage = () => {
  const { user, loading: authLoading, initialLoadComplete } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [allLinks, setAllLinks] = useState<PaymentLink[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const { toast } = useToast();

  const [currentPageActive, setCurrentPageActive] = useState(1);
  const [currentPageInactive, setCurrentPageInactive] = useState(1);

  useEffect(() => {
    if (!initialLoadComplete) return; 

    if (!user) {
      router.push('/login');
      return;
    }
    setLoadingData(true);
    const linksCollection = collection(db, 'paymentLinks');
    const q = query(linksCollection, where('userId', '==', user.uid), orderBy('creationDate', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedLinks: PaymentLink[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedLinks.push({ id: docSnap.id, ...docSnap.data() } as PaymentLink);
      });
      setAllLinks(fetchedLinks);
      setLoadingData(false);
      // Reset pages on data change
      setCurrentPageActive(1);
      setCurrentPageInactive(1);
    }, (error) => {
      console.error("Error fetching payment links:", error);
      toast({ title: "Error", description: "Could not fetch payment links.", variant: "destructive" });
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [user, initialLoadComplete, router, toast]);

  const handleDelete = async (id: string, linkName: string) => {
    if (!user) {
      toast({ title: "Error", description: "Authentication required.", variant: "destructive"});
      return;
    }
    
    const batch = writeBatch(db);
    const linkDocRef = doc(db, 'paymentLinks', id);

    try {
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('paymentLinkId', '==', id),
        where('userId', '==', user.uid) 
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      transactionsSnapshot.forEach((docSnap) => batch.delete(docSnap.ref));
      batch.delete(linkDocRef);
      await batch.commit();
      toast({ 
          title: "Payment Link Deleted", 
          description: `Link "${linkName}" and its ${transactionsSnapshot.size} associated transaction(s) have been deleted.` 
      });
    } catch (error: any) {
      console.error("Error deleting payment link and transactions:", error);
      toast({ title: "Error", description: `Failed to delete payment link: ${error.message}`, variant: "destructive"});
    }
  };
  
  const handleCopyLink = (link: PaymentLink) => {
    const fullUrl = link.shortUrl?.startsWith('/') 
        ? `${window.location.origin}${link.shortUrl}`
        : link.shortUrl || `No URL available`;
    navigator.clipboard.writeText(fullUrl);
    toast({ title: "Link Copied!", description: `${fullUrl} copied to clipboard.` });
  };

  const filteredLinks = useMemo(() => {
    return allLinks.filter(link =>
      link.linkName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.reference && link.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (link.purpose && link.purpose.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, allLinks]);

  const activeLinks = useMemo(() =>
    filteredLinks.filter(link => link.status === 'Active' && (!link.hasExpiry || !link.expiryDate || (link.expiryDate instanceof Timestamp ? link.expiryDate.toDate() : new Date(link.expiryDate as any)) >= new Date())),
    [filteredLinks]
  );

  const inactiveLinks = useMemo(() =>
    filteredLinks.filter(link => link.status !== 'Active' || (link.hasExpiry && link.expiryDate && (link.expiryDate instanceof Timestamp ? link.expiryDate.toDate() : new Date(link.expiryDate as any)) < new Date())),
    [filteredLinks]
  );
  
  const totalPagesActive = Math.ceil(activeLinks.length / ITEMS_PER_PAGE);
  const paginatedActiveLinks = useMemo(() => {
    const startIndex = (currentPageActive - 1) * ITEMS_PER_PAGE;
    return activeLinks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [activeLinks, currentPageActive]);

  const totalPagesInactive = Math.ceil(inactiveLinks.length / ITEMS_PER_PAGE);
  const paginatedInactiveLinks = useMemo(() => {
    const startIndex = (currentPageInactive - 1) * ITEMS_PER_PAGE;
    return inactiveLinks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [inactiveLinks, currentPageInactive]);


  if (authLoading || (!user && !initialLoadComplete)) { 
     return (
        <div className="flex justify-center items-center h-full p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment Links</h1>
          <Link href="/dashboard/payment-links/create">
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
            className="w-full bg-secondary border-border rounded-lg h-12 pl-10 pr-4 text-base focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <PaymentLinksTable 
            links={paginatedActiveLinks} 
            title="Active" 
            onDelete={handleDelete} 
            onCopy={handleCopyLink} 
            isLoading={loadingData}
            currentPage={currentPageActive}
            totalPages={totalPagesActive}
            onNextPage={() => setCurrentPageActive(p => Math.min(p + 1, totalPagesActive))}
            onPreviousPage={() => setCurrentPageActive(p => Math.max(p - 1, 1))}
        />
        <PaymentLinksTable 
            links={paginatedInactiveLinks} 
            title="Inactive" 
            onDelete={handleDelete} 
            onCopy={handleCopyLink} 
            isLoading={loadingData}
            currentPage={currentPageInactive}
            totalPages={totalPagesInactive}
            onNextPage={() => setCurrentPageInactive(p => Math.min(p + 1, totalPagesInactive))}
            onPreviousPage={() => setCurrentPageInactive(p => Math.max(p - 1, 1))}
        />
        
        {!loadingData && filteredLinks.length === 0 && searchTerm && (
          <div className="text-center py-10 text-muted-foreground">
              No payment links found matching your search term "{searchTerm}".
          </div>
        )}
        {!loadingData && allLinks.length === 0 && !searchTerm && (
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

