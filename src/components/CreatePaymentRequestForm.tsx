
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
import { Textarea } from '@/components/ui/textarea';
import { CardContent } from '@/components/ui/card';
import { DollarSign, Smartphone, FileText, Link2, Loader2, Copy, Check } from 'lucide-react';
import { createPaymentRequest, type CreatePaymentRequestState } from '@/lib/actions';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const kenyanPhoneNumberRegex = /^\+254\d{9}$/;

const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive.").min(10, "Minimum amount is KES 10."),
  description: z.string().max(200, "Description cannot exceed 200 characters.").optional(),
  recipientMpesaNumber: z.string().regex(kenyanPhoneNumberRegex, "Invalid Kenyan MPESA number (e.g., +2547XXXXXXXXX)."),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreatePaymentRequestForm() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [formSubmissionState, setFormSubmissionState] = useState<CreatePaymentRequestState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined, // Will be string due to input, Zod coerces
      description: '',
      recipientMpesaNumber: '',
    },
  });

  useEffect(() => {
    // If user is signed in, prefill their Mpesa number if available from settings (future enhancement)
    // For now, we'll let them input it.
  }, [user]);

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be signed in to create a payment request.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setFormSubmissionState(null);
    setShowSuccessMessage(false);
    setGeneratedLink(null);

    const dataWithUserId = {
      ...values,
      userId: user.uid,
      currency: 'KES', // Hardcoding KES for now
    };

    const result = await createPaymentRequest(dataWithUserId);
    setFormSubmissionState(result);
    setIsSubmitting(false);

    if (result.success && result.paymentRequestLink) {
      toast({
        title: "Payment Request Created!",
        description: result.message || "Share the link with your sender.",
      });
      setShowSuccessMessage(true);
      setGeneratedLink(result.paymentRequestLink);
      form.reset();
    } else {
      toast({
        title: "Creation Failed",
        description: result.message || "Please check your inputs and try again.",
        variant: "destructive",
      });
       if (result.errors) {
        if (result.errors.amount) form.setError("amount", { type: "server", message: result.errors.amount.join(', ')});
        if (result.errors.description) form.setError("description", { type: "server", message: result.errors.description.join(', ')});
        if (result.errors.recipientMpesaNumber) form.setError("recipientMpesaNumber", { type: "server", message: result.errors.recipientMpesaNumber.join(', ')});
      }
    }
  };

  const handleCopyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink).then(() => {
        setCopied(true);
        toast({ title: "Link Copied!"});
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        toast({ title: "Failed to copy", description: "Could not copy link to clipboard.", variant: "destructive"});
      });
    }
  };

  if (authLoading) {
    return (
      <CardContent className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    );
  }

  if (showSuccessMessage && generatedLink) {
    return (
      <CardContent className="space-y-6 text-center py-10">
        <Check className="h-16 w-16 text-green-500 mx-auto" />
        <h3 className="text-2xl font-semibold">Payment Request Created!</h3>
        <p className="text-muted-foreground">Share this link with the person you want to request payment from:</p>
        <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
          <Link href={generatedLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex-grow">
            {generatedLink}
          </Link>
          <Button variant="ghost" size="icon" onClick={handleCopyToClipboard} title="Copy link">
            {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
          </Button>
        </div>
        <Button onClick={() => { setShowSuccessMessage(false); setGeneratedLink(null); }} variant="outline">
          Create Another Request
        </Button>
         <Link href="/dashboard/payment-requests">
          <Button variant="link">View All Requests</Button>
        </Link>
      </CardContent>
    );
  }


  return (
    <CardContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (KES)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="number" placeholder="e.g. 1000" {...field} className="pl-10" onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                  </div>
                </FormControl>
                <FormDescription>The amount you are requesting in KES. Minimum KES 10.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recipientMpesaNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your MPESA Number (for receiving funds)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="+2547XXXXXXXX" {...field} className="pl-10" />
                  </div>
                </FormControl>
                <FormDescription>The MPESA number where you will receive the payment.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Textarea placeholder="e.g., Payment for project X, Lunch contribution" {...field} className="pl-10 min-h-[80px]" />
                  </div>
                </FormControl>
                <FormDescription>A short note for the sender (max 200 characters).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {formSubmissionState?.errors?.general && (
            <FormMessage>{formSubmissionState.errors.general.join(', ')}</FormMessage>
          )}
          <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-shadow" disabled={isSubmitting || authLoading || !user}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Generating Link...' : 'Generate Payment Link'}
          </Button>
          {!user && !authLoading && <p className="text-sm text-destructive text-center mt-2">Please sign in to create a payment request.</p>}
        </form>
      </Form>
    </CardContent>
  );
}
