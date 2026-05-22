import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleApiRequest } from '../lib/api/handlers';
import {
  applyCorsPreflightIfNeeded,
  sendWebResponse,
  toWebRequest,
} from '../lib/api/vercel';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    if (applyCorsPreflightIfNeeded(request, response)) {
      return;
    }

    const webResponse = await handleApiRequest(
      toWebRequest(request, request.url || '/api', request.method === 'POST'),
    );
    await sendWebResponse(response, webResponse);
  } catch (error) {
    response.status(500);
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.send(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Leaderboard API failed.',
        entries: [],
      }),
    );
  }
}
