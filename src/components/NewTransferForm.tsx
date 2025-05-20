
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Smartphone, User, Mail, Send } from 'lucide-react';
import { initiateTransfer, InitiateTransferState } from '@/lib/actions';
import { useFormState } from 'react-dom';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const kenyanPhoneNumberRegex = /^\+254\d{9}$/; // Example: +2547XXXXXXXX

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }).min(50, {message: 'Minimum amount is KES 50.'}),
  recipientPhone: z.string().regex(kenyanPhoneNumberRegex, { message: 'Invalid Kenyan phone number. Format: +254XXXXXXXXX' }),
  senderName: z.string().min(2, {message: 'Sender name must be at least 2 characters.'}),
  senderEmail: z.string().email({message: 'Invalid sender email address.'}),
});

export default function NewTransferForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [state, formAction] = useFormState<InitiateTransferState | undefined, FormData>(initiateTransfer, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '', // Changed from undefined to empty string
      recipientPhone: '',
      senderName: '',
      senderEmail: '',
    },
  });

  useEffect(() => {
    if (state?.message && !state.errors) {
      toast({
        title: state.transactionId ? "Transfer Initiated" : "Notice",
        description: state.message,
        variant: state.transactionId ? "default" : "default",
      });
      if (state.transactionId) {
        // Redirect to Stripe simulation / status page
        // This will be a redirect to Stripe in a real app.
        // For now, redirect to our status page.
        router.push(`/dashboard/transfer/status/${state.transactionId}?stripe_sim=true`);
        form.reset(); // Reset form on successful initiation
      }
    } else if (state?.message && state.errors) {
       toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast, router, form]);


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <Send className="mr-2 h-6 w-6 text-primary" />
          Create New Transfer
        </CardTitle>
        <CardDescription>
          Enter the amount and recipient&apos;s MPESA phone number. All payments are processed securely via Stripe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form ref={formRef} action={formAction} className="space-y-6">
            <FormField
              control={form.control}
              name="senderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input placeholder="e.g. John Doe" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="senderEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Email</FormLabel>
                  <FormControl>
                     <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input type="email" placeholder="e.g. john.doe@example.com" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormDescription>Used for payment confirmation and receipts.</FormDescription>
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
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input type="number" placeholder="e.g. 1000" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormDescription>Minimum transfer amount is KES 50.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recipientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient&apos;s MPESA Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input placeholder="+254712345678" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormDescription>Must be a valid Kenyan Safaricom number (e.g., +2547XXXXXXXX).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {state?.errors?.general && (
              <FormMessage>{state.errors.general.join(', ')}</FormMessage>
            )}
            <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-shadow" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
