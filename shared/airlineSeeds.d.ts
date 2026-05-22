export type AirlineSeed = {
    id: string;
    name: string;
    country: string;
    iata: string;
    icao: string;
    categoryTitle: string;
};
export declare const airlineSeeds: AirlineSeed[];
export declare const buildValidationAirlines: () => {
    id: string;
    name: string;
    country: string;
    iata: string;
    icao: string;
    images: {
        id: string;
        category: "tail";
        alt: string;
    }[];
}[];
