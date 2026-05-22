import type { VercelRequest, VercelResponse } from '@vercel/node';

export const applyCorsPreflightIfNeeded = (
  request: VercelRequest,
  response: VercelResponse,
) => {
  if (request.method !== 'OPTIONS') {
    return false;
  }

  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.status(204).end();
  return true;
};

export const toWebRequest = (
  request: VercelRequest,
  fallbackPath: string,
  includeBody = false,
) => {
  const protocol = request.headers['x-forwarded-proto'] || 'https';
  const host = request.headers.host || 'localhost';
  const url = new URL(request.url || fallbackPath, `${protocol}://${host}`);

  return new Request(url, {
    method: request.method,
    headers: request.headers as HeadersInit,
    body:
      includeBody && request.method === 'POST'
        ? JSON.stringify(request.body ?? {})
        : undefined,
  });
};

export const sendWebResponse = async (
  response: VercelResponse,
  webResponse: Response,
) => {
  response.status(webResponse.status);
  webResponse.headers.forEach((value, key) => {
    response.setHeader(key, value);
  });
  response.send(await webResponse.text());
};
