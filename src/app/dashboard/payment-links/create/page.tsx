
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowLeft, CalendarIcon, Loader2 } from 'lucide-react';
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
import type { PayoutAccount, PaymentLink } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, Timestamp, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

const paymentLinkSchema = z.object({
  linkName: z.string().min(1, { message: 'Link name is required.' }),
  reference: z.string().min(1, { message: 'Reference is required.' }),
  amount: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().positive({ message: 'Amount must be a positive number.' })
  ).refine(val => /^\d+(\.\d{1,2})?$/.test(String(val)), { message: 'Amount must be a valid number with up to two decimal places.' }),
  currency: z.string().default('KES'),
  purpose: z.string().min(1, { message: 'Purpose is required.' }),
  payoutAccountId: z.string().min(1, { message: 'Payout account is required.' }),
  hasExpiry: z.boolean().default(true),
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
  const { user } = useAuth();
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const form = useForm<PaymentLinkFormValues>({
    resolver: zodResolver(paymentLinkSchema),
    defaultValues: {
      linkName: '',
      reference: '',
      amount: 0,
      currency: 'KES',
      purpose: '',
      payoutAccountId: '',
      hasExpiry: true,
      expiryDate: undefined,
    },
  });

  const watchHasExpiry = form.watch('hasExpiry');

  useEffect(() => {
    if (!user) return;
    setLoadingAccounts(true);
    const q = query(collection(db, 'payoutAccounts'), where('userId', '==', user.uid), where('status', '==', 'Active'));
    getDocs(q).then(snapshot => {
      const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayoutAccount));
      setPayoutAccounts(accounts);
      setLoadingAccounts(false);
    }).catch(error => {
      console.error("Error fetching payout accounts:", error);
      toast({ title: "Error", description: "Could not fetch payout accounts.", variant: "destructive" });
      setLoadingAccounts(false);
    });
  }, [user, toast]);

  const onSubmit = async (data: PaymentLinkFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    try {
      const newLinkRef = doc(collection(db, 'paymentLinks')); // Generate ID beforehand for shortUrl
      const newLinkData: Omit<PaymentLink, 'id'> = {
        userId: user.uid,
        linkName: data.linkName,
        reference: data.reference,
        amount: data.amount,
        currency: data.currency,
        purpose: data.purpose,
        payoutAccountId: data.payoutAccountId,
        hasExpiry: data.hasExpiry,
        expiryDate: data.hasExpiry && data.expiryDate ? Timestamp.fromDate(data.expiryDate) : null,
        status: 'Active',
        creationDate: serverTimestamp() as Timestamp, // Cast for type consistency
        shortUrl: `/payment/order?paymentLinkId=${newLinkRef.id}`, // Use generated ID
      };

      await setDoc(newLinkRef, newLinkData); // Use setDoc with the generated ref

      toast({
        title: "Payment Link Created!",
        description: `${data.linkName} created successfully.`,
      });
      router.push('/dashboard/payment-links');
    } catch (error: any) {
      console.error("Error creating payment link:", error);
      toast({ title: "Error", description: `Failed to create payment link: ${error.message}`, variant: "destructive" });
    }
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
              <FormField control={form.control} name="linkName" render={({ field }) => ( <FormItem> <FormLabel>Link Name</FormLabel> <FormControl><Input placeholder="e.g., Invoice #123 Payment" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="reference" render={({ field }) => ( <FormItem> <FormLabel>Reference</FormLabel> <FormControl><Input placeholder="INV-00123" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="amount" render={({ field }) => ( <FormItem> <FormLabel>Amount ({form.getValues('currency')})</FormLabel> <FormControl><Input type="number" step="0.01" placeholder="5000.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl> <FormMessage /> </FormItem> )}/>
              </div>
              <FormField control={form.control} name="purpose" render={({ field }) => ( <FormItem> <FormLabel>Purpose</FormLabel> <FormControl><Textarea placeholder="Payment for web development services" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="payoutAccountId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payout Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingAccounts}>
                      <FormControl>
                        <SelectTrigger>{loadingAccounts ? "Loading accounts..." : <SelectValue placeholder="Select a payout account" />}</SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {payoutAccounts.map(acc => ( <SelectItem key={acc.id} value={acc.id}>{acc.accountName} ({acc.type === 'bank' ? acc.bankName : acc.accountNumber})</SelectItem> ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="hasExpiry" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5"> <FormLabel>Enable Expiry Date</FormLabel> <p className="text-xs text-muted-foreground">Set a date when this payment link will expire.</p> </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
              {watchHasExpiry && (
                <FormField control={form.control} name="expiryDate" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiry Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting || loadingAccounts}>
                  {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Link'}
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
