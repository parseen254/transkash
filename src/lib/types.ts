
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
  createdAt?: Timestamp; // Firestore timestamp
  updatedAt?: Timestamp; // Firestore timestamp
  lastLoginAt?: Timestamp; // Firestore timestamp
  provider?: string;
  themePreference?: ThemePreference;
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessWebsite?: string;
}

export interface PayoutAccount {
  id: string; // Firestore document ID
  userId: string;
  type: 'bank' | 'mpesa';
  accountName: string; // User-defined nickname
  accountNumber: string; // Actual account number or M-Pesa phone number
  accountHolderName: string; // Required for M-Pesa & Bank
  bankName?: string; // Required for bank accounts
  routingNumber?: string; // Required for bank accounts (can be optional based on region)
  swiftCode?: string; // Required for bank accounts (can be optional based on region)
  status: 'Active' | 'Pending' | 'Disabled';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface PaymentLink {
  id: string; // Firestore document ID
  userId: string;
  linkName: string;
  reference: string;
  amount: number; // Store as number (e.g., cents or actual value)
  currency: string; // e.g., KES, USD
  purpose: string;
  creationDate: Timestamp;
  expiryDate?: Timestamp | null; // Optional, use null if not set
  status: 'Active' | 'Expired' | 'Disabled' | 'Paid';
  payoutAccountId: string; // ID of the payout account
  shortUrl: string; // The actual shareable link
  hasExpiry: boolean;
  updatedAt?: Timestamp;
}

export interface Transaction {
  id: string; // Firestore document ID
  userId: string;
  paymentLinkId: string;
  date: Timestamp; // Transaction date
  customer: string; // Payer's name or identifier
  amount: number; // Amount transacted
  currency: string;
  status: 'Completed' | 'Pending' | 'Failed';
  reference: string; // Payment gateway transaction reference (e.g., Mpesa TXN ID, Card TXN ID)
  method?: 'mpesa_stk' | 'mpesa_paybill' | 'card'; // Payment method used
  createdAt: Timestamp;
}

// For the payment flow pages that don't have auth context
export interface PublicPaymentLinkDetails extends Omit<PaymentLink, 'userId' | 'payoutAccountId' | 'updatedAt' | 'creationDate' | 'expiryDate'> {
  // Fields needed by the public payment page
  creationDate: string | Date | Timestamp; // More flexible for dummy data vs Firestore
  expiryDate?: string | Date | Timestamp | null;
}


// Used in payment success/failure pages, derived from URL + link lookup
export interface PaymentOutcomeDetails {
  linkName?: string; // From PaymentLink
  orderReference?: string; // From PaymentLink.reference
  purpose?: string; // From PaymentLink.purpose
  amountPaid?: string; // Formatted amount from URL
  currency?: string; // From URL
  paidOn?: string; // Formatted date of payment
  failureReason?: string; // For failed payments
}
