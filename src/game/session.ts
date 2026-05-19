import type { GameSession, Question } from '../types';

const SHARE_CODE_PATTERN = /^[A-Z0-9-]{4,32}$/;

export const normalizeShareCode = (shareCode: string) =>
  shareCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

export const isValidShareCode = (shareCode: string) => SHARE_CODE_PATTERN.test(normalizeShareCode(shareCode));

const createRandomShareCode = () => {
  const value = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
  return normalizeShareCode(value).padEnd(6, 'A');
};

export const createGameSession = (shareCode = createRandomShareCode()): GameSession => {
  const normalizedShareCode = normalizeShareCode(shareCode);

  return {
    id: `session-${normalizedShareCode}`,
    shareCode: normalizedShareCode,
    seed: normalizedShareCode,
    mode: 'tail',
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
  return SHARE_CODE_PATTERN.test(normalizedShareCode) ? normalizedShareCode : null;
};

export const buildShareUrl = (shareCode: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set('challenge', normalizeShareCode(shareCode));
  return url.toString();
};
