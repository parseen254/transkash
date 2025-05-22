
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Mock Mpesa STK Push Initiation API
 * This endpoint simulates the initial request to Safaricom's Daraja API for an STK push.
 *
 * Expected request body:
 * {
 *   "phoneNumber": "2547xxxxxxxx", // Customer's phone number
 *   "amount": 10,                   // Amount to charge
 *   "accountReference": "ORDER123", // A reference for the transaction
 *   "transactionDesc": "Payment for goods" // Description of the transaction
 * }
 *
 * Mocked Daraja-like immediate success response:
 * {
 *   "MerchantRequestID": "string",
 *   "CheckoutRequestID": "string",
 *   "ResponseCode": "0",
 *   "ResponseDescription": "Success. Request accepted for processing",
 *   "CustomerMessage": "Success. Request accepted for processing"
 * }
 *
 * Mocked Daraja-like immediate failure response:
 * {
 *   "requestId": "string",
 *   "errorCode": "string",
 *   "errorMessage": "string"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, amount, accountReference, transactionDesc } = body;

    // Basic validation
    if (!phoneNumber || !amount || !accountReference || !transactionDesc) {
      return NextResponse.json({ error: 'Missing required fields: phoneNumber, amount, accountReference, transactionDesc' }, { status: 400 });
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Simulate random success or failure
    const isSuccess = Math.random() > 0.2; // 80% chance of success

    if (isSuccess) {
      const merchantRequestID = `MOCK_MRID_${Date.now()}`;
      const checkoutRequestID = `MOCK_CKID_${Date.now()}`;
      
      console.log(`Mock Mpesa STK Push Initiated:
        Phone: ${phoneNumber},
        Amount: ${amount},
        Ref: ${accountReference},
        Desc: ${transactionDesc},
        MerchantRequestID: ${merchantRequestID},
        CheckoutRequestID: ${checkoutRequestID}`);

      return NextResponse.json({
        MerchantRequestID: merchantRequestID,
        CheckoutRequestID: checkoutRequestID,
        ResponseCode: "0",
        ResponseDescription: "Success. Request accepted for processing",
        CustomerMessage: "Success. Request accepted for processing"
      });
    } else {
      // Simulate a Daraja-like error
      const requestId = `MOCK_ERR_REQID_${Date.now()}`;
      const errorCode = "500.001.1001"; // Example error code
      const errorMessage = "Unable to lock subscriber, a transaction is already in process for the current subscriber";
      
      console.warn(`Mock Mpesa STK Push Failed:
        Phone: ${phoneNumber},
        Amount: ${amount},
        Error: ${errorMessage}`);

      return NextResponse.json({
        requestId: requestId,
        errorCode: errorCode,
        errorMessage: errorMessage
      }, { status: 400 }); // Or 500 for server-side simulation issues
    }

  } catch (error) {
    console.error('Mock Mpesa API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred in Mpesa mock.' }, { status: 500 });
  }
}
