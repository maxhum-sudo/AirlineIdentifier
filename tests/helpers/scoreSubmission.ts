import { buildValidationAirlines } from '../../shared/airlineSeeds';
import { buildQuestionSet } from '../../shared/questions';
import { calculateQuestionScore } from '../../shared/scoring';
import type { GameMode, PlayerAnswer } from '../../shared/types';

export const buildValidScoreSubmission = (
  shareCode = 'ABC123',
  mode: GameMode = 'tail',
) => {
  const airlines = buildValidationAirlines();
  const questions = buildQuestionSet(airlines, shareCode, 5, mode);
  const answers: PlayerAnswer[] = questions.map((question) => {
    const elapsedMs = 5_000;
    const isCorrect = true;

    return {
      questionId: question.id,
      selectedAirlineId: question.airlineId,
      correctAirlineId: question.airlineId,
      typedAnswer: mode === 'type' ? airlines.find((airline) => airline.id === question.airlineId)?.name : undefined,
      isCorrect,
      elapsedMs,
      score: calculateQuestionScore({ isCorrect, elapsedMs }),
    };
  });
  const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);

  return {
    playerName: 'Test Pilot',
    shareCode,
    mode,
    totalScore,
    answers,
  };
};
