import type { Airline, Question, WikimediaImage } from '../types';

type GameCardProps = {
  question: Question;
  airlinesById: Map<string, Airline>;
  currentRound: number;
  totalRounds: number;
  score: number;
  timeLeftMs: number;
  image: WikimediaImage | null;
  imageError: string | null;
  isPromptReady: boolean;
  selectedAirlineId: string | null;
  correctAirlineId: string | null;
  onAnswer: (airlineId: string) => void;
};

const formatSeconds = (timeLeftMs: number) => Math.ceil(timeLeftMs / 1000);

export const GameCard = ({
  question,
  airlinesById,
  currentRound,
  totalRounds,
  score,
  timeLeftMs,
  image,
  imageError,
  isPromptReady,
  selectedAirlineId,
  correctAirlineId,
  onAnswer,
}: GameCardProps) => {
  const correctAirline = airlinesById.get(question.airlineId);
  const hasAnswered = correctAirlineId !== null;
  const timerPercent = Math.max(0, Math.min(100, (timeLeftMs / 10_000) * 100));

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
        <h1>Which airline uses this tail?</h1>
      </div>

      <div className="answer-grid">
        {question.optionAirlineIds.map((airlineId) => {
          const airline = airlinesById.get(airlineId);
          const isCorrect = correctAirlineId === airlineId;
          const isSelected = selectedAirlineId === airlineId;
          const stateClass = hasAnswered
            ? isCorrect
              ? 'answer-correct'
              : isSelected
                ? 'answer-wrong'
                : ''
            : '';

          return (
            <button
              className={`answer-button ${stateClass}`}
              disabled={hasAnswered || !isPromptReady}
              key={airlineId}
              onClick={() => onAnswer(airlineId)}
              type="button"
            >
              <span>{airline?.name}</span>
              <small>
                {airline?.iata} · {airline?.country}
              </small>
            </button>
          );
        })}
      </div>

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
