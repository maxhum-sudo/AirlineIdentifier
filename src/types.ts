export type AirlineProductCategory = 'tail' | 'cabin' | 'seat' | 'meal' | 'livery';

export type WikimediaCitation = {
  sourceCategoryTitle: string;
  sourceCategoryUrl: string;
};

export type AirlineProductImage = {
  id: string;
  category: AirlineProductCategory;
  src?: string;
  alt: string;
  citation: WikimediaCitation;
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

export type GameMode = 'tail' | 'type';

export type GameSession = {
  id: string;
  shareCode: string;
  seed: string;
  mode: GameMode;
  roundCount: 5;
  questionIds: string[];
  createdAt: string;
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

export type PlayerResult = {
  sessionId: string;
  playerName?: string;
  answers: PlayerAnswer[];
  totalScore: number;
  completedAt: string;
};

export type LeaderboardEntry = {
  rank: number;
  playerName: string;
  totalScore: number;
  mode: GameMode;
  shareCode: string;
  createdAt: string;
};

export type WikimediaImage = {
  fileTitle: string;
  title: string;
  imageUrl: string;
  pageUrl: string;
  author: string;
  license: string;
  licenseUrl?: string;
  credit?: string;
  attributionText: string;
};
