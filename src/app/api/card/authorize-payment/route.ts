
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Mock Card Payment Authorization API
 * This endpoint simulates a card payment authorization request to a generic payment gateway (e.g., Mastercard).
 *
 * Expected request body:
 * {
 *   "cardNumber": "string",        // Mock card number
 *   "expiryMonth": "string",       // MM
 *   "expiryYear": "string",        // YYYY
 *   "cvv": "string",
 *   "amount": number,
 *   "currency": "string"           // e.g., "KES", "USD"
 * }
 *
 * Mocked Mastercard-like success response:
 * {
 *   "result": "SUCCESS",
 *   "transaction": {
 *     "id": "string", // Mock transaction ID
 *     "type": "PAYMENT",
 *     "amount": number,
 *     "currency": "string"
 *   },
 *   "response": {
 *     "gatewayCode": "APPROVED"
 *   }
 * }
 *
 * Mocked Mastercard-like failure response:
 * {
 *   "result": "FAILURE",
 *   "error": {
 *     "cause": "string",
 *     "explanation": "string"
 *   },
 *   "response": {
 *     "gatewayCode": "DECLINED" // or other error codes
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardNumber, expiryMonth, expiryYear, cvv, amount, currency } = body;

    // Basic validation
    if (!cardNumber || !expiryMonth || !expiryYear || !cvv || amount === undefined || !currency) {
      return NextResponse.json({ error: 'Missing required fields: cardNumber, expiryMonth, expiryYear, cvv, amount, currency' }, { status: 400 });
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Simulate random success or failure
    const isSuccess = Math.random() > 0.2; // 80% chance of success

    if (isSuccess) {
      const transactionId = `TRN_MOCK_${Date.now()}`;
      console.log(`Mock Card Payment Authorized:
        Card (last 4): ${cardNumber.slice(-4)},
        Amount: ${amount} ${currency},
        Transaction ID: ${transactionId}`);
        
      return NextResponse.json({
        result: "SUCCESS",
        transaction: {
          id: transactionId,
          type: "PAYMENT",
          amount: parseFloat(amount),
          currency: currency
        },
        response: {
          gatewayCode: "APPROVED"
        }
      });
    } else {
      const failureCause = "CARD_DECLINED";
      const failureExplanation = "The transaction was declined by the issuing bank.";
      console.warn(`Mock Card Payment Failed:
        Card (last 4): ${cardNumber.slice(-4)},
        Amount: ${amount} ${currency},
        Reason: ${failureExplanation}`);

      return NextResponse.json({
        result: "FAILURE",
        error: {
          cause: failureCause,
          explanation: failureExplanation
        },
        response: {
          gatewayCode: "DECLINED_BY_BANK" // Example decline code
        }
      }, { status: 400 }); // Gateway errors are often 4xx
    }

  } catch (error) {
    console.error('Mock Card Payment API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred in card mock.' }, { status: 500 });
  }
}
