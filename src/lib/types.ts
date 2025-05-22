
import type { Timestamp } from 'firebase/firestore';

export type ThemePreference = "light" | "dark" | "system";

export interface UserProfile {
  uid: string;
  email: string | null; // Firebase Auth email (login email)
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  personalPhone?: string; 
  photoURL?: string | null;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  lastLoginAt?: Timestamp | Date;
  provider?: string; // e.g., 'password', 'google.com'
  themePreference?: ThemePreference;

  // Business Profile Fields
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessWebsite?: string;
}


export interface PayoutAccount {
  id: string; // Firestore document ID
  userId?: string; // Belongs to which user
  accountName: string;
  accountNumber: string; // Should be stored securely, consider masking for display
  bankName: string;
  bankBranch?: string;
  bankCode?: string;
  bankSwiftCode?: string;
  status: 'Active' | 'Pending' | 'Disabled';
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface PaymentLink {
  id: string; // Firestore document ID
  userId?: string; // Belongs to which user
  linkName: string;
  reference: string;
  amount: string; // Consider storing as number (e.g. cents) for precision
  currency?: string; // e.g., KES, USD
  purpose: string;
  creationDate: string | Timestamp | Date; // Allow string for dummy data, Firestore for real
  expiryDate?: string | Timestamp | Date; // Optional
  status: 'Active' | 'Expired' | 'Disabled' | 'Paid';
  payoutAccountId?: string; // ID of the payout account
  payoutAccount?: string; // TEMPORARY for edit form, should be ID
  shortUrl?: string; // The actual shareable link
  updatedAt?: Timestamp | Date;
}

export interface PaymentDetails {
  reference: string;
  name: string; // Recipient/Merchant Name
  amount: string; // Formatted amount with currency
  date: string; // Formatted date string
  status?: 'Successful' | 'Failed' | 'Pending';
  paymentReason?: string; // Optional reason for failure/status
}

export interface Transaction {
  id: string;
  date: string; // Formatted date string for display
  customer: string;
  amount: string; // Formatted amount for display
  status: 'Completed' | 'Pending' | 'Failed';
  userId: string;
  currency: string;
  linkName:string;
  purpose:string;
  creationDate: Date | Timestamp;
  reference: string;
}
