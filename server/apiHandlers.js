import { fetchLeaderboard, fetchRankForScore, insertScore } from './db';
import { sanitizePlayerName } from '../shared/session';
import { validateScoreSubmission } from '../shared/validateScore';
const jsonResponse = (status, body) => new Response(JSON.stringify(body), {
    status,
    headers: {
        'Content-Type': 'application/json',
    },
});
const readJsonBody = async (request) => {
    try {
        return (await request.json());
    }
    catch {
        return null;
    }
};
export const handlePostScores = async (request) => {
    if (request.method !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed.' });
    }
    const body = await readJsonBody(request);
    if (!body || typeof body !== 'object') {
        return jsonResponse(400, { error: 'Invalid JSON body.' });
    }
    const payload = body;
    const playerName = sanitizePlayerName(payload.playerName || '');
    if (!playerName || playerName.length < 2) {
        return jsonResponse(400, { error: 'Enter a display name with at least 2 characters.' });
    }
    const validation = validateScoreSubmission({
        playerName,
        shareCode: String(payload.shareCode || ''),
        mode: payload.mode,
        totalScore: Number(payload.totalScore),
        answers: Array.isArray(payload.answers) ? payload.answers : [],
    });
    if (!validation.ok) {
        return jsonResponse(400, { error: validation.error });
    }
    try {
        const storedScore = await insertScore({
            playerName,
            shareCode: validation.shareCode,
            mode: validation.mode,
            totalScore: validation.totalScore,
            answers: validation.answers,
        });
        const rank = await fetchRankForScore({
            mode: storedScore.mode,
            shareCode: storedScore.shareCode,
            totalScore: storedScore.totalScore,
            createdAt: storedScore.createdAt,
        });
        return jsonResponse(201, {
            id: storedScore.id,
            rank,
            playerName: storedScore.playerName,
            totalScore: storedScore.totalScore,
            mode: storedScore.mode,
            shareCode: storedScore.shareCode,
            createdAt: storedScore.createdAt,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to save score.';
        if (message.includes('DATABASE_URL')) {
            return jsonResponse(503, { error: 'Leaderboard is not configured yet.' });
        }
        return jsonResponse(500, { error: 'Unable to save score.' });
    }
};
export const handleGetLeaderboard = async (request) => {
    if (request.method !== 'GET') {
        return jsonResponse(405, { error: 'Method not allowed.' });
    }
    const url = new URL(request.url);
    const modeParam = url.searchParams.get('mode');
    const mode = modeParam === 'tail' || modeParam === 'type' ? modeParam : undefined;
    const shareCode = url.searchParams.get('shareCode') || undefined;
    const limit = Number.parseInt(url.searchParams.get('limit') || '20', 10);
    try {
        const entries = await fetchLeaderboard({
            mode,
            shareCode,
            limit: Number.isFinite(limit) ? limit : 20,
        });
        return jsonResponse(200, { entries });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load leaderboard.';
        if (message.includes('DATABASE_URL')) {
            return jsonResponse(503, { error: 'Leaderboard is not configured yet.', entries: [] });
        }
        return jsonResponse(500, { error: 'Unable to load leaderboard.', entries: [] });
    }
};
export const handleApiRequest = async (request) => {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/scores') {
        return handlePostScores(request);
    }
    if (pathname === '/api/leaderboard') {
        return handleGetLeaderboard(request);
    }
    return jsonResponse(404, { error: 'Not found.' });
};
