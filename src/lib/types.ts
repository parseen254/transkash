
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
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
  lastLoginAt?: Timestamp | string;
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
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export interface PaymentLink {
  id: string;
  userId: string;
  linkName: string;
  reference: string;
  amount: number;
  currency: string;
  purpose: string;
  payoutAccountId: string;
  creationDate: Timestamp | null;
  expiryDate: Timestamp | null;
  status: 'Active' | 'Inactive' | 'Paid' | 'Expired' | 'Disabled';
  shortUrl: string;
  hasExpiry: boolean;
  updatedAt?: Timestamp;
  creatorUserId?: string;
}export interface Transaction {
  id: string; 
  userId: string; 
  paymentLinkId: string;
  date: Timestamp | string; 
  customer: string; 
  customerEmail?: string;
  customerPhone?: string;
  amount: number; 
  currency: string;
  status: 'Completed' | 'Pending' | 'Failed';
  reference: string; 
  method?: 'mpesa_stk' | 'mpesa_paybill' | 'card';
  // MITO-specific fields
  mitoReference?: string; // Reference returned by MITO
  mitoTransactionId?: string; // Transaction ID from MITO
  mitoStatus?: 'PROCESSED' | 'AWAITINGAFFILIATEUPDATE' | 'INREVIEW' | 'FAILED' | 'CANCELLED' | 'INPROGRESS' | 'NEW';
  mitoPaymentUrl?: string; // Hosted payment page URL
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export interface Beneficiary {
  id: string;
  beneficiaryId?: string; // from API
  userId: string;
  serviceCode: "MOBILETOPUP" | "MONEYTRANSFER" | "BILLPAYMENT";
  collectionMode: "MOBILEMONEY" | "BANKACCOUNT" | "CASH";
  legalEntityType: "I" | "B" | "Individual" | "Business"; // Allow both short and long form
  countryIso3: string;
  currencyIso: string;
  providerId: string;
  branchId?: string | null;
  beneficiaryNickname?: string | null;
  beneficiaryEmailAddress?: string | null;
  companyName?: string | null;
  firstName: string;
  lastName: string;
  dob?: string | Date | null;
  gender?: "M" | "F" | null;
  mobileNo?: string | null;
  postcode?: string | null;
  city?: string | null;
  address?: string | null;
  addressLine2?: string | null;
  district?: string | null;
  stateOrProvince?: string | null;
  nationalityCountry?: string | null;
  birthCountry?: string | null;
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
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
}

// Types from Furp API Spec
export interface FurpLoginResponse {
  data: {
    token: string;
    issuedOn: string;
    expiresOn: string;
    refreshToken: string;
  };
  message: string;
  code: number;
  responseType: string;
}

export interface FurpUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  countryIso3: string;
  phoneNumber: string;
  middleName?: string;
  legalEntityType: 'I' | 'B';
  created_at: string;
}

export interface FurpBeneficiaryRequirement {
  label: string;
  name: string;
  order: number;
  type: string;
  format: string | null;
  columnDataType: string;
  isRequired: boolean;
  isDisplayable: boolean;
  fieldInformation: string | null;
  dropdownOptions: { name: string; id: string }[] | null;
}
