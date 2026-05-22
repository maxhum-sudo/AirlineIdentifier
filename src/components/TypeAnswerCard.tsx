import { useEffect, useRef } from 'react';
import type { Airline, Question, WikimediaImage } from '../types';

type TypeAnswerCardProps = {
  question: Question;
  airlinesById: Map<string, Airline>;
  currentRound: number;
  totalRounds: number;
  score: number;
  timeLeftMs: number;
  image: WikimediaImage | null;
  imageError: string | null;
  isPromptReady: boolean;
  typedAnswer: string;
  selectedAirlineId: string | null;
  correctAirlineId: string | null;
  onTypedAnswerChange: (value: string) => void;
  onSubmit: (value: string) => void;
};

const formatSeconds = (timeLeftMs: number) => Math.ceil(timeLeftMs / 1000);

export const TypeAnswerCard = ({
  question,
  airlinesById,
  currentRound,
  totalRounds,
  score,
  timeLeftMs,
  image,
  imageError,
  isPromptReady,
  typedAnswer,
  selectedAirlineId,
  correctAirlineId,
  onTypedAnswerChange,
  onSubmit,
}: TypeAnswerCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const correctAirline = airlinesById.get(question.airlineId);
  const hasAnswered = correctAirlineId !== null;
  const timerPercent = Math.max(0, Math.min(100, (timeLeftMs / 10_000) * 100));

  useEffect(() => {
    if (isPromptReady && !hasAnswered) {
      inputRef.current?.focus();
    }
  }, [hasAnswered, isPromptReady, question.id]);

  return (
    <section className="game-card" aria-live="polite">
      <div className="game-status">
        <span>
          Round {currentRound} of {totalRounds}
        </span>
        <span>Score {score}</span>
      </div>

      <div className="timer" aria-label={`${formatSeconds(timeLeftMs)} seconds remaining`}>
        <div className="timer-fill" style={{ width: `${timerPercent}%` }} />
      </div>

      <div className="prompt-card">
        {image ? (
          <img className="tail-image" src={image.imageUrl} alt="Airline aircraft tailfin" />
        ) : (
          <div className="image-placeholder">{imageError ? 'Image unavailable' : 'Loading Wikimedia image...'}</div>
        )}
      </div>

      <div className="question-copy">
        <p className="eyebrow">Name that airline</p>
        <h1>Type the airline name</h1>
      </div>

      <form
        className="type-answer-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!hasAnswered && isPromptReady && typedAnswer.trim()) {
            onSubmit(typedAnswer);
          }
        }}
      >
        <label className="type-answer-label">
          Airline name
          <input
            autoComplete="off"
            className={hasAnswered ? (selectedAirlineId === question.airlineId ? 'answer-correct' : 'answer-wrong') : ''}
            disabled={hasAnswered || !isPromptReady}
            onChange={(event) => onTypedAnswerChange(event.target.value)}
            placeholder="e.g. British Airways or BA"
            ref={inputRef}
            spellCheck={false}
            type="text"
            value={typedAnswer}
          />
        </label>
        <button disabled={hasAnswered || !isPromptReady || !typedAnswer.trim()} type="submit">
          Submit
        </button>
      </form>

      {hasAnswered ? (
        <div className="feedback">
          {selectedAirlineId === question.airlineId ? 'Correct' : `Answer: ${correctAirline?.name}`}
        </div>
      ) : null}

      <footer className="citation">
        {image ? (
          <>
            <span>Photo: </span>
            <a href={image.pageUrl} rel="noreferrer" target="_blank">
              {image.title}
            </a>
            <span> by {image.author}</span>
            <span>, {image.license}</span>
            {image.licenseUrl ? (
              <>
                <span> </span>
                <a href={image.licenseUrl} rel="noreferrer" target="_blank">
                  license
                </a>
              </>
            ) : null}
          </>
        ) : (
          <span>Source: Wikimedia Commons aircraft tailfin category</span>
        )}
      </footer>
    </section>
  );
};
