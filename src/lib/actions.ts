
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  orderBy,
  Timestamp,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { Transaction, TransactionStatus, UserSettings, PaymentRequest, PaymentRequestStatus } from './types';

function generateRandomAlphanumeric(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function generateMpesaConfirmationCode(): string {
  return generateRandomAlphanumeric(10).toUpperCase();
}

const kenyanPhoneNumberRegex = /^\+254\d{9}$/;

const TransferSchema = z.object({
  userId: z.string().min(1, { message: 'User ID is required.'}),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }).min(50, {message: 'Minimum amount is KES 50.'}),
  recipientPhone: z.string().regex(kenyanPhoneNumberRegex, { message: 'Invalid Kenyan phone number. Format: +254XXXXXXXXX' }),
  senderName: z.string().min(2, {message: 'Sender name must be at least 2 characters.'}),
  senderEmail: z.string().email({message: 'Invalid sender email address.'}),
});

export interface InitiateTransferState {
  message?: string | null;
  errors?: {
    userId?: string[];
    amount?: string[];
    recipientPhone?: string[];
    senderName?: string[];
    senderEmail?: string[];
    general?: string[];
  };
  transactionId?: string | null;
  success?: boolean;
}

export async function initiateTransfer(
  data: z.infer<typeof TransferSchema>
): Promise<InitiateTransferState> {
  const validatedFields = TransferSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check your inputs.',
      success: false,
    };
  }

  const { userId, amount, recipientPhone, senderEmail, senderName } = validatedFields.data;

  try {
    const newTransactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
      userId,
      amount,
      currency: 'KES',
      recipientPhone,
      senderEmail,
      senderName,
      status: 'PENDING_STRIPE',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const transactionsCollection = collection(db, 'transactions');
    const docRef = await addDoc(transactionsCollection, newTransactionData);

    revalidatePath('/dashboard/transactions');
    revalidatePath('/dashboard');

    return {
      message: 'Stripe payment pending...',
      transactionId: docRef.id,
      success: true
    };

  } catch (error) {
    console.error('Transfer initiation failed:', error);
    return {
      message: 'An unexpected error occurred. Please try again.',
      errors: { general: ['Transfer initiation failed.'] },
      success: false,
    };
  }
}

export async function getTransactionById(userId: string, transactionId: string): Promise<Transaction | null> {
  if (!userId || !transactionId) {
    console.error('User ID and Transaction ID are required for getTransactionById');
    return null;
  }
  try {
    const transactionDocRef = doc(db, 'transactions', transactionId);
    const transactionSnap = await getDoc(transactionDocRef);

    if (transactionSnap.exists()) {
      const transactionData = transactionSnap.data() as Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: Timestamp, updatedAt: Timestamp };
      if (transactionData.userId !== userId) {
        console.warn('User attempted to access unauthorized transaction.');
        return null;
      }
      return {
        ...transactionData,
        id: transactionSnap.id,
        createdAt: transactionData.createdAt.toDate().toISOString(),
        updatedAt: transactionData.updatedAt.toDate().toISOString(),
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching transaction by ID:', error);
    return null;
  }
}

export async function getAllTransactions(userId: string): Promise<Transaction[]> {
   if (!userId) {
    console.error('User ID is required for getAllTransactions');
    return [];
  }
  try {
    const transactionsCollection = collection(db, 'transactions');
    const q = query(
      transactionsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: Timestamp, updatedAt: Timestamp };
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    return [];
  }
}

export async function updateTransactionStatus(transactionId: string, status: TransactionStatus, userId?: string): Promise<Transaction | null> {
  if (!transactionId) {
    console.error('Transaction ID is required to update status.');
    return null;
  }
  try {
    const transactionDocRef = doc(db, 'transactions', transactionId);

    if (userId) {
        const currentDoc = await getDoc(transactionDocRef);
        if (!currentDoc.exists() || currentDoc.data()?.userId !== userId) {
            console.warn('Attempt to update status of unauthorized or non-existent transaction.');
            return null;
        }
    }

    const updateData: Partial<Transaction> & { updatedAt: any } = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'COMPLETED') {
      updateData.mpesaTransactionId = generateMpesaConfirmationCode();
    }

    await updateDoc(transactionDocRef, updateData);

    const updatedDocSnap = await getDoc(transactionDocRef);
    if (updatedDocSnap.exists()) {
      const data = updatedDocSnap.data() as Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: Timestamp, updatedAt: Timestamp };
      revalidatePath(`/dashboard/transfer/status/${transactionId}`);
      revalidatePath('/dashboard/transactions');
      revalidatePath('/dashboard');
      return {
        ...data,
        id: updatedDocSnap.id,
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return null;
  }
}

// User Settings Actions

const defaultUserSettings: Omit<UserSettings, 'userId'> = {
  emailNotifications: true,
  smsNotifications: false,
  stripeApiKey: '',
  darajaApiKey: '',
};

export async function getUserSettings(userId: string): Promise<UserSettings> {
  if (!userId) {
    console.error('User ID is required to get user settings.');
    return { ...defaultUserSettings };
  }
  try {
    const settingsDocRef = doc(db, 'userSettings', userId);
    const docSnap = await getDoc(settingsDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        emailNotifications: data?.emailNotifications ?? defaultUserSettings.emailNotifications,
        smsNotifications: data?.smsNotifications ?? defaultUserSettings.smsNotifications,
        stripeApiKey: data?.stripeApiKey ?? defaultUserSettings.stripeApiKey,
        darajaApiKey: data?.darajaApiKey ?? defaultUserSettings.darajaApiKey,
      };
    } else {
      await setDoc(settingsDocRef, defaultUserSettings);
      return { ...defaultUserSettings };
    }
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return { ...defaultUserSettings };
  }
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: 'User ID is required.' };
  }
  try {
    const settingsDocRef = doc(db, 'userSettings', userId);
    const dataToUpdate = {
        ...(settings.emailNotifications !== undefined && { emailNotifications: settings.emailNotifications }),
        ...(settings.smsNotifications !== undefined && { smsNotifications: settings.smsNotifications }),
        ...(settings.stripeApiKey !== undefined && { stripeApiKey: settings.stripeApiKey }),
        ...(settings.darajaApiKey !== undefined && { darajaApiKey: settings.darajaApiKey }),
    };

    await setDoc(settingsDocRef, dataToUpdate, { merge: true });
    revalidatePath('/dashboard/settings');
    return { success: true, message: 'Settings updated successfully.' };
  } catch (error) {
    console.error('Error updating user settings:', error);
    return { success: false, message: 'Failed to update settings.' };
  }
}

// --- Payment Request Actions ---

const CreatePaymentRequestSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  amount: z.coerce.number().positive("Amount must be positive.").min(10, "Minimum amount is KES 10."), // Example minimum
  currency: z.string().length(3, "Currency code must be 3 letters, e.g., KES."),
  description: z.string().max(200, "Description cannot exceed 200 characters.").optional(),
  recipientMpesaNumber: z.string().regex(kenyanPhoneNumberRegex, "Invalid Kenyan MPESA number format."),
});

export interface CreatePaymentRequestState {
  message?: string | null;
  errors?: {
    userId?: string[];
    amount?: string[];
    currency?: string[];
    description?: string[];
    recipientMpesaNumber?: string[];
    general?: string[];
  };
  paymentRequestId?: string | null;
  paymentRequestLink?: string | null;
  success?: boolean;
}

export async function createPaymentRequest(
  data: z.infer<typeof CreatePaymentRequestSchema>
): Promise<CreatePaymentRequestState> {
  const validatedFields = CreatePaymentRequestSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check your inputs.',
      success: false,
    };
  }

  const { userId, amount, currency, description, recipientMpesaNumber } = validatedFields.data;

  try {
    const newPaymentRequestData: Omit<PaymentRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { createdAt: any, updatedAt: any, status: PaymentRequestStatus } = {
      userId,
      amount,
      currency,
      description: description || '',
      recipientMpesaNumber,
      status: 'PENDING',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const paymentRequestsCollection = collection(db, 'paymentRequests');
    const docRef = await addDoc(paymentRequestsCollection, newPaymentRequestData);

    revalidatePath('/dashboard/payment-requests');

    // Construct the link (assuming your app is hosted at NEXT_PUBLIC_APP_URL)
    // You'll need to set NEXT_PUBLIC_APP_URL in your .env.local
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const paymentRequestLink = appUrl ? `${appUrl}/pay/${docRef.id}` : null;


    return {
      message: 'Payment request created successfully!',
      paymentRequestId: docRef.id,
      paymentRequestLink: paymentRequestLink,
      success: true,
    };

  } catch (error) {
    console.error('Payment request creation failed:', error);
    return {
      message: 'An unexpected error occurred creating the payment request.',
      errors: { general: ['Payment request creation failed.'] },
      success: false,
    };
  }
}

export async function getPaymentRequestsByUser(userId: string): Promise<PaymentRequest[]> {
  if (!userId) {
    console.error('User ID is required to fetch payment requests.');
    return [];
  }
  try {
    const paymentRequestsCollection = collection(db, 'paymentRequests');
    const q = query(
      paymentRequestsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as Omit<PaymentRequest, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: Timestamp, updatedAt: Timestamp };
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching payment requests by user:', error);
    return [];
  }
}

export async function getPaymentRequestPublic(requestId: string): Promise<PaymentRequest | null> {
  if (!requestId) {
    console.error('Request ID is required to fetch payment request.');
    return null;
  }
  try {
    const requestDocRef = doc(db, 'paymentRequests', requestId);
    const docSnap = await getDoc(requestDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as Omit<PaymentRequest, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: Timestamp, updatedAt: Timestamp };
      // Optionally, you might want to fetch limited user details of the creator here if needed
      // For now, returning the raw request data
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString(),
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching payment request for public page:', error);
    return null;
  }
}

// TODO: Add action to update payment request status (e.g., to PAID, CANCELED)
// This would be called after a payment is processed (e.g., by a Stripe webhook or Mpesa callback handler)
// export async function updatePaymentRequestStatus(requestId: string, status: PaymentRequestStatus, paymentDetails?: Partial<PaymentRequest>): Promise<PaymentRequest | null> { ... }

