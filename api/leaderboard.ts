import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetLeaderboard } from '../server/apiHandlers';

const toWebRequest = (request: VercelRequest) => {
  const protocol = request.headers['x-forwarded-proto'] || 'https';
  const host = request.headers.host || 'localhost';
  const url = new URL(request.url || '/api/leaderboard', `${protocol}://${host}`);

  return new Request(url, {
    method: request.method,
    headers: request.headers as HeadersInit,
  });
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const webResponse = await handleGetLeaderboard(toWebRequest(request));
  response.status(webResponse.status);
  webResponse.headers.forEach((value, key) => {
    response.setHeader(key, value);
  });
  response.send(await webResponse.text());
}
