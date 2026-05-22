export declare const hashString: (value: string) => number;
export declare const createSeededRandom: (seed: string) => () => number;
export declare const shuffleSeeded: <T>(items: T[], seed: string) => T[];
