
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Landmark, Phone, Edit2, PlusCircle, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PayoutAccount } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 3; // Or your preferred number

const PayoutAccountItem: React.FC<{ account: PayoutAccount; onEdit: (id: string, type: 'bank' | 'mpesa') => void }> = ({ account, onEdit }) => {
  const Icon = account.type === 'bank' ? Landmark : Phone;
  
  let primaryIdentifier = account.accountNumber;
  if (account.type === 'bank' && account.accountNumber.length > 4) {
    primaryIdentifier = `•••• ${account.accountNumber.slice(-4)}`;
  }
  
  const secondaryIdentifier = account.type === 'bank' ? account.bankName : account.accountHolderName;

  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-b-0">
      <div className="flex items-center gap-4">
        <div className="bg-secondary p-3 rounded-lg">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">{account.accountName}</p>
          <p className="text-sm text-muted-foreground">{primaryIdentifier} {secondaryIdentifier && `- ${secondaryIdentifier}`}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onEdit(account.id, account.type)} aria-label="Edit account">
        <Edit2 className="h-5 w-5 text-muted-foreground hover:text-foreground" />
      </Button>
    </div>
  );
};

const PayoutAccountsPage: NextPage = () => {
  const router = useRouter();
  const { user, loading: authLoading, initialLoadComplete } = useAuth();
  
  const [allPayoutAccounts, setAllPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPageBank, setCurrentPageBank] = useState(1);
  const [currentPageMpesa, setCurrentPageMpesa] = useState(1);

  useEffect(() => {
    if (!initialLoadComplete) return; 

    if (!user) {
      router.push('/login');
      return;
    }

    setLoadingData(true);
    const payoutAccountsCollection = collection(db, 'payoutAccounts');
    const q = query(payoutAccountsCollection, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedAccounts: PayoutAccount[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedAccounts.push({ id: docSnap.id, ...docSnap.data() } as PayoutAccount);
      });
      setAllPayoutAccounts(fetchedAccounts);
      setCurrentPageBank(1); // Reset page on new data
      setCurrentPageMpesa(1); // Reset page on new data
      setLoadingData(false);
    }, (error) => {
      console.error("Error fetching payout accounts: ", error);
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [user, initialLoadComplete, router]);

  const handleEdit = (id: string, type: 'bank' | 'mpesa') => {
    if (type === 'bank') {
      router.push(`/dashboard/payouts/edit-bank/${id}`);
    } else if (type === 'mpesa') {
      router.push(`/dashboard/payouts/edit-mpesa/${id}`);
    }
  };

  const filteredAccounts = useMemo(() => {
    return allPayoutAccounts.filter(acc => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        acc.accountName.toLowerCase().includes(searchTermLower) ||
        acc.accountNumber.toLowerCase().includes(searchTermLower) ||
        (acc.type === 'bank' && acc.bankName?.toLowerCase().includes(searchTermLower)) ||
        (acc.type === 'mpesa' && acc.accountHolderName?.toLowerCase().includes(searchTermLower))
      );
    });
  }, [allPayoutAccounts, searchTerm]);

  const bankAccounts = useMemo(() => filteredAccounts.filter(acc => acc.type === 'bank'), [filteredAccounts]);
  const mpesaAccounts = useMemo(() => filteredAccounts.filter(acc => acc.type === 'mpesa'), [filteredAccounts]);

  const paginatedBankAccounts = useMemo(() => {
    const startIndex = (currentPageBank - 1) * ITEMS_PER_PAGE;
    return bankAccounts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [bankAccounts, currentPageBank]);
  const totalPagesBank = Math.ceil(bankAccounts.length / ITEMS_PER_PAGE);

  const paginatedMpesaAccounts = useMemo(() => {
    const startIndex = (currentPageMpesa - 1) * ITEMS_PER_PAGE;
    return mpesaAccounts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [mpesaAccounts, currentPageMpesa]);
  const totalPagesMpesa = Math.ceil(mpesaAccounts.length / ITEMS_PER_PAGE);
  
  const PayoutSkeleton = () => (
    <div className="space-y-2 px-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="flex items-center justify-between py-4 border-b border-border last:border-b-0">
            <div className="flex items-center gap-4">
                <Skeleton className="h-11 w-11 rounded-lg" />
                <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
            <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );

  if (authLoading || (!initialLoadComplete && !user)) { 
    return (
        <div className="flex justify-center items-center h-full p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Payout accounts</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search accounts by name, number, bank, or holder"
          className="w-full bg-secondary border-border rounded-lg h-12 pl-10 pr-4 text-base focus-visible:ring-primary"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPageBank(1);
            setCurrentPageMpesa(1);
          }}
        />
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Bank accounts</h2>
          <div className="flex justify-end">
             <Link href="/dashboard/payouts/add-bank">
                <Button> {/* Default primary variant */}
                  <PlusCircle className="mr-2 h-4 w-4" /> Add bank account
                </Button>
            </Link>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            {loadingData ? <PayoutSkeleton /> : bankAccounts.length > 0 ? (
              <div className="divide-y divide-border">
                {paginatedBankAccounts.map((account) => (
                  <div key={account.id} className="px-6">
                    <PayoutAccountItem account={account} onEdit={handleEdit} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-muted-foreground text-center">
                {searchTerm ? `No bank accounts found matching "${searchTerm}".` : "No bank accounts added yet."}
              </p>
            )}
          </CardContent>
          {totalPagesBank > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <Button variant="outline" onClick={() => setCurrentPageBank(p => Math.max(1, p - 1))} disabled={currentPageBank === 1}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {currentPageBank} of {totalPagesBank}</span>
              <Button variant="outline" onClick={() => setCurrentPageBank(p => Math.min(totalPagesBank, p + 1))} disabled={currentPageBank === totalPagesBank}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">M-Pesa accounts</h2>
          <div className="flex justify-end">
            <Link href="/dashboard/payouts/add-mpesa">
                <Button> {/* Default primary variant */}
                  <PlusCircle className="mr-2 h-4 w-4" /> Add M-Pesa account
                </Button>
            </Link>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
             {loadingData ? <PayoutSkeleton /> : mpesaAccounts.length > 0 ? (
               <div className="divide-y divide-border">
                {paginatedMpesaAccounts.map((account) => (
                   <div key={account.id} className="px-6">
                    <PayoutAccountItem account={account} onEdit={handleEdit} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-muted-foreground text-center">
                 {searchTerm ? `No M-Pesa accounts found matching "${searchTerm}".` : "No M-Pesa accounts added yet."}
              </p>
            )}
          </CardContent>
           {totalPagesMpesa > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <Button variant="outline" onClick={() => setCurrentPageMpesa(p => Math.max(1, p - 1))} disabled={currentPageMpesa === 1}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {currentPageMpesa} of {totalPagesMpesa}</span>
              <Button variant="outline" onClick={() => setCurrentPageMpesa(p => Math.min(totalPagesMpesa, p + 1))} disabled={currentPageMpesa === totalPagesMpesa}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
};

export default PayoutAccountsPage;

    