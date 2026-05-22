import type { Airline } from './types';

const normalizeAnswer = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');

export const isTypedAnswerCorrect = (input: string, airline: Airline) => {
  const normalized = normalizeAnswer(input);

  if (!normalized) {
    return false;
  }

  if (airline.iata && normalized === airline.iata.toLowerCase()) {
    return true;
  }

  if (airline.icao && normalized === airline.icao.toLowerCase()) {
    return true;
  }

  return normalized === normalizeAnswer(airline.name);
};
