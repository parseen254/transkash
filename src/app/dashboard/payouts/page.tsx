
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Landmark, Phone, Edit2, PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PayoutAccount } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { user, loading: authLoading } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<PayoutAccount[]>([]);
  const [mpesaAccounts, setMpesaAccounts] = useState<PayoutAccount[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    setLoadingData(true);
    const payoutAccountsCollection = collection(db, 'payoutAccounts');
    const q = query(payoutAccountsCollection, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedBankAccounts: PayoutAccount[] = [];
      const fetchedMpesaAccounts: PayoutAccount[] = [];
      querySnapshot.forEach((doc) => {
        const account = { id: doc.id, ...doc.data() } as PayoutAccount;
        if (account.type === 'bank') {
          fetchedBankAccounts.push(account);
        } else if (account.type === 'mpesa') {
          fetchedMpesaAccounts.push(account);
        }
      });
      setBankAccounts(fetchedBankAccounts);
      setMpesaAccounts(fetchedMpesaAccounts);
      setLoadingData(false);
    }, (error) => {
      console.error("Error fetching payout accounts: ", error);
      setLoadingData(false);
      // Optionally show a toast message for the error
    });

    return () => unsubscribe();
  }, [user, authLoading, router]);

  const handleEdit = (id: string, type: 'bank' | 'mpesa') => {
    if (type === 'bank') {
      router.push(`/dashboard/payouts/edit-bank/${id}`);
    } else if (type === 'mpesa') {
      router.push(`/dashboard/payouts/edit-mpesa/${id}`);
    }
  };
  
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


  if (authLoading || (!user && !authLoading)) { // Show loading if auth is loading or user is null (before redirect)
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

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Bank accounts</h2>
          <div className="flex justify-end">
             <Link href="/dashboard/payouts/add-bank" legacyBehavior>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add bank account
                </Button>
            </Link>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            {loadingData ? <PayoutSkeleton /> : bankAccounts.length > 0 ? (
              <div className="divide-y divide-border">
                {bankAccounts.map((account) => (
                  <div key={account.id} className="px-6">
                    <PayoutAccountItem account={account} onEdit={handleEdit} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-muted-foreground">No bank accounts added yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">M-Pesa accounts</h2>
          <div className="flex justify-end">
            <Link href="/dashboard/payouts/add-mpesa" legacyBehavior>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add M-Pesa account
                </Button>
            </Link>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
             {loadingData ? <PayoutSkeleton /> : mpesaAccounts.length > 0 ? (
               <div className="divide-y divide-border">
                {mpesaAccounts.map((account) => (
                   <div key={account.id} className="px-6">
                    <PayoutAccountItem account={account} onEdit={handleEdit} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-muted-foreground">No M-Pesa accounts added yet.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default PayoutAccountsPage;
