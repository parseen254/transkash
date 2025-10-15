

"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import * as z from 'zod';
import { ArrowLeft, CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Beneficiary } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { countries } from '@/lib/countries';
import { currencies } from '@/lib/currencies';

const beneficiarySchema = z.object({
  serviceCode: z.enum(["MOBILETOPUP", "MONEYTRANSFER", "BILLPAYMENT"]),
  collectionMode: z.enum(["MOBILEMONEY", "BANKACCOUNT", "CASH"]),
  legalEntityType: z.enum(["I", "B"]),
  countryIso3: z.string().length(3, "Must be a 3-letter country code"),
  currencyIso: z.string().length(3, "Must be a 3-letter currency code"),
  providerId: z.string().min(1, "Provider ID is required"),
  branchId: z.string().optional().nullable(),
  beneficiaryNickname: z.string().optional().nullable(),
  beneficiaryEmailAddress: z.string().email().optional().nullable(),
  companyName: z.string().optional().nullable(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["M", "F"]),
  mobileNo: z.string().min(1, "Mobile number is required"),
  postcode: z.string().min(1, "Postal code is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  stateOrProvince: z.string().optional().nullable(),
  nationalityCountry: z.string().min(1, "Nationality is required"),
  birthCountry: z.string().min(1, "Country of birth is required"),
  reasonId: z.string().optional().nullable(),
  relationId: z.string().optional().nullable(),
  sourceOfFundId: z.string().optional().nullable(),
  narration: z.string().optional().nullable(),
  bankAccountEmail: z.string().email().optional().nullable(),
  branchCode: z.string().optional().nullable(),
  ifsc: z.string().optional().nullable(),
  aba: z.string().optional().nullable(),
  bankAddress: z.string().optional().nullable(),
  institutionNo: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  clabe: z.string().optional().nullable(),
  bicSwift: z.string().optional().nullable(),
  acctNumber: z.string().optional().nullable(),
  sortCode: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  bsbCode: z.string().optional().nullable(),
  cnaps: z.string().optional().nullable(),
  identificationNumber: z.string().optional().nullable(),
  idIssuingCountry: z.string().optional().nullable(),
  idIssueDate: z.string().optional().nullable(),
  identificationType: z.string().optional().nullable(),
  idExpiryDate: z.string().optional().nullable(),
  billReferenceNumber: z.string().optional().nullable(),
});

type BeneficiaryFormValues = z.infer<typeof beneficiarySchema>;

const CreateBeneficiaryPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<BeneficiaryFormValues>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      serviceCode: 'MONEYTRANSFER',
      collectionMode: 'BANKACCOUNT',
      legalEntityType: 'I',
    },
  });

  const onSubmit = async (data: BeneficiaryFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    try {
      const newBeneficiaryData: Omit<Beneficiary, 'id'> = {
        userId: user.uid,
        ...data,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await addDoc(collection(db, 'beneficiaries'), newBeneficiaryData);

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

  const steps = [
    { name: "General", fields: ["serviceCode", "collectionMode", "legalEntityType", "countryIso3", "currencyIso", "providerId"] },
    { name: "Personal", fields: ["firstName", "lastName", "companyName", "dob", "gender", "nationalityCountry", "birthCountry"] },
    { name: "Contact & Address", fields: ["beneficiaryEmailAddress", "mobileNo", "address", "addressLine2", "city", "postcode", "stateOrProvince", "district"] },
    { name: "Financial", fields: ["beneficiaryNickname", "bankName", "acctNumber", "iban", "bicSwift", "sortCode", "ifsc", "aba", "bsbCode", "cnaps", "clabe", "institutionNo", "branchCode", "bankAddress", "bankAccountEmail"] },
    { name: "Identification", fields: ["identificationType", "identificationNumber", "idIssuingCountry", "idIssueDate", "idExpiryDate"] },
  ];

  const nextStep = async () => {
    const currentFields = steps[currentStep].fields as (keyof BeneficiaryFormValues)[];
    const isValid = await form.trigger(currentFields);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/beneficiaries">
        <Button variant="link" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4 px-0">
          <ArrowLeft className="h-4 w-4" />
          Back to Beneficiaries
        </Button>
      </Link>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Create a new Beneficiary</CardTitle>
          <CardDescription>Follow the steps to add all required information.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stepper */}
          <div className="mb-8 flex justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={cn("rounded-full h-8 w-8 flex items-center justify-center text-white", currentStep > index ? "bg-green-500" : currentStep === index ? "bg-primary" : "bg-muted-foreground")}>
                  {index + 1}
                </div>
                <div className={cn("ml-2 font-medium", currentStep === index ? "text-primary" : "text-muted-foreground")}>{step.name}</div>
              </div>
            ))}
          </div>

          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="serviceCode" render={({ field }) => ( <FormItem> <FormLabel>Service Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger></FormControl><SelectContent><SelectItem value="MONEYTRANSFER">Money Transfer</SelectItem><SelectItem value="MOBILETOPUP">Mobile Top-up</SelectItem><SelectItem value="BILLPAYMENT">Bill Payment</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                  <FormField control={form.control} name="collectionMode" render={({ field }) => ( <FormItem> <FormLabel>Collection Mode</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger></FormControl><SelectContent><SelectItem value="BANKACCOUNT">Bank Account</SelectItem><SelectItem value="MOBILEMONEY">Mobile Money</SelectItem><SelectItem value="CASH">Cash Pickup</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                  <FormField control={form.control} name="legalEntityType" render={({ field }) => ( <FormItem> <FormLabel>Legal Entity</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select entity type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="I">Individual</SelectItem><SelectItem value="B">Business</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                  <FormField control={form.control} name="countryIso3" render={({ field }) => ( <FormItem> <FormLabel>Country</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger></FormControl><SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                  <FormField control={form.control} name="currencyIso" render={({ field }) => ( <FormItem> <FormLabel>Currency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a currency" /></SelectTrigger></FormControl><SelectContent>{currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                  <FormField control={form.control} name="providerId" render={({ field }) => ( <FormItem> <FormLabel>Provider ID</FormLabel> <FormControl><Input placeholder="Financial provider ID" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                </div>
              )}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem> <FormLabel>First Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem> <FormLabel>Last Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    {form.getValues("legalEntityType") === 'B' && <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem> <FormLabel>Company Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>}
                    <FormField control={form.control} name="dob" render={({ field }) => ( <FormItem> <FormLabel>Date of Birth</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="gender" render={({ field }) => ( <FormItem> <FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="M">Male</SelectItem><SelectItem value="F">Female</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                    <FormField control={form.control} name="nationalityCountry" render={({ field }) => ( <FormItem> <FormLabel>Nationality</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger></FormControl><SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                    <FormField control={form.control} name="birthCountry" render={({ field }) => ( <FormItem> <FormLabel>Country of Birth</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger></FormControl><SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                </div>
              )}
              {currentStep === 2 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="beneficiaryEmailAddress" render={({ field }) => ( <FormItem> <FormLabel>Email Address</FormLabel> <FormControl><Input type="email" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="mobileNo" render={({ field }) => ( <FormItem> <FormLabel>Mobile Number</FormLabel> <FormControl><Input type="tel" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="address" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel>Address Line 1</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="addressLine2" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel>Address Line 2</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="city" render={({ field }) => ( <FormItem> <FormLabel>City</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="postcode" render={({ field }) => ( <FormItem> <FormLabel>Postal Code</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="stateOrProvince" render={({ field }) => ( <FormItem> <FormLabel>State / Province</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="district" render={({ field }) => ( <FormItem> <FormLabel>District</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                </div>
              )}
               {currentStep === 3 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="beneficiaryNickname" render={({ field }) => ( <FormItem> <FormLabel>Nickname</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="bankName" render={({ field }) => ( <FormItem> <FormLabel>Bank Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="acctNumber" render={({ field }) => ( <FormItem> <FormLabel>Account Number</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="iban" render={({ field }) => ( <FormItem> <FormLabel>IBAN</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="bicSwift" render={({ field }) => ( <FormItem> <FormLabel>SWIFT / BIC</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="sortCode" render={({ field }) => ( <FormItem> <FormLabel>Sort Code (UK)</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="ifsc" render={({ field }) => ( <FormItem> <FormLabel>IFSC (India)</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="aba" render={({ field }) => ( <FormItem> <FormLabel>ABA Routing (US)</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                </div>
              )}
              {currentStep === 4 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="identificationType" render={({ field }) => ( <FormItem> <FormLabel>ID Type</FormLabel> <FormControl><Input placeholder="e.g., Passport" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="identificationNumber" render={({ field }) => ( <FormItem> <FormLabel>ID Number</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="idIssuingCountry" render={({ field }) => ( <FormItem> <FormLabel>ID Issuing Country</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger></FormControl><SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                    <FormField control={form.control} name="idIssueDate" render={({ field }) => ( <FormItem> <FormLabel>ID Issue Date</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="idExpiryDate" render={({ field }) => ( <FormItem> <FormLabel>ID Expiry Date</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                </div>
              )}

              <div className="flex justify-between mt-8">
                {currentStep > 0 && <Button type="button" variant="outline" onClick={prevStep}>Previous</Button>}
                <div />
                {currentStep < steps.length - 1 && <Button type="button" onClick={nextStep}>Next</Button>}
                {currentStep === steps.length - 1 && (
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Beneficiary'}
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateBeneficiaryPage;

    

    