export type TransactionStatus = 
  | 'PENDING_STRIPE' 
  | 'PROCESSING_MPESA' 
  | 'COMPLETED' 
  | 'FAILED_MPESA' 
  | 'CANCELED_STRIPE'
  | 'PAYMENT_SUCCESSFUL'; // Added after Stripe payment, before MPESA

export interface Transaction {
  id: string;
  amount: number;
  currency: 'KES'; // Assuming KES for now
  recipientPhone: string;
  status: TransactionStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  stripePaymentIntentId?: string;
  mpesaTransactionId?: string;
  senderName?: string; // Optional: if collected
  senderEmail?: string; // Optional: if collected for Stripe
}
