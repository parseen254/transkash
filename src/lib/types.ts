
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  phone?: string;
  businessName?: string;
  photoURL?: string | null;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  lastLoginAt?: Timestamp | Date;
  provider?: string; // e.g., 'password', 'google.com'
}


export interface PayoutAccount {
  id: string; // Firestore document ID
  userId: string; // Belongs to which user
  accountName: string;
  accountNumber: string; // Should be stored securely, consider masking for display
  bankName: string;
  bankBranch?: string;
  bankCode?: string;
  bankSwiftCode?: string;
  status: 'Active' | 'Pending' | 'Disabled';
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface PaymentLink {
  id: string; // Firestore document ID
  userId: string; // Belongs to which user
  linkName: string;
  reference: string;
  amount: string; // Consider storing as number (e.g. cents) for precision
  currency: string; // e.g., KES, USD
  purpose: string;
  creationDate: Timestamp | Date; // Firestore timestamp
  expiryDate?: Timestamp | Date; // Optional
  status: 'Active' | 'Expired' | 'Disabled' | 'Paid';
  payoutAccountId?: string; // ID of the payout account
  shortUrl?: string; // The actual shareable link
  updatedAt?: Timestamp | Date;
}

export interface PaymentDetails {
  reference: string;
  name: string; // Recipient/Merchant Name
  amount: string; // Formatted amount with currency
  date: string; // Formatted date string
  status?: 'Successful' | 'Failed' | 'Pending';
  paymentReason?: string;
}
