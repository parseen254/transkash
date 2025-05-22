
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowLeft, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PayoutAccount } from '@/lib/types';

const mpesaAccountSchema = z.object({
  accountName: z.string().min(1, {message: "Account nickname is required."}),
  accountHolderName: z.string().min(1, { message: 'Registered M-Pesa name is required.' }),
  accountNumber: z.string()
    .min(10, { message: 'Phone number must be at least 10 digits.' })
    .regex(/^(?:\+?254|0)?([17]\d{8})$/, "Invalid Kenyan M-Pesa number format (e.g., 07... or 01...)."),
});

type MpesaAccountFormValues = z.infer<typeof mpesaAccountSchema>;

const AddMpesaAccountPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<MpesaAccountFormValues>({
    resolver: zodResolver(mpesaAccountSchema),
    defaultValues: {
      accountName: '',
      accountHolderName: '',
      accountNumber: '',
    },
  });

  const onSubmit = async (data: MpesaAccountFormValues) => {
     if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const newAccountData: Omit<PayoutAccount, 'id' | 'createdAt' | 'updatedAt' | 'bankName' | 'routingNumber' | 'swiftCode'> = {
        userId: user.uid,
        type: 'mpesa',
        status: 'Active',
        ...data,
      };

      await addDoc(collection(db, 'payoutAccounts'), {
        ...newAccountData,
        createdAt: serverTimestamp(),
      });
      
      toast({
        title: "M-Pesa Account Added",
        description: `${data.accountName} (${data.accountNumber}) has been added successfully.`,
      });
      router.push('/dashboard/payouts');
    } catch (error: any) {
      console.error("Error adding M-Pesa account:", error);
      toast({ title: "Error", description: `Failed to add M-Pesa account: ${error.message}`, variant: "destructive" });
    }
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
          <div className="flex items-center gap-3">
            <Phone className="h-7 w-7 text-primary" />
            <div>
              <CardTitle className="text-2xl">Add M-Pesa Account</CardTitle>
              <CardDescription>Provide details for your new M-Pesa payout account.</CardDescription>
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
                      <Input placeholder="e.g., My Primary M-Pesa" {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
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
                      <Input placeholder="e.g., 0712345678 or +254712345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Adding...</> : 'Add M-Pesa Account'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddMpesaAccountPage;
