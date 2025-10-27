
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
import React, { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Beneficiary, FurpBeneficiaryRequirement } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { countries } from '@/lib/countries';
import { currencies } from '@/lib/currencies';
import { api } from '@/lib/api';

// Base schema with all possible fields, all optional initially
const beneficiarySchemaBase = z.object({
  serviceCode: z.enum(["MOBILETOPUP", "MONEYTRANSFER", "BILLPAYMENT"]),
  collectionMode: z.enum(["MOBILEMONEY", "BANKACCOUNT", "CASH"]),
  legalEntityType: z.enum(["I", "B"]),
  countryIso3: z.string(),
  currencyIso: z.string(),
  providerId: z.string(),
  branchId: z.string().optional().nullable(),
  beneficiaryNickname: z.string().optional().nullable(),
  beneficiaryEmailAddress: z.string().email().optional().nullable(),
  companyName: z.string().optional().nullable(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dob: z.date().optional(),
  gender: z.enum(["M", "F"]).optional(),
  mobileNo: z.string().optional(),
  postcode: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  addressLine2: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  stateOrProvince: z.string().optional().nullable(),
  nationalityCountry: z.string().optional(),
  birthCountry: z.string().optional(),
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

type BeneficiaryFormValues = z.infer<typeof beneficiarySchemaBase>;

const CreateBeneficiaryPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [requirements, setRequirements] = useState<FurpBeneficiaryRequirement[]>([]);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [dynamicSchema, setDynamicSchema] = useState(beneficiarySchemaBase);

  const form = useForm<BeneficiaryFormValues>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      serviceCode: 'MONEYTRANSFER',
      collectionMode: 'BANKACCOUNT',
      legalEntityType: 'I',
      countryIso3: undefined,
      currencyIso: undefined,
      providerId: '',
      branchId: '',
      beneficiaryNickname: '',
      beneficiaryEmailAddress: '',
      companyName: '',
      firstName: '',
      lastName: '',
      addressLine2: '',
      district: '',
      stateOrProvince: '',
      reasonId: '',
      relationId: '',
      sourceOfFundId: '',
      narration: '',
      bankAccountEmail: '',
      branchCode: '',
      ifsc: '',
      aba: '',
      bankAddress: '',
      institutionNo: '',
      bankName: '',
      clabe: '',
      bicSwift: '',
      acctNumber: '',
      sortCode: '',
      iban: '',
      bsbCode: '',
      cnaps: '',
      identificationNumber: '',
      idIssuingCountry: '',
      idIssueDate: '',
      identificationType: '',
      idExpiryDate: '',
      billReferenceNumber: '',
    },
  });

  const { serviceCode, collectionMode, legalEntityType, countryIso3, currencyIso, providerId } = form.watch();

  const fetchRequirements = useCallback(async () => {
    if (!providerId || !countryIso3 || !currencyIso || !legalEntityType || !serviceCode) {
      setRequirements([]);
      return;
    }
    setLoadingRequirements(true);
    try {
      const response = await api.get('/beneficiaries/requirements', {
        params: {
          providerId,
          toCountry: countryIso3,
          toCurrencyCode: currencyIso,
          entityType: legalEntityType,
          ServiceCode: serviceCode,
          collectionMode,
        },
      });
      const reqs = response.data.data || [];
      setRequirements(reqs);

      // Dynamically build schema
      let schema = beneficiarySchemaBase.shape;
      reqs.forEach((req: FurpBeneficiaryRequirement) => {
        if (req.isRequired) {
            const field = req.name as keyof typeof schema;
            if (schema[field]) {
                if(schema[field] instanceof z.ZodString) {
                    (schema[field] as z.ZodString) = (schema[field] as z.ZodString).min(1, `${req.label} is required.`);
                } else if (schema[field] instanceof z.ZodOptional || schema[field] instanceof z.ZodNullable) {
                     // This is tricky; for now, we'll assume string for simplicity.
                     // A real implementation would need to handle types more robustly.
                     schema[field] = z.string().min(1, `${req.label} is required.`) as any;
                }
            }
        }
      });
      setDynamicSchema(z.object(schema));
      
    } catch (error) {
      console.error("Error fetching beneficiary requirements:", error);
      toast({ title: "Error", description: "Failed to fetch beneficiary requirements.", variant: "destructive" });
    } finally {
      setLoadingRequirements(false);
    }
  }, [providerId, countryIso3, currencyIso, legalEntityType, serviceCode, collectionMode, toast]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  useEffect(() => {
    form.reset(undefined, { keepValues: true });
  }, [dynamicSchema, form]);


  const onSubmit = async (data: BeneficiaryFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    try {
      const apiData = {
        ...data,
        userId: user.userId,
        dob: data.dob ? format(data.dob, 'yyyy-MM-dd') : undefined,
      };

      await api.post('/beneficiaries', apiData);

      toast({
        title: "Beneficiary Created!",
        description: `${data.firstName} ${data.lastName} has been added successfully.`,
      });
      router.push('/dashboard/beneficiaries');
    } catch (error: any) {
      console.error("Error creating beneficiary:", error);
      const apiError = error.response?.data?.message || error.message;
      toast({ title: "Error", description: `Failed to create beneficiary: ${apiError}`, variant: "destructive" });
    }
  };

  const isFieldRequired = (fieldName: string) => {
    return requirements.some(req => req.name === fieldName && req.isRequired);
  };
  
  const isFieldVisible = (fieldName: string) => {
     if (['serviceCode', 'collectionMode', 'legalEntityType', 'countryIso3', 'currencyIso', 'providerId'].includes(fieldName)) return true;
     return requirements.some(req => req.name === fieldName && req.isDisplayable);
  };
  
  const getFieldLabel = (fieldName: string, defaultLabel: string) => {
    const req = requirements.find(r => r.name === fieldName);
    return req ? req.label : defaultLabel;
  };

  const renderField = (name: keyof BeneficiaryFormValues, label: string, component: React.ReactNode) => {
    if (!isFieldVisible(name)) return null;
    return (
      <FormItem>
        <FormLabel>{getFieldLabel(name, label)}{isFieldRequired(name) && '*'}</FormLabel>
        {component}
        <FormMessage />
      </FormItem>
    );
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
    const visibleAndRequiredFields = currentFields.filter(f => isFieldVisible(f) && isFieldRequired(f));
    const isValid = await form.trigger(visibleAndRequiredFields);
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
          <CardDescription>Follow the steps to add all required information. Required fields are marked with *</CardDescription>
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
                  {renderField("serviceCode", "Service Type", <Select onValueChange={field => form.setValue("serviceCode", field)} defaultValue={form.getValues("serviceCode")}><FormControl><SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger></FormControl><SelectContent><SelectItem value="MONEYTRANSFER">Money Transfer</SelectItem><SelectItem value="MOBILETOPUP">Mobile Top-up</SelectItem><SelectItem value="BILLPAYMENT">Bill Payment</SelectItem></SelectContent></Select>)}
                  {renderField("collectionMode", "Collection Mode", <Select onValueChange={field => form.setValue("collectionMode", field)} defaultValue={form.getValues("collectionMode")}><FormControl><SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger></FormControl><SelectContent><SelectItem value="BANKACCOUNT">Bank Account</SelectItem><SelectItem value="MOBILEMONEY">Mobile Money</SelectItem><SelectItem value="CASH">Cash Pickup</SelectItem></SelectContent></Select>)}
                  {renderField("legalEntityType", "Legal Entity", <Select onValueChange={field => form.setValue("legalEntityType", field)} defaultValue={form.getValues("legalEntityType")}><FormControl><SelectTrigger><SelectValue placeholder="Select entity type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="I">Individual</SelectItem><SelectItem value="B">Business</SelectItem></SelectContent></Select>)}
                  {renderField("countryIso3", "Country", <Select onValueChange={field => form.setValue("countryIso3", field)}><FormControl><SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger></FormControl><SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select>)}
                  {renderField("currencyIso", "Currency", <Select onValueChange={field => form.setValue("currencyIso", field)}><FormControl><SelectTrigger><SelectValue placeholder="Select a currency" /></SelectTrigger></FormControl><SelectContent>{currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>)}</SelectContent></Select>)}
                  {renderField("providerId", "Provider ID", <FormControl><Input placeholder="Financial provider ID" {...form.register("providerId")} /></FormControl>)}
                </div>
              )}
              {currentStep > 0 && loadingRequirements && <div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading fields...</span></div>}
              {currentStep > 0 && !loadingRequirements && (
                <>
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderField("firstName", "First Name", <FormControl><Input {...form.register("firstName")} /></FormControl>)}
                      {renderField("lastName", "Last Name", <FormControl><Input {...form.register("lastName")} /></FormControl>)}
                      {isFieldVisible("companyName") && form.getValues("legalEntityType") === 'B' && renderField("companyName", "Company Name", <FormControl><Input {...form.register("companyName")} value={form.getValues("companyName") ?? ''} /></FormControl>)}
                      {isFieldVisible("dob") && <FormField control={form.control} name="dob" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>{getFieldLabel("dob", "Date of Birth")}{isFieldRequired("dob") && '*'}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )} />}
                      {renderField("gender", "Gender", <Select onValueChange={field => form.setValue("gender", field)} defaultValue={form.getValues("gender")}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="M">Male</SelectItem><SelectItem value="F">Female</SelectItem></SelectContent></Select>)}
                      {renderField("nationalityCountry", "Nationality", <Select onValueChange={field => form.setValue("nationalityCountry", field)}><FormControl><SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger></FormControl><SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select>)}
                      {renderField("birthCountry", "Country of Birth", <Select onValueChange={field => form.setValue("birthCountry", field)}><FormControl><SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger></FormControl><SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select>)}
                  </div>
                )}
                {currentStep === 2 && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderField("beneficiaryEmailAddress", "Email Address", <FormControl><Input type="email" {...form.register("beneficiaryEmailAddress")} value={form.getValues("beneficiaryEmailAddress") ?? ''} /></FormControl>)}
                      {renderField("mobileNo", "Mobile Number", <FormControl><Input type="tel" {...form.register("mobileNo")} /></FormControl>)}
                      <div className="md:col-span-2">{renderField("address", "Address Line 1", <FormControl><Input {...form.register("address")} /></FormControl>)}</div>
                      <div className="md:col-span-2">{renderField("addressLine2", "Address Line 2", <FormControl><Input {...form.register("addressLine2")} value={form.getValues("addressLine2") ?? ''} /></FormControl>)}</div>
                      {renderField("city", "City", <FormControl><Input {...form.register("city")} /></FormControl>)}
                      {renderField("postcode", "Postal Code", <FormControl><Input {...form.register("postcode")} /></FormControl>)}
                      {renderField("stateOrProvince", "State / Province", <FormControl><Input {...form.register("stateOrProvince")} value={form.getValues("stateOrProvince") ?? ''} /></FormControl>)}
                      {renderField("district", "District", <FormControl><Input {...form.register("district")} value={form.getValues("district") ?? ''} /></FormControl>)}
                  </div>
                )}
                 {currentStep === 3 && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderField("beneficiaryNickname", "Nickname", <FormControl><Input {...form.register("beneficiaryNickname")} value={form.getValues("beneficiaryNickname") ?? ''} /></FormControl>)}
                      {renderField("bankName", "Bank Name", <FormControl><Input {...form.register("bankName")} value={form.getValues("bankName") ?? ''} /></FormControl>)}
                      {renderField("acctNumber", "Account Number", <FormControl><Input {...form.register("acctNumber")} value={form.getValues("acctNumber") ?? ''} /></FormControl>)}
                      {renderField("iban", "IBAN", <FormControl><Input {...form.register("iban")} value={form.getValues("iban") ?? ''} /></FormControl>)}
                      {renderField("bicSwift", "SWIFT / BIC", <FormControl><Input {...form.register("bicSwift")} value={form.getValues("bicSwift") ?? ''} /></FormControl>)}
                      {renderField("sortCode", "Sort Code (UK)", <FormControl><Input {...form.register("sortCode")} value={form.getValues("sortCode") ?? ''} /></FormControl>)}
                      {renderField("ifsc", "IFSC (India)", <FormControl><Input {...form.register("ifsc")} value={form.getValues("ifsc") ?? ''} /></FormControl>)}
                      {renderField("aba", "ABA Routing (US)", <FormControl><Input {...form.register("aba")} value={form.getValues("aba") ?? ''} /></FormControl>)}
                  </div>
                )}
                {currentStep === 4 && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderField("identificationType", "ID Type", <FormControl><Input placeholder="e.g., Passport" {...form.register("identificationType")} value={form.getValues("identificationType") ?? ''} /></FormControl>)}
                      {renderField("identificationNumber", "ID Number", <FormControl><Input {...form.register("identificationNumber")} value={form.getValues("identificationNumber") ?? ''} /></FormControl>)}
                      {renderField("idIssuingCountry", "ID Issuing Country", <Select onValueChange={field => form.setValue("idIssuingCountry", field)} defaultValue={form.getValues("idIssuingCountry") ?? ''}><FormControl><SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger></FormControl><SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select>)}
                      {renderField("idIssueDate", "ID Issue Date", <FormControl><Input type="date" {...form.register("idIssueDate")} value={form.getValues("idIssueDate") ?? ''} /></FormControl>)}
                      {renderField("idExpiryDate", "ID Expiry Date", <FormControl><Input type="date" {...form.register("idExpiryDate")} value={form.getValues("idExpiryDate") ?? ''} /></FormControl>)}
                  </div>
                )}
                </>
              )}

              <div className="flex justify-between mt-8">
                {currentStep > 0 && <Button type="button" variant="outline" onClick={prevStep}>Previous</Button>}
                <div />
                {currentStep < steps.length - 1 && <Button type="button" onClick={nextStep} disabled={loadingRequirements}>Next</Button>}
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
