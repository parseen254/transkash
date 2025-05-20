
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
  deleteDoc,
} from 'firebase/firestore';
import type { Transaction, TransactionStatus, UserSettings, ApiKeyEntry } from './types';

function generateRandomAlphanumeric(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// This function is not strictly "collision-free" in a distributed system without checking the DB.
// For Firestore, the document ID itself is unique. We'll use Firestore's auto-generated IDs for main transaction ID.
// This function can be used for MPESA confirmation codes.
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

const defaultUserSettings: UserSettings = {
  emailNotifications: true,
  smsNotifications: false,
};

export async function getUserSettings(userId: string): Promise<UserSettings> {
  if (!userId) {
    console.error('User ID is required to get user settings.');
    return defaultUserSettings; // Return default if no userId
  }
  try {
    const settingsDocRef = doc(db, 'userSettings', userId);
    const docSnap = await getDoc(settingsDocRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserSettings;
    } else {
      // If no settings found, create with defaults
      await setDoc(settingsDocRef, defaultUserSettings);
      return defaultUserSettings;
    }
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return defaultUserSettings; // Return default on error
  }
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: 'User ID is required.' };
  }
  try {
    const settingsDocRef = doc(db, 'userSettings', userId);
    await setDoc(settingsDocRef, settings, { merge: true }); // Use setDoc with merge to create if not exists or update
    revalidatePath('/dashboard/settings');
    return { success: true, message: 'Settings updated successfully.' };
  } catch (error) {
    console.error('Error updating user settings:', error);
    return { success: false, message: 'Failed to update settings.' };
  }
}

// API Key Management Actions

export async function addApiKey(userId: string, serviceName: string, keyValue: string): Promise<{ success: boolean; message?: string, apiKeyId?: string }> {
  if (!userId || !serviceName || !keyValue) {
    return { success: false, message: 'User ID, service name, and key value are required.' };
  }
  try {
    const apiKeysCollection = collection(db, 'apiKeys');
    const newApiKeyData: Omit<ApiKeyEntry, 'id' | 'createdAt'> & { createdAt: any } = {
      userId,
      serviceName,
      keyValue, // Key is stored directly; consider encryption for production
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(apiKeysCollection, newApiKeyData);
    revalidatePath('/dashboard/settings');
    return { success: true, message: 'API Key added successfully.', apiKeyId: docRef.id };
  } catch (error) {
    console.error('Error adding API key:', error);
    return { success: false, message: 'Failed to add API key.' };
  }
}

export async function getUserApiKeys(userId: string): Promise<ApiKeyEntry[]> {
  if (!userId) {
    console.error('User ID is required to get API keys.');
    return [];
  }
  try {
    const apiKeysCollection = collection(db, 'apiKeys');
    const q = query(
      apiKeysCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as Omit<ApiKeyEntry, 'id' | 'createdAt'> & { createdAt: Timestamp };
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt.toDate().toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return [];
  }
}

export async function deleteApiKey(userId: string, apiKeyId: string): Promise<{ success: boolean; message?: string }> {
  if (!userId || !apiKeyId) {
    return { success: false, message: 'User ID and API Key ID are required.' };
  }
  try {
    const apiKeyDocRef = doc(db, 'apiKeys', apiKeyId);
    const docSnap = await getDoc(apiKeyDocRef);

    if (!docSnap.exists() || docSnap.data()?.userId !== userId) {
      return { success: false, message: 'API Key not found or unauthorized.' };
    }

    await deleteDoc(apiKeyDocRef);
    revalidatePath('/dashboard/settings');
    return { success: true, message: 'API Key deleted successfully.' };
  } catch (error) {
    console.error('Error deleting API key:', error);
    return { success: false, message: 'Failed to delete API key.' };
  }
}
