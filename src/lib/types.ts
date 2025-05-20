
export type TransactionStatus =
  | 'PENDING_STRIPE'
  | 'PROCESSING_MPESA'
  | 'COMPLETED'
  | 'FAILED_MPESA'
  | 'CANCELED_STRIPE'
  | 'PAYMENT_SUCCESSFUL';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: 'KES';
  recipientPhone: string;
  status: TransactionStatus;
  createdAt: string | any;
  updatedAt: string | any;
  stripePaymentIntentId?: string;
  mpesaTransactionId?: string;
  senderName?: string;
  senderEmail?: string;
}

export interface UserSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  // Future settings can be added here, e.g., preferredCurrency?: string;
}

export interface ApiKeyEntry {
  id: string; // Firestore document ID
  userId: string;
  serviceName: string;
  keyValue: string; // This will be the actual API key
  createdAt: string | any; // Timestamp
  // Add any other relevant fields, e.g., lastUsed, keyType
}
