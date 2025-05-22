
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { PayoutAccount } from '@/lib/types';

// Dummy data for payout accounts - In a real app, fetch this
const dummyPayoutAccounts: PayoutAccount[] = [
  { id: 'acc_1', accountName: 'Main Business Account', accountNumber: 'xxxx', bankName: 'Equity', status: 'Active' },
  { id: 'acc_2', accountName: 'Personal Savings', accountNumber: 'xxxx', bankName: 'KCB', status: 'Active' },
];

const paymentLinkSchema = z.object({
  linkName: z.string().min(1, { message: 'Link name is required.' }),
  reference: z.string().min(1, { message: 'Reference is required.' }),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: 'Amount must be a valid number with up to two decimal places.' }),
  purpose: z.string().min(1, { message: 'Purpose is required.' }),
  payoutAccountId: z.string().min(1, { message: 'Payout account is required.' }),
  hasExpiry: z.boolean().default(true), // Changed default to true
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

type PaymentLinkFormValues = z.infer<typeof paymentLinkSchema>;

const CreatePaymentLinkPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<PaymentLinkFormValues>({
    resolver: zodResolver(paymentLinkSchema),
    defaultValues: {
      linkName: '',
      reference: '',
      amount: '',
      purpose: '',
      payoutAccountId: '',
      hasExpiry: true, // Set default to true here as well
      expiryDate: undefined,
    },
  });

  const watchHasExpiry = form.watch('hasExpiry');

  const onSubmit = async (data: PaymentLinkFormValues) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const submissionData = { ...data };
    if (!submissionData.hasExpiry) {
      delete submissionData.expiryDate; // Remove expiryDate if not enabled
    }

    console.log('Payment link data:', submissionData);
    const generatedLink = `https://switch.link/pay/${Math.random().toString(36).substring(7)}`;
    toast({
      title: "Payment Link Generated!",
      description: (
        <div>
          <p>{data.linkName} created successfully.</p>
          {submissionData.expiryDate && <p>Expires on: {format(submissionData.expiryDate, "PPP")}</p>}
          <p className="mt-2">Shareable Link: <a href={generatedLink} target="_blank" rel="noopener noreferrer" className="text-primary underline">{generatedLink}</a></p>
        </div>
      ),
      duration: 9000,
    });
    router.push('/dashboard/payment-links');
  };

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
          <CardTitle>Create a Payment Link</CardTitle>
          <CardDescription>Generate a new shareable link for collecting payments.</CardDescription>
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
                        <Input type="number" step="0.01" placeholder="5000.00" {...field} />
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
                    <FormLabel>Payout Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a payout account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                              date < new Date(new Date().setHours(0,0,0,0)) // Disable past dates
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
                  {form.formState.isSubmitting ? 'Generating...' : 'Generate Link'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePaymentLinkPage;
