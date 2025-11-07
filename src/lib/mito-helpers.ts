/**
 * MITO API Helper Functions
 * 
 * These functions interact with MITO's API through the existing /api/proxy endpoint.
 * All payments go to the Upesi account in MITO (configured in MITO dashboard).
 * 
 * Key environment variables (set in .env.local):
 * - NEXT_PUBLIC_MITO_API_BASE_URL: Base URL for MITO API
 * - MITO_API_KEY: API key for authentication
 * - MITO_USERNAME: Username for login
 * - MITO_PASSWORD: Password for login
 * - MITO_BENEFICIARY_ID: Upesi account beneficiary ID (where all payments go)
 */

import axios from 'axios';

// Service-level MITO auth (PSP) - cached in memory on the server
let cachedToken: string | null = null;
let tokenExpiresAtMs = 0;

/**
 * Get base URL for MITO proxy
 * In server-side context (API routes), use full URL with APP_URL
 * In client-side context (browser), use relative URL
 */
function getProxyBaseUrl(): string {
  // Check if running on server (Node.js) or client (browser)
  if (typeof window === 'undefined') {
    // Server-side: use full URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${appUrl}/api/proxy`;
  }
  // Client-side: use relative URL
  return '/api/proxy';
}

async function getMitoServiceToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && tokenExpiresAtMs - now > 60_000) {
    return cachedToken;
  }

  const username = process.env.MITO_USERNAME;
  const password = process.env.MITO_PASSWORD;
  const accessServiceNumber = process.env.MITO_ACCESS_SERVICE_NUMBER;
  const accessAffiliateNumber = process.env.MITO_ACCESS_AFFILIATE_NUMBER;

  if (!username || !password || !accessServiceNumber || !accessAffiliateNumber) {
    throw new Error('MITO service credentials are not fully configured on the server');
  }

  // Login via proxy (ApiKey is added by proxy)
  const proxyBaseUrl = getProxyBaseUrl();
  const res = await axios.post(`${proxyBaseUrl}/auth/login`, {
    username,
    password,
    AccessServiceNumber: accessServiceNumber,
    AccessAffiliateNumber: accessAffiliateNumber,
  });

  const token = res.data?.data?.token as string | undefined;
  const expiresOn = res.data?.data?.expiresOn as string | undefined;
  if (!token || !expiresOn) {
    throw new Error('Failed to obtain MITO service token');
  }

  cachedToken = token;
  tokenExpiresAtMs = new Date(expiresOn).getTime();
  return cachedToken;
}

// Create MITO API client - baseURL determined dynamically per request
function createMitoClient() {
  return axios.create({
    baseURL: getProxyBaseUrl(),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Get client instance with interceptors
function getMitoClient() {
  const client = createMitoClient();
  
  // Attach Authorization automatically
  client.interceptors.request.use(async (config) => {
    try {
      const token = await getMitoServiceToken();
      if (token) {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      // Let the request proceed; downstream will throw a clearer error
      // This keeps resiliency in case an endpoint doesn't require auth
    }
    return config;
  });

  // Add response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('MITO API Error:', error.response?.data || error.message);
      throw error;
    }
  );

  return client;
}

/**
 * Get available payment providers for a specific country, currency, and service
 */
export async function getProviders(params: {
  countryIso3: string;
  currencyCode: string;
  serviceCode: 'MOBILETOPUP' | 'MONEYTRANSFER' | 'BILLPAYMENT';
  collectionMode?: 'MOBILEMONEY' | 'BANKACCOUNT' | 'CASH';
}) {
  const mitoClient = getMitoClient();
  const response = await mitoClient.get('/lookups/provider', {
    params: {
      countryiso3: params.countryIso3,
      CurrencyCode: params.currencyCode,
      ServiceCode: params.serviceCode,
      ...(params.collectionMode && { CollectionMode: params.collectionMode }),
    },
  });
  
  return response.data.data || [];
}

/**
 * Get available corridors (currency pairs supported)
 */
export async function getCorridors(params: {
  serviceCode: 'MOBILETOPUP' | 'MONEYTRANSFER' | 'BILLPAYMENT';
}) {
  const mitoClient = getMitoClient();
  const response = await mitoClient.get('/exchange/Corridors', {
    params: {
      ServiceCode: params.serviceCode,
    },
  });
  
  return response.data.data || [];
}

/**
 * Validate exchange rate and get rate ID
 */
export async function validateRate(params: {
  userId: string;
  serviceCode: 'MOBILETOPUP' | 'MONEYTRANSFER' | 'BILLPAYMENT';
  collectionMode: 'MOBILEMONEY' | 'BANKACCOUNT' | 'CASH';
  fromCountry: string;
  toCountry: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  direction: 'S' | 'R'; // S = Send, R = Receive
  providerId: string;
}) {
  const mitoClient = getMitoClient();
  const response = await mitoClient.post('/exchange/rates', params);
  
  return response.data.data;
}

/**
 * Initiate a transaction with MITO
 * This returns a PaymentUrl where the customer completes payment
 */
export async function initiateTransaction(params: {
  serviceCode: 'MOBILETOPUP' | 'MONEYTRANSFER' | 'BILLPAYMENT';
  collectionMode: 'MOBILEMONEY' | 'BANKACCOUNT' | 'CASH';
  sendCountryIso3: string;
  receiveCountryIso3: string;
  sendCurrency: string;
  receiveCurrency: string;
  sendAmount: number;
  rateId: string;
  providerId: string;
  userId: string;
  beneficiaryId: string; // Upesi account beneficiary ID
  partnerReferenceNumber: string; // Unique reference for idempotency
  successUrl: string;
  cancelUrl: string;
  failureUrl: string;
  webhookUrl: string;
  reasonId?: string;
  sourceOfFundId?: string;
  paymentNarration?: string;
}) {
  const mitoClient = getMitoClient();
  const response = await mitoClient.post('/transactions', {
    serviceCode: params.serviceCode,
    collectionMode: params.collectionMode,
    sendCountryIso3: params.sendCountryIso3,
    receiveCountryIso3: params.receiveCountryIso3,
    sendCurrency: params.sendCurrency,
    receiveCurrency: params.receiveCurrency,
    sendAmount: params.sendAmount,
    rateId: params.rateId,
    providerId: params.providerId,
    userId: params.userId,
    beneficiaryId: params.beneficiaryId,
    PartnerReferenceNumber: params.partnerReferenceNumber,
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl,
    failureUrl: params.failureUrl,
    webhookUrl: params.webhookUrl,
    ...(params.reasonId && { reasonId: params.reasonId }),
    ...(params.sourceOfFundId && { sourceOfFundId: params.sourceOfFundId }),
    ...(params.paymentNarration && { paymentNarration: params.paymentNarration }),
  });
  
  return response.data.data;
}

/**
 * Get transaction status by reference
 */
export async function getTransactionByReference(params: {
  reference?: string;
  partnerReferenceNumber?: string;
}) {
  const mitoClient = getMitoClient();
  const response = await mitoClient.get('/transactions/by-reference', {
    params,
  });
  
  return response.data.data;
}

/**
 * Get all transactions for a user
 */
export async function getTransactions(params: {
  userId: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  pageNo?: number;
  pageSize?: number;
}) {
  const mitoClient = getMitoClient();
  const response = await mitoClient.get('/transactions', {
    params: {
      userId: params.userId,
      ...(params.fromDate && { fromDate: params.fromDate }),
      ...(params.toDate && { toDate: params.toDate }),
      PageNo: params.pageNo || 1,
      PageSize: params.pageSize || 10,
    },
  });
  
  return response.data.data;
}
