export declare const QUESTION_TIME_MS = 10000;
export declare const BASE_CORRECT_POINTS = 100;
export declare const MAX_TIME_BONUS = 100;
export type ScoreInput = {
    isCorrect: boolean;
    elapsedMs: number;
    maxTimeMs?: number;
};
export declare const calculateQuestionScore: ({ isCorrect, elapsedMs, maxTimeMs, }: ScoreInput) => number;
