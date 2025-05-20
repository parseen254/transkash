
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
  stripeApiKey?: string; // Added Stripe API Key
  darajaApiKey?: string; // Added Daraja API Key
  // Future settings can be added here, e.g., preferredCurrency?: string;
}

// ApiKeyEntry interface is removed as it's no longer needed for the simplified approach
