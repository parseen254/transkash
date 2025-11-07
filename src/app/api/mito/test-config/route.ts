import { NextRequest, NextResponse } from 'next/server';
import { getProviders, getCorridors } from '@/lib/mito-helpers';

/**
 * GET /api/mito/test-config
 * 
 * Test endpoint to check what MITO services are available for Upesi account
 * This helps debug corridor and provider issues
 */
export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [],
  };

  try {
    // Test 1: Get corridors
    results.tests.push({
      name: 'Get Corridors',
      status: 'testing',
    });
    
    try {
      const corridors = await getCorridors({ serviceCode: 'MONEYTRANSFER' });
      results.tests[results.tests.length - 1].status = 'success';
      results.tests[results.tests.length - 1].data = corridors;
      results.tests[results.tests.length - 1].count = corridors.length;
    } catch (error: any) {
      results.tests[results.tests.length - 1].status = 'error';
      results.tests[results.tests.length - 1].error = error.message;
    }

    // Test 2: Get KES providers (BANKACCOUNT)
    results.tests.push({
      name: 'KES Providers - BANKACCOUNT',
      status: 'testing',
    });
    
    try {
      const providers = await getProviders({
        countryIso3: 'KEN',
        currencyCode: 'KES',
        serviceCode: 'MONEYTRANSFER',
        collectionMode: 'BANKACCOUNT',
      });
      results.tests[results.tests.length - 1].status = 'success';
      results.tests[results.tests.length - 1].data = providers;
      results.tests[results.tests.length - 1].count = providers.length;
    } catch (error: any) {
      results.tests[results.tests.length - 1].status = 'error';
      results.tests[results.tests.length - 1].error = error.message;
    }

    // Test 3: Get KES providers (MOBILEMONEY)
    results.tests.push({
      name: 'KES Providers - MOBILEMONEY',
      status: 'testing',
    });
    
    try {
      const providers = await getProviders({
        countryIso3: 'KEN',
        currencyCode: 'KES',
        serviceCode: 'MONEYTRANSFER',
        collectionMode: 'MOBILEMONEY',
      });
      results.tests[results.tests.length - 1].status = 'success';
      results.tests[results.tests.length - 1].data = providers;
      results.tests[results.tests.length - 1].count = providers.length;
    } catch (error: any) {
      results.tests[results.tests.length - 1].status = 'error';
      results.tests[results.tests.length - 1].error = error.message;
    }

    // Test 4: Try USD providers
    results.tests.push({
      name: 'USD Providers - BANKACCOUNT',
      status: 'testing',
    });
    
    try {
      const providers = await getProviders({
        countryIso3: 'USA',
        currencyCode: 'USD',
        serviceCode: 'MONEYTRANSFER',
        collectionMode: 'BANKACCOUNT',
      });
      results.tests[results.tests.length - 1].status = 'success';
      results.tests[results.tests.length - 1].data = providers;
      results.tests[results.tests.length - 1].count = providers.length;
    } catch (error: any) {
      results.tests[results.tests.length - 1].status = 'error';
      results.tests[results.tests.length - 1].error = error.message;
    }

    // Test 5: Try GBP providers
    results.tests.push({
      name: 'GBP Providers - BANKACCOUNT',
      status: 'testing',
    });
    
    try {
      const providers = await getProviders({
        countryIso3: 'GBR',
        currencyCode: 'GBP',
        serviceCode: 'MONEYTRANSFER',
        collectionMode: 'BANKACCOUNT',
      });
      results.tests[results.tests.length - 1].status = 'success';
      results.tests[results.tests.length - 1].data = providers;
      results.tests[results.tests.length - 1].count = providers.length;
    } catch (error: any) {
      results.tests[results.tests.length - 1].status = 'error';
      results.tests[results.tests.length - 1].error = error.message;
    }

    // Summary
    const successTests = results.tests.filter((t: any) => t.status === 'success' && t.count > 0);
    results.summary = {
      totalTests: results.tests.length,
      successfulTests: successTests.length,
      availableProviders: successTests.reduce((sum: number, t: any) => sum + (t.count || 0), 0),
      recommendation: successTests.length > 0 
        ? `Use ${successTests[0].name} for UAT testing`
        : 'No providers available - account may need MITO configuration',
    };

    return NextResponse.json(results);

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Failed to test MITO configuration',
        message: error.message,
        results 
      },
      { status: 500 }
    );
  }
}
