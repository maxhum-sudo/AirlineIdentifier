import type { GameMode, GameSession, Question } from '../types';
import { isValidShareCode, normalizeShareCode } from '../../shared/session';

export { isValidShareCode, normalizeShareCode };

const createRandomShareCode = () => {
  const value = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
  return normalizeShareCode(value).padEnd(6, 'A');
};

export const createGameSession = (shareCode = createRandomShareCode(), mode: GameMode = 'tail'): GameSession => {
  const normalizedShareCode = normalizeShareCode(shareCode);

  return {
    id: `session-${normalizedShareCode}`,
    shareCode: normalizedShareCode,
    seed: normalizedShareCode,
    mode,
    roundCount: 5,
    questionIds: [],
    createdAt: new Date().toISOString(),
  };
};

export const finalizeSessionQuestions = (
  session: GameSession,
  questions: Question[],
): GameSession => ({
  ...session,
  questionIds: questions.map((question) => question.id),
});

export const readShareCodeFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const shareCode = params.get('challenge');

  if (!shareCode) {
    return null;
  }

  const normalizedShareCode = normalizeShareCode(shareCode);
  return isValidShareCode(normalizedShareCode) ? normalizedShareCode : null;
};

export const readModeFromUrl = (): GameMode => {
  const mode = new URLSearchParams(window.location.search).get('mode');
  return mode === 'type' ? 'type' : 'tail';
};

export const buildShareUrl = (shareCode: string, mode: GameMode = 'tail') => {
  const url = new URL(window.location.href);
  url.searchParams.set('challenge', normalizeShareCode(shareCode));

  if (mode === 'type') {
    url.searchParams.set('mode', 'type');
  } else {
    url.searchParams.delete('mode');
  }

  return url.toString();
};
