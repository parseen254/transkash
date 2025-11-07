
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import React from 'react';
import { countries } from '@/lib/countries';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// Simplified beneficiary schema for Firestore storage
const beneficiarySchema = z.object({
  beneficiaryNickname: z.string().min(1, 'Nickname is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  beneficiaryEmailAddress: z.string().email('Invalid email').optional().or(z.literal('')),
  mobileNo: z.string().optional(),
  collectionMode: z.enum(['MOBILEMONEY', 'BANKACCOUNT']),
  countryIso3: z.string().min(1, 'Country is required'),
  
  // Bank details (for BANKACCOUNT mode)
  bankName: z.string().optional(),
  acctNumber: z.string().optional(),
  bankCode: z.string().optional(), // Sort code, SWIFT, etc.
  
  // Mobile money details (for MOBILEMONEY mode)
  mobileMoneyProvider: z.string().optional(),
});

type BeneficiaryFormValues = z.infer<typeof beneficiarySchema>;

const CreateBeneficiaryPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<BeneficiaryFormValues>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      beneficiaryNickname: '',
      firstName: '',
      lastName: '',
      beneficiaryEmailAddress: '',
      mobileNo: '',
      collectionMode: 'BANKACCOUNT',
      countryIso3: '',
      bankName: '',
      acctNumber: '',
      bankCode: '',
      mobileMoneyProvider: '',
    },
  });

  const collectionMode = form.watch('collectionMode');

  const onSubmit = async (data: BeneficiaryFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    try {
      await addDoc(collection(db, 'beneficiaries'), {
        ...data,
        userId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast({
        title: "Beneficiary Created!",
        description: `${data.firstName} ${data.lastName} has been added successfully.`,
      });
      router.push('/dashboard/beneficiaries');
    } catch (error: any) {
      console.error("Error creating beneficiary:", error);
      toast({ title: "Error", description: `Failed to create beneficiary: ${error.message}`, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/beneficiaries">
        <Button variant="link" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4 px-0">
          <ArrowLeft className="h-4 w-4" />
          Back to Beneficiaries
        </Button>
      </Link>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add Beneficiary for Offline Settlement</CardTitle>
          <CardDescription>
            Add bank or mobile money account details for manual payout settlement. 
            These are stored for compliance and offline processing only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="beneficiaryNickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nickname *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John's M-Pesa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="collectionMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BANKACCOUNT">Bank Account</SelectItem>
                          <SelectItem value="MOBILEMONEY">Mobile Money</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="beneficiaryEmailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobileNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+254..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="countryIso3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map(c => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {collectionMode === 'BANKACCOUNT' && (
                  <>
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Equity Bank" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="acctNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Code / SWIFT</FormLabel>
                          <FormControl>
                            <Input placeholder="Branch code, SWIFT, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {collectionMode === 'MOBILEMONEY' && (
                  <FormField
                    control={form.control}
                    name="mobileMoneyProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Money Provider</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., M-Pesa, Airtel Money" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/beneficiaries')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    'Create Beneficiary'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateBeneficiaryPage;
