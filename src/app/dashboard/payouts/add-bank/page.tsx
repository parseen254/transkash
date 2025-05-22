
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription as FormDesc, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const bankAccountSchema = z.object({
  accountName: z.string().min(1, { message: 'Account nickname is required.' }),
  accountHolderName: z.string().min(1, { message: 'Account holder name is required.' }),
  accountNumber: z.string().min(1, { message: 'Account number is required.' }).regex(/^\d+$/, "Account number must be numeric."),
  bankName: z.string().min(1, { message: 'Bank name is required.' }),
  routingNumber: z.string().min(1, { message: 'Routing number is required.' }),
  swiftCode: z.string()
    .min(8, { message: "SWIFT/BIC code must be between 8 and 11 characters." })
    .max(11, { message: "SWIFT/BIC code must be between 8 and 11 characters." })
    .regex(/^[A-Z0-9]{8,11}$/, { message: "Invalid SWIFT/BIC code format." }), // Typical SWIFT/BIC format
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;


const AddBankAccountPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

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
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Bank account data:', data);
    toast({
      title: "Bank Account Added",
      description: `${data.accountName} (${data.bankName}) has been added successfully.`,
    });
    router.push('/dashboard/payouts');
  };

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
          <CardTitle>Add payout account</CardTitle>
          <CardDescription>Provide details for your new bank payout account.</CardDescription>
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
                  {form.formState.isSubmitting ? 'Adding...' : 'Add Bank Account'}
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
