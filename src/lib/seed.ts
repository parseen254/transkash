
'use server';

import { faker } from '@faker-js/faker';
import { db } from './firebase';
import { collection, writeBatch, getDocs, query, where, doc, Timestamp } from 'firebase/firestore';
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
  creationDate: Date; // JS Date for faker usage
}

export async function clearExistingData(userId: string) {
  console.log(`[Seed] Starting to clear data for user: ${userId}`);
  const collectionsToClear = ['paymentLinks', 'transactions', 'payoutAccounts'];
  const batch = writeBatch(db);
  let totalCleared = 0;

  for (const collectionName of collectionsToClear) {
    console.log(`[Seed] Preparing to clear existing ${collectionName} for user ${userId}...`);
    const q = query(collection(db, collectionName), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log(`[Seed] No documents found in ${collectionName} for user ${userId} to delete.`);
      continue;
    }
    snapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
    console.log(`[Seed] Added ${snapshot.size} documents from ${collectionName} to delete batch.`);
    totalCleared += snapshot.size;
  }

  if (totalCleared > 0) {
    await batch.commit();
    console.log(`[Seed] Cleared ${totalCleared} total documents for user ${userId}.`);
  } else {
    console.log(`[Seed] No existing data found to clear for user ${userId}.`);
  }
}


export async function seedFirestoreData(userId: string, counts: SeedCounts) {
  if (!userId) {
    throw new Error("User ID is required to seed data.");
  }

  console.log("[Seed] Starting data seeding process...");
  await clearExistingData(userId);

  const batch = writeBatch(db);
  const seededPaymentLinksInfo: SeededPaymentLinkInfo[] = [];

  // 1. Seed Payout Accounts
  console.log(`[Seed] Seeding ${counts.mpesaPayoutAccounts} M-Pesa Payout Accounts and ${counts.bankPayoutAccounts} Bank Payout Accounts...`);
  const payoutAccountIds: string[] = [];

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
    batch.set(mpesaAccountRef, newMpesaAccount);
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
    batch.set(bankAccountRef, newBankAccount);
  }
  console.log(`[Seed] Added ${payoutAccountIds.length} payout accounts to batch.`);

  // 2. Seed Payment Links
  console.log(`[Seed] Seeding ${counts.paymentLinks} Payment Links...`);
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
    const selectedPayoutAccountId = payoutAccountIds.length > 0 ? faker.helpers.arrayElement(payoutAccountIds) : "default_payout_id"; // Fallback if no payout accounts seeded

    const newPaymentLink: Omit<PaymentLink, 'id'> = {
      userId,
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
    batch.set(paymentLinkRef, newPaymentLink);
    seededPaymentLinksInfo.push({
      id: paymentLinkRef.id,
      amount: newPaymentLink.amount,
      currency: newPaymentLink.currency,
      creationDate: jsCreationDate // Store JS Date for faker
    });
  }
  console.log(`[Seed] Added ${seededPaymentLinksInfo.length} payment links to batch.`);

  // 3. Seed Transactions
  console.log(`[Seed] Seeding Transactions (${counts.transactionsPerLink} per link)...`);
  let transactionsAdded = 0;
  for (const linkInfo of seededPaymentLinksInfo) {
    if (!linkInfo.creationDate) {
        console.warn(`[Seed] Payment link info for ID ${linkInfo.id} missing creationDate. Skipping transactions.`);
        continue;
    }
    for (let j = 0; j < counts.transactionsPerLink; j++) {
      const transactionRef = doc(collection(db, 'transactions'));
      const transactionDate = faker.date.between({ from: linkInfo.creationDate, to: new Date() }); // Use JS Date from linkInfo
      const newTransaction: Omit<Transaction, 'id'> = {
        userId,
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
      batch.set(transactionRef, newTransaction);
      transactionsAdded++;
    }
  }
  console.log(`[Seed] Added ${transactionsAdded} transactions to batch.`);

  await batch.commit();
  console.log("[Seed] Data seeding process complete! Batch committed.");
}
