import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { getProviders, validateRate, initiateTransaction } from '@/lib/mito-helpers';
import type { PaymentLink } from '@/lib/types';

/**
 * POST /api/mito/initiate-payment
 * 
 * Initiates a payment transaction with MITO
 * 
 * Request body:
 * - paymentLinkId: string
 * - customerName: string
 * - customerEmail: string
 * - customerPhone: string
 * 
 * Response:
 * - paymentUrl: string (MITO hosted payment page)
 * - transactionId: string (Firestore transaction ID)
 * - reference: string (MITO reference)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentLinkId, customerName, customerEmail, customerPhone } = body;

    // Validate required fields
    if (!paymentLinkId || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentLinkId, customerName, customerEmail' },
        { status: 400 }
      );
    }

    // Load payment link from Firestore
    const paymentLinkRef = doc(db, 'paymentLinks', paymentLinkId);
    const paymentLinkSnap = await getDoc(paymentLinkRef);

    if (!paymentLinkSnap.exists()) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 }
      );
    }

    const paymentLink = { id: paymentLinkSnap.id, ...paymentLinkSnap.data() } as PaymentLink;

    // Check if payment link is active and not expired
    if (paymentLink.status !== 'Active') {
      return NextResponse.json(
        { error: `Payment link is ${paymentLink.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Get environment variables
    const mitoBeneficiaryId = process.env.MITO_BENEFICIARY_ID;
    const mitoUserId = process.env.MITO_USER_ID || 'default-user';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!mitoBeneficiaryId) {
      return NextResponse.json(
        { error: 'MITO_BENEFICIARY_ID not configured' },
        { status: 500 }
      );
    }

    // Generate unique partner reference number for idempotency
    const partnerReference = `TK-${Date.now()}-${paymentLinkId.slice(0, 8)}`;

    // Step 1: Get available providers
    const providers = await getProviders({
      countryIso3: 'KEN', // Kenya - adjust based on your target country
      currencyCode: paymentLink.currency,
      serviceCode: 'MONEYTRANSFER',
      collectionMode: 'MOBILEMONEY',
    });

    if (!providers || providers.length === 0) {
      return NextResponse.json(
        { error: 'No payment providers available for this currency' },
        { status: 400 }
      );
    }

    const provider = providers[0]; // Use first available provider

    // Step 2: Validate rate
    const rateData = await validateRate({
      userId: mitoUserId,
      serviceCode: 'MONEYTRANSFER',
      collectionMode: 'MOBILEMONEY',
      fromCountry: 'KEN',
      toCountry: 'KEN',
      fromCurrency: paymentLink.currency,
      toCurrency: paymentLink.currency,
      amount: paymentLink.amount,
      direction: 'S', // Send
      providerId: provider.providerId,
    });

    // Step 3: Initiate transaction with MITO
    const mitoTransaction = await initiateTransaction({
      serviceCode: 'MONEYTRANSFER',
      collectionMode: 'MOBILEMONEY',
      sendCountryIso3: 'KEN',
      receiveCountryIso3: 'KEN',
      sendCurrency: paymentLink.currency,
      receiveCurrency: paymentLink.currency,
      sendAmount: paymentLink.amount,
      rateId: rateData.id,
      providerId: provider.providerId,
      userId: mitoUserId,
      beneficiaryId: mitoBeneficiaryId, // Upesi account
      partnerReferenceNumber: partnerReference,
      successUrl: `${baseUrl}/payment/successful?ref=${partnerReference}`,
      cancelUrl: `${baseUrl}/payment/failed?ref=${partnerReference}&reason=cancelled`,
      failureUrl: `${baseUrl}/payment/failed?ref=${partnerReference}&reason=failed`,
      webhookUrl: `${baseUrl}/api/webhooks/mito`,
      paymentNarration: `Payment for ${paymentLink.linkName} - ${paymentLink.purpose}`,
    });

    // Step 4: Create transaction record in Firestore
    const transactionRef = await addDoc(collection(db, 'transactions'), {
      userId: paymentLink.userId,
      paymentLinkId: paymentLinkId,
      date: Timestamp.now(),
      customer: customerName,
      customerEmail: customerEmail,
      customerPhone: customerPhone || '',
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      status: 'Pending',
      reference: partnerReference,
      mitoReference: mitoTransaction.reference,
      mitoTransactionId: mitoTransaction.reference, // MITO doesn't return separate ID initially
      mitoStatus: mitoTransaction.status,
      mitoPaymentUrl: mitoTransaction.PaymentUrl,
      createdAt: Timestamp.now(),
    });

    // Return payment URL to frontend
    return NextResponse.json({
      success: true,
      paymentUrl: mitoTransaction.PaymentUrl,
      transactionId: transactionRef.id,
      reference: partnerReference,
      mitoReference: mitoTransaction.reference,
    });

  } catch (error: any) {
    console.error('Error initiating MITO payment:', error);
    
    // Check if it's a MITO API error
    const errorMessage = error.response?.data?.message || error.message || 'Failed to initiate payment';
    
    return NextResponse.json(
      { error: errorMessage, details: error.response?.data },
      { status: 500 }
    );
  }
}
