
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
import { DollarSign, Smartphone, User, Mail, Send, Loader2 } from 'lucide-react';
import { initiateTransfer } from '@/lib/actions';
import type { InitiateTransferState } from '@/lib/actions';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const kenyanPhoneNumberRegex = /^\+254\d{9}$/;

// Schema for form validation without userId (will be added before calling action)
const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }).min(50, {message: 'Minimum amount is KES 50.'}),
  recipientPhone: z.string().regex(kenyanPhoneNumberRegex, { message: 'Invalid Kenyan phone number. Format: +254XXXXXXXXX' }),
  senderName: z.string().min(2, {message: 'Sender name must be at least 2 characters.'}),
  senderEmail: z.string().email({message: 'Invalid sender email address.'}),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewTransferForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formSubmissionState, setFormSubmissionState] = useState<InitiateTransferState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      recipientPhone: '',
      senderName: '',
      senderEmail: '',
    },
  });
  
  // Populate sender name and email from authenticated user if available
  useEffect(() => {
    if (user) {
      form.setValue('senderName', user.displayName || '');
      form.setValue('senderEmail', user.email || '');
    }
  }, [user, form]);


  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be signed in to initiate a transfer.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setFormSubmissionState(null);

    const dataWithUserId = { ...values, userId: user.uid };
    const result = await initiateTransfer(dataWithUserId);
    setFormSubmissionState(result);
    setIsSubmitting(false);

    if (result.success && result.transactionId) {
      toast({
        title: "Transfer Initiated",
        description: result.message || "Redirecting to payment...",
      });
      router.push(`/dashboard/transfer/status/${result.transactionId}?stripe_sim=true`);
      form.reset();
    } else {
      toast({
        title: "Transfer Initiation Failed",
        description: result.message || "Please check your inputs and try again.",
        variant: "destructive",
      });
      // Potentially set form errors if result.errors exists
      if (result.errors) {
        if (result.errors.amount) form.setError("amount", { type: "server", message: result.errors.amount.join(', ')});
        if (result.errors.recipientPhone) form.setError("recipientPhone", { type: "server", message: result.errors.recipientPhone.join(', ')});
        if (result.errors.senderName) form.setError("senderName", { type: "server", message: result.errors.senderName.join(', ')});
        if (result.errors.senderEmail) form.setError("senderEmail", { type: "server", message: result.errors.senderEmail.join(', ')});
        // General errors can be displayed separately or via toast
      }
    }
  };

  if (authLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Send className="mr-2 h-6 w-6 text-primary" />
            Create New Transfer
          </CardTitle>
          <CardDescription>Loading user information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="senderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input placeholder="e.g. John Doe" {...field} className="pl-10" disabled={authLoading || !!user?.displayName} />
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
                      <Input type="email" placeholder="e.g. john.doe@example.com" {...field} className="pl-10" disabled={authLoading || !!user?.email} />
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
            {formSubmissionState?.errors?.general && (
              <FormMessage>{formSubmissionState.errors.general.join(', ')}</FormMessage>
            )}
            <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-shadow" disabled={isSubmitting || authLoading || !user}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
            </Button>
            {!user && !authLoading && <p className="text-sm text-destructive text-center mt-2">Please sign in to make a transfer.</p>}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
