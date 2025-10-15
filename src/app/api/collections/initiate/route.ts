import { NextResponse } from 'next/server';
import { z } from 'zod';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { initiateCollection, validateRate } from '@/lib/providers/furp';
import { mapProviderStatusToLocal } from '@/lib/providers/furp';

// Schema for requests initiating a collection via provider (currently Furp)
const BodySchema = z.object({
  // Our domain
  userId: z.string(),
  paymentLinkId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string(),
  customer: z.string().optional().default('Online Customer'),
  // Routing to provider
  serviceCode: z.enum(['MOBILETOPUP', 'MONEYTRANSFER', 'BILLPAYMENT']),
  collectionMode: z.enum(['MOBILEMONEY', 'BANKACCOUNT', 'CASH']),
  fromCountryIso3: z.string(),
  toCountryIso3: z.string(),
  providerId: z.string(),
  // Callbacks
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  failureUrl: z.string().url(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = BodySchema.parse(body);

    // Step 1: validate rate with provider (kept provider-agnostic via adapter)
    const rate = await validateRate({
      userId: input.userId,
      fromCountry: input.fromCountryIso3,
      toCountry: input.toCountryIso3,
      fromCurrency: input.currency,
      toCurrency: input.currency, // simplify: same currency, adjust as needed
      amount: input.amount,
      direction: 'S',
      serviceCode: input.serviceCode,
      providerId: input.providerId,
      collectionMode: input.collectionMode,
    });

    // Step 2: create a local transaction id to use as PartnerReferenceNumber (idempotency)
    const localTxnRef = `LOC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const txnRef = doc(db, 'transactions').id; // Firestore id

    // Pre-write a local pending transaction (no vendor lock-in)
    const txnDocRef = doc(db, 'transactions', txnRef);
    await setDoc(txnDocRef, {
      userId: input.userId,
      paymentLinkId: input.paymentLinkId || '',
      date: serverTimestamp(),
      customer: input.customer,
      amount: input.amount,
      currency: input.currency,
      status: 'Pending',
      reference: localTxnRef,
      method: 'card', // placeholder; could be dynamic based on collectionMode
      createdAt: serverTimestamp(),
      provider: 'furp',
    }, { merge: true });

    // Webhook URL for provider callbacks (public route)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_BASE_URL;
    if (!baseUrl) {
      throw new Error('Missing NEXT_PUBLIC_BASE_URL or APP_BASE_URL for webhook callbacks');
    }
    const webhookUrl = `${baseUrl}/api/collections/webhook`;

    // Step 3: initiate collection with provider
    const initiated = await initiateCollection({
      userId: input.userId,
      providerId: input.providerId,
      serviceCode: input.serviceCode,
      collectionMode: input.collectionMode,
      sendCountryIso3: input.fromCountryIso3,
      receiveCountryIso3: input.toCountryIso3,
      sendCurrency: input.currency,
      receiveCurrency: input.currency, // adjust as needed
      sendAmount: input.amount,
      rateId: rate.id || 'unknown',
      partnerReferenceNumber: txnRef, // use our Firestore id for idempotency/linkage
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      failureUrl: input.failureUrl,
      webhookUrl,
    });

    // Update local transaction with provider reference and initial status
    await setDoc(txnDocRef, {
      providerReference: initiated.reference,
      status: mapProviderStatusToLocal(initiated.status as any),
    }, { merge: true });

    return NextResponse.json({
      ok: true,
      transactionId: txnRef,
      paymentUrl: initiated.paymentUrl,
      providerStatus: initiated.status,
      localStatus: mapProviderStatusToLocal(initiated.status as any),
    });
  } catch (e: any) {
    console.error('collections/initiate error', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
