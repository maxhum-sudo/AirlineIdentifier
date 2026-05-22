import { afterEach, describe, expect, it } from 'vitest';
import {
  handleApiRequest,
  handleGetLeaderboard,
  handlePostScores,
} from '../lib/api/handlers';
import { validateScoreSubmission } from '../shared/validateScore';
import { buildValidScoreSubmission } from './helpers/scoreSubmission';

const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

describe('validateScoreSubmission', () => {
  it('accepts a valid tail-mode submission', () => {
    const submission = buildValidScoreSubmission('ABC123', 'tail');
    const result = validateScoreSubmission(submission);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.totalScore).toBe(submission.totalScore);
      expect(result.shareCode).toBe('ABC123');
    }
  });

  it('rejects tampered scores', () => {
    const submission = buildValidScoreSubmission('ABC123', 'tail');
    submission.totalScore += 100;

    const result = validateScoreSubmission(submission);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('total score');
    }
  });
});

describe('leaderboard API handlers', () => {
  it('returns JSON when the database is not configured', async () => {
    delete process.env.DATABASE_URL;

    const response = await handleGetLeaderboard(new Request('http://localhost/api/leaderboard'));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(payload.error).toBe('Leaderboard is not configured yet.');
    expect(payload.entries).toEqual([]);
  });

  it('rejects incomplete score submissions before hitting the database', async () => {
    delete process.env.DATABASE_URL;

    const response = await handlePostScores(
      new Request('http://localhost/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: 'Test Pilot',
          shareCode: 'ABC123',
          mode: 'tail',
          totalScore: 0,
          answers: [],
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('five answers');
  });

  it('returns a configured leaderboard error for valid submissions without DATABASE_URL', async () => {
    delete process.env.DATABASE_URL;

    const submission = buildValidScoreSubmission('ABC123', 'tail');
    const response = await handlePostScores(
      new Request('http://localhost/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toBe('Leaderboard is not configured yet.');
  });

  it('handles CORS preflight requests', async () => {
    const response = await handleApiRequest(
      new Request('http://localhost/api/scores', { method: 'OPTIONS' }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
