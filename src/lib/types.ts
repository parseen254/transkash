
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
  stripeApiKey?: string;
  darajaApiKey?: string;
}

export type PaymentRequestStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELED';

export interface PaymentRequest {
  id: string; // Document ID in Firestore, same as requestId for the link
  userId: string; // Creator of the request
  amount: number;
  currency: string; // e.g., 'KES'
  description?: string;
  recipientMpesaNumber: string; // User's Mpesa # to receive funds
  status: PaymentRequestStatus;
  createdAt: string | any; // Firestore Timestamp
  updatedAt: string | any; // Firestore Timestamp
  
  // Fields to be filled when payment is made (for future implementation)
  payerName?: string;
  payerEmail?: string;
  paymentMethod?: 'STRIPE' | 'MPESA_STK' | 'MPESA_PAYBILL';
  relatedTransactionId?: string; // Optional: Link to a transaction in 'transactions' collection
}
