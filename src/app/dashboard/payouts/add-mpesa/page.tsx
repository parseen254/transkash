
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

const mpesaAccountSchema = z.object({
  accountHolderName: z.string().min(1, { message: 'Account holder name is required.' }),
  accountNumber: z.string()
    .min(10, { message: 'Phone number must be at least 10 digits.' })
    .regex(/^(?:\+?254|0)?(7\d{8})$/, "Invalid Kenyan M-Pesa number format."), // Basic Kenyan phone number regex
});

type MpesaAccountFormValues = z.infer<typeof mpesaAccountSchema>;

const AddMpesaAccountPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<MpesaAccountFormValues>({
    resolver: zodResolver(mpesaAccountSchema),
    defaultValues: {
      accountHolderName: '',
      accountNumber: '',
    },
  });

  const onSubmit = async (data: MpesaAccountFormValues) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('M-Pesa account data:', data);
    toast({
      title: "M-Pesa Account Added",
      description: `${data.accountHolderName} (${data.accountNumber}) has been added successfully.`,
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
          <CardTitle>Add M-Pesa Account</CardTitle>
          <CardDescription>Provide details for your new M-Pesa payout account.</CardDescription>
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
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Adding...' : 'Add M-Pesa Account'}
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
