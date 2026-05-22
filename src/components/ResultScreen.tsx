import { BASE_CORRECT_POINTS, MAX_TIME_BONUS } from '../game/scoring';
import type { GameMode, PlayerResult } from '../types';

type ResultScreenProps = {
  result: PlayerResult;
  mode: GameMode;
  bestScore: number;
  shareUrl: string;
  challengeCodeInput: string;
  playerName: string;
  submitStatus: 'idle' | 'submitting' | 'success' | 'error';
  submitMessage: string;
  submittedRank: number | null;
  onPlayerNameChange: (value: string) => void;
  onSubmitScore: () => void;
  onCopyChallenge: () => void;
  onChallengeCodeChange: (value: string) => void;
  onJoinChallenge: () => void;
  onNewGame: () => void;
  onReplay: () => void;
};

const MAX_STAR_COUNT = 5;

const getStarRating = (score: number) => {
  if (score >= 900) {
    return 5;
  }

  if (score >= 800) {
    return 4;
  }

  if (score >= 600) {
    return 3;
  }

  if (score >= 400) {
    return 2;
  }

  return 1;
};

const modeLabel = (mode: GameMode) => (mode === 'type' ? 'Name It' : 'Multiple Choice');

export const ResultScreen = ({
  result,
  mode,
  bestScore,
  shareUrl,
  challengeCodeInput,
  playerName,
  submitStatus,
  submitMessage,
  submittedRank,
  onPlayerNameChange,
  onSubmitScore,
  onCopyChallenge,
  onChallengeCodeChange,
  onJoinChallenge,
  onNewGame,
  onReplay,
}: ResultScreenProps) => {
  const correctAnswers = result.answers.filter((answer) => answer.isCorrect).length;
  const averageMs =
    result.answers.reduce((total, answer) => total + answer.elapsedMs, 0) /
    Math.max(1, result.answers.length);
  const starRating = getStarRating(result.totalScore);
  const maxPossibleScore = Math.max(
    1,
    result.answers.length * (BASE_CORRECT_POINTS + MAX_TIME_BONUS),
  );
  const progressPercent = Math.min(100, Math.max(0, (result.totalScore / maxPossibleScore) * 100));

  return (
    <section className="results-card">
      <div className="score-hero">
        <p className="eyebrow">Final score</p>
        <h1>{result.totalScore}</h1>
        <p className="best-score">Best score {bestScore}</p>
      </div>

      <div
        aria-label={`${starRating} out of ${MAX_STAR_COUNT} stars`}
        className="star-rating"
        role="img"
      >
        {Array.from({ length: MAX_STAR_COUNT }, (_, index) => {
          const isEarned = index < starRating;

          return (
            <span
              className={isEarned ? 'star earned' : 'star'}
              key={index}
              style={{ animationDelay: `${index * 120}ms` }}
            >
              ★
            </span>
          );
        })}
      </div>

      <div className="score-flight-path">
        <div className="fuselage-meter" aria-hidden="true">
          <div className="fuselage-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <span>{Math.round(progressPercent)}% of max score</span>
      </div>

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
      </div>

      <form
        className="leaderboard-submit"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitScore();
        }}
      >
        <label>
          Post to leaderboard
          <input
            autoComplete="nickname"
            maxLength={24}
            onChange={(event) => onPlayerNameChange(event.target.value)}
            placeholder="Display name"
            value={playerName}
          />
        </label>
        <button disabled={submitStatus === 'submitting' || submitStatus === 'success'} type="submit">
          {submitStatus === 'submitting'
            ? 'Submitting...'
            : submitStatus === 'success'
              ? 'Score posted'
              : 'Submit score'}
        </button>
      </form>

      {submitStatus === 'success' && submittedRank ? (
        <p className="notice success">
          You ranked #{submittedRank} for {modeLabel(mode)}.
        </p>
      ) : null}
      {submitMessage ? (
        <p className={`notice ${submitStatus === 'error' ? 'error' : ''}`}>{submitMessage}</p>
      ) : null}

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

      <form
        className="challenge-form"
        onSubmit={(event) => {
          event.preventDefault();
          onJoinChallenge();
        }}
      >
        <label>
          Join another multiplayer challenge
          <input
            autoComplete="off"
            inputMode="text"
            onChange={(event) => onChallengeCodeChange(event.target.value)}
            placeholder="Enter challenge code"
            value={challengeCodeInput}
          />
        </label>
        <button className="secondary" type="submit">
          Play code
        </button>
      </form>
    </section>
  );
};
