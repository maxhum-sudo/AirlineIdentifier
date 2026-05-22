import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePostScores } from './_lib/handlers';
import {
  applyCorsPreflightIfNeeded,
  sendWebResponse,
  toWebRequest,
} from './_lib/vercel';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (applyCorsPreflightIfNeeded(request, response)) {
    return;
  }

  const webResponse = await handlePostScores(toWebRequest(request, '/api/scores', true));
  await sendWebResponse(response, webResponse);
}
