export type GameMode = 'tail' | 'type';
export type AirlineProductCategory = 'tail' | 'cabin' | 'seat' | 'meal' | 'livery';
export type AirlineProductImage = {
    id: string;
    category: AirlineProductCategory;
    src?: string;
    alt: string;
    selectedFileTitle?: string;
    licensePath?: string;
};
export type Airline = {
    id: string;
    name: string;
    country: string;
    iata?: string;
    icao?: string;
    images: AirlineProductImage[];
};
export type Question = {
    id: string;
    airlineId: string;
    imageId: string;
    optionAirlineIds: string[];
};
export type PlayerAnswer = {
    questionId: string;
    selectedAirlineId: string | null;
    typedAnswer?: string;
    correctAirlineId: string;
    isCorrect: boolean;
    elapsedMs: number;
    score: number;
};
export type LeaderboardEntry = {
    rank: number;
    playerName: string;
    totalScore: number;
    mode: GameMode;
    shareCode: string;
    createdAt: string;
};
export type ScoreSubmission = {
    playerName: string;
    shareCode: string;
    mode: GameMode;
    totalScore: number;
    answers: PlayerAnswer[];
};
