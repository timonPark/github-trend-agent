import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb, getSetting, getServerAuthKey } from './db';
import { toErrorMessage } from './types/error';

export interface VerifyKeyResult {
  valid: boolean;
  user?: {
    id: string;
    username: string;
  };
  error?: string;
  statusCode?: number;
}

interface ServerVerifyResponse {
  valid?: boolean;
  user?: {
    id: string;
    username: string;
  };
  error?: string;
}

export class UnauthorizedError extends Error {
  constructor(message: string = '401 Unauthorized: Invalid or expired client auth key') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Verify a client auth key directly against the central server.
 */
export async function verifyServerKey(serverUrl: string, clientAuthKey: string): Promise<VerifyKeyResult> {
  const url: string = `${serverUrl.replace(/\/+$/, '')}/api/auth/verify-key`;

  try {
    const res: Response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientAuthKey}`,
      },
      body: JSON.stringify({ client_auth_key: clientAuthKey }),
    });

    const data: ServerVerifyResponse = (await res.json().catch((): ServerVerifyResponse => ({}))) as ServerVerifyResponse;

    if (res.status === 401) {
      const authFailResult: VerifyKeyResult = {
        valid: false,
        statusCode: 401,
        error: data.error || 'Invalid or expired client auth key',
      };
      return authFailResult;
    }

    if (!res.ok) {
      const errResult: VerifyKeyResult = {
        valid: false,
        statusCode: res.status,
        error: data.error || `Server responded with status ${res.status}`,
      };
      return errResult;
    }

    const successResult: VerifyKeyResult = {
      valid: true,
      statusCode: 200,
      user: data.user,
    };
    return successResult;
  } catch (err: unknown) {
    const catchResult: VerifyKeyResult = {
      valid: false,
      statusCode: 500,
      error: toErrorMessage(err),
    };
    return catchResult;
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
  const db: DatabaseInstance = getClientDb(dbPath);
  const serverUrl: string =
    getSetting('server_url', db) || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
  const authKey: string | null = getServerAuthKey(db);

  if (!authKey) {
    throw new UnauthorizedError('Client authentication key is not registered');
  }

  const cleanServerUrl: string = serverUrl.replace(/\/+$/, '');
  const cleanEndpoint: string = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  const fullUrl: string = `${cleanServerUrl}${cleanEndpoint}`;

  const headers: Headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${authKey}`);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response: Response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    throw new UnauthorizedError('401 Unauthorized: Central server rejected client key');
  }

  return response;
}
