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

const minimalAccountSchema = z.object({
  accountName: z.string().min(1, { message: 'Account name is required.' }),
});

type MinimalAccountFormValues = z.infer<typeof minimalAccountSchema>;

const AddMinimalPayoutAccountPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<MinimalAccountFormValues>({
    resolver: zodResolver(minimalAccountSchema),
    defaultValues: {
      accountName: '',
    },
  });

  const onSubmit = async (data: MinimalAccountFormValues) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Minimal payout account data:', data);
    toast({
      title: "Account Added",
      description: `${data.accountName} has been added successfully.`,
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
          <CardTitle>Add Payout Account (Minimal)</CardTitle>
          <CardDescription>Quickly add a new payout account with minimal details.</CardDescription>
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
                      <Input placeholder="e.g., My Primary Bank" {...field} />
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

export default AddMinimalPayoutAccountPage;
