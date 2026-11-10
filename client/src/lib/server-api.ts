import { getClientDb, getSetting, getServerAuthKey } from './db';

export interface VerifyKeyResult {
  valid: boolean;
  user?: {
    id: string;
    username: string;
  };
  error?: string;
  statusCode?: number;
}

export class UnauthorizedError extends Error {
  constructor(message = '401 Unauthorized: Invalid or expired client auth key') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Verify a client auth key directly against the central server.
 */
export async function verifyServerKey(serverUrl: string, clientAuthKey: string): Promise<VerifyKeyResult> {
  const url = `${serverUrl.replace(/\/+$/, '')}/api/auth/verify-key`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientAuthKey}`,
      },
      body: JSON.stringify({ client_auth_key: clientAuthKey }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      return {
        valid: false,
        statusCode: 401,
        error: data.error || 'Invalid or expired client auth key',
      };
    }

    if (!res.ok) {
      return {
        valid: false,
        statusCode: res.status,
        error: data.error || `Server responded with status ${res.status}`,
      };
    }

    return {
      valid: true,
      statusCode: 200,
      user: data.user,
    };
  } catch (err: any) {
    return {
      valid: false,
      statusCode: 500,
      error: err.message || 'Failed to connect to central server',
    };
  }
}

/**
 * Client helper to make authenticated requests to central server.
 * Throws UnauthorizedError on 401 to trigger navigation to settings.
 */
export async function fetchWithServerAuth(
  dbPath: string | undefined,
  endpointPath: string,
  options: RequestInit = {}
): Promise<Response> {
  const db = getClientDb(dbPath);
  const serverUrl = getSetting('server_url', db) || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
  const authKey = getServerAuthKey(db);

  if (!authKey) {
    throw new UnauthorizedError('Client authentication key is not registered');
  }

  const cleanServerUrl = serverUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  const fullUrl = `${cleanServerUrl}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${authKey}`);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    throw new UnauthorizedError('401 Unauthorized: Central server rejected client key');
  }

  return response;
}
