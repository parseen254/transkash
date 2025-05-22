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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const detailedAccountSchema = z.object({
  accountName: z.string().min(1, { message: 'Account name is required.' }),
  accountNumber: z.string().min(1, { message: 'Account number is required.' }).regex(/^\d+$/, "Account number must be numeric."),
  bankName: z.string().min(1, { message: 'Bank name is required.' }),
  bankBranch: z.string().optional(),
  bankCode: z.string().optional(),
  bankSwiftCode: z.string().optional(),
});

type DetailedAccountFormValues = z.infer<typeof detailedAccountSchema>;

const AddDetailedPayoutAccountPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<DetailedAccountFormValues>({
    resolver: zodResolver(detailedAccountSchema),
    defaultValues: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      bankBranch: '',
      bankCode: '',
      bankSwiftCode: '',
    },
  });

  const onSubmit = async (data: DetailedAccountFormValues) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Detailed payout account data:', data);
    toast({
      title: "Account Added",
      description: `${data.accountName} has been added successfully with detailed information.`,
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
          <CardTitle>Add Payout Account (Detailed)</CardTitle>
          <CardDescription>Provide comprehensive details for your new payout account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Business Checking" {...field} />
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
                      <Input placeholder="1234567890" {...field} />
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
                      <Input placeholder="Kenya Commercial Bank" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="bankBranch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Branch (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nairobi Main" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="01101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="bankSwiftCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank SWIFT Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="KCBLKENXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Adding...' : 'Add Account'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddDetailedPayoutAccountPage;
