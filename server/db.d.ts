import type { GameMode, PlayerAnswer } from '../shared/types';
export type StoredScore = {
    id: number;
    playerName: string;
    shareCode: string;
    mode: GameMode;
    totalScore: number;
    answers: PlayerAnswer[];
    createdAt: string;
};
export declare const insertScore: (input: {
    playerName: string;
    shareCode: string;
    mode: GameMode;
    totalScore: number;
    answers: PlayerAnswer[];
}) => Promise<{
    id: number;
    playerName: string;
    shareCode: string;
    mode: GameMode;
    totalScore: number;
    answers: PlayerAnswer[];
    createdAt: string;
}>;
export declare const fetchLeaderboard: (input: {
    mode?: GameMode;
    shareCode?: string;
    limit?: number;
}) => Promise<{
    rank: number;
    playerName: string;
    totalScore: number;
    mode: GameMode;
    shareCode: string;
    createdAt: string;
}[]>;
export declare const fetchRankForScore: (input: {
    mode: GameMode;
    shareCode?: string;
    totalScore: number;
    createdAt: string;
}) => Promise<number>;
