import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePostScores } from '../server/apiHandlers.ts';

const toWebRequest = (request: VercelRequest) => {
  const protocol = request.headers['x-forwarded-proto'] || 'https';
  const host = request.headers.host || 'localhost';
  const url = new URL(request.url || '/api/scores', `${protocol}://${host}`);

  return new Request(url, {
    method: request.method,
    headers: request.headers as HeadersInit,
    body: request.method === 'POST' ? JSON.stringify(request.body) : undefined,
  });
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.status(204).end();
    return;
  }

  const webResponse = await handlePostScores(toWebRequest(request));
  response.status(webResponse.status);
  webResponse.headers.forEach((value, key) => {
    response.setHeader(key, value);
  });
  response.send(await webResponse.text());
}
