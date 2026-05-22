import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetLeaderboard } from './_lib/handlers';
import {
  applyCorsPreflightIfNeeded,
  sendWebResponse,
  toWebRequest,
} from './_lib/vercel';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (applyCorsPreflightIfNeeded(request, response)) {
    return;
  }

  const webResponse = await handleGetLeaderboard(toWebRequest(request, '/api/leaderboard'));
  await sendWebResponse(response, webResponse);
}
