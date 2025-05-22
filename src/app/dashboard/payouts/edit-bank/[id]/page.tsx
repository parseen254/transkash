
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { ArrowLeft, Landmark, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription as FormDesc, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { PayoutAccount } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

// Re-using schema from add-bank page
const bankAccountSchema = z.object({
  accountName: z.string().min(1, { message: 'Account nickname is required.' }),
  accountHolderName: z.string().min(1, { message: 'Account holder name is required.' }),
  accountNumber: z.string().min(1, { message: 'Account number is required.' }).regex(/^\d+$/, "Account number must be numeric."),
  bankName: z.string().min(1, { message: 'Bank name is required.' }),
  routingNumber: z.string().min(1, { message: 'Routing number is required.' }),
  swiftCode: z.string()
    .min(8, { message: "SWIFT/BIC code must be between 8 and 11 characters." })
    .max(11, { message: "SWIFT/BIC code must be between 8 and 11 characters." })
    .regex(/^[A-Z0-9]{8,11}$/, { message: "Invalid SWIFT/BIC code format." }),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

// Mock data for fetching - replace with actual API call
const dummyPayoutAccounts: PayoutAccount[] = [
  { id: '1', type: 'bank', accountName: 'Main Business Account', accountNumber: '**** **** **** 1234', accountHolderName: 'PesiX Corp', bankName: 'Bank of America', routingNumber: '123456789', swiftCode: 'BOFAUS3N', status: 'Active' },
  { id: '2', type: 'bank', accountName: 'Project Funds', accountNumber: '**** **** **** 5678', accountHolderName: 'PesiX Projects', bankName: 'Chase Bank', routingNumber: '987654321', swiftCode: 'CHASUS33', status: 'Active' },
];

const EditBankAccountPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      accountName: '',
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      routingNumber: '',
      swiftCode: '',
    },
  });

  useEffect(() => {
    if (id) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const accountToEdit = dummyPayoutAccounts.find(acc => acc.id === id && acc.type === 'bank');
        if (accountToEdit) {
          form.reset({
            accountName: accountToEdit.accountName,
            accountHolderName: accountToEdit.accountHolderName || '',
            // Masked account number is for display only. Real form should use unmasked.
            // For this mock, we'll just keep it potentially masked or expect full if it were real.
            accountNumber: accountToEdit.accountNumber.includes('*') ? '' : accountToEdit.accountNumber, 
            bankName: accountToEdit.bankName || '',
            routingNumber: accountToEdit.routingNumber || '',
            swiftCode: accountToEdit.swiftCode || '',
          });
        } else {
          toast({ title: "Error", description: "Bank account not found.", variant: "destructive" });
          router.push('/dashboard/payouts');
        }
        setLoading(false);
      }, 700);
    }
  }, [id, router, toast, form]);

  const onSubmit = async (data: BankAccountFormValues) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Updated bank account data for ID:', id, data);
    toast({
      title: "Bank Account Updated",
      description: `${data.accountName} (${data.bankName}) has been updated successfully.`,
    });
    router.push('/dashboard/payouts');
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3"> <Landmark className="h-7 w-7 text-primary" /> <div> <Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64 mt-1" /></div></div>
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(6)].map((_, i) => <div key={i}><Skeleton className="h-5 w-1/4 mb-2" /><Skeleton className="h-10 w-full" /></div>)}
            <div className="flex justify-end"><Skeleton className="h-10 w-24" /></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/payouts" legacyBehavior>
        <a className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Payout Accounts
        </a>
      </Link>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Landmark className="h-7 w-7 text-primary" />
            <div>
              <CardTitle className="text-2xl">Edit Bank Account</CardTitle>
              <CardDescription>Update the details for your bank payout account.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Nickname</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My Business Checking" {...field} />
                    </FormControl>
                    <FormDesc>A friendly name for you to identify this account.</FormDesc>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="accountHolderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Holder Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account holder name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account number" {...field} />
                    </FormControl>
                     <FormDesc>Enter the full account number to update it.</FormDesc>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter bank name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="routingNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Routing Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter routing number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="swiftCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SWIFT/BIC Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter SWIFT/BIC code" {...field} />
                    </FormControl>
                    <FormDesc>Required for international transfers. Must be 8 or 11 characters.</FormDesc>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || form.formState.isSubmitting}>
                  {isSubmitting || form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditBankAccountPage;
