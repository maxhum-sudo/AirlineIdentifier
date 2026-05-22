import type { Airline, GameMode, Question } from './types';
export declare const buildQuestionSet: (airlines: Airline[], seed: string, roundCount: 5, mode?: GameMode) => Question[];
