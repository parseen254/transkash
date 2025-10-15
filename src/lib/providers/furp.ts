// Furp provider adapter: maps our domain to Furp API and vice versa.
// Keeps our system provider-agnostic by exposing a small interface.

import { z } from 'zod';

const FURP_BASE_URL = process.env.FURP_BASE_URL || 'https://furp02-staging.funtechcom.com/api/v1';
const FURP_API_KEY = process.env.FURP_API_KEY; // for /auth/login header ApiKey
const FURP_USERNAME = process.env.FURP_USERNAME; // service account username
const FURP_PASSWORD = process.env.FURP_PASSWORD; // service account password
const FURP_ACCESS_SERVICE_NUMBER = process.env.FURP_ACCESS_SERVICE_NUMBER; // optional per spec
const FURP_ACCESS_AFFILIATE_NUMBER = process.env.FURP_ACCESS_AFFILIATE_NUMBER; // optional per spec

// Simple in-memory token cache for the current runtime
let cachedToken: { token: string; expiresOn: number } | null = null;

const LoginResponseSchema = z.object({
  data: z.object({
    token: z.string(),
    issuedOn: z.string().optional(),
    expiresOn: z.string().optional(),
    refreshToken: z.string().optional(),
  }),
});

async function furpLogin(): Promise<string> {
  if (!FURP_API_KEY || !FURP_USERNAME || !FURP_PASSWORD) {
    throw new Error('FURP credentials missing. Set FURP_API_KEY, FURP_USERNAME, FURP_PASSWORD');
  }

  // Use cached token if not expired (assume 50 min TTL if expiresOn missing)
  if (cachedToken && cachedToken.expiresOn > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const body: Record<string, string> = {
    username: FURP_USERNAME,
    password: FURP_PASSWORD,
  };
  if (FURP_ACCESS_SERVICE_NUMBER) body['AccessServiceNumber'] = FURP_ACCESS_SERVICE_NUMBER;
  if (FURP_ACCESS_AFFILIATE_NUMBER) body['AccessAffiliateNumber'] = FURP_ACCESS_AFFILIATE_NUMBER;

  const res = await fetch(`${FURP_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ApiKey': FURP_API_KEY,
    },
    body: JSON.stringify(body),
    // Next.js route handlers run on the server; this is safe server-side
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Furp login failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  const parsed = LoginResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error('Unexpected Furp login response shape');
  }

  const token = parsed.data.data.token;
  // Set expiry ~50 minutes from now as a conservative default
  const expiresOn = Date.now() + 50 * 60 * 1000;
  cachedToken = { token, expiresOn };
  return token;
}

async function furpFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await furpLogin();
  const url = `${FURP_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Furp request failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Public adapter surface kept small and provider-agnostic where possible
export type RateValidationInput = {
  userId: string;
  fromCountry: string; // ISO3
  toCountry: string;   // ISO3
  fromCurrency: string; // ISO 4217
  toCurrency: string;   // ISO 4217
  amount: number;
  direction: 'S' | 'R';
  serviceCode: 'MOBILETOPUP' | 'MONEYTRANSFER' | 'BILLPAYMENT';
  providerId: string; // from /lookups/provider
  collectionMode?: 'MOBILEMONEY' | 'BANKACCOUNT' | 'CASH';
};

export type RateValidationResult = {
  id?: string;
  rate: number;
  sendAmount: number;
  receiveAmount: number;
  commission?: number;
  isKycRequired?: boolean;
};

export async function validateRate(input: RateValidationInput): Promise<RateValidationResult> {
  const payload: any = {
    userId: input.userId,
    fromCountry: input.fromCountry,
    toCountry: input.toCountry,
    fromCurrency: input.fromCurrency,
    toCurrency: input.toCurrency,
    amount: input.amount,
    direction: input.direction,
    serviceCode: input.serviceCode,
    providerId: input.providerId,
  };
  if (input.collectionMode) payload.collectionMode = input.collectionMode;

  const json = await furpFetch<any>('/exchange/rates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = json?.data || {};
  return {
    id: data.id,
    rate: Number(data.rate ?? 0),
    sendAmount: Number(data.sendAmount ?? input.amount),
    receiveAmount: Number(data.receiveAmount ?? 0),
    commission: data.commission ? Number(data.commission) : undefined,
    isKycRequired: data.isKycRequired,
  };
}

export type InitiateCollectionInput = {
  userId: string;
  providerId: string;
  serviceCode: 'MOBILETOPUP' | 'MONEYTRANSFER' | 'BILLPAYMENT';
  collectionMode: 'MOBILEMONEY' | 'BANKACCOUNT' | 'CASH';
  sendCountryIso3: string;
  receiveCountryIso3: string;
  sendCurrency: string;
  receiveCurrency: string;
  sendAmount: number;
  rateId: string; // from validateRate
  partnerReferenceNumber: string; // our idempotency key (map to Transaction.id)
  successUrl: string;
  cancelUrl: string;
  failureUrl: string;
  redirectUrl?: string; // optional per spec
  beneficiaryId?: string;
  reasonId?: string;
  sourceOfFundId?: string;
  webhookUrl: string; // where provider posts status updates
};

export type InitiateCollectionResult = {
  reference?: string;
  status?: string;
  paymentUrl?: string;
};

export async function initiateCollection(input: InitiateCollectionInput): Promise<InitiateCollectionResult> {
  const payload: any = {
    serviceCode: input.serviceCode,
    collectionMode: input.collectionMode,
    PartnerReferenceNumber: input.partnerReferenceNumber,
    userId: input.userId,
    beneficiaryId: input.beneficiaryId,
    sendCountryIso3: input.sendCountryIso3,
    receiveCountryIso3: input.receiveCountryIso3,
    sendCurrency: input.sendCurrency,
    receiveCurrency: input.receiveCurrency,
    sendAmount: input.sendAmount,
    rateId: input.rateId,
    providerId: input.providerId,
    redirectUrl: input.redirectUrl || input.successUrl,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    failureUrl: input.failureUrl,
    webhookUrl: input.webhookUrl,
  };
  if (input.reasonId) payload.reasonId = input.reasonId;
  if (input.sourceOfFundId) payload.sourceOfFundId = input.sourceOfFundId;

  const json = await furpFetch<any>('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = json?.data || {};
  return {
    reference: data.reference,
    status: data.status,
    paymentUrl: data.PaymentUrl,
  };
}

export type ProviderStatus = 'PROCESSED' | 'AWAITINGAFFILIATEUPDATE' | 'INREVIEW' | 'FAILED' | 'CANCELLED' | 'INPROGRESS' | 'NEW';

// Map Furp status to our Transaction.status
export function mapProviderStatusToLocal(status?: ProviderStatus): 'Completed' | 'Pending' | 'Failed' {
  switch (status) {
    case 'PROCESSED':
      return 'Completed';
    case 'FAILED':
    case 'CANCELLED':
      return 'Failed';
    case 'AWAITINGAFFILIATEUPDATE':
    case 'INREVIEW':
    case 'INPROGRESS':
    case 'NEW':
    default:
      return 'Pending';
  }
}
