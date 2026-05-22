export const QUESTION_TIME_MS = 10_000;
export const BASE_CORRECT_POINTS = 100;
export const MAX_TIME_BONUS = 100;

export type ScoreInput = {
  isCorrect: boolean;
  elapsedMs: number;
  maxTimeMs?: number;
};

export const calculateQuestionScore = ({
  isCorrect,
  elapsedMs,
  maxTimeMs = QUESTION_TIME_MS,
}: ScoreInput) => {
  if (!isCorrect) {
    return 0;
  }

  const remainingRatio = Math.max(0, maxTimeMs - elapsedMs) / maxTimeMs;
  return BASE_CORRECT_POINTS + Math.round(remainingRatio * MAX_TIME_BONUS);
};
