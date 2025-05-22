
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { PaymentLink, PayoutAccount } from '@/lib/types';

const editPaymentLinkSchema = z.object({
  linkName: z.string().min(1, { message: 'Link name is required.' }),
  reference: z.string().min(1, { message: 'Reference is required.' }),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: 'Amount must be a valid number.' }),
  purpose: z.string().min(1, { message: 'Purpose is required.' }),
  payoutAccountId: z.string().optional(), // ID of the payout account, can be "" for none
});

type EditPaymentLinkFormValues = z.infer<typeof editPaymentLinkSchema>;

// Dummy data for payout accounts
const dummyPayoutAccounts: PayoutAccount[] = [
  { id: 'acc_1', accountName: 'Main Business Account', accountNumber: 'xxxx', bankName: 'Equity', status: 'Active' },
  { id: 'acc_2', accountName: 'Personal Savings', accountNumber: 'xxxx', bankName: 'KCB', status: 'Active' },
];

// Special value for the "None" option in the SelectItem, must not be an empty string.
const NONE_PAYOUT_ACCOUNT_VALUE = "___NONE___";

const EditPaymentLinkPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // Payment link ID
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const form = useForm<EditPaymentLinkFormValues>({
    resolver: zodResolver(editPaymentLinkSchema),
    defaultValues: {
      linkName: '',
      reference: '',
      amount: '',
      purpose: '',
      payoutAccountId: '', // react-hook-form state will use "" for "None"
    },
  });

  useEffect(() => {
    const fetchLinkData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500)); 
      const dummyLinkData: PaymentLink = { 
        id: id as string, 
        linkName: `Invoice #${id} Payment`, 
        reference: `INV-${id}`, 
        amount: '5000.00', 
        purpose: 'Consultation Services Update', 
        creationDate: '2023-10-01', 
        expiryDate: '2023-10-15', 
        status: 'Active',
        payoutAccount: 'acc_1' // This could be undefined or an empty string from a real API
      };
      form.reset({
        linkName: dummyLinkData.linkName,
        reference: dummyLinkData.reference,
        amount: dummyLinkData.amount,
        purpose: dummyLinkData.purpose,
        payoutAccountId: dummyLinkData.payoutAccount || '', // Ensure it's at least "" for form state
      });
      setLoading(false);
    };
    if (id) {
      fetchLinkData();
    }
  }, [id, form]);

  const onSubmit = async (data: EditPaymentLinkFormValues) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // The data.payoutAccountId from the form will already be "" if "None" was selected,
    // due to the logic in the onValueChange handler of the Select component.
    console.log('Updated payment link data:', id, data);
    toast({
      title: "Payment Link Updated!",
      description: `${data.linkName} has been updated successfully.`,
    });
    router.push('/dashboard/payment-links');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Loading link details...</p></div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/payment-links" legacyBehavior>
        <a className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Payment Links
        </a>
      </Link>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Payment Link</CardTitle>
          <CardDescription>Update the details for your payment link.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="linkName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Invoice #123 Payment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="INV-00123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (KES)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5000.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Payment for web development services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payoutAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payout Account (Optional)</FormLabel>
                    <Select 
                      // The 'value' prop for Select must be one of the SelectItem values.
                      // If field.value (from RHF) is "", map it to NONE_PAYOUT_ACCOUNT_VALUE for the Select.
                      value={field.value === '' ? NONE_PAYOUT_ACCOUNT_VALUE : field.value}
                      onValueChange={(valueFromSelectItem) => {
                        // When a SelectItem is chosen, its 'value' is passed here.
                        // If it's our special "None" value, change RHF state to "".
                        // Otherwise, use the actual item value (e.g., "acc_1").
                        field.onChange(valueFromSelectItem === NONE_PAYOUT_ACCOUNT_VALUE ? '' : valueFromSelectItem);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a payout account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* This SelectItem's value is non-empty */}
                        <SelectItem value={NONE_PAYOUT_ACCOUNT_VALUE}>None</SelectItem>
                        {dummyPayoutAccounts.map(acc => {
                          // Ensure acc.id is not an empty string
                          if (acc.id === "") {
                            console.error("PayoutAccount found with empty ID:", acc);
                            // Optionally skip rendering this item or throw an error
                            return null; 
                          }
                          return (
                           <SelectItem key={acc.id} value={acc.id}>{acc.accountName} ({acc.bankName})</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditPaymentLinkPage;

    