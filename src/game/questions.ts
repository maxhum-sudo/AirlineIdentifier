import type { Airline, Question } from '../types';
import { shuffleSeeded } from './random';

const ANSWER_OPTION_COUNT = 4;

export const buildQuestionSet = (
  airlines: Airline[],
  seed: string,
  roundCount: 5,
): Question[] => {
  const candidates = airlines.filter((airline) =>
    airline.images.some((image) => image.category === 'tail'),
  );
  const selectedAirlines = shuffleSeeded(candidates, `${seed}:questions`).slice(0, roundCount);

  return selectedAirlines.map((airline, index) => {
    const distractors = shuffleSeeded(
      candidates.filter((candidate) => candidate.id !== airline.id),
      `${seed}:${airline.id}:options`,
    )
      .slice(0, ANSWER_OPTION_COUNT - 1)
      .map((candidate) => candidate.id);

    const optionAirlineIds = shuffleSeeded(
      [airline.id, ...distractors],
      `${seed}:${airline.id}:shuffle-options`,
    );

    return {
      id: `${seed}-${index + 1}-${airline.id}`,
      airlineId: airline.id,
      imageId: `${airline.id}-tail`,
      optionAirlineIds,
    };
  });
};
