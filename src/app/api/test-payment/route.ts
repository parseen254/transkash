import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import type { PaymentLink } from '@/lib/types';

/**
 * POST /api/test-payment
 * 
 * TEST ONLY: Simulates payment completion for UAT testing
 * Bypasses MITO integration for testing user flows
 * 
 * Request body:
 * - paymentLinkId: string
 * - customerName: string
 * - customerEmail: string
 * - customerPhone: string
 * 
 * Response:
 * - paymentUrl: string (redirect to success page)
 * - transactionId: string (Firestore transaction ID)
 * - reference: string (test reference)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentLinkId, customerName, customerEmail, customerPhone, simulate = 'success' } = body;

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

    // Check if payment link is active
    if (paymentLink.status !== 'Active') {
      return NextResponse.json(
        { error: `Payment link is ${paymentLink.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Generate unique test reference
    const testReference = `TEST-${Date.now()}-${paymentLinkId.slice(0, 8)}`;

    // Create transaction record in Firestore
    const transactionRef = await addDoc(collection(db, 'transactions'), {
      userId: paymentLink.userId,
      paymentLinkId: paymentLinkId,
      date: Timestamp.now(),
      customer: customerName,
      customerEmail: customerEmail,
      customerPhone: customerPhone || '',
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      status: simulate === 'failed' ? 'Failed' : simulate === 'pending' ? 'Pending' : 'Completed',
      reference: testReference,
      mitoReference: `TEST-MITO-${Date.now()}`,
      mitoTransactionId: testReference,
      mitoStatus: simulate === 'failed' ? 'FAILED' : simulate === 'pending' ? 'INPROGRESS' : 'PROCESSED',
      method: 'test_simulation',
      createdAt: Timestamp.now(),
    });

    // Return success URL directly (skip MITO hosted page for testing)
    const redirectUrl = simulate === 'failed' 
      ? `${baseUrl}/payment/failed?ref=${testReference}&reason=test_failure`
      : `${baseUrl}/payment/successful?ref=${testReference}`;

    return NextResponse.json({
      success: true,
      paymentUrl: redirectUrl,
      transactionId: transactionRef.id,
      reference: testReference,
      testMode: true,
      message: 'TEST MODE: Payment simulation created successfully',
    });

  } catch (error: any) {
    console.error('Error creating test payment:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create test payment' },
      { status: 500 }
    );
  }
}
