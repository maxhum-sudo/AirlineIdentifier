import { useEffect, useMemo, useState } from 'react';
import { fetchTailImageCandidatesForAirline } from '../services/wikimedia';
import type { Airline, WikimediaImage } from '../types';

type CuratorScreenProps = {
  airlines: Airline[];
};

type CuratedTailSelection = {
  fileTitle: string;
  imagePath?: string;
  licensePath?: string;
};

const CURATION_STORAGE_KEY = 'airline-guess-curated-tail-files';

const readStoredSelections = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(CURATION_STORAGE_KEY) || '{}') as Record<
      string,
      string | CuratedTailSelection
    >;

    return Object.fromEntries(
      Object.entries(stored).map(([airlineId, selection]) => [
        airlineId,
        typeof selection === 'string' ? { fileTitle: selection } : selection,
      ]),
    ) as Record<string, CuratedTailSelection>;
  } catch {
    return {};
  }
};

export const CuratorScreen = ({ airlines }: CuratorScreenProps) => {
  const [airlineIndex, setAirlineIndex] = useState(0);
  const [candidates, setCandidates] = useState<WikimediaImage[]>([]);
  const [selectedFilesByAirlineId, setSelectedFilesByAirlineId] = useState(readStoredSelections);
  const [savingFileTitle, setSavingFileTitle] = useState<string | null>(null);
  const [status, setStatus] = useState('Loading candidate images...');
  const airline = airlines[airlineIndex];
  const selectedFile = selectedFilesByAirlineId[airline.id];
  const selectedFileTitle = selectedFile?.fileTitle || '';
  const exportSnippet = useMemo(
    () => JSON.stringify(selectedFilesByAirlineId, null, 2),
    [selectedFilesByAirlineId],
  );

  useEffect(() => {
    let isCurrent = true;

    setCandidates([]);
    setStatus(`Loading candidate images for ${airline.name}...`);

    fetchTailImageCandidatesForAirline(airline, 12)
      .then((images) => {
        if (!isCurrent) {
          return;
        }

        setCandidates(images);
        setStatus(images.length ? `${images.length} candidates found.` : 'No candidates found.');
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        setStatus(error instanceof Error ? error.message : 'Candidate images failed to load.');
      });

    return () => {
      isCurrent = false;
    };
  }, [airline]);

  const selectCandidate = async (candidate: WikimediaImage) => {
    setSavingFileTitle(candidate.fileTitle);
    setStatus(`Saving ${candidate.fileTitle} locally...`);

    try {
      const response = await fetch('/__curate-tail-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airline: {
            id: airline.id,
            name: airline.name,
            country: airline.country,
            iata: airline.iata,
            icao: airline.icao,
          },
          image: candidate,
        }),
      });
      const saveResult = (await response.json()) as {
        imagePath?: string;
        licensePath?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(saveResult.error || 'Failed to save curated image.');
      }

      const nextSelections = {
        ...selectedFilesByAirlineId,
        [airline.id]: {
          fileTitle: candidate.fileTitle,
          imagePath: saveResult.imagePath,
          licensePath: saveResult.licensePath,
        },
      };

      setSelectedFilesByAirlineId(nextSelections);
      window.localStorage.setItem(CURATION_STORAGE_KEY, JSON.stringify(nextSelections));
      setStatus(`Saved to ${saveResult.imagePath} with license data at ${saveResult.licensePath}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to save curated image.');
    } finally {
      setSavingFileTitle(null);
    }
  };

  const goToAirline = (nextIndex: number) => {
    setAirlineIndex(Math.min(airlines.length - 1, Math.max(0, nextIndex)));
  };

  return (
    <section className="curator-card">
      <div className="curator-header">
        <div>
          <p className="eyebrow">Tail image curator</p>
          <h1>{airline.name}</h1>
          <p>
            {airlineIndex + 1} of {airlines.length} · {airline.country} · {airline.iata}/{airline.icao}
          </p>
        </div>
        <div className="curator-actions">
          <button
            className="secondary"
            disabled={airlineIndex === 0}
            onClick={() => goToAirline(airlineIndex - 1)}
            type="button"
          >
            Previous
          </button>
          <button
            disabled={airlineIndex === airlines.length - 1}
            onClick={() => goToAirline(airlineIndex + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </div>

      <div className="curator-selection">
        <strong>Selected file</strong>
        <code>{selectedFileTitle || 'None yet'}</code>
        {selectedFile?.imagePath ? <code>Image: {selectedFile.imagePath}</code> : null}
        {selectedFile?.licensePath ? <code>License: {selectedFile.licensePath}</code> : null}
      </div>

      <p className="notice">{status}</p>

      <div className="candidate-grid">
        {candidates.map((candidate, index) => (
          <article
            className={`candidate-card ${
              candidate.fileTitle === selectedFileTitle ? 'selected' : ''
            }`}
            key={candidate.fileTitle}
          >
            <img alt={candidate.title} src={candidate.imageUrl} />
            <div>
              <strong>Option {index + 1}</strong>
              <small>{candidate.fileTitle}</small>
              <a href={candidate.pageUrl} rel="noreferrer" target="_blank">
                View source
              </a>
            </div>
            <button
              disabled={savingFileTitle !== null}
              onClick={() => selectCandidate(candidate)}
              type="button"
            >
              {savingFileTitle === candidate.fileTitle ? 'Saving...' : 'Use this image'}
            </button>
          </article>
        ))}
      </div>

      <label className="curator-export">
        Export selected image records
        <textarea readOnly rows={8} value={exportSnippet} />
      </label>
    </section>
  );
};
