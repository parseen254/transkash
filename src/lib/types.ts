
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
  type: 'bank' | 'mpesa'; // Type of payout account
  accountName: string; // User-defined name for the account (e.g., "My Main KCB") - Nickname
  accountNumber: string; // Actual account number or M-Pesa phone number
  accountHolderName?: string; // Required for M-Pesa, formal name for bank
  bankName?: string; // Required for bank accounts
  bankBranch?: string; // Kept for potential future use, even if not on current form
  bankCode?: string; // Kept for potential future use
  swiftCode?: string; // For international bank transfers
  routingNumber?: string; // For specific banking systems (e.g., US ABA)
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
  payoutAccountId: string; // ID of the payout account - Now required
  shortUrl?: string; // The actual shareable link
  updatedAt?: Timestamp | Date;
  hasExpiry?: boolean;
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
  customer: string; // Payer's name or identifier
  amount: string; // Formatted amount for display
  status: 'Completed' | 'Pending' | 'Failed';
  userId?: string; // User who owns the payment link
  currency?: string;
  linkName?:string; // Name of the payment link used
  purpose?:string; // Purpose of the payment link
  creationDate: Date | Timestamp;
  reference: string; // Transaction reference
  paymentLinkId?: string; // ID of the payment link this transaction is for
}

