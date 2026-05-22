import { buildValidationAirlines } from './airlineSeeds';
import { buildQuestionSet } from './questions';
import { calculateQuestionScore, QUESTION_TIME_MS } from './scoring';
import { isValidShareCode, normalizeShareCode } from './session';
import { isTypedAnswerCorrect } from './validation';
const validationAirlines = buildValidationAirlines();
const airlinesById = new Map(validationAirlines.map((airline) => [airline.id, airline]));
export const validateScoreSubmission = (submission) => {
    const shareCode = normalizeShareCode(submission.shareCode);
    if (!isValidShareCode(shareCode)) {
        return { ok: false, error: 'Invalid challenge code.' };
    }
    if (submission.mode !== 'tail' && submission.mode !== 'type') {
        return { ok: false, error: 'Invalid game mode.' };
    }
    if (!Array.isArray(submission.answers) || submission.answers.length !== 5) {
        return { ok: false, error: 'A completed game must include five answers.' };
    }
    const questions = buildQuestionSet(validationAirlines, shareCode, 5, submission.mode);
    let validatedTotal = 0;
    for (const [index, question] of questions.entries()) {
        const answer = submission.answers[index];
        if (!answer || answer.questionId !== question.id) {
            return { ok: false, error: 'Submitted answers do not match this challenge.' };
        }
        if (answer.correctAirlineId !== question.airlineId) {
            return { ok: false, error: 'Answer metadata does not match this challenge.' };
        }
        if (!Number.isFinite(answer.elapsedMs) || answer.elapsedMs < 0 || answer.elapsedMs > QUESTION_TIME_MS) {
            return { ok: false, error: 'Answer timing is invalid.' };
        }
        const airline = airlinesById.get(question.airlineId);
        if (!airline) {
            return { ok: false, error: 'Unknown airline in challenge.' };
        }
        let isCorrect = false;
        if (submission.mode === 'tail') {
            isCorrect = answer.selectedAirlineId === question.airlineId;
        }
        else {
            isCorrect = isTypedAnswerCorrect(answer.typedAnswer || '', airline);
        }
        const expectedScore = calculateQuestionScore({
            isCorrect,
            elapsedMs: answer.elapsedMs,
        });
        if (answer.isCorrect !== isCorrect ||
            answer.score !== expectedScore ||
            answer.correctAirlineId !== question.airlineId) {
            return { ok: false, error: 'Submitted score does not match verified answers.' };
        }
        validatedTotal += expectedScore;
    }
    if (submission.totalScore !== validatedTotal) {
        return { ok: false, error: 'Submitted total score is incorrect.' };
    }
    return {
        ok: true,
        shareCode,
        mode: submission.mode,
        totalScore: validatedTotal,
        answers: submission.answers,
    };
};
