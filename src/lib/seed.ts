
'use server'; // Can be a server action or just a server-side module

import { faker } from '@faker-js/faker';
import { db } from './firebase';
import { collection, addDoc, Timestamp, doc, setDoc, writeBatch, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import type { PaymentLink, PayoutAccount, Transaction, UserProfile } from './types';

// Helper to generate Kenyan-like names (simple approach)
const kenyanFirstNames = ['John', 'Peter', 'James', 'Mary', 'Jane', 'Grace', 'David', 'Paul', 'Esther', 'Joseph', 'Samuel', 'Ann', 'Daniel', 'Sarah', 'Michael', 'Ruth'];
const kenyanLastNames = ['Mwangi', 'Otieno', 'Kariuki', 'Wanjala', 'Ochieng', 'Maina', 'Kimani', 'Mutua', 'Akinyi', 'Kamau', 'Njoroge', 'Wafula', 'Cheruiyot', 'Langat'];

function getKenyanName() {
  return `${faker.helpers.arrayElement(kenyanFirstNames)} ${faker.helpers.arrayElement(kenyanLastNames)}`;
}

function generateMpesaTxnId() {
  return `R${faker.string.alphanumeric(9).toUpperCase()}`; // Example: R123ABCXYZ
}

interface SeedCounts {
  paymentLinks: number;
  mpesaPayoutAccounts: number;
  bankPayoutAccounts: number;
  transactionsPerLink: number;
}

type ProgressCallback = (step: number, message: string, currentProgress: number) => void;


// Function to delete existing data for a user
export async function clearExistingData(userId: string, progressCallback: ProgressCallback) {
  const collectionsToClear = ['paymentLinks', 'transactions', 'payoutAccounts'];
  let currentProgress = 0;
  const totalSteps = collectionsToClear.length;

  for (let i = 0; i < collectionsToClear.length; i++) {
    const collectionName = collectionsToClear[i];
    progressCallback(i + 1, `Clearing existing ${collectionName}...`, (i / totalSteps) * 100);
    
    const q = query(collection(db, collectionName), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    currentProgress = ((i + 1) / totalSteps) * 100;
    progressCallback(i + 1, `Cleared ${collectionName}.`, currentProgress);
  }
}


export async function seedFirestoreData(userId: string, counts: SeedCounts, progressCallback: ProgressCallback) {
  if (!userId) {
    throw new Error("User ID is required to seed data.");
  }
  
  // Step 0: Clear existing data
  await clearExistingData(userId, (step, message, prog) => progressCallback(0, message, prog * 0.1)); // 10% of progress for clearing

  const totalProgressSteps = 
    counts.mpesaPayoutAccounts + 
    counts.bankPayoutAccounts + 
    counts.paymentLinks + 
    (counts.paymentLinks * counts.transactionsPerLink);
  
  let completedProgressSteps = 0;

  const updateOverallProgress = () => {
    completedProgressSteps++;
    // Start progress reporting from 10% after clearing, up to 100%
    progressCallback(0, "Seeding in progress...", 10 + (completedProgressSteps / totalProgressSteps) * 90);
  };

  const batch = writeBatch(db);

  // Seed Payout Accounts
  progressCallback(1, "Seeding M-Pesa Payout Accounts...", 10);
  for (let i = 0; i < counts.mpesaPayoutAccounts; i++) {
    const mpesaAccountRef = doc(collection(db, 'payoutAccounts'));
    const newMpesaAccount: Omit<PayoutAccount, 'id'> = {
      userId,
      type: 'mpesa',
      accountName: `${faker.helpers.arrayElement(['Personal M-Pesa', 'Business Till', 'Savings M-Pesa'])} ${i + 1}`,
      accountNumber: `+2547${faker.string.numeric(8)}`,
      accountHolderName: getKenyanName(),
      status: faker.helpers.arrayElement(['Active', 'Pending']),
      createdAt: Timestamp.fromDate(faker.date.past()),
    };
    batch.set(mpesaAccountRef, newMpesaAccount);
    updateOverallProgress();
  }

  progressCallback(2, "Seeding Bank Payout Accounts...", 10 + (completedProgressSteps / totalProgressSteps) * 90);
  for (let i = 0; i < counts.bankPayoutAccounts; i++) {
    const bankAccountRef = doc(collection(db, 'payoutAccounts'));
    const newBankAccount: Omit<PayoutAccount, 'id'> = {
      userId,
      type: 'bank',
      accountName: `${faker.helpers.arrayElement(['Business Cheque', 'Project Account', 'General Savings'])} ${i + 1}`,
      accountNumber: faker.finance.accountNumber(10),
      accountHolderName: getKenyanName(),
      bankName: faker.helpers.arrayElement(['KCB', 'Equity Bank', 'Cooperative Bank', 'Standard Chartered Kenya']),
      routingNumber: faker.finance.routingNumber(),
      swiftCode: faker.finance.bic(),
      status: faker.helpers.arrayElement(['Active', 'Disabled']),
      createdAt: Timestamp.fromDate(faker.date.past()),
    };
    batch.set(bankAccountRef, newBankAccount);
    updateOverallProgress();
  }
  
  // Get created payout account IDs to link them to payment links
  // This needs to happen after the payout accounts batch commit if we were to fetch them.
  // For simplicity in seeding, we'll pick a dummy one or make it less critical for seeded data.
  // Or, we could create one specific payout account first, get its ID, then use it.
  // For now, let's assume a placeholder or that the forms will handle this.
  // A better approach would be to commit payout accounts first, then fetch, then create links.
  // For seeding, let's assign a fixed dummy ID or leave it to be updated via UI.
  const dummyPayoutAccountId = "seeded_payout_acc_id"; // Placeholder

  // Seed Payment Links
  progressCallback(3, "Seeding Payment Links...", 10 + (completedProgressSteps / totalProgressSteps) * 90);
  const paymentLinkIds: string[] = [];
  for (let i = 0; i < counts.paymentLinks; i++) {
    const paymentLinkRef = doc(collection(db, 'paymentLinks'));
    paymentLinkIds.push(paymentLinkRef.id);
    const hasExpiry = faker.datatype.boolean(0.7); // 70% chance of having expiry
    const creationDate = faker.date.past({ years: 1 });
    let expiryDate = null;
    if (hasExpiry) {
        const futureDate = faker.date.future({ years: 0.5, refDate: creationDate });
        expiryDate = Timestamp.fromDate(futureDate);
    }

    const amount = parseFloat(faker.finance.amount(50, 10000, 2));

    const newPaymentLink: Omit<PaymentLink, 'id'> = {
      userId,
      linkName: faker.commerce.productName() + ` Invoice #${faker.string.alphanumeric(4).toUpperCase()}`,
      reference: `INV-${faker.string.alphanumeric({ length: 8, casing: 'upper' })}`,
      amount: amount,
      currency: 'KES',
      purpose: faker.lorem.sentence(5),
      creationDate: Timestamp.fromDate(creationDate),
      expiryDate: expiryDate,
      status: expiryDate && expiryDate.toDate() < new Date() ? 'Expired' : faker.helpers.arrayElement(['Active', 'Paid', 'Disabled']),
      payoutAccountId: dummyPayoutAccountId, // Use a placeholder or fetch a real one
      shortUrl: `/payment/order?paymentLinkId=${paymentLinkRef.id}`,
      hasExpiry: hasExpiry,
      updatedAt: Timestamp.now(),
    };
    batch.set(paymentLinkRef, newPaymentLink);
    updateOverallProgress();
  }

  // Seed Transactions
  progressCallback(4, "Seeding Transactions...", 10 + (completedProgressSteps / totalProgressSteps) * 90);
  for (const linkId of paymentLinkIds) {
    const paymentLinkDoc = (await getDoc(doc(db, 'paymentLinks', linkId))).data() as PaymentLink | undefined;
    if (!paymentLinkDoc) continue;

    for (let j = 0; j < counts.transactionsPerLink; j++) {
      const transactionRef = doc(collection(db, 'transactions'));
      const transactionDate = faker.date.between({ from: paymentLinkDoc.creationDate.toDate(), to: new Date() });
      const newTransaction: Omit<Transaction, 'id'> = {
        userId,
        paymentLinkId: linkId,
        date: Timestamp.fromDate(transactionDate),
        customer: getKenyanName(),
        amount: paymentLinkDoc.amount, // Assume full amount paid for simplicity
        currency: paymentLinkDoc.currency,
        status: faker.helpers.arrayElement(['Completed', 'Pending', 'Failed']),
        reference: generateMpesaTxnId(),
        method: faker.helpers.arrayElement(['mpesa_stk', 'mpesa_paybill', 'card']),
        createdAt: Timestamp.fromDate(transactionDate),
      };
      batch.set(transactionRef, newTransaction);
      updateOverallProgress();
    }
  }

  await batch.commit();
  progressCallback(5, "Seeding complete!", 100);
}
