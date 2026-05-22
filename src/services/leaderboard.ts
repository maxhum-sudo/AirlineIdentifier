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

const parseJson = async <T>(response: Response) => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

export const submitScore = async (input: SubmitScoreInput) => {
  const response = await fetch('/api/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = await parseJson<SubmitScoreResponse & { error?: string }>(response);

  if (!response.ok || !payload) {
    throw new Error(payload?.error || 'Unable to submit score.');
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
  const response = await fetch(`/api/leaderboard${query ? `?${query}` : ''}`);
  const payload = await parseJson<LeaderboardResponse>(response);

  if (!payload) {
    throw new Error('Unable to load leaderboard.');
  }

  return payload;
};
