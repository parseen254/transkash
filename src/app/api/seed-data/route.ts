import { NextRequest, NextResponse } from 'next/server';
import { seedFirestoreData } from '@/lib/seed';

/**
 * POST /api/seed-data
 * 
 * Seeds dummy data for testing/development
 * 
 * Request body:
 * - userId: string
 * - paymentLinks: number
 * - mpesaPayoutAccounts: number
 * - bankPayoutAccounts: number
 * - transactionsPerLink: number
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      paymentLinks = 5,
      mpesaPayoutAccounts = 1,
      bankPayoutAccounts = 1,
      transactionsPerLink = 3
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const counts = {
      paymentLinks,
      mpesaPayoutAccounts,
      bankPayoutAccounts,
      transactionsPerLink,
    };

    await seedFirestoreData(userId, counts);

    return NextResponse.json({
      success: true,
      message: 'Data seeded successfully',
      counts,
    });

  } catch (error: any) {
    console.error('Error seeding data:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to seed data',
        details: error.stack 
      },
      { status: 500 }
    );
  }
}
