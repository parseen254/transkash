
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
import { useAuth } from '@/contexts/auth-context';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const mpesaAccountSchema = z.object({
  accountName: z.string().min(1, {message: "Account nickname is required."}),
  accountHolderName: z.string().min(1, { message: 'Registered M-Pesa name is required.' }),
  accountNumber: z.string()
    .min(10, { message: 'Phone number must be at least 10 digits.' })
    .regex(/^(?:\+?254|0)?([17]\d{8})$/, "Invalid Kenyan M-Pesa number format (e.g., 07... or 01...)."),
  status: z.enum(['Active', 'Pending', 'Disabled']),
});

type MpesaAccountFormValues = z.infer<typeof mpesaAccountSchema>;

const EditMpesaAccountPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MpesaAccountFormValues>({
    resolver: zodResolver(mpesaAccountSchema),
    defaultValues: {
      accountName: '',
      accountHolderName: '',
      accountNumber: '',
      status: 'Active',
    },
  });

  useEffect(() => {
    if (!user || !id) {
      if(!user) router.push('/login');
      setLoading(false);
      return;
    }

    const fetchAccountData = async () => {
      setLoading(true);
      try {
        const accountDocRef = doc(db, 'payoutAccounts', id as string);
        const accountDocSnap = await getDoc(accountDocRef);

        if (accountDocSnap.exists()) {
          const accountData = accountDocSnap.data() as PayoutAccount;
           if (accountData.userId !== user.uid || accountData.type !== 'mpesa') {
            toast({ title: "Error", description: "Account not found or access denied.", variant: "destructive" });
            router.push('/dashboard/payouts');
            return;
          }
          form.reset({
            accountName: accountData.accountName,
            accountHolderName: accountData.accountHolderName,
            accountNumber: accountData.accountNumber,
            status: accountData.status,
          });
        } else {
          toast({ title: "Error", description: "M-Pesa account not found.", variant: "destructive" });
          router.push('/dashboard/payouts');
        }
      } catch (error) {
        console.error("Error fetching M-Pesa account:", error);
        toast({ title: "Error", description: "Failed to load account details.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchAccountData();
  }, [id, user, router, toast, form]);

  const onSubmit = async (data: MpesaAccountFormValues) => {
    if (!user || !id) return;
    setIsSubmitting(true);
    try {
      const accountDocRef = doc(db, 'payoutAccounts', id as string);
      await updateDoc(accountDocRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "M-Pesa Account Updated",
        description: `${data.accountName} has been updated successfully.`,
      });
      router.push('/dashboard/payouts');
    } catch (error: any) {
      console.error('Error updating M-Pesa account:', error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
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
            {[...Array(3)].map((_, i) => <div key={i}><Skeleton className="h-5 w-1/4 mb-2" /><Skeleton className="h-10 w-full" /></div>)}
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
              <FormField control={form.control} name="accountName" render={({ field }) => ( <FormItem> <FormLabel>Account Nickname</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="accountHolderName" render={({ field }) => ( <FormItem> <FormLabel>Registered M-Pesa Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="accountNumber" render={({ field }) => ( <FormItem> <FormLabel>M-Pesa Phone Number</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              {/* TODO: Add Status select if needed */}
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
