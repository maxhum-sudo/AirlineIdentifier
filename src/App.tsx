import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CuratorScreen } from './components/CuratorScreen';
import { GameCard } from './components/GameCard';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { ResultScreen } from './components/ResultScreen';
import { TypeAnswerCard } from './components/TypeAnswerCard';
import { airlines } from './data/airlines';
import { buildQuestionSet } from './game/questions';
import { calculateQuestionScore, QUESTION_TIME_MS } from './game/scoring';
import {
  buildShareUrl,
  createGameSession,
  finalizeSessionQuestions,
  isValidShareCode,
  normalizeShareCode,
  readModeFromUrl,
  readShareCodeFromUrl,
} from './game/session';
import { isTypedAnswerCorrect } from './game/validation';
import { submitScore } from './services/leaderboard';
import { fetchTailImageForAirline } from './services/wikimedia';
import type { Airline, GameMode, GameSession, PlayerAnswer, PlayerResult, WikimediaImage } from './types';

const BEST_SCORE_KEY = 'airline-guess-best-score';
const RECENT_RESULTS_KEY = 'airline-guess-results';
const PLAYER_NAME_KEY = 'airline-guess-player-name';
const FEEDBACK_DELAY_MS = 900;
const MOSAIC_BATCH_SIZE = 5;
const MOSAIC_BATCH_DELAY_MS = 180;

type GamePhase = 'intro' | 'playing' | 'results';

const getStoredBestScore = () => {
  const stored = window.localStorage.getItem(BEST_SCORE_KEY);
  return stored ? Number.parseInt(stored, 10) || 0 : 0;
};

const getStoredPlayerName = () => window.localStorage.getItem(PLAYER_NAME_KEY) || '';

const storeResult = (result: PlayerResult) => {
  const existing = JSON.parse(window.localStorage.getItem(RECENT_RESULTS_KEY) || '[]') as PlayerResult[];
  window.localStorage.setItem(RECENT_RESULTS_KEY, JSON.stringify([result, ...existing].slice(0, 10)));
};

const createSessionWithQuestions = (shareCode?: string, mode: GameMode = 'tail') => {
  const session = createGameSession(shareCode, mode);
  const questions = buildQuestionSet(airlines, session.seed, session.roundCount, session.mode);
  return finalizeSessionQuestions(session, questions);
};

const MODE_LABELS: Record<GameMode, { title: string; subtitle: string }> = {
  tail: {
    title: 'Tail Challenge',
    subtitle: 'Pick the airline from four choices',
  },
  type: {
    title: 'Name It',
    subtitle: 'Type the airline name from the tail',
  },
};

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export default function App() {
  const initialShareCode = useMemo(() => readShareCodeFromUrl(), []);
  const initialMode = useMemo(() => readModeFromUrl(), []);
  const isCuratorMode = useMemo(() => new URLSearchParams(window.location.search).get('curate') === '1', []);
  const [selectedMode, setSelectedMode] = useState<GameMode>(initialMode);
  const [session, setSession] = useState<GameSession>(() =>
    createSessionWithQuestions(initialShareCode || undefined, initialMode),
  );
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [answers, setAnswers] = useState<PlayerAnswer[]>([]);
  const [selectedAirlineId, setSelectedAirlineId] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [correctAirlineId, setCorrectAirlineId] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(QUESTION_TIME_MS);
  const [imageByAirlineId, setImageByAirlineId] = useState<Record<string, WikimediaImage>>({});
  const [imageErrorByAirlineId, setImageErrorByAirlineId] = useState<Record<string, string>>({});
  const [bestScore, setBestScore] = useState(getStoredBestScore);
  const [playerName, setPlayerName] = useState(getStoredPlayerName);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [challengeCodeInput, setChallengeCodeInput] = useState('');
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState(Boolean(initialShareCode));
  const [introImages, setIntroImages] = useState<WikimediaImage[]>([]);
  const [challengeMessage, setChallengeMessage] = useState<string | null>(
    initialShareCode ? `Connected to challenge ${initialShareCode}.` : null,
  );
  const questionStartedAt = useRef(Date.now());
  const roundAdvancing = useRef(false);
  const timerArmedQuestionId = useRef<string | null>(null);
  const hasStartedIntroMosaic = useRef(false);

  const airlinesById = useMemo(
    () => new Map<string, Airline>(airlines.map((airline) => [airline.id, airline])),
    [],
  );
  const questions = useMemo(
    () => buildQuestionSet(airlines, session.seed, session.roundCount, session.mode),
    [session.mode, session.roundCount, session.seed],
  );
  const roundAirlines = useMemo(
    () =>
      questions
        .map((question) => airlinesById.get(question.airlineId))
        .filter((airline): airline is Airline => Boolean(airline)),
    [airlinesById, questions],
  );
  const currentQuestion = questions[currentRoundIndex];
  const currentAirline = currentQuestion ? airlinesById.get(currentQuestion.airlineId) : null;
  const currentImage = currentAirline ? imageByAirlineId[currentAirline.id] || null : null;
  const currentImageError = currentAirline ? imageErrorByAirlineId[currentAirline.id] || null : null;
  const isPromptReady = Boolean(currentImage || currentImageError);
  const shareUrl = useMemo(
    () => buildShareUrl(session.shareCode, session.mode),
    [session.mode, session.shareCode],
  );
  const displayMode = phase === 'intro' ? selectedMode : session.mode;
  const modeLabel = MODE_LABELS[displayMode];
  const totalScore = answers.reduce((total, answer) => total + answer.score, 0);

  const startRoundTimer = useCallback(() => {
    questionStartedAt.current = Date.now();
    roundAdvancing.current = false;
    timerArmedQuestionId.current = null;
    setSelectedAirlineId(null);
    setTypedAnswer('');
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
      setSubmitStatus('idle');
      setSubmitMessage('');
      setSubmittedRank(null);
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

  const submitChoiceAnswer = useCallback(
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

  const submitTypedAnswer = useCallback(
    (input: string) => {
      if (!currentQuestion || !currentAirline || !isPromptReady || roundAdvancing.current) {
        return;
      }

      roundAdvancing.current = true;
      const elapsedMs = Math.min(QUESTION_TIME_MS, Date.now() - questionStartedAt.current);
      const trimmedInput = input.trim();
      const isCorrect = isTypedAnswerCorrect(trimmedInput, currentAirline);
      const answer: PlayerAnswer = {
        questionId: currentQuestion.id,
        selectedAirlineId: isCorrect ? currentQuestion.airlineId : null,
        typedAnswer: trimmedInput,
        correctAirlineId: currentQuestion.airlineId,
        isCorrect,
        elapsedMs,
        score: calculateQuestionScore({ isCorrect, elapsedMs }),
      };
      const nextAnswers = [...answers, answer];

      setSelectedAirlineId(isCorrect ? currentQuestion.airlineId : null);
      setTypedAnswer(trimmedInput);
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
      currentAirline,
      currentQuestion,
      currentRoundIndex,
      isPromptReady,
      questions.length,
      startRoundTimer,
    ],
  );

  const beginGame = useCallback(() => {
    const nextSession = createSessionWithQuestions(session.shareCode, selectedMode);
    window.history.replaceState(null, '', buildShareUrl(nextSession.shareCode, nextSession.mode));
    setSession(nextSession);
    setAnswers([]);
    setCurrentRoundIndex(0);
    setCopied(false);
    setChallengeMessage(`Connected to challenge ${nextSession.shareCode}.`);
    setPhase('playing');
    startRoundTimer();
  }, [selectedMode, session.shareCode, startRoundTimer]);

  const resetGameStateForSession = useCallback(
    (nextSession: GameSession, nextPhase: GamePhase) => {
      window.history.replaceState(null, '', buildShareUrl(nextSession.shareCode, nextSession.mode));
      setSession(nextSession);
      setSelectedMode(nextSession.mode);
      setAnswers([]);
      setCurrentRoundIndex(0);
      setSelectedAirlineId(null);
      setTypedAnswer('');
      setCorrectAirlineId(null);
      setCopied(false);
      setChallengeMessage(`Connected to challenge ${nextSession.shareCode}.`);
      setPhase(nextPhase);
      startRoundTimer();
    },
    [startRoundTimer],
  );

  const createNewGame = useCallback(() => {
    const nextSession = createSessionWithQuestions(undefined, selectedMode);
    setChallengeCodeInput('');
    setIsMultiplayerOpen(false);
    resetGameStateForSession(nextSession, 'intro');
  }, [resetGameStateForSession, selectedMode]);

  const joinChallenge = useCallback(() => {
    setIsMultiplayerOpen(true);

    if (!isValidShareCode(challengeCodeInput)) {
      setChallengeMessage('Enter a challenge code with at least 4 letters or numbers.');
      return;
    }

    const normalizedCode = normalizeShareCode(challengeCodeInput);
    const nextSession = createSessionWithQuestions(normalizedCode, selectedMode);
    setChallengeCodeInput('');
    resetGameStateForSession(nextSession, 'playing');
  }, [challengeCodeInput, resetGameStateForSession, selectedMode]);

  const copyChallenge = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  }, [shareUrl]);

  const handlePlayerNameChange = useCallback((value: string) => {
    setPlayerName(value);
    window.localStorage.setItem(PLAYER_NAME_KEY, value);
  }, []);

  const submitScoreToLeaderboard = useCallback(async () => {
    if (!playerName.trim()) {
      setSubmitStatus('error');
      setSubmitMessage('Enter a display name before submitting.');
      return;
    }

    setSubmitStatus('submitting');
    setSubmitMessage('');

    try {
      const response = await submitScore({
        playerName: playerName.trim(),
        shareCode: session.shareCode,
        mode: session.mode,
        totalScore,
        answers,
      });

      setSubmitStatus('success');
      setSubmittedRank(response.rank);
      setSubmitMessage('');
      setLeaderboardRefreshKey((value) => value + 1);
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage(error instanceof Error ? error.message : 'Unable to submit score.');
    }
  }, [answers, playerName, session.mode, session.shareCode, totalScore]);

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
        if (session.mode === 'type') {
          submitTypedAnswer('');
        } else {
          submitChoiceAnswer(null);
        }
      }
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [correctAirlineId, isPromptReady, phase, session.mode, submitChoiceAnswer, submitTypedAnswer]);

  useEffect(() => {
    roundAirlines.forEach((airline) => {
      if (imageByAirlineId[airline.id] || imageErrorByAirlineId[airline.id]) {
        return;
      }

      fetchTailImageForAirline(airline)
        .then((image) => {
          setImageByAirlineId((previous) => ({ ...previous, [airline.id]: image }));
        })
        .catch((error: unknown) => {
          setImageErrorByAirlineId((previous) => ({
            ...previous,
            [airline.id]: error instanceof Error ? error.message : 'Image failed to load',
          }));
        });
    });
  }, [imageByAirlineId, imageErrorByAirlineId, roundAirlines]);

  useEffect(() => {
    if (phase !== 'intro' || hasStartedIntroMosaic.current) {
      return;
    }

    hasStartedIntroMosaic.current = true;

    const loadMosaic = async () => {
      for (let index = 0; index < airlines.length; index += MOSAIC_BATCH_SIZE) {
        const batch = airlines.slice(index, index + MOSAIC_BATCH_SIZE);

        await Promise.allSettled(
          batch.map((airline) =>
            fetchTailImageForAirline(airline).then((image) => {
              setIntroImages((previous) => {
                if (previous.some((item) => item.pageUrl === image.pageUrl)) {
                  return previous;
                }

                return [...previous, image].slice(0, airlines.length);
              });
            }),
          ),
        );

        await delay(MOSAIC_BATCH_DELAY_MS);
      }
    };

    void loadMosaic();
  }, [phase]);

  const latestResult: PlayerResult = {
    sessionId: session.id,
    answers,
    totalScore,
    completedAt: new Date().toISOString(),
  };

  if (isCuratorMode) {
    return (
      <main className="app-shell curator-shell">
        <div className="brand">
          <span className="logo-mark">AG</span>
          <div>
            <p className="eyebrow">Airline Guess</p>
            <strong>{modeLabel.title}</strong>
          </div>
        </div>
        <CuratorScreen airlines={airlines} />
      </main>
    );
  }

  return (
    <main className={`app-shell ${phase === 'intro' ? 'intro-shell' : ''}`}>
      <div className="brand">
        <span className="logo-mark">AG</span>
        <div>
          <p className="eyebrow">Airline Guess</p>
          <strong>{modeLabel.title}</strong>
        </div>
      </div>

      {phase === 'intro' ? (
        <section className="intro-card intro-hero">
          <div className="tail-mosaic" aria-hidden="true">
            {introImages.map((image) => (
              <img alt="" key={image.pageUrl} src={image.imageUrl} />
            ))}
          </div>
          <div className="intro-overlay" />
          <div className="intro-content">
            <p className="eyebrow">Airline Guess</p>
            <h1>{modeLabel.title}</h1>
            <p className="intro-subtitle">{modeLabel.subtitle}</p>
            <div className="mode-selector" role="group" aria-label="Game mode">
              <button
                className={`mode-option ${selectedMode === 'tail' ? 'selected' : ''}`}
                onClick={() => setSelectedMode('tail')}
                type="button"
              >
                <strong>Multiple Choice</strong>
                <span>Pick from four airlines</span>
              </button>
              <button
                className={`mode-option ${selectedMode === 'type' ? 'selected' : ''}`}
                onClick={() => setSelectedMode('type')}
                type="button"
              >
                <strong>Type It</strong>
                <span>Type the airline name</span>
              </button>
            </div>
            <button className="start-button" onClick={beginGame} type="button">
              Start
            </button>
          </div>
          <div className="multiplayer-dock">
            {isMultiplayerOpen ? (
              <form
                className="challenge-form compact"
                onSubmit={(event) => {
                  event.preventDefault();
                  joinChallenge();
                }}
              >
                <label>
                  Challenge code
                  <input
                    autoComplete="off"
                    autoFocus
                    inputMode="text"
                    onChange={(event) => setChallengeCodeInput(event.target.value)}
                    placeholder="TEST50"
                    value={challengeCodeInput}
                  />
                </label>
                <button type="submit">Play</button>
              </form>
            ) : (
              <button
                className="multiplayer-button"
                onClick={() => setIsMultiplayerOpen(true)}
                type="button"
              >
                Multiplayer
              </button>
            )}
            {challengeMessage ? <p className="notice">{challengeMessage}</p> : null}
          </div>
          <LeaderboardPanel
            compact
            mode={selectedMode}
            refreshKey={leaderboardRefreshKey}
            shareCode={session.shareCode}
          />
        </section>
      ) : null}

      {phase === 'playing' && currentQuestion && !isPromptReady ? (
        <section className="game-card loading-card" aria-live="polite">
          <div className="game-status">
            <span>
              Round {currentRoundIndex + 1} of {questions.length}
            </span>
            <span>Score {totalScore}</span>
          </div>
          <div className="prompt-card">
            <div className="image-placeholder">
              <span className="loading-spinner" aria-hidden="true" />
              Loading photo{session.mode === 'tail' ? ' and choices' : ''}...
            </div>
          </div>
          <div className="loading-copy">
            <p className="eyebrow">Preparing round</p>
            <h1>The {session.mode === 'type' ? 'input' : 'options'} will appear with the photo.</h1>
          </div>
        </section>
      ) : null}

      {phase === 'playing' && currentQuestion && isPromptReady && session.mode === 'tail' ? (
        <GameCard
          airlinesById={airlinesById}
          correctAirlineId={correctAirlineId}
          currentRound={currentRoundIndex + 1}
          image={currentImage}
          imageError={currentImageError}
          isPromptReady={isPromptReady}
          onAnswer={submitChoiceAnswer}
          question={currentQuestion}
          score={totalScore}
          selectedAirlineId={selectedAirlineId}
          timeLeftMs={timeLeftMs}
          totalRounds={questions.length}
        />
      ) : null}

      {phase === 'playing' && currentQuestion && isPromptReady && session.mode === 'type' ? (
        <TypeAnswerCard
          airlinesById={airlinesById}
          correctAirlineId={correctAirlineId}
          currentRound={currentRoundIndex + 1}
          image={currentImage}
          imageError={currentImageError}
          isPromptReady={isPromptReady}
          onSubmit={submitTypedAnswer}
          onTypedAnswerChange={setTypedAnswer}
          question={currentQuestion}
          score={totalScore}
          selectedAirlineId={selectedAirlineId}
          timeLeftMs={timeLeftMs}
          totalRounds={questions.length}
          typedAnswer={typedAnswer}
        />
      ) : null}

      {phase === 'results' ? (
        <>
          <ResultScreen
            bestScore={bestScore}
            challengeCodeInput={challengeCodeInput}
            mode={session.mode}
            onChallengeCodeChange={setChallengeCodeInput}
            onJoinChallenge={joinChallenge}
            onCopyChallenge={copyChallenge}
            onNewGame={createNewGame}
            onPlayerNameChange={handlePlayerNameChange}
            onReplay={beginGame}
            onSubmitScore={submitScoreToLeaderboard}
            playerName={playerName}
            result={latestResult}
            shareUrl={shareUrl}
            submitMessage={submitMessage}
            submitStatus={submitStatus}
            submittedRank={submittedRank}
          />
          <LeaderboardPanel
            mode={session.mode}
            refreshKey={leaderboardRefreshKey}
            shareCode={session.shareCode}
          />
          {copied ? <p className="notice">Challenge link copied.</p> : null}
          {challengeMessage ? <p className="notice">{challengeMessage}</p> : null}
        </>
      ) : null}
    </main>
  );
}
