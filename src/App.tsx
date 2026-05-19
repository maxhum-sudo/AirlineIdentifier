import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameCard } from './components/GameCard';
import { ResultScreen } from './components/ResultScreen';
import { airlines } from './data/airlines';
import { buildQuestionSet } from './game/questions';
import { calculateQuestionScore, QUESTION_TIME_MS } from './game/scoring';
import {
  buildShareUrl,
  createGameSession,
  finalizeSessionQuestions,
  readShareCodeFromUrl,
} from './game/session';
import { fetchTailImageForAirline } from './services/wikimedia';
import type { Airline, GameSession, PlayerAnswer, PlayerResult, WikimediaImage } from './types';

const BEST_SCORE_KEY = 'airline-guess-best-score';
const RECENT_RESULTS_KEY = 'airline-guess-results';
const FEEDBACK_DELAY_MS = 900;

type GamePhase = 'intro' | 'playing' | 'results';

const getStoredBestScore = () => {
  const stored = window.localStorage.getItem(BEST_SCORE_KEY);
  return stored ? Number.parseInt(stored, 10) || 0 : 0;
};

const storeResult = (result: PlayerResult) => {
  const existing = JSON.parse(window.localStorage.getItem(RECENT_RESULTS_KEY) || '[]') as PlayerResult[];
  window.localStorage.setItem(RECENT_RESULTS_KEY, JSON.stringify([result, ...existing].slice(0, 10)));
};

const createSessionWithQuestions = (shareCode?: string) => {
  const session = createGameSession(shareCode);
  const questions = buildQuestionSet(airlines, session.seed, session.roundCount);
  return finalizeSessionQuestions(session, questions);
};

export default function App() {
  const initialShareCode = useMemo(() => readShareCodeFromUrl(), []);
  const [session, setSession] = useState<GameSession>(() =>
    createSessionWithQuestions(initialShareCode || undefined),
  );
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [answers, setAnswers] = useState<PlayerAnswer[]>([]);
  const [selectedAirlineId, setSelectedAirlineId] = useState<string | null>(null);
  const [correctAirlineId, setCorrectAirlineId] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(QUESTION_TIME_MS);
  const [imageByAirlineId, setImageByAirlineId] = useState<Record<string, WikimediaImage>>({});
  const [imageErrorByAirlineId, setImageErrorByAirlineId] = useState<Record<string, string>>({});
  const [bestScore, setBestScore] = useState(getStoredBestScore);
  const [copied, setCopied] = useState(false);
  const questionStartedAt = useRef(Date.now());
  const roundAdvancing = useRef(false);
  const timerArmedQuestionId = useRef<string | null>(null);

  const airlinesById = useMemo(
    () => new Map<string, Airline>(airlines.map((airline) => [airline.id, airline])),
    [],
  );
  const questions = useMemo(
    () => buildQuestionSet(airlines, session.seed, session.roundCount),
    [session.roundCount, session.seed],
  );
  const currentQuestion = questions[currentRoundIndex];
  const currentAirline = currentQuestion ? airlinesById.get(currentQuestion.airlineId) : null;
  const currentImage = currentAirline ? imageByAirlineId[currentAirline.id] || null : null;
  const currentImageError = currentAirline ? imageErrorByAirlineId[currentAirline.id] || null : null;
  const isPromptReady = Boolean(currentImage || currentImageError);
  const shareUrl = useMemo(() => buildShareUrl(session.shareCode), [session.shareCode]);
  const totalScore = answers.reduce((total, answer) => total + answer.score, 0);

  const startRoundTimer = useCallback(() => {
    questionStartedAt.current = Date.now();
    roundAdvancing.current = false;
    timerArmedQuestionId.current = null;
    setSelectedAirlineId(null);
    setCorrectAirlineId(null);
    setTimeLeftMs(QUESTION_TIME_MS);
  }, []);

  const completeGame = useCallback(
    (finalAnswers: PlayerAnswer[]) => {
      const totalScore = finalAnswers.reduce((total, answer) => total + answer.score, 0);
      const result: PlayerResult = {
        sessionId: session.id,
        answers: finalAnswers,
        totalScore,
        completedAt: new Date().toISOString(),
      };

      storeResult(result);
      setBestScore((previousBest) => {
        const nextBest = Math.max(previousBest, totalScore);
        window.localStorage.setItem(BEST_SCORE_KEY, String(nextBest));
        return nextBest;
      });
      setAnswers(finalAnswers);
      setPhase('results');
    },
    [session.id],
  );

  const submitAnswer = useCallback(
    (airlineId: string | null) => {
      if (!currentQuestion || !isPromptReady || roundAdvancing.current) {
        return;
      }

      roundAdvancing.current = true;
      const elapsedMs = Math.min(QUESTION_TIME_MS, Date.now() - questionStartedAt.current);
      const isCorrect = airlineId === currentQuestion.airlineId;
      const answer: PlayerAnswer = {
        questionId: currentQuestion.id,
        selectedAirlineId: airlineId,
        correctAirlineId: currentQuestion.airlineId,
        isCorrect,
        elapsedMs,
        score: calculateQuestionScore({ isCorrect, elapsedMs }),
      };
      const nextAnswers = [...answers, answer];

      setSelectedAirlineId(airlineId);
      setCorrectAirlineId(currentQuestion.airlineId);

      window.setTimeout(() => {
        if (currentRoundIndex + 1 >= questions.length) {
          completeGame(nextAnswers);
          return;
        }

        setAnswers(nextAnswers);
        setCurrentRoundIndex((index) => index + 1);
        startRoundTimer();
      }, FEEDBACK_DELAY_MS);
    },
    [
      answers,
      completeGame,
      currentQuestion,
      currentRoundIndex,
      isPromptReady,
      questions.length,
      startRoundTimer,
    ],
  );

  const beginGame = useCallback(() => {
    setAnswers([]);
    setCurrentRoundIndex(0);
    setCopied(false);
    setPhase('playing');
    startRoundTimer();
  }, [startRoundTimer]);

  const createNewGame = useCallback(() => {
    const nextSession = createSessionWithQuestions();
    window.history.replaceState(null, '', buildShareUrl(nextSession.shareCode));
    setSession(nextSession);
    setAnswers([]);
    setCurrentRoundIndex(0);
    setCopied(false);
    setPhase('intro');
    startRoundTimer();
  }, [startRoundTimer]);

  const copyChallenge = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  }, [shareUrl]);

  useEffect(() => {
    if (phase !== 'playing' || !currentQuestion || !isPromptReady || correctAirlineId !== null) {
      return;
    }

    if (timerArmedQuestionId.current !== currentQuestion.id) {
      timerArmedQuestionId.current = currentQuestion.id;
      questionStartedAt.current = Date.now();
      setTimeLeftMs(QUESTION_TIME_MS);
    }
  }, [correctAirlineId, currentQuestion, isPromptReady, phase]);

  useEffect(() => {
    if (phase !== 'playing' || !isPromptReady || correctAirlineId !== null) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      const elapsedMs = Date.now() - questionStartedAt.current;
      const nextTimeLeft = Math.max(0, QUESTION_TIME_MS - elapsedMs);
      setTimeLeftMs(nextTimeLeft);

      if (nextTimeLeft === 0) {
        submitAnswer(null);
      }
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [correctAirlineId, isPromptReady, phase, submitAnswer]);

  useEffect(() => {
    if (!currentAirline || imageByAirlineId[currentAirline.id] || imageErrorByAirlineId[currentAirline.id]) {
      return;
    }

    fetchTailImageForAirline(currentAirline)
      .then((image) => {
        setImageByAirlineId((previous) => ({ ...previous, [currentAirline.id]: image }));
      })
      .catch((error: unknown) => {
        setImageErrorByAirlineId((previous) => ({
          ...previous,
          [currentAirline.id]: error instanceof Error ? error.message : 'Image failed to load',
        }));
      });
  }, [currentAirline, imageByAirlineId, imageErrorByAirlineId]);

  const latestResult: PlayerResult = {
    sessionId: session.id,
    answers,
    totalScore,
    completedAt: new Date().toISOString(),
  };

  return (
    <main className="app-shell">
      <div className="brand">
        <span className="logo-mark">AG</span>
        <div>
          <p className="eyebrow">Airline Guess</p>
          <strong>Tail Challenge</strong>
        </div>
      </div>

      {phase === 'intro' ? (
        <section className="intro-card">
          <p className="eyebrow">5 rounds · 4 choices · 10 seconds</p>
          <h1>Can you identify the airline from the tail?</h1>
          <p>
            Every challenge uses Wikimedia Commons aircraft tailfin categories and keeps attribution
            visible while you play. Share code <strong>{session.shareCode}</strong> gives everyone the
            same five questions.
          </p>
          <div className="action-row">
            <button onClick={beginGame} type="button">
              Start game
            </button>
            <button className="secondary" onClick={createNewGame} type="button">
              New challenge
            </button>
          </div>
          {initialShareCode ? <p className="notice">Loaded shared challenge {initialShareCode}.</p> : null}
        </section>
      ) : null}

      {phase === 'playing' && currentQuestion ? (
        <GameCard
          airlinesById={airlinesById}
          correctAirlineId={correctAirlineId}
          currentRound={currentRoundIndex + 1}
          image={currentImage}
          imageError={currentImageError}
          isPromptReady={isPromptReady}
          onAnswer={submitAnswer}
          question={currentQuestion}
          score={totalScore}
          selectedAirlineId={selectedAirlineId}
          timeLeftMs={timeLeftMs}
          totalRounds={questions.length}
        />
      ) : null}

      {phase === 'results' ? (
        <>
          <ResultScreen
            bestScore={bestScore}
            onCopyChallenge={copyChallenge}
            onNewGame={createNewGame}
            onReplay={beginGame}
            result={latestResult}
            shareUrl={shareUrl}
          />
          {copied ? <p className="notice">Challenge link copied.</p> : null}
        </>
      ) : null}
    </main>
  );
}
