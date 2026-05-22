import { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../services/leaderboard';
import type { GameMode, LeaderboardEntry } from '../types';

type LeaderboardPanelProps = {
  mode: GameMode;
  shareCode?: string;
  refreshKey?: number;
  compact?: boolean;
};

type LeaderboardScope = 'global' | 'challenge';

export const LeaderboardPanel = ({
  mode,
  shareCode,
  refreshKey = 0,
  compact = false,
}: LeaderboardPanelProps) => {
  const [scope, setScope] = useState<LeaderboardScope>(shareCode ? 'challenge' : 'global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'unconfigured'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      setStatus('loading');

      try {
        const response = await fetchLeaderboard({
          mode,
          shareCode: scope === 'challenge' ? shareCode : undefined,
          limit: compact ? 5 : 10,
        });

        if (cancelled) {
          return;
        }

        if (response.error?.includes('not configured')) {
          setStatus('unconfigured');
          setEntries([]);
          setMessage('Leaderboard will appear once the database is connected in production.');
          return;
        }

        setEntries(response.entries);
        setStatus('ready');
        setMessage(response.entries.length ? '' : 'No scores yet. Be the first to post one.');
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus('error');
        setEntries([]);
        setMessage(error instanceof Error ? error.message : 'Unable to load leaderboard.');
      }
    };

    void loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [compact, mode, refreshKey, scope, shareCode]);

  return (
    <section className={`leaderboard-panel ${compact ? 'compact' : ''}`}>
      <div className="leaderboard-header">
        <div>
          <p className="eyebrow">Leaderboard</p>
          <h2>{scope === 'challenge' ? 'This challenge' : 'Global top scores'}</h2>
        </div>
        {shareCode ? (
          <div className="leaderboard-tabs" role="tablist" aria-label="Leaderboard scope">
            <button
              aria-selected={scope === 'global'}
              className={scope === 'global' ? 'selected' : ''}
              onClick={() => setScope('global')}
              role="tab"
              type="button"
            >
              Global
            </button>
            <button
              aria-selected={scope === 'challenge'}
              className={scope === 'challenge' ? 'selected' : ''}
              onClick={() => setScope('challenge')}
              role="tab"
              type="button"
            >
              Challenge
            </button>
          </div>
        ) : null}
      </div>

      {status === 'loading' ? <p className="leaderboard-message">Loading scores...</p> : null}
      {status !== 'loading' && message ? <p className="leaderboard-message">{message}</p> : null}

      {entries.length ? (
        <ol className="leaderboard-list">
          {entries.map((entry) => (
            <li key={`${entry.rank}-${entry.playerName}-${entry.createdAt}`}>
              <span className="leaderboard-rank">#{entry.rank}</span>
              <div className="leaderboard-player">
                <strong>{entry.playerName}</strong>
                <span>{entry.mode === 'type' ? 'Name It' : 'Multiple Choice'}</span>
              </div>
              <span className="leaderboard-score">{entry.totalScore}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
};
