import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { mapProviderStatusToLocal } from '@/lib/providers/furp';

// Furp webhook shape (subset): TransactionStatusEvent
const EventSchema = z.object({
  transactionId: z.string(),
  status: z.enum(['PROCESSED', 'AWAITINGAFFILIATEUPDATE', 'INREVIEW', 'FAILED', 'CANCELLED', 'INPROGRESS', 'NEW']),
  reason: z.string().optional().nullable(),
  updatedAt: z.string(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const event = EventSchema.parse(json);

    // We used our Firestore transaction id as PartnerReferenceNumber when initiating
    // Some providers call back with their own transactionId; if so, we require mapping.
    // For demo, attempt to update by providerReference (we stored it on initiate) if available;
    // but we don't have a direct index here. We'll store a lightweight event log and leave reconciliation to UI/cron if not found.

    // Attempt to update by assuming transactionId equals our stored doc id (PartnerReferenceNumber)
    const txnDocRef = doc(db, 'transactions', event.transactionId);
    await setDoc(txnDocRef, {
      updatedAt: serverTimestamp(),
      status: mapProviderStatusToLocal(event.status),
      provider: 'furp',
      providerLastEvent: {
        status: event.status,
        reason: event.reason || null,
        updatedAt: event.updatedAt,
      },
    }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('collections/webhook error', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
