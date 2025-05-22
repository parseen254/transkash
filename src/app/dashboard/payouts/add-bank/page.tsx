
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowLeft, Landmark, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription as FormDesc, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PayoutAccount } from '@/lib/types';

const bankAccountSchema = z.object({
  accountName: z.string().min(1, { message: 'Account nickname is required.' }),
  accountHolderName: z.string().min(1, { message: 'Account holder name is required.' }),
  accountNumber: z.string().min(1, { message: 'Account number is required.' }).regex(/^\d+$/, "Account number must be numeric."),
  bankName: z.string().min(1, { message: 'Bank name is required.' }),
  routingNumber: z.string().min(1, { message: 'Routing number is required.' }),
  swiftCode: z.string()
    .min(8, { message: "SWIFT/BIC code must be between 8 and 11 characters." })
    .max(11, { message: "SWIFT/BIC code must be between 8 and 11 characters." })
    .regex(/^[A-Za-z0-9]{8,11}$/, { message: "Invalid SWIFT/BIC code format." }),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

const AddBankAccountPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

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

  const onSubmit = async (data: BankAccountFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    try {
      const newAccountData: Omit<PayoutAccount, 'id' | 'createdAt' | 'updatedAt' > = {
        userId: user.uid, // Ensure userId is included
        type: 'bank',
        status: 'Active',
        ...data,
      };
      
      await addDoc(collection(db, 'payoutAccounts'), {
        ...newAccountData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(), // Also set updatedAt on creation
      });

      toast({
        title: "Bank Account Added",
        description: `${data.accountName} (${data.bankName}) has been added successfully.`,
      });
      router.push('/dashboard/payouts');
    } catch (error: any) {
      console.error("Error adding bank account:", error);
      toast({ title: "Error", description: `Failed to add bank account: ${error.message}`, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/payouts">
        <Button variant="link" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4 px-0">
          <ArrowLeft className="h-4 w-4" />
          Back to Payout Accounts
        </Button>
      </Link>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Landmark className="h-7 w-7 text-primary" />
            <div>
              <CardTitle className="text-2xl">Add Bank Account</CardTitle>
              <CardDescription>Provide details for your new bank payout account.</CardDescription>
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
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Add Bank Account'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddBankAccountPage;
