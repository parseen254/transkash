import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

/**
 * POST /api/webhooks/mito
 * 
 * Receives transaction status updates from MITO
 * 
 * MITO sends webhook with:
 * - transactionId: string (MITO transaction ID)
 * - status: string (PROCESSED, FAILED, etc.)
 * - reason?: string (failure reason)
 * - updatedAt: string (ISO 8601 timestamp)
 * 
 * We find the transaction by mitoReference and update its status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, status, reason, updatedAt } = body;

    console.log('[MITO Webhook] Received:', {
      transactionId,
      status,
      reason,
      updatedAt,
    });

    // Validate required fields
    if (!transactionId || !status) {
      console.error('[MITO Webhook] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, status' },
        { status: 400 }
      );
    }

    // Find transaction in Firestore by MITO transaction ID
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('mitoTransactionId', '==', transactionId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error('[MITO Webhook] Transaction not found:', transactionId);
      // Still return 200 to avoid MITO retrying
      return NextResponse.json({ 
        received: true,
        warning: 'Transaction not found',
      });
    }

    // Update each matching transaction (should be only one)
    const updatePromises = querySnapshot.docs.map(async (docSnap) => {
      const transactionRef = doc(db, 'transactions', docSnap.id);
      
      // Map MITO status to our Transaction status
      let firestoreStatus: 'Completed' | 'Pending' | 'Failed' = 'Pending';
      
      if (status === 'PROCESSED') {
        firestoreStatus = 'Completed';
      } else if (status === 'FAILED' || status === 'CANCELLED') {
        firestoreStatus = 'Failed';
      } else if (status === 'INPROGRESS' || status === 'NEW' || status === 'AWAITINGAFFILIATEUPDATE' || status === 'INREVIEW') {
        firestoreStatus = 'Pending';
      }

      await updateDoc(transactionRef, {
        status: firestoreStatus,
        mitoStatus: status,
        mitoTransactionId: transactionId,
        updatedAt: Timestamp.now(),
        ...(reason && { failureReason: reason }),
      });

      console.log(`[MITO Webhook] Updated transaction ${docSnap.id} to status: ${firestoreStatus} (MITO: ${status})`);
    });

    await Promise.all(updatePromises);

    // Return 200 OK to acknowledge receipt
    return NextResponse.json({
      received: true,
      transactionId,
      status,
      updatedCount: querySnapshot.docs.length,
    });

  } catch (error: any) {
    console.error('[MITO Webhook] Error processing webhook:', error);
    
    // Still return 200 to avoid MITO retrying indefinitely
    // Log the error for manual investigation
    return NextResponse.json({
      received: true,
      error: error.message,
    });
  }
}

/**
 * GET /api/webhooks/mito
 * 
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'MITO webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
