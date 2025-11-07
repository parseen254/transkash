// src/app/api/proxy/[[...slug]]/route.ts

import { NextResponse, type NextRequest } from 'next/server';

// Never hardcode secrets. Read from environment with sensible defaults for local dev only.
const FURP_API_BASE_URL = process.env.NEXT_PUBLIC_MITO_BASE_URL || process.env.MITO_API_BASE_URL || 'https://furp02-staging.funtechcom.com/api/v1/mito';
const FURP_API_KEY = process.env.MITO_API_KEY;

async function handler(req: NextRequest) {
  if (!FURP_API_KEY) {
    return NextResponse.json(
      { message: 'MITO API key not configured on server' },
      { status: 500 }
    );
  }
  const { pathname, search } = new URL(req.url);
  // Reconstruct the path to forward to the Furp API
  const apiPath = pathname.replace('/api/proxy', '');
  const apiUrl = `${FURP_API_BASE_URL}${apiPath}${search}`;

  // Create new headers, copying existing ones
  const headers = new Headers(req.headers);

  // Set the host to the target API's host
  headers.set('host', new URL(FURP_API_BASE_URL).host);
  // Add the Furp API key
  headers.set('ApiKey', FURP_API_KEY);
  // Remove headers that should not be forwarded
  headers.delete('cookie');
  // Deleting Content-Length allows the fetch API to set it correctly based on the body.
  // This is a common fix for 502 errors in Node.js-based proxies.
  headers.delete('content-length');

  try {
    const response = await fetch(apiUrl, {
      method: req.method,
      headers: headers,
      body: req.body,
      // IMPORTANT: Duplex must be set for streaming request bodies
      // @ts-ignore
      duplex: 'half',
    });

    // Return the response from the Furp API directly to the client
    return response;
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { message: 'Error forwarding request to the API' },
      { status: 502 } // 502 Bad Gateway is appropriate for a proxy error
    );
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
