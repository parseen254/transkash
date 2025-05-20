
export type TransactionStatus = 
  | 'PENDING_STRIPE' 
  | 'PROCESSING_MPESA' 
  | 'COMPLETED' 
  | 'FAILED_MPESA' 
  | 'CANCELED_STRIPE'
  | 'PAYMENT_SUCCESSFUL'; // Added after Stripe payment, before MPESA

export interface Transaction {
  id: string; // Firestore document ID
  userId: string; // Firebase Auth User ID
  amount: number;
  currency: 'KES'; // Assuming KES for now
  recipientPhone: string;
  status: TransactionStatus;
  createdAt: string | any; // ISO date string or Firebase Timestamp for new docs
  updatedAt: string | any; // ISO date string or Firebase Timestamp
  stripePaymentIntentId?: string;
  mpesaTransactionId?: string;
  senderName?: string;
  senderEmail?: string; 
}
