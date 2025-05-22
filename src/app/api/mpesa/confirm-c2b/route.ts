
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Mock Mpesa C2B Confirmation API
 * This endpoint simulates confirming a C2B payment allegedly made by a user via Paybill.
 *
 * Expected request body:
 * {
 *   "paymentLinkId": "string", // Reference for the payment link (used as Account Number)
 *   "amount": number,          // Amount expected
 *   "currency": "string"       // e.g. "KES"
 * }
 *
 * Mocked Daraja-like success response:
 * {
 *   "ResultCode": "0",
 *   "ResultDesc": "The service request is processed successfully.",
 *   "ThirdPartyTransID": "MOCK_MPESA_TXN_ID_123",
 *   "BillRefNumber": "PAYMENT_LINK_ID_OR_REFERENCE",
 *   "TransAmount": "100.00",
 *   "MSISDN": "2547XXXXXX" // Masked phone number
 * }
 *
 * Mocked failure response:
 * {
 *   "ResultCode": "1", // Or other non-zero code
 *   "ResultDesc": "Transaction not found or still processing."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentLinkId, amount, currency } = body;

    if (!paymentLinkId || amount === undefined || !currency) {
      return NextResponse.json({ error: 'Missing required fields: paymentLinkId, amount, currency' }, { status: 400 });
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));

    // Simulate random success or failure (e.g., 70% chance of success for demo)
    const isSuccess = Math.random() > 0.3;

    if (isSuccess) {
      const mockMpesaTxnId = `C2B_MOCK_${Date.now()}`;
      console.log(`Mock Mpesa C2B Confirmed:
        Account (Payment Link ID): ${paymentLinkId},
        Amount: ${amount} ${currency},
        Mpesa TXN ID: ${mockMpesaTxnId}`);
        
      return NextResponse.json({
        ResultCode: "0",
        ResultDesc: "The service request is processed successfully.",
        ThirdPartyTransID: mockMpesaTxnId,
        BillRefNumber: paymentLinkId, // Echoing back the payment link ID as BillRefNumber
        TransAmount: parseFloat(amount).toFixed(2),
        MSISDN: `2547${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}` // Mock phone
      });
    } else {
      console.warn(`Mock Mpesa C2B Confirmation Failed:
        Account (Payment Link ID): ${paymentLinkId},
        Amount: ${amount} ${currency},
        Reason: Transaction not found or still processing (simulated).`);

      return NextResponse.json({
        ResultCode: "1",
        ResultDesc: "Transaction not found or still processing (simulated)."
      }, { status: 400 }); // Or use 200 with error details as per Daraja style
    }

  } catch (error) {
    console.error('Mock Mpesa C2B Confirm API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred in Mpesa C2B mock.' }, { status: 500 });
  }
}
