
'use server';

import { faker } from '@faker-js/faker';
import { db } from './firebase';
import { collection, writeBatch, getDocs, query, where, doc, Timestamp, serverTimestamp } from 'firebase/firestore';
import type { PaymentLink, PayoutAccount, Transaction } from './types';

const kenyanFirstNames = ['John', 'Peter', 'James', 'Mary', 'Jane', 'Grace', 'David', 'Paul', 'Esther', 'Joseph', 'Samuel', 'Ann', 'Daniel', 'Sarah', 'Michael', 'Ruth', 'Alice', 'Robert', 'Lucy', 'George'];
const kenyanLastNames = ['Mwangi', 'Otieno', 'Kariuki', 'Wanjala', 'Ochieng', 'Maina', 'Kimani', 'Mutua', 'Akinyi', 'Kamau', 'Njoroge', 'Wafula', 'Cheruiyot', 'Langat', 'Omondi', 'Nyambura', 'Kipkemoi', 'Wairimu'];

function getKenyanName() {
  return `${faker.helpers.arrayElement(kenyanFirstNames)} ${faker.helpers.arrayElement(kenyanLastNames)}`;
}

function generateMpesaTxnId() {
  return `R${faker.string.alphanumeric(9).toUpperCase()}`;
}

interface SeedCounts {
  paymentLinks: number;
  mpesaPayoutAccounts: number;
  bankPayoutAccounts: number;
  transactionsPerLink: number;
}

interface SeededPaymentLinkInfo {
  id: string;
  amount: number;
  currency: string;
  creationDate: Date; 
  creatorUserId: string;
}

const MAX_BATCH_OPERATIONS = 490; // Firestore batch limit is 500

async function commitBatchInChunks(operations: ((batch: ReturnType<typeof writeBatch>) => void)[]) {
  let currentBatch = writeBatch(db);
  let operationCount = 0;

  for (const operation of operations) {
    operation(currentBatch);
    operationCount++;
    if (operationCount >= MAX_BATCH_OPERATIONS) {
      await currentBatch.commit();
      currentBatch = writeBatch(db);
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await currentBatch.commit();
  }
}


export async function clearExistingData(userId: string) {
  console.log(`[Seed] Starting to clear data for user: ${userId}`);
  const collectionsToClear = ['paymentLinks', 'transactions', 'payoutAccounts'];
  
  for (const collectionName of collectionsToClear) {
    console.log(`[Seed] Preparing to clear existing ${collectionName} for user ${userId}...`);
    const q = query(collection(db, collectionName), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log(`[Seed] No documents found in ${collectionName} for user ${userId} to delete.`);
      continue;
    }
    const deleteOps: ((batch: ReturnType<typeof writeBatch>) => void)[] = [];
    snapshot.docs.forEach(docSnap => deleteOps.push(batch => batch.delete(docSnap.ref)));
    
    await commitBatchInChunks(deleteOps);
    console.log(`[Seed] Cleared ${snapshot.size} documents from ${collectionName}.`);
  }
  console.log(`[Seed] Finished clearing existing data for user ${userId}.`);
}


export async function seedFirestoreData(userId: string, counts: SeedCounts) {
  if (!userId) {
    throw new Error("User ID is required to seed data.");
  }

  console.log("[Seed] Starting data seeding process...");
  await clearExistingData(userId);

  const payoutAccountOps: ((batch: ReturnType<typeof writeBatch>) => void)[] = [];
  const payoutAccountIds: string[] = [];

  console.log(`[Seed] Preparing ${counts.mpesaPayoutAccounts} M-Pesa Payout Accounts and ${counts.bankPayoutAccounts} Bank Payout Accounts...`);
  for (let i = 0; i < counts.mpesaPayoutAccounts; i++) {
    const mpesaAccountRef = doc(collection(db, 'payoutAccounts'));
    payoutAccountIds.push(mpesaAccountRef.id);
    const newMpesaAccount: Omit<PayoutAccount, 'id'> = {
      userId,
      type: 'mpesa',
      accountName: `${faker.helpers.arrayElement(['Personal M-Pesa', 'Business Till', 'Savings M-Pesa'])} ${i + 1}`,
      accountNumber: `+2547${faker.string.numeric(8)}`,
      accountHolderName: getKenyanName(),
      status: faker.helpers.arrayElement(['Active', 'Pending']),
      createdAt: Timestamp.fromDate(faker.date.past({ years: 1 })),
      updatedAt: Timestamp.fromDate(faker.date.recent({ days: 30 })),
    };
    payoutAccountOps.push(batch => batch.set(mpesaAccountRef, newMpesaAccount));
  }

  for (let i = 0; i < counts.bankPayoutAccounts; i++) {
    const bankAccountRef = doc(collection(db, 'payoutAccounts'));
    payoutAccountIds.push(bankAccountRef.id);
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
      createdAt: Timestamp.fromDate(faker.date.past({ years: 1 })),
      updatedAt: Timestamp.fromDate(faker.date.recent({ days: 30 })),
    };
    payoutAccountOps.push(batch => batch.set(bankAccountRef, newBankAccount));
  }
  if (payoutAccountOps.length > 0) {
    console.log(`[Seed] Committing ${payoutAccountOps.length} payout account operations...`);
    await commitBatchInChunks(payoutAccountOps);
  }


  const paymentLinkOps: ((batch: ReturnType<typeof writeBatch>) => void)[] = [];
  const seededPaymentLinksInfo: SeededPaymentLinkInfo[] = [];

  console.log(`[Seed] Preparing ${counts.paymentLinks} Payment Links...`);
  for (let i = 0; i < counts.paymentLinks; i++) {
    const paymentLinkRef = doc(collection(db, 'paymentLinks'));
    const jsCreationDate = faker.date.past({ years: 1 });
    const hasExpiry = faker.datatype.boolean(0.7);
    let firestoreExpiryDate: Timestamp | null = null;
    if (hasExpiry) {
      const jsExpiryDate = faker.date.future({ years: 0.5, refDate: jsCreationDate });
      firestoreExpiryDate = Timestamp.fromDate(jsExpiryDate);
    }

    const amount = parseFloat(faker.finance.amount({ min: 50, max: 10000, dec: 2 }));
    const selectedPayoutAccountId = payoutAccountIds.length > 0 ? faker.helpers.arrayElement(payoutAccountIds) : "default_payout_id";

    const newPaymentLink: Omit<PaymentLink, 'id'> = {
      userId,
      creatorUserId: userId, 
      linkName: faker.commerce.productName() + ` Invoice #${faker.string.alphanumeric(4).toUpperCase()}`,
      reference: `INV-${faker.string.alphanumeric({ length: 8, casing: 'upper' })}`,
      amount: amount,
      currency: 'KES',
      purpose: faker.lorem.sentence(5),
      creationDate: Timestamp.fromDate(jsCreationDate),
      expiryDate: firestoreExpiryDate,
      status: firestoreExpiryDate && firestoreExpiryDate.toDate() < new Date() ? 'Expired' : faker.helpers.arrayElement(['Active', 'Paid', 'Disabled']),
      payoutAccountId: selectedPayoutAccountId,
      shortUrl: `/payment/order?paymentLinkId=${paymentLinkRef.id}`,
      hasExpiry: hasExpiry,
      updatedAt: Timestamp.fromDate(faker.date.recent({ days: 30, refDate: jsCreationDate })),
    };
    paymentLinkOps.push(batch => batch.set(paymentLinkRef, newPaymentLink));
    seededPaymentLinksInfo.push({
      id: paymentLinkRef.id,
      amount: newPaymentLink.amount,
      currency: newPaymentLink.currency,
      creationDate: jsCreationDate,
      creatorUserId: userId
    });
  }
   if (paymentLinkOps.length > 0) {
    console.log(`[Seed] Committing ${paymentLinkOps.length} payment link operations...`);
    await commitBatchInChunks(paymentLinkOps);
  }


  const transactionOps: ((batch: ReturnType<typeof writeBatch>) => void)[] = [];
  console.log(`[Seed] Preparing Transactions (${counts.transactionsPerLink} per link)...`);
  for (const linkInfo of seededPaymentLinksInfo) {
    for (let j = 0; j < counts.transactionsPerLink; j++) {
      const transactionRef = doc(collection(db, 'transactions'));
      const transactionDate = faker.date.between({ from: linkInfo.creationDate, to: new Date() });
      const newTransaction: Omit<Transaction, 'id'> = {
        userId: linkInfo.creatorUserId,
        paymentLinkId: linkInfo.id,
        date: Timestamp.fromDate(transactionDate), 
        customer: getKenyanName(),
        amount: linkInfo.amount,
        currency: linkInfo.currency,
        status: faker.helpers.arrayElement(['Completed', 'Pending', 'Failed']),
        reference: generateMpesaTxnId(),
        method: faker.helpers.arrayElement(['mpesa_stk', 'mpesa_paybill', 'card']),
        createdAt: Timestamp.fromDate(transactionDate),
      };
      transactionOps.push(batch => batch.set(transactionRef, newTransaction));
    }
  }
  if (transactionOps.length > 0) {
    console.log(`[Seed] Committing ${transactionOps.length} transaction operations...`);
    await commitBatchInChunks(transactionOps);
  }

  console.log("[Seed] Data seeding process complete!");
}


    