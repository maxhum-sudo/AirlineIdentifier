const SHARE_CODE_PATTERN = /^[A-Z0-9-]{4,32}$/;
export const normalizeShareCode = (shareCode) => shareCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
export const isValidShareCode = (shareCode) => SHARE_CODE_PATTERN.test(normalizeShareCode(shareCode));
export const sanitizePlayerName = (value) => value.trim().replace(/\s+/g, ' ').slice(0, 24);
