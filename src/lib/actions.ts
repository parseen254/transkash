
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import type { Transaction } from './types';
import { revalidatePath } from 'next/cache';

// In a real app, this would be a database or a persistent store.
// For demonstration, we use an in-memory array.
const mockTransactionsStore: Transaction[] = [
  {
    id: 'txn_1P2gHh9jKlMnOpQrStUvWxYz',
    amount: 1500.00,
    currency: 'KES',
    recipientPhone: '+254712345678',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    senderName: 'John Doe',
    senderEmail: 'john.doe@example.com',
    mpesaTransactionId: 'NAK876HYT1'
  },
  {
    id: 'txn_0P1fGe8iJkLmNoPqRsTuVwXy',
    amount: 750.50,
    currency: 'KES',
    recipientPhone: '+254723456789',
    status: 'PROCESSING_MPESA',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    senderName: 'Jane Smith',
    senderEmail: 'jane.smith@example.com'
  },
  {
    id: 'txn_3R4tYu6oPqRsTuVwXyZ1aBcD',
    amount: 2500.00,
    currency: 'KES',
    recipientPhone: '+254734567890',
    status: 'PENDING_STRIPE',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    senderName: 'Alice Brown',
    senderEmail: 'alice.brown@example.com'
  },
];

let globalTransactionCounter = 0; // Counter for sequential part of the ID

function generateNewTransactionId(): string {
  globalTransactionCounter++;
  const counterString = String(globalTransactionCounter).padStart(7, '0');
  // Generate 3 random uppercase letters for prefix
  const P1 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const P2 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const P3 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${P1}${P2}${P3}${counterString}`; // e.g., RFA0000001
}

function generateMpesaConfirmationCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result; // e.g., QWERTY123A
}


const kenyanPhoneNumberRegex = /^\+254\d{9}$/; // Example: +2547XXXXXXXX

const TransferSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }).min(50, {message: 'Minimum amount is KES 50.'}),
  recipientPhone: z.string().regex(kenyanPhoneNumberRegex, { message: 'Invalid Kenyan phone number. Format: +254XXXXXXXXX' }),
  senderName: z.string().min(2, {message: 'Sender name must be at least 2 characters.'}),
  senderEmail: z.string().email({message: 'Invalid sender email address.'}),
});

export interface InitiateTransferState {
  message?: string | null;
  errors?: {
    amount?: string[];
    recipientPhone?: string[];
    senderName?: string[];
    senderEmail?: string[];
    general?: string[];
  };
  transactionId?: string | null;
}

export async function initiateTransfer(
  prevState: InitiateTransferState | undefined,
  formData: FormData
): Promise<InitiateTransferState> {
  const validatedFields = TransferSchema.safeParse({
    amount: formData.get('amount'),
    recipientPhone: formData.get('recipientPhone'),
    senderName: formData.get('senderName'),
    senderEmail: formData.get('senderEmail'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check your inputs.',
    };
  }

  const { amount, recipientPhone, senderEmail, senderName } = validatedFields.data;

  try {
    const transactionId = generateNewTransactionId(); // Use new ID generation
    const now = new Date().toISOString();

    const newTransaction: Transaction = {
      id: transactionId,
      amount,
      currency: 'KES',
      recipientPhone,
      senderEmail,
      senderName,
      status: 'PENDING_STRIPE', // Initial status
      createdAt: now,
      updatedAt: now,
    };
    
    mockTransactionsStore.unshift(newTransaction); // Add to the beginning of the array
    
    revalidatePath('/dashboard/transactions'); // Update transaction list
    revalidatePath('/dashboard'); // Update dashboard recent transactions
    
    return { message: 'Stripe payment pending...', transactionId };

  } catch (error) {
    console.error('Transfer initiation failed:', error);
    return {
      message: 'An unexpected error occurred. Please try again.',
      errors: { general: ['Transfer initiation failed.'] }
    };
  }
}


// Simulate fetching a transaction by ID
export async function getTransactionById(id: string): Promise<Transaction | null> {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  const transaction = mockTransactionsStore.find(txn => txn.id === id);
  return transaction || null;
}

// Simulate fetching all transactions
export async function getAllTransactions(): Promise<Transaction[]> {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return [...mockTransactionsStore].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Simulate updating transaction status (e.g., after Stripe webhook or MPESA update)
export async function updateTransactionStatus(id: string, status: Transaction['status']): Promise<Transaction | null> {
  const transactionIndex = mockTransactionsStore.findIndex(txn => txn.id === id);
  if (transactionIndex !== -1) {
    mockTransactionsStore[transactionIndex].status = status;
    mockTransactionsStore[transactionIndex].updatedAt = new Date().toISOString();
    
    if (status === 'COMPLETED') {
      mockTransactionsStore[transactionIndex].mpesaTransactionId = generateMpesaConfirmationCode(); // Use new MPESA code generation
    }
    
    revalidatePath(`/dashboard/transfer/status/${id}`);
    revalidatePath('/dashboard/transactions');
    revalidatePath('/dashboard');
    return mockTransactionsStore[transactionIndex];
  }
  return null;
}
