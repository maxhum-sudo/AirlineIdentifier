import type { PlayerResult } from '../types';

type ResultScreenProps = {
  result: PlayerResult;
  bestScore: number;
  shareUrl: string;
  onCopyChallenge: () => void;
  onNewGame: () => void;
  onReplay: () => void;
};

export const ResultScreen = ({
  result,
  bestScore,
  shareUrl,
  onCopyChallenge,
  onNewGame,
  onReplay,
}: ResultScreenProps) => {
  const correctAnswers = result.answers.filter((answer) => answer.isCorrect).length;
  const averageMs =
    result.answers.reduce((total, answer) => total + answer.elapsedMs, 0) /
    Math.max(1, result.answers.length);

  return (
    <section className="results-card">
      <p className="eyebrow">Final score</p>
      <h1>{result.totalScore}</h1>

      <div className="stats-grid">
        <div>
          <strong>
            {correctAnswers}/{result.answers.length}
          </strong>
          <span>Accuracy</span>
        </div>
        <div>
          <strong>{(averageMs / 1000).toFixed(1)}s</strong>
          <span>Avg answer</span>
        </div>
        <div>
          <strong>{bestScore}</strong>
          <span>Best score</span>
        </div>
      </div>

      <label className="share-field">
        Challenge link
        <input readOnly value={shareUrl} />
      </label>

      <div className="action-row">
        <button onClick={onCopyChallenge} type="button">
          Copy link
        </button>
        <button onClick={onReplay} type="button">
          Replay
        </button>
        <button className="secondary" onClick={onNewGame} type="button">
          New game
        </button>
      </div>
    </section>
  );
};
