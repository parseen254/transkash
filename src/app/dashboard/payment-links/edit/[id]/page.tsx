
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarIcon, Loader2 } from 'lucide-react';
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
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


const editPaymentLinkSchema = z.object({
  linkName: z.string().min(1, { message: 'Link name is required.' }),
  reference: z.string().min(1, { message: 'Reference is required.' }),
  amount: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().positive({ message: 'Amount must be a positive number.' })
  ).refine(val => /^\d+(\.\d{1,2})?$/.test(String(val)), { message: 'Amount must be a valid number with up to two decimal places.' }),
  currency: z.string().default('KES'),
  purpose: z.string().min(1, { message: 'Purpose is required.' }),
  payoutAccountId: z.string().min(1, { message: 'Payout account is required.' }),
  hasExpiry: z.boolean().default(false),
  expiryDate: z.date().optional(),
  status: z.enum(['Active', 'Disabled', 'Expired', 'Paid']),
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

const EditPaymentLinkPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id: paymentLinkId } = params;
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const form = useForm<EditPaymentLinkFormValues>({
    resolver: zodResolver(editPaymentLinkSchema),
    defaultValues: {
      linkName: '',
      reference: '',
      amount: 0,
      currency: 'KES',
      purpose: '',
      payoutAccountId: '',
      hasExpiry: false,
      expiryDate: undefined,
      status: 'Active',
    },
  });

  const watchHasExpiry = form.watch('hasExpiry');

  useEffect(() => {
    if (!user) {
        router.push('/login');
        return;
    }
    // Fetch payout accounts
    setLoadingAccounts(true);
    const accQuery = query(collection(db, 'payoutAccounts'), where('userId', '==', user.uid), where('status', '==', 'Active'));
    getDocs(accQuery).then(snapshot => {
      setPayoutAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayoutAccount)));
      setLoadingAccounts(false);
    }).catch(err => {
      console.error("Error fetching payout accounts: ", err);
      toast({ title: "Error", description: "Could not fetch payout accounts.", variant: "destructive" });
      setLoadingAccounts(false);
    });

    // Fetch payment link data
    if (paymentLinkId) {
      setLoading(true);
      const linkDocRef = doc(db, 'paymentLinks', paymentLinkId as string);
      getDoc(linkDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const linkData = docSnap.data() as PaymentLink;
          if (linkData.userId !== user.uid) {
            toast({ title: "Access Denied", description: "You do not have permission to edit this link.", variant: "destructive" });
            router.push('/dashboard/payment-links');
            return;
          }
          form.reset({
            ...linkData,
            amount: linkData.amount, // Keep as number
            expiryDate: linkData.expiryDate instanceof Timestamp ? linkData.expiryDate.toDate() : undefined,
          });
        } else {
          toast({ title: "Error", description: "Payment link not found.", variant: "destructive" });
          router.push('/dashboard/payment-links');
        }
        setLoading(false);
      }).catch(err => {
        console.error("Error fetching payment link: ", err);
        toast({ title: "Error", description: "Could not load payment link details.", variant: "destructive" });
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [paymentLinkId, user, form, router, toast]);

  const onSubmit = async (data: EditPaymentLinkFormValues) => {
    if (!user || !paymentLinkId) return;

    try {
      const linkDocRef = doc(db, 'paymentLinks', paymentLinkId as string);
      const updateData: Partial<PaymentLink> = {
        ...data,
        amount: data.amount,
        expiryDate: data.hasExpiry && data.expiryDate ? Timestamp.fromDate(data.expiryDate) : null,
        updatedAt: serverTimestamp() as Timestamp,
      };
      
      await updateDoc(linkDocRef, updateData);
      toast({
        title: "Payment Link Updated!",
        description: `${data.linkName} has been updated successfully.`,
      });
      router.push(`/dashboard/payment-links/${paymentLinkId}`);
    } catch (error: any) {
      console.error('Error updating payment link:', error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  };

  if (loading || loadingAccounts) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-60 mb-4" />
        <Card className="max-w-2xl mx-auto">
          <CardHeader><Skeleton className="h-7 w-1/2" /><Skeleton className="h-4 w-3/4 mt-1" /></CardHeader>
          <CardContent className="space-y-6">
            {[...Array(6)].map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-10 w-full" /></div>))}
            <Skeleton className="h-12 w-full" />
            <div className="flex justify-end"><Skeleton className="h-10 w-32" /></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={paymentLinkId ? `/dashboard/payment-links/${paymentLinkId}` : "/dashboard/payment-links"} legacyBehavior>
        <a className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Payment Link Details
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
              <FormField control={form.control} name="linkName" render={({ field }) => ( <FormItem> <FormLabel>Link Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="reference" render={({ field }) => ( <FormItem> <FormLabel>Reference</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="amount" render={({ field }) => ( <FormItem> <FormLabel>Amount ({form.getValues('currency')})</FormLabel> <FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl> <FormMessage /> </FormItem> )}/>
              </div>
              <FormField control={form.control} name="purpose" render={({ field }) => ( <FormItem> <FormLabel>Purpose</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="payoutAccountId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payout Account</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={loadingAccounts}>
                      <FormControl><SelectTrigger>{loadingAccounts ? "Loading..." : <SelectValue placeholder="Select a payout account" />}</SelectTrigger></FormControl>
                      <SelectContent>{payoutAccounts.map(acc => ( <SelectItem key={acc.id} value={acc.id}>{acc.accountName} ({acc.type === 'bank' ? acc.bankName : acc.accountNumber})</SelectItem> ))}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Disabled">Disabled</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
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
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus/>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
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
