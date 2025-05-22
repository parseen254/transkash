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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const paymentLinkSchema = z.object({
  linkName: z.string().min(1, { message: 'Link name is required.' }),
  reference: z.string().min(1, { message: 'Reference is required.' }),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: 'Amount must be a valid number.' }),
  purpose: z.string().min(1, { message: 'Purpose is required.' }),
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
    },
  });

  const onSubmit = async (data: PaymentLinkFormValues) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Payment link data:', data);
    const generatedLink = `https://switch.link/pay/${Math.random().toString(36).substring(7)}`; // Dummy link
    toast({
      title: "Payment Link Generated!",
      description: (
        <div>
          <p>{data.linkName} created successfully.</p>
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
