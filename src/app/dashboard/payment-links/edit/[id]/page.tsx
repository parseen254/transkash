
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import type { PaymentLink, PayoutAccount } from '@/lib/types';
import { cn } from '@/lib/utils';

const editPaymentLinkSchema = z.object({
  linkName: z.string().min(1, { message: 'Link name is required.' }),
  reference: z.string().min(1, { message: 'Reference is required.' }),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: 'Amount must be a valid number.' }),
  purpose: z.string().min(1, { message: 'Purpose is required.' }),
  payoutAccountId: z.string().optional(),
  hasExpiry: z.boolean().default(false),
  expiryDate: z.date().optional(),
}).refine(data => {
  if (data.hasExpiry && !data.expiryDate) {
    return false;
  }
  return true;
}, {
  message: 'Expiry date is required when expiry is enabled.',
  path: ['expiryDate'],
});

type EditPaymentLinkFormValues = z.infer<typeof editPaymentLinkSchema>;

const dummyPayoutAccounts: PayoutAccount[] = [
  { id: 'acc_1', accountName: 'Main Business Account', accountNumber: 'xxxx', bankName: 'Equity', status: 'Active' },
  { id: 'acc_2', accountName: 'Personal Savings', accountNumber: 'xxxx', bankName: 'KCB', status: 'Active' },
];

const NONE_PAYOUT_ACCOUNT_VALUE = "___NONE___";

const EditPaymentLinkPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const form = useForm<EditPaymentLinkFormValues>({
    resolver: zodResolver(editPaymentLinkSchema),
    defaultValues: {
      linkName: '',
      reference: '',
      amount: '',
      purpose: '',
      payoutAccountId: '',
      hasExpiry: false,
      expiryDate: undefined,
    },
  });

  const watchHasExpiry = form.watch('hasExpiry');

  useEffect(() => {
    const fetchLinkData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      // Dummy link data - including potential expiry info
      const dummyLinkData: PaymentLink & { hasExpiry?: boolean } = {
        id: id as string,
        linkName: `Invoice #${id} Payment`,
        reference: `INV-${id}`,
        amount: '5000.00',
        purpose: 'Consultation Services Update',
        creationDate: '2023-10-01',
        status: 'Active',
        payoutAccount: 'acc_1',
        hasExpiry: id === 'pl_1', // Example: link pl_1 has expiry
        expiryDate: id === 'pl_1' ? new Date(new Date().setDate(new Date().getDate() + 7)).toISOString() : undefined, // Expires in 7 days if pl_1
      };

      form.reset({
        linkName: dummyLinkData.linkName,
        reference: dummyLinkData.reference,
        amount: dummyLinkData.amount,
        purpose: dummyLinkData.purpose,
        payoutAccountId: dummyLinkData.payoutAccount || '',
        hasExpiry: !!dummyLinkData.hasExpiry,
        expiryDate: dummyLinkData.expiryDate ? new Date(dummyLinkData.expiryDate) : undefined,
      });
      setLoading(false);
    };
    if (id) {
      fetchLinkData();
    }
  }, [id, form]);

  const onSubmit = async (data: EditPaymentLinkFormValues) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const submissionData = { ...data };
    if (!submissionData.hasExpiry) {
      delete submissionData.expiryDate; 
    }
    if (submissionData.payoutAccountId === NONE_PAYOUT_ACCOUNT_VALUE) {
      submissionData.payoutAccountId = '';
    }

    console.log('Updated payment link data:', id, submissionData);
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
                      value={field.value === '' ? NONE_PAYOUT_ACCOUNT_VALUE : field.value}
                      onValueChange={(valueFromSelectItem) => {
                        field.onChange(valueFromSelectItem === NONE_PAYOUT_ACCOUNT_VALUE ? '' : valueFromSelectItem);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a payout account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE_PAYOUT_ACCOUNT_VALUE}>None</SelectItem>
                        {dummyPayoutAccounts.map(acc => {
                          if (acc.id === "") {
                            console.error("PayoutAccount found with empty ID:", acc);
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

              <FormField
                control={form.control}
                name="hasExpiry"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Expiry Date</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Set a date when this payment link will expire.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchHasExpiry && (
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiry Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0,0,0,0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
    

    