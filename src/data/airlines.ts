import type { Airline } from '../types';
import { airlineSeeds } from '../../shared/airlineSeeds';

const commonsCategoryUrl = (categoryTitle: string) =>
  `https://commons.wikimedia.org/wiki/${categoryTitle.replace(/ /g, '_')}`;

const curatedTailImages: Record<string, { src: string; selectedFileTitle: string; licensePath: string }> = {
  'aeroflot': { src: '/airlines/tails/aeroflot.jpg', selectedFileTitle: "File:Aeroflot - Airbus A320 (14017478315).jpg", licensePath: '/airlines/tails/aeroflot.license.json' },
  'aerolineas': { src: '/airlines/tails/aerolineas.jpg', selectedFileTitle: "File:LV-AXF B747-400 Argentina tail (4586363320) (2).jpg", licensePath: '/airlines/tails/aerolineas.license.json' },
  'air-arabia': { src: '/airlines/tails/air-arabia.jpg', selectedFileTitle: "File:Air Arabia Airbus A321neo A6-ATC Sharjah 2025 (03).jpg", licensePath: '/airlines/tails/air-arabia.license.json' },
  'air-canada': { src: '/airlines/tails/air-canada.jpg', selectedFileTitle: "File:Oratoire (3084043924).jpg", licensePath: '/airlines/tails/air-canada.license.json' },
  'air-china': { src: '/airlines/tails/air-china.jpg', selectedFileTitle: "File:B-2456 Boeing B747-4J6(BCF) Air China Cargo,CN 24346, taxiing 21July2013 pic-011.JPG", licensePath: '/airlines/tails/air-china.license.json' },
  'air-france': { src: '/airlines/tails/air-france.jpg', selectedFileTitle: "File:F-GSPE (6762174821).jpg", licensePath: '/airlines/tails/air-france.license.json' },
  'air-india': { src: '/airlines/tails/air-india.jpg', selectedFileTitle: "File:Air India - Boeing 787-8 (14015591861).jpg", licensePath: '/airlines/tails/air-india.license.json' },
  'air-new-zealand': { src: '/airlines/tails/air-new-zealand.jpg', selectedFileTitle: "File:AirNZ Koru.jpg", licensePath: '/airlines/tails/air-new-zealand.license.json' },
  'alaska': { src: '/airlines/tails/alaska.jpg', selectedFileTitle: "File:Alaska Airlines Boeing 737-890 N560AS (1).jpg", licensePath: '/airlines/tails/alaska.license.json' },
  'american': { src: '/airlines/tails/american.jpg', selectedFileTitle: "File:2015-10-14 Heck des American Airlines Airbus A330 (freddy2001).jpg", licensePath: '/airlines/tails/american.license.json' },
  'ana': { src: '/airlines/tails/ana.jpg', selectedFileTitle: "File:2018-05-16 tail of JA802A (aircraft).jpg", licensePath: '/airlines/tails/ana.license.json' },
  'avianca': { src: '/airlines/tails/avianca.jpg', selectedFileTitle: "File:PR-AVU Airbus A320 Avianca Tail (8167195972).jpg", licensePath: '/airlines/tails/avianca.license.json' },
  'azul': { src: '/airlines/tails/azul.jpg', selectedFileTitle: "File:PR-AIT A330 Azul tailfin LIS.jpg", licensePath: '/airlines/tails/azul.license.json' },
  'british-airways': { src: '/airlines/tails/british-airways.jpg', selectedFileTitle: "File:116ad - British Airways Airbus A320-111, G-BUSC@ZRH,25.10.2000 - Flickr - Aero Icarus (cropped).jpg", licensePath: '/airlines/tails/british-airways.license.json' },
  'cathay': { src: '/airlines/tails/cathay.jpg', selectedFileTitle: "File:B-HLI Airbus A330-342 Cathay Pacific 'HKSAR 10th Anniversary' (8751155465).jpg", licensePath: '/airlines/tails/cathay.license.json' },
  'china-airlines': { src: '/airlines/tails/china-airlines.jpg', selectedFileTitle: "File:B-18215 (6932464121).jpg", licensePath: '/airlines/tails/china-airlines.license.json' },
  'china-eastern': { src: '/airlines/tails/china-eastern.jpg', selectedFileTitle: "File:Airbus A330-243, China Eastern Airlines JP6982024.jpg", licensePath: '/airlines/tails/china-eastern.license.json' },
  'china-southern': { src: '/airlines/tails/china-southern.jpg', selectedFileTitle: "File:B-2071 China Southern Airlines Boeing 777-F1B - cn 37309, taxiing 22july2013 pic-010.JPG", licensePath: '/airlines/tails/china-southern.license.json' },
  'delta': { src: '/airlines/tails/delta.jpg', selectedFileTitle: "File:2 x Delta A330 tail (4535564116).jpg", licensePath: '/airlines/tails/delta.license.json' },
  'easyjet': { src: '/airlines/tails/easyjet.jpg', selectedFileTitle: "File:-i---i- (32186390340).jpg", licensePath: '/airlines/tails/easyjet.license.json' },
  'emirates': { src: '/airlines/tails/emirates.jpg', selectedFileTitle: "File:A6-EDI Emirates Airbus A380-861 - cn 028 at Schiphol (AMS - EHAM), The Netherlands, 16may2014, pic-011.JPG", licensePath: '/airlines/tails/emirates.license.json' },
  'eva': { src: '/airlines/tails/eva.jpg', selectedFileTitle: "File:Evergreen (2298884067).jpg", licensePath: '/airlines/tails/eva.license.json' },
  'finnair': { src: '/airlines/tails/finnair.jpg', selectedFileTitle: "File:Airbus A340-313E, Finnair JP6511745.jpg", licensePath: '/airlines/tails/finnair.license.json' },
  'frontier': { src: '/airlines/tails/frontier.jpg', selectedFileTitle: "File:Airbus A319-111, Frontier Airlines AN1395282.jpg", licensePath: '/airlines/tails/frontier.license.json' },
  'gol': { src: '/airlines/tails/gol.jpg', selectedFileTitle: "File:GOL and Austral (5459152326) (2).jpg", licensePath: '/airlines/tails/gol.license.json' },
  'hawaiian': { src: '/airlines/tails/hawaiian.jpg', selectedFileTitle: "File:Hawaiian 767 tail (7733466490).jpg", licensePath: '/airlines/tails/hawaiian.license.json' },
  'iberia': { src: '/airlines/tails/iberia.jpg', selectedFileTitle: "File:Airbus A319 et A320 Iberia Align\u00e9s - A\u00e9roport de Madrid-Barajas.jpg", licensePath: '/airlines/tails/iberia.license.json' },
  'indigo': { src: '/airlines/tails/indigo.jpg', selectedFileTitle: "File:Indigo ATR72 600 VT-IYB Rear Madurai Sep22 R16 06289.jpg", licensePath: '/airlines/tails/indigo.license.json' },
  'jal': { src: '/airlines/tails/jal.jpg', selectedFileTitle: "File:JAL Dreamliner tail (15062685180).jpg", licensePath: '/airlines/tails/jal.license.json' },
  'jetblue': { src: '/airlines/tails/jetblue.jpg', selectedFileTitle: "File:EM N580JB (2767183666).jpg", licensePath: '/airlines/tails/jetblue.license.json' },
  'jetstar': { src: '/airlines/tails/jetstar.jpg', selectedFileTitle: "File:Jetstar Airbus A320 tail (6768111915).jpg", licensePath: '/airlines/tails/jetstar.license.json' },
  'klm': { src: '/airlines/tails/klm.jpg', selectedFileTitle: "File:Boeing 737-700 PH-BGP of KLM Tail (12291134464).jpg", licensePath: '/airlines/tails/klm.license.json' },
  'korean': { src: '/airlines/tails/korean.jpg', selectedFileTitle: "File:HL7434 Boeing 747F Korean Air Cargo Tail (7976412034).jpg", licensePath: '/airlines/tails/korean.license.json' },
  'lufthansa': { src: '/airlines/tails/lufthansa.jpg', selectedFileTitle: "File:Airbus A321-131, Lufthansa AN1788303.jpg", licensePath: '/airlines/tails/lufthansa.license.json' },
  'norwegian': { src: '/airlines/tails/norwegian.jpg', selectedFileTitle: "File:Derivas de Norwegian en Arlanda.jpg", licensePath: '/airlines/tails/norwegian.license.json' },
  'qantas': { src: '/airlines/tails/qantas.jpg', selectedFileTitle: "File:Boeing 747 QANTAS (35099377241).jpg", licensePath: '/airlines/tails/qantas.license.json' },
  'qatar': { src: '/airlines/tails/qatar.jpg', selectedFileTitle: "File:17-05-27-Flughafen Berlin TXL-a RR71146.jpg", licensePath: '/airlines/tails/qatar.license.json' },
  'ryanair': { src: '/airlines/tails/ryanair.jpg', selectedFileTitle: "File:EI-DAK 737 Ryanair tailfin SCQ.jpg", licensePath: '/airlines/tails/ryanair.license.json' },
  'sas': { src: '/airlines/tails/sas.jpg', selectedFileTitle: "File:LN-RNW 737 SAS ARN 02.jpg", licensePath: '/airlines/tails/sas.license.json' },
  'saudia': { src: '/airlines/tails/saudia.jpg', selectedFileTitle: "File:Airbus A320-200 Saudi Arabian AL (SVA) F-WWIF - MSN 4122 - Will be HZ-AS15 (4219892212).jpg", licensePath: '/airlines/tails/saudia.license.json' },
  'singapore': { src: '/airlines/tails/singapore.jpg', selectedFileTitle: "File:9V-SFF Singapore Airlines Cargo Boeing 747-400F 29july2013 pic1.JPG", licensePath: '/airlines/tails/singapore.license.json' },
  'southwest': { src: '/airlines/tails/southwest.jpg', selectedFileTitle: "File:Southwest Airlines aircraft at San Francisco International Airport 02.jpg", licensePath: '/airlines/tails/southwest.license.json' },
  'spirit': { src: '/airlines/tails/spirit.jpg', selectedFileTitle: "File:DSC 8247-F-WWDF - MSN 5861 (10515771896).jpg", licensePath: '/airlines/tails/spirit.license.json' },
  'swiss': { src: '/airlines/tails/swiss.jpg', selectedFileTitle: "File:HB-IJH tail (4181732955).jpg", licensePath: '/airlines/tails/swiss.license.json' },
  'tap': { src: '/airlines/tails/tap.jpg', selectedFileTitle: "File:CS-TOE Airbus A330 TAP Portugal Tail (8168960332).jpg", licensePath: '/airlines/tails/tap.license.json' },
  'thai': { src: '/airlines/tails/thai.jpg', selectedFileTitle: "File:DSC 8304-HS-TXG (10518175956).jpg", licensePath: '/airlines/tails/thai.license.json' },
  'turkish': { src: '/airlines/tails/turkish.jpg', selectedFileTitle: "File:D-AVZC Airbus A321 Turkish Airlines Msn 5546 Tail (8634659114).jpg", licensePath: '/airlines/tails/turkish.license.json' },
  'united': { src: '/airlines/tails/united.jpg', selectedFileTitle: "File:United Airlines - Boeing 787-8 (14038782873).jpg", licensePath: '/airlines/tails/united.license.json' },
  'westjet': { src: '/airlines/tails/westjet.jpg', selectedFileTitle: "File:The evening rush hour at YYC (4845428395).jpg", licensePath: '/airlines/tails/westjet.license.json' },
  'xiamen': { src: '/airlines/tails/xiamen.jpg', selectedFileTitle: "File:B-2848 Boeing 752 Xiamen Airlines Tail (11756978504).jpg", licensePath: '/airlines/tails/xiamen.license.json' },
};

const tailImageSrc = (airlineId: string, curated?: (typeof curatedTailImages)[string]) =>
  curated ? `/airlines/tailpins/${airlineId}.png` : undefined;

export const airlines: Airline[] = airlineSeeds.map((airline) => {
  const curatedTailImage = curatedTailImages[airline.id];

  return {
    id: airline.id,
    name: airline.name,
    country: airline.country,
    iata: airline.iata,
    icao: airline.icao,
    images: [
      {
        id: `${airline.id}-tail`,
        category: 'tail',
        src: tailImageSrc(airline.id, curatedTailImage),
        selectedFileTitle: curatedTailImage?.selectedFileTitle,
        licensePath: curatedTailImage?.licensePath,
        alt: `${airline.name} aircraft tailfin from Wikimedia Commons`,
        citation: {
          sourceCategoryTitle: airline.categoryTitle,
          sourceCategoryUrl: commonsCategoryUrl(airline.categoryTitle),
        },
      },
    ],
  };
});
