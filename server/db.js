import { neon } from '@neondatabase/serverless';
let schemaReady = null;
const getSql = () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not configured.');
    }
    return neon(databaseUrl);
};
const ensureSchema = async () => {
    if (!schemaReady) {
        schemaReady = (async () => {
            const sql = getSql();
            await sql `
        CREATE TABLE IF NOT EXISTS scores (
          id BIGSERIAL PRIMARY KEY,
          player_name TEXT NOT NULL,
          share_code TEXT NOT NULL,
          mode TEXT NOT NULL CHECK (mode IN ('tail', 'type')),
          total_score INTEGER NOT NULL CHECK (total_score >= 0),
          answers JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
            await sql `
        CREATE INDEX IF NOT EXISTS idx_scores_mode_score
        ON scores (mode, total_score DESC, created_at ASC)
      `;
            await sql `
        CREATE INDEX IF NOT EXISTS idx_scores_share_code_score
        ON scores (share_code, total_score DESC, created_at ASC)
      `;
        })();
    }
    await schemaReady;
};
export const insertScore = async (input) => {
    await ensureSchema();
    const sql = getSql();
    const rows = await sql `
    INSERT INTO scores (player_name, share_code, mode, total_score, answers)
    VALUES (
      ${input.playerName},
      ${input.shareCode},
      ${input.mode},
      ${input.totalScore},
      ${JSON.stringify(input.answers)}
    )
    RETURNING id, player_name, share_code, mode, total_score, answers, created_at
  `;
    const row = rows[0];
    return {
        id: Number(row.id),
        playerName: String(row.player_name),
        shareCode: String(row.share_code),
        mode: row.mode,
        totalScore: Number(row.total_score),
        answers: row.answers,
        createdAt: new Date(String(row.created_at)).toISOString(),
    };
};
export const fetchLeaderboard = async (input) => {
    await ensureSchema();
    const sql = getSql();
    const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
    const rows = input.shareCode
        ? input.mode
            ? await sql `
          SELECT player_name, share_code, mode, total_score, created_at
          FROM scores
          WHERE share_code = ${input.shareCode} AND mode = ${input.mode}
          ORDER BY total_score DESC, created_at ASC
          LIMIT ${limit}
        `
            : await sql `
          SELECT player_name, share_code, mode, total_score, created_at
          FROM scores
          WHERE share_code = ${input.shareCode}
          ORDER BY total_score DESC, created_at ASC
          LIMIT ${limit}
        `
        : input.mode
            ? await sql `
          SELECT player_name, share_code, mode, total_score, created_at
          FROM scores
          WHERE mode = ${input.mode}
          ORDER BY total_score DESC, created_at ASC
          LIMIT ${limit}
        `
            : await sql `
          SELECT player_name, share_code, mode, total_score, created_at
          FROM scores
          ORDER BY total_score DESC, created_at ASC
          LIMIT ${limit}
        `;
    return rows.map((row, index) => ({
        rank: index + 1,
        playerName: String(row.player_name),
        totalScore: Number(row.total_score),
        mode: row.mode,
        shareCode: String(row.share_code),
        createdAt: new Date(String(row.created_at)).toISOString(),
    }));
};
export const fetchRankForScore = async (input) => {
    await ensureSchema();
    const sql = getSql();
    const rows = input.shareCode
        ? await sql `
        SELECT COUNT(*)::int AS rank
        FROM scores
        WHERE share_code = ${input.shareCode}
          AND mode = ${input.mode}
          AND (
            total_score > ${input.totalScore}
            OR (total_score = ${input.totalScore} AND created_at < ${input.createdAt})
          )
      `
        : await sql `
        SELECT COUNT(*)::int AS rank
        FROM scores
        WHERE mode = ${input.mode}
          AND (
            total_score > ${input.totalScore}
            OR (total_score = ${input.totalScore} AND created_at < ${input.createdAt})
          )
      `;
    return Number(rows[0]?.rank ?? 0) + 1;
};
