
import type { Timestamp } from 'firebase/firestore';

export type ThemePreference = "light" | "dark" | "system";

export interface UserProfile {
  uid: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  personalPhone?: string;
  photoURL?: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastLoginAt?: Timestamp;
  provider?: string;
  themePreference?: ThemePreference;
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessWebsite?: string;
}

export interface PayoutAccount {
  id: string; 
  userId: string;
  type: 'bank' | 'mpesa';
  accountName: string; 
  accountNumber: string; 
  accountHolderName: string; 
  bankName?: string; 
  routingNumber?: string; 
  swiftCode?: string; 
  status: 'Active' | 'Pending' | 'Disabled';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface PaymentLink {
  id: string; 
  userId: string;
  creatorUserId?: string;
  linkName: string;
  reference: string;
  amount: number; // Store as number
  currency: string; 
  purpose: string;
  creationDate: Timestamp;
  expiryDate?: Timestamp | null; 
  status: 'Active' | 'Expired' | 'Disabled' | 'Paid';
  payoutAccountId: string; 
  shortUrl: string; 
  hasExpiry: boolean;
  updatedAt?: Timestamp;
}

export interface Transaction {
  id: string; 
  userId: string; // The ID of the user who created the payment link
  paymentLinkId: string;
  date: Timestamp; 
  customer: string; 
  amount: number; 
  currency: string;
  status: 'Completed' | 'Pending' | 'Failed';
  reference: string; 
  method?: 'mpesa_stk' | 'mpesa_paybill' | 'card';
  createdAt: Timestamp;
}

export interface Beneficiary {
  id: string;
  userId: string;
  serviceCode: "MOBILETOPUP" | "MONEYTRANSFER" | "BILLPAYMENT";
  collectionMode: "MOBILEMONEY" | "BANKACCOUNT" | "CASH";
  legalEntityType: "I" | "B";
  countryIso3: string;
  currencyIso: string;
  providerId: string;
  branchId?: string | null;
  beneficiaryNickname?: string | null;
  beneficiaryEmailAddress?: string | null;
  companyName?: string | null;
  firstName: string;
  lastName: string;
  dob: string;
  gender: "M" | "F";
  mobileNo: string;
  postcode: string;
  city: string;
  address: string;
  addressLine2?: string | null;
  district?: string | null;
  stateOrProvince?: string | null;
  nationalityCountry: string;
  birthCountry: string;
  reasonId?: string | null;
  relationId?: string | null;
  sourceOfFundId?: string | null;
  narration?: string | null;
  bankAccountEmail?: string | null;
  branchCode?: string | null;
  ifsc?: string | null;
  aba?: string | null;
  bankAddress?: string | null;
  institutionNo?: string | null;
  bankName?: string | null;
  clabe?: string | null;
  bicSwift?: string | null;
  acctNumber?: string | null;
  sortCode?: string | null;
  iban?: string | null;
  bsbCode?: string | null;
  cnaps?: string | null;
  identificationNumber?: string | null;
  idIssuingCountry?: string | null;
  idIssueDate?: string | null;
  identificationType?: string | null;
  idExpiryDate?: string | null;
  billReferenceNumber?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


export interface PublicPaymentLinkDetails extends Omit<PaymentLink, 'userId' | 'payoutAccountId' | 'updatedAt' | 'creationDate' | 'expiryDate' | 'amount' | 'status'> {
  amount: string | number; // More flexible for display
  status: string; // More flexible for display
  creationDate: string | Date | Timestamp;
  expiryDate?: string | Date | Timestamp | null;
}


export interface PaymentOutcomeDetails {
  linkName?: string; 
  orderReference?: string; 
  purpose?: string; 
  amountPaid?: string; 
  currency?: string; 
  paidOn?: string; 
  failureReason?: string; 
}
