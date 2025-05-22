
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { ArrowLeft, Phone, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { PayoutAccount } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

// Re-using schema from add-mpesa page
const mpesaAccountSchema = z.object({
  accountHolderName: z.string().min(1, { message: 'Account holder name is required.' }),
  accountNumber: z.string()
    .min(10, { message: 'Phone number must be at least 10 digits.' })
    .regex(/^(?:\+?254|0)?(7\d{8})$/, "Invalid Kenyan M-Pesa number format."),
});

type MpesaAccountFormValues = z.infer<typeof mpesaAccountSchema>;

// Mock data for fetching - replace with actual API call
const dummyPayoutAccounts: PayoutAccount[] = [
    { id: '3', type: 'mpesa', accountName: 'Sophia Bennett M-Pesa', accountNumber: '+254712345678', accountHolderName: 'Sophia Bennett', status: 'Active' },
    { id: '5', type: 'mpesa', accountName: 'John Doe M-Pesa', accountNumber: '+254700000000', accountHolderName: 'John Doe', status: 'Disabled' },
];


const EditMpesaAccountPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MpesaAccountFormValues>({
    resolver: zodResolver(mpesaAccountSchema),
    defaultValues: {
      accountHolderName: '',
      accountNumber: '',
    },
  });

  useEffect(() => {
    if (id) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const accountToEdit = dummyPayoutAccounts.find(acc => acc.id === id && acc.type === 'mpesa');
        if (accountToEdit) {
          form.reset({
            accountHolderName: accountToEdit.accountHolderName || '',
            accountNumber: accountToEdit.accountNumber || '',
          });
        } else {
          toast({ title: "Error", description: "M-Pesa account not found.", variant: "destructive" });
          router.push('/dashboard/payouts');
        }
        setLoading(false);
      }, 700);
    }
  }, [id, router, toast, form]);

  const onSubmit = async (data: MpesaAccountFormValues) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Updated M-Pesa account data for ID:', id, data);
    toast({
      title: "M-Pesa Account Updated",
      description: `${data.accountHolderName} (${data.accountNumber}) has been updated successfully.`,
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
            <div className="flex items-center gap-3"> <Phone className="h-7 w-7 text-primary" /> <div> <Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64 mt-1" /></div></div>
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(2)].map((_, i) => <div key={i}><Skeleton className="h-5 w-1/4 mb-2" /><Skeleton className="h-10 w-full" /></div>)}
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
            <Phone className="h-7 w-7 text-primary" />
            <div>
              <CardTitle className="text-2xl">Edit M-Pesa Account</CardTitle>
              <CardDescription>Update the details for your M-Pesa payout account.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="accountHolderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registered M-Pesa Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe" {...field} />
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
                    <FormLabel>M-Pesa Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+2547XXXXXXXX" {...field} />
                    </FormControl>
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

export default EditMpesaAccountPage;
