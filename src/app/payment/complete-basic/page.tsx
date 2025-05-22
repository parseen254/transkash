"use client";

import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CenteredCardLayout } from '@/components/layouts/centered-card-layout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PaymentDetailsCard } from '@/components/payment/payment-details-card';
import type { PaymentDetails } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const paymentFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phoneNumber: z.string().min(1, { message: 'Phone number is required.' }),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

// Dummy payment details
const paymentInfo: PaymentDetails = {
  reference: 'RFX456789',
  name: 'SwitchLink Kenya',
  amount: 'KES 1,250.00',
  date: '2023-10-28',
};

const CompletePaymentBasicPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
    },
  });

  const onSubmit = async (data: PaymentFormValues) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Payment completion data:', data);
    // Simulate payment success/failure
    const isSuccess = Math.random() > 0.3; // 70% chance of success
    if (isSuccess) {
      toast({
        title: "Payment Processing",
        description: "Your payment is being processed.",
      });
      router.push('/payment/successful');
    } else {
      router.push('/payment/failed');
    }
  };

  return (
    <CenteredCardLayout title="Complete Your Payment">
      <PaymentDetailsCard details={paymentInfo} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+254 7XX XXX XXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Processing...' : 'Complete Payment'}
          </Button>
        </form>
      </Form>
    </CenteredCardLayout>
  );
};

export default CompletePaymentBasicPage;
