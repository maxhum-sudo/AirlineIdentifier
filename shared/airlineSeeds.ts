export type AirlineSeed = {
  id: string;
  name: string;
  country: string;
  iata: string;
  icao: string;
  categoryTitle: string;
};

export const airlineSeeds: AirlineSeed[] = [
  { id: 'american', name: 'American Airlines', country: 'United States', iata: 'AA', icao: 'AAL', categoryTitle: 'Category:American Airlines aircraft tailfins' },
  { id: 'delta', name: 'Delta Air Lines', country: 'United States', iata: 'DL', icao: 'DAL', categoryTitle: 'Category:Delta Air Lines aircraft tailfins' },
  { id: 'united', name: 'United Airlines', country: 'United States', iata: 'UA', icao: 'UAL', categoryTitle: 'Category:United Airlines aircraft tailfins' },
  { id: 'southwest', name: 'Southwest Airlines', country: 'United States', iata: 'WN', icao: 'SWA', categoryTitle: 'Category:Southwest Airlines aircraft tailfins' },
  { id: 'alaska', name: 'Alaska Airlines', country: 'United States', iata: 'AS', icao: 'ASA', categoryTitle: 'Category:Alaska Airlines aircraft tailfins' },
  { id: 'jetblue', name: 'JetBlue Airways', country: 'United States', iata: 'B6', icao: 'JBU', categoryTitle: 'Category:JetBlue Airways aircraft tailfins' },
  { id: 'spirit', name: 'Spirit Airlines', country: 'United States', iata: 'NK', icao: 'NKS', categoryTitle: 'Category:Spirit Airlines aircraft tailfins' },
  { id: 'frontier', name: 'Frontier Airlines', country: 'United States', iata: 'F9', icao: 'FFT', categoryTitle: 'Category:Frontier Airlines aircraft tailfins' },
  { id: 'air-canada', name: 'Air Canada', country: 'Canada', iata: 'AC', icao: 'ACA', categoryTitle: 'Category:Air Canada aircraft tailfins' },
  { id: 'westjet', name: 'WestJet', country: 'Canada', iata: 'WS', icao: 'WJA', categoryTitle: 'Category:WestJet aircraft tailfins' },
  { id: 'british-airways', name: 'British Airways', country: 'United Kingdom', iata: 'BA', icao: 'BAW', categoryTitle: 'Category:British Airways aircraft tailfins' },
  { id: 'lufthansa', name: 'Lufthansa', country: 'Germany', iata: 'LH', icao: 'DLH', categoryTitle: 'Category:Lufthansa aircraft tailfins' },
  { id: 'air-france', name: 'Air France', country: 'France', iata: 'AF', icao: 'AFR', categoryTitle: 'Category:Air France aircraft tailfins' },
  { id: 'klm', name: 'KLM', country: 'Netherlands', iata: 'KL', icao: 'KLM', categoryTitle: 'Category:KLM aircraft tailfins' },
  { id: 'iberia', name: 'Iberia', country: 'Spain', iata: 'IB', icao: 'IBE', categoryTitle: 'Category:Iberia aircraft tailfins' },
  { id: 'easyjet', name: 'easyJet', country: 'United Kingdom', iata: 'U2', icao: 'EZY', categoryTitle: 'Category:EasyJet aircraft tailfins' },
  { id: 'ryanair', name: 'Ryanair', country: 'Ireland', iata: 'FR', icao: 'RYR', categoryTitle: 'Category:Ryanair aircraft tailfins' },
  { id: 'swiss', name: 'Swiss International Air Lines', country: 'Switzerland', iata: 'LX', icao: 'SWR', categoryTitle: 'Category:Swiss International Air Lines aircraft tailfins' },
  { id: 'sas', name: 'SAS Scandinavian Airlines', country: 'Denmark, Norway, Sweden', iata: 'SK', icao: 'SAS', categoryTitle: 'Category:SAS Scandinavian Airlines aircraft tailfins' },
  { id: 'finnair', name: 'Finnair', country: 'Finland', iata: 'AY', icao: 'FIN', categoryTitle: 'Category:Finnair aircraft tailfins' },
  { id: 'tap', name: 'TAP Air Portugal', country: 'Portugal', iata: 'TP', icao: 'TAP', categoryTitle: 'Category:TAP Portugal aircraft tailfins' },
  { id: 'norwegian', name: 'Norwegian Air Shuttle', country: 'Norway', iata: 'DY', icao: 'NOZ', categoryTitle: 'Category:Norwegian Air Shuttle aircraft tailfins' },
  { id: 'turkish', name: 'Turkish Airlines', country: 'Turkey', iata: 'TK', icao: 'THY', categoryTitle: 'Category:Turkish Airlines aircraft tailfins' },
  { id: 'emirates', name: 'Emirates', country: 'United Arab Emirates', iata: 'EK', icao: 'UAE', categoryTitle: 'Category:Emirates aircraft tailfins' },
  { id: 'qatar', name: 'Qatar Airways', country: 'Qatar', iata: 'QR', icao: 'QTR', categoryTitle: 'Category:Qatar Airways aircraft tailfins' },
  { id: 'saudia', name: 'Saudia', country: 'Saudi Arabia', iata: 'SV', icao: 'SVA', categoryTitle: 'Category:Saudi Arabian Airlines aircraft tailfins' },
  { id: 'air-arabia', name: 'Air Arabia', country: 'United Arab Emirates', iata: 'G9', icao: 'ABY', categoryTitle: 'Category:Air Arabia aircraft tailfins' },
  { id: 'air-india', name: 'Air India', country: 'India', iata: 'AI', icao: 'AIC', categoryTitle: 'Category:Air India aircraft tailfins' },
  { id: 'indigo', name: 'IndiGo', country: 'India', iata: '6E', icao: 'IGO', categoryTitle: 'Category:IndiGo aircraft tailfins' },
  { id: 'ana', name: 'All Nippon Airways', country: 'Japan', iata: 'NH', icao: 'ANA', categoryTitle: 'Category:All Nippon Airways aircraft tailfins' },
  { id: 'jal', name: 'Japan Airlines', country: 'Japan', iata: 'JL', icao: 'JAL', categoryTitle: 'Category:Japan Airlines aircraft tailfins' },
  { id: 'korean', name: 'Korean Air', country: 'South Korea', iata: 'KE', icao: 'KAL', categoryTitle: 'Category:Korean Air aircraft tailfins' },
  { id: 'singapore', name: 'Singapore Airlines', country: 'Singapore', iata: 'SQ', icao: 'SIA', categoryTitle: 'Category:Singapore Airlines aircraft tailfins' },
  { id: 'thai', name: 'Thai Airways', country: 'Thailand', iata: 'TG', icao: 'THA', categoryTitle: 'Category:Thai Airways International aircraft tailfins' },
  { id: 'cathay', name: 'Cathay Pacific', country: 'Hong Kong', iata: 'CX', icao: 'CPA', categoryTitle: 'Category:Cathay Pacific aircraft tailfins' },
  { id: 'eva', name: 'EVA Air', country: 'Taiwan', iata: 'BR', icao: 'EVA', categoryTitle: 'Category:EVA Air aircraft tailfins' },
  { id: 'china-airlines', name: 'China Airlines', country: 'Taiwan', iata: 'CI', icao: 'CAL', categoryTitle: 'Category:China Airlines aircraft tailfins' },
  { id: 'air-china', name: 'Air China', country: 'China', iata: 'CA', icao: 'CCA', categoryTitle: 'Category:Air China aircraft tailfins' },
  { id: 'china-eastern', name: 'China Eastern Airlines', country: 'China', iata: 'MU', icao: 'CES', categoryTitle: 'Category:China Eastern Airlines aircraft tailfins' },
  { id: 'china-southern', name: 'China Southern Airlines', country: 'China', iata: 'CZ', icao: 'CSN', categoryTitle: 'Category:China Southern Airlines aircraft tailfins' },
  { id: 'xiamen', name: 'XiamenAir', country: 'China', iata: 'MF', icao: 'CXA', categoryTitle: 'Category:Xiamen Airlines aircraft tailfins' },
  { id: 'air-new-zealand', name: 'Air New Zealand', country: 'New Zealand', iata: 'NZ', icao: 'ANZ', categoryTitle: 'Category:Air New Zealand aircraft tailfins' },
  { id: 'qantas', name: 'Qantas', country: 'Australia', iata: 'QF', icao: 'QFA', categoryTitle: 'Category:Qantas aircraft tailfins' },
  { id: 'jetstar', name: 'Jetstar', country: 'Australia', iata: 'JQ', icao: 'JST', categoryTitle: 'Category:Jetstar aircraft tailfins' },
  { id: 'avianca', name: 'Avianca', country: 'Colombia', iata: 'AV', icao: 'AVA', categoryTitle: 'Category:Avianca aircraft tailfins' },
  { id: 'azul', name: 'Azul Brazilian Airlines', country: 'Brazil', iata: 'AD', icao: 'AZU', categoryTitle: 'Category:Azul Linhas Aéreas Brasileiras aircraft tailfins' },
  { id: 'gol', name: 'GOL Linhas Aéreas', country: 'Brazil', iata: 'G3', icao: 'GLO', categoryTitle: 'Category:Gol Transportes Aéreos aircraft tailfins' },
  { id: 'aerolineas', name: 'Aerolíneas Argentinas', country: 'Argentina', iata: 'AR', icao: 'ARG', categoryTitle: 'Category:Aerolíneas Argentinas aircraft tailfins' },
  { id: 'hawaiian', name: 'Hawaiian Airlines', country: 'United States', iata: 'HA', icao: 'HAL', categoryTitle: 'Category:Hawaiian Airlines aircraft tailfins' },
  { id: 'aeroflot', name: 'Aeroflot', country: 'Russia', iata: 'SU', icao: 'AFL', categoryTitle: 'Category:Aeroflot aircraft tailfins' },
];

export const buildValidationAirlines = () =>
  airlineSeeds.map((airline) => ({
    id: airline.id,
    name: airline.name,
    country: airline.country,
    iata: airline.iata,
    icao: airline.icao,
    images: [
      {
        id: `${airline.id}-tail`,
        category: 'tail' as const,
        alt: `${airline.name} aircraft tailfin`,
      },
    ],
  }));
