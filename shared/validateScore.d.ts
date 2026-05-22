import type { GameMode, PlayerAnswer, ScoreSubmission } from './types';
export declare const validateScoreSubmission: (submission: ScoreSubmission) => {
    ok: false;
    error: string;
    shareCode?: undefined;
    mode?: undefined;
    totalScore?: undefined;
    answers?: undefined;
} | {
    ok: true;
    shareCode: string;
    mode: GameMode;
    totalScore: number;
    answers: PlayerAnswer[];
    error?: undefined;
};
