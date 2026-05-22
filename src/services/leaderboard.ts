import type { GameMode, LeaderboardEntry, PlayerAnswer } from '../types';

export type SubmitScoreInput = {
  playerName: string;
  shareCode: string;
  mode: GameMode;
  totalScore: number;
  answers: PlayerAnswer[];
};

export type SubmitScoreResponse = {
  id: number;
  rank: number;
  playerName: string;
  totalScore: number;
  mode: GameMode;
  shareCode: string;
  createdAt: string;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  error?: string;
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const apiUrl = (path: string) => `${API_BASE}${path}`;

const parseJson = async <T>(response: Response) => {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const unavailableMessage =
  'Leaderboard API is unavailable. Deploy the app to Vercel with DATABASE_URL configured, or set VITE_API_BASE_URL for static hosting.';

export const submitScore = async (input: SubmitScoreInput) => {
  const response = await fetch(apiUrl('/api/scores'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = await parseJson<SubmitScoreResponse & { error?: string }>(response);

  if (!response.ok || !payload) {
    throw new Error(payload?.error || unavailableMessage);
  }

  if ('error' in payload && payload.error) {
    throw new Error(payload.error);
  }

  return payload;
};

export const fetchLeaderboard = async (input?: {
  mode?: GameMode;
  shareCode?: string;
  limit?: number;
}) => {
  const params = new URLSearchParams();

  if (input?.mode) {
    params.set('mode', input.mode);
  }

  if (input?.shareCode) {
    params.set('shareCode', input.shareCode);
  }

  if (input?.limit) {
    params.set('limit', String(input.limit));
  }

  const query = params.toString();
  const response = await fetch(apiUrl(`/api/leaderboard${query ? `?${query}` : ''}`));
  const payload = await parseJson<LeaderboardResponse>(response);

  if (!payload) {
    throw new Error(unavailableMessage);
  }

  return payload;
};
