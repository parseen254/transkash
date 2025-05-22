
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const bankAccountSchema = z.object({
  accountName: z.string().min(1, { message: 'Account name is required.' }),
  accountNumber: z.string().min(1, { message: 'Account number is required.' }).regex(/^\d+$/, "Account number must be numeric."),
  bankName: z.string().min(1, { message: 'Bank name is required.' }),
  bankBranch: z.string().optional(),
  // bankCode: z.string().optional(), // Removed as per simpler design
  // bankSwiftCode: z.string().optional(), // Removed as per simpler design
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

// Dummy data for bank names - in a real app, this might come from an API or be more extensive
const KCB_BANK = { id: 'kcb', name: 'KCB Bank Kenya' };
const EQUITY_BANK = { id: 'equity', name: 'Equity Bank Kenya' };
const COOP_BANK = { id: 'coop', name: 'Co-operative Bank of Kenya' };
const STANBIC_BANK = { id: 'stanbic', name: 'Stanbic Bank Kenya' };
const STANCHART_BANK = { id: 'stanchart', name: 'Standard Chartered Bank Kenya' };
const ABSA_BANK = { id: 'absa', name: 'Absa Bank Kenya' };
const DTB_BANK = { id: 'dtb', name: 'Diamond Trust Bank Kenya' };
const NCBA_BANK = { id: 'ncba', name: 'NCBA Bank Kenya' };

const popularBanks = [
    KCB_BANK, EQUITY_BANK, COOP_BANK, STANBIC_BANK, STANCHART_BANK, ABSA_BANK, DTB_BANK, NCBA_BANK
];


const AddBankAccountPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      bankBranch: '',
    },
  });

  const onSubmit = async (data: BankAccountFormValues) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Bank account data:', data);
    toast({
      title: "Bank Account Added",
      description: `${data.accountName} (${data.bankName}) has been added successfully.`,
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
          <CardTitle>Add Bank Account</CardTitle>
          <CardDescription>Provide details for your new bank payout account.</CardDescription>
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
                      <Input placeholder="e.g., My Business Checking" {...field} />
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
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a bank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {popularBanks.map(bank => (
                           <SelectItem key={bank.id} value={bank.name}>{bank.name}</SelectItem>
                        ))}
                         <SelectItem value="Other">Other (Specify Below)</SelectItem>
                      </SelectContent>
                    </Select>
                     {form.watch('bankName') === 'Other' && (
                       <FormControl className="mt-2">
                         <Input placeholder="Specify bank name" {...field} />
                       </FormControl>
                     )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankBranch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Branch (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Nairobi Main" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Adding...' : 'Add Bank Account'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddBankAccountPage;
