const normalizeAnswer = (value) => value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
export const isTypedAnswerCorrect = (input, airline) => {
    const normalized = normalizeAnswer(input);
    if (!normalized) {
        return false;
    }
    if (airline.iata && normalized === airline.iata.toLowerCase()) {
        return true;
    }
    if (airline.icao && normalized === airline.icao.toLowerCase()) {
        return true;
    }
    return normalized === normalizeAnswer(airline.name);
};
