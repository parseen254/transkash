import { NextRequest, NextResponse } from 'next/server';
import { getProviders } from '@/lib/mito-helpers';

/**
 * GET /api/mito/providers
 * 
 * Fetches available payment providers for a country/currency/service combination
 * 
 * Query params:
 * - country: ISO3 country code (NGA, KEN, GHA, etc.)
 * - currency: Currency code (NGN, KES, GHS, etc.)
 * - service: Service code (MONEYTRANSFER, BILLPAYMENT, MOBILETOPUP)
 * - collectionMode: Optional (MOBILEMONEY, BANKACCOUNT, CASH)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const currency = searchParams.get('currency');
    const service = searchParams.get('service') as 'MONEYTRANSFER' | 'BILLPAYMENT' | 'MOBILETOPUP' | null;
    const collectionMode = searchParams.get('collectionMode') as 'MOBILEMONEY' | 'BANKACCOUNT' | 'CASH' | null;

    // Validate required params
    if (!country || !currency || !service) {
      return NextResponse.json(
        { error: 'Missing required parameters: country, currency, service' },
        { status: 400 }
      );
    }

    // Validate service code
    if (!['MONEYTRANSFER', 'BILLPAYMENT', 'MOBILETOPUP'].includes(service)) {
      return NextResponse.json(
        { error: 'Invalid service code. Must be MONEYTRANSFER, BILLPAYMENT, or MOBILETOPUP' },
        { status: 400 }
      );
    }

    const params: any = {
      countryIso3: country.toUpperCase(),
      currencyCode: currency.toUpperCase(),
      serviceCode: service,
    };

    if (collectionMode) {
      params.collectionMode = collectionMode;
    }

    const providers = await getProviders(params);

    return NextResponse.json({
      success: true,
      count: providers.length,
      providers,
      query: {
        country: country.toUpperCase(),
        currency: currency.toUpperCase(),
        service,
        collectionMode: collectionMode || 'any',
      },
    });

  } catch (error: any) {
    console.error('Error fetching MITO providers:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch providers',
        details: error.response?.data 
      },
      { status: 500 }
    );
  }
}
