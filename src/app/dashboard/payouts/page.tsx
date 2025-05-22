
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Landmark, Phone, Edit2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PayoutAccount } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Dummy data - updated with type and M-Pesa examples
const dummyPayoutAccounts: PayoutAccount[] = [
  { id: '1', type: 'bank', accountName: 'Main Business Account', accountNumber: '**** **** **** 1234', accountHolderName: 'PesiX Corp', bankName: 'Bank of America', routingNumber: '123456789', swiftCode: 'BOFAUS3N', status: 'Active' },
  { id: '2', type: 'bank', accountName: 'Project Funds', accountNumber: '**** **** **** 5678', accountHolderName: 'PesiX Projects', bankName: 'Chase Bank', routingNumber: '987654321', swiftCode: 'CHASUS33', status: 'Active' },
  { id: '3', type: 'mpesa', accountName: 'Sophia Bennett M-Pesa', accountNumber: '+254712345678', accountHolderName: 'Sophia Bennett', status: 'Active' },
  { id: '4', type: 'bank', accountName: 'Secondary Business', accountNumber: '**** **** **** 9012', accountHolderName: 'PesiX Global', bankName: 'Equity Bank Kenya', routingNumber: '000000000', swiftCode: 'EQBLKENA', status: 'Pending' },
  { id: '5', type: 'mpesa', accountName: 'John Doe M-Pesa', accountNumber: '+254700000000', accountHolderName: 'John Doe', status: 'Disabled' },
];

const PayoutAccountItem: React.FC<{ account: PayoutAccount; onEdit: (id: string, type: 'bank' | 'mpesa') => void }> = ({ account, onEdit }) => {
  const Icon = account.type === 'bank' ? Landmark : Phone;
  const primaryIdentifier = account.type === 'bank' ? `...${account.accountNumber.slice(-4)}` : account.accountNumber;
  const secondaryIdentifier = account.type === 'bank' ? account.bankName : account.accountHolderName;

  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-b-0">
      <div className="flex items-center gap-4">
        <div className="bg-secondary p-3 rounded-lg">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">{account.accountName}</p> {/* Display Nickname */}
          <p className="text-sm text-muted-foreground">{primaryIdentifier} - {secondaryIdentifier}</p>
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

  const bankAccounts = dummyPayoutAccounts.filter(acc => acc.type === 'bank');
  const mpesaAccounts = dummyPayoutAccounts.filter(acc => acc.type === 'mpesa');

  const handleEdit = (id: string, type: 'bank' | 'mpesa') => {
    if (type === 'bank') {
      router.push(`/dashboard/payouts/edit-bank/${id}`);
    } else if (type === 'mpesa') {
      router.push(`/dashboard/payouts/edit-mpesa/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Payout accounts</h1>
      </div>

      {/* Bank Accounts Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Bank accounts</h2>
        </div>
        <Card>
          <CardContent className="p-0">
            {bankAccounts.length > 0 ? (
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
        <div className="mt-4 flex justify-end">
          <Link href="/dashboard/payouts/add-bank" legacyBehavior>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add bank account
            </Button>
          </Link>
        </div>
      </section>

      {/* M-Pesa Accounts Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">M-Pesa accounts</h2>
        </div>
        <Card>
          <CardContent className="p-0">
            {mpesaAccounts.length > 0 ? (
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
        <div className="mt-4 flex justify-end">
          <Link href="/dashboard/payouts/add-mpesa" legacyBehavior>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add M-Pesa account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PayoutAccountsPage;
