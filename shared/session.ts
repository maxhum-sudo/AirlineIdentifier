const SHARE_CODE_PATTERN = /^[A-Z0-9-]{4,32}$/;

export const normalizeShareCode = (shareCode: string) =>
  shareCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

export const isValidShareCode = (shareCode: string) =>
  SHARE_CODE_PATTERN.test(normalizeShareCode(shareCode));

export const sanitizePlayerName = (value: string) =>
  value.trim().replace(/\s+/g, ' ').slice(0, 24);
