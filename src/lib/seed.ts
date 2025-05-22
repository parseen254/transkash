
'use server'; 

import { faker } from '@faker-js/faker';
import { db } from './firebase';
import { collection, writeBatch, getDocs, query, where, doc } from 'firebase/firestore';
import type { PaymentLink, PayoutAccount, Transaction } from './types'; // UserProfile removed as it's not seeded here
import { Timestamp } from 'firebase/firestore';


const kenyanFirstNames = ['John', 'Peter', 'James', 'Mary', 'Jane', 'Grace', 'David', 'Paul', 'Esther', 'Joseph', 'Samuel', 'Ann', 'Daniel', 'Sarah', 'Michael', 'Ruth'];
const kenyanLastNames = ['Mwangi', 'Otieno', 'Kariuki', 'Wanjala', 'Ochieng', 'Maina', 'Kimani', 'Mutua', 'Akinyi', 'Kamau', 'Njoroge', 'Wafula', 'Cheruiyot', 'Langat'];

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

export async function clearExistingData(userId: string) {
  console.log(`Starting to clear data for user: ${userId}`);
  const collectionsToClear = ['paymentLinks', 'transactions', 'payoutAccounts'];
  
  for (const collectionName of collectionsToClear) {
    console.log(`Clearing existing ${collectionName}...`);
    const q = query(collection(db, collectionName), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log(`No documents found in ${collectionName} for user ${userId} to delete.`);
      continue;
    }
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Cleared ${snapshot.size} documents from ${collectionName}.`);
  }
  console.log(`Finished clearing data for user: ${userId}`);
}


export async function seedFirestoreData(userId: string, counts: SeedCounts) {
  if (!userId) {
    throw new Error("User ID is required to seed data.");
  }
  
  console.log("Starting data seeding process...");
  await clearExistingData(userId);

  const batch = writeBatch(db);

  console.log("Seeding Payout Accounts...");
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
      createdAt: Timestamp.fromDate(faker.date.past({years: 1})),
      updatedAt: Timestamp.fromDate(faker.date.recent({days: 30})),
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
      createdAt: Timestamp.fromDate(faker.date.past({years: 1})),
      updatedAt: Timestamp.fromDate(faker.date.recent({days: 30})),
    };
    batch.set(bankAccountRef, newBankAccount);
  }
  
  console.log("Seeding Payment Links...");
  const paymentLinkIds: string[] = [];
  for (let i = 0; i < counts.paymentLinks; i++) {
    const paymentLinkRef = doc(collection(db, 'paymentLinks'));
    paymentLinkIds.push(paymentLinkRef.id);
    const hasExpiry = faker.datatype.boolean(0.7); 
    const creationDate = faker.date.past({ years: 1 });
    let expiryDate = null;
    if (hasExpiry) {
        const futureDate = faker.date.future({ years: 0.5, refDate: creationDate }); // Ensures expiry is after creation
        expiryDate = Timestamp.fromDate(futureDate);
    }

    const amount = parseFloat(faker.finance.amount({min: 50, max: 10000, dec:2}));
    const selectedPayoutAccountId = payoutAccountIds.length > 0 ? faker.helpers.arrayElement(payoutAccountIds) : "default_payout_id";


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
      payoutAccountId: selectedPayoutAccountId, 
      shortUrl: `/payment/order?paymentLinkId=${paymentLinkRef.id}`,
      hasExpiry: hasExpiry,
      updatedAt: Timestamp.fromDate(faker.date.recent({days: 30, refDate: creationDate})),
    };
    batch.set(paymentLinkRef, newPaymentLink);
  }

  console.log("Seeding Transactions...");
  for (const linkId of paymentLinkIds) {
    const paymentLinkDocData = (await getDocs(query(collection(db, 'paymentLinks'), where("userId", "==", userId), where("__name__", "==", linkId)))).docs[0]?.data() as PaymentLink | undefined;

    if (!paymentLinkDocData || !(paymentLinkDocData.creationDate instanceof Timestamp)) continue;


    for (let j = 0; j < counts.transactionsPerLink; j++) {
      const transactionRef = doc(collection(db, 'transactions'));
      const transactionDate = faker.date.between({ from: paymentLinkDocData.creationDate.toDate(), to: new Date() });
      const newTransaction: Omit<Transaction, 'id'> = {
        userId,
        paymentLinkId: linkId,
        date: Timestamp.fromDate(transactionDate), 
        customer: getKenyanName(),
        amount: paymentLinkDocData.amount, 
        currency: paymentLinkDocData.currency,
        status: faker.helpers.arrayElement(['Completed', 'Pending', 'Failed']),
        reference: generateMpesaTxnId(),
        method: faker.helpers.arrayElement(['mpesa_stk', 'mpesa_paybill', 'card']),
        createdAt: Timestamp.fromDate(transactionDate), // Use transactionDate for createdAt
      };
      batch.set(transactionRef, newTransaction);
    }
  }

  await batch.commit();
  console.log("Data seeding process complete!");
}
