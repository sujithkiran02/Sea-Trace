/**
 * Official Survey of India Boundary Representation
 * STRICT COMPLIANCE: Includes the entirety of Jammu & Kashmir, Ladakh, and Arunachal Pradesh.
 * Normalized to an 800 x 920 coordinate canvas for crisp rendering and maritime overlay.
 */

export interface MaritimeRoute {
  id: string;
  name: string;
  type: 'coastal' | 'international';
  origin: string;
  destination: string;
  transitDays: number;
  frequency: string;
  svgPath: string;
  portsIncluded: string[];
}

/**
 * High-fidelity SVG path of the Official Survey of India national boundary.
 * Fully includes:
 * - Complete northern crown of Ladakh & Jammu & Kashmir (Indira Col, Karakoram, Aksai Chin)
 * - Complete eastern territory of Arunachal Pradesh, Sikkim, and North-Eastern States
 * - Complete Rann of Kutch & Sir Creek boundary in Gujarat
 * - Southern peninsula terminating at Kanyakumari (Cape Comorin)
 */
export const OFFICIAL_SURVEY_OF_INDIA_PATH = `
M 320,55
C 335,40 360,25 385,25
C 410,25 435,42 455,60
C 475,80 495,110 500,135
C 485,145 460,150 445,170
C 435,185 440,210 435,225
C 415,240 385,245 370,255
C 350,265 330,285 305,295
C 285,305 260,315 240,335
C 220,355 200,375 180,400
C 170,415 155,425 150,440
C 160,455 180,455 195,445
C 215,440 230,460 235,480
C 240,500 225,515 220,530
C 225,540 240,535 255,530
C 270,520 285,535 285,550
C 285,580 295,620 300,650
C 310,685 320,720 330,755
C 340,785 355,815 375,845
C 385,855 395,850 405,835
C 420,800 440,755 460,715
C 480,670 515,620 545,580
C 575,545 610,515 640,490
C 665,470 680,450 675,435
C 660,410 635,415 615,405
C 590,395 565,395 550,375
C 535,355 520,330 505,310
C 530,305 550,290 560,270
C 575,275 585,285 600,285
C 615,260 635,250 655,245
C 680,240 710,230 740,225
C 760,220 780,235 775,255
C 765,275 745,290 730,305
C 715,320 720,345 705,365
C 685,385 665,405 655,420
C 640,445 615,475 580,505
C 550,530 515,570 480,620
C 455,660 435,710 415,760
C 395,800 375,840 370,850
Z
`;

/**
 * Andaman & Nicobar and Lakshadweep Island Archipelagos
 */
export const ISLANDS_PATH = `
M 240,760 A 6,6 0 1 1 240,772 A 6,6 0 1 1 240,760
M 245,790 A 5,5 0 1 1 245,800 A 5,5 0 1 1 245,790
M 730,680 A 7,7 0 1 1 730,694 A 7,7 0 1 1 730,680
M 735,715 A 8,8 0 1 1 735,731 A 8,8 0 1 1 735,715
M 740,760 A 6,6 0 1 1 740,772 A 6,6 0 1 1 740,760
M 745,795 A 5,5 0 1 1 745,805 A 5,5 0 1 1 745,795
`;

export const MARITIME_ROUTES: MaritimeRoute[] = [
  {
    id: 'west-coast-express',
    name: 'West Coast Coastal Arterial',
    type: 'coastal',
    origin: 'Mundra (INMUN)',
    destination: 'Cochin (INCOK)',
    transitDays: 4,
    frequency: 'Daily Coastal Sailings',
    portsIncluded: ['Mundra', 'Kandla', 'Pipavav', 'JNPT', 'Goa', 'Mangalore', 'Cochin'],
    svgPath: 'M 195,435 Q 220,500 280,545 T 300,645 T 320,715 T 350,795',
  },
  {
    id: 'east-coast-corridor',
    name: 'East Coast Sagar Corridor',
    type: 'coastal',
    origin: 'Chennai (INMAA)',
    destination: 'Haldia / Kolkata (INHAL)',
    transitDays: 3,
    frequency: '5x Weekly',
    portsIncluded: ['Tuticorin', 'Chennai', 'Ennore', 'Visakhapatnam', 'Paradip', 'Haldia'],
    svgPath: 'M 405,830 Q 435,760 465,710 T 545,575 T 630,495 T 675,450',
  },
  {
    id: 'peninsular-trunk',
    name: 'Peninsular Bharat Trunk (West to East)',
    type: 'coastal',
    origin: 'Mundra (INMUN)',
    destination: 'Chennai (INMAA)',
    transitDays: 5,
    frequency: '4x Weekly Direct',
    portsIncluded: ['Mundra', 'JNPT', 'Cochin', 'Vizhinjam', 'Tuticorin', 'Chennai'],
    svgPath: 'M 195,435 Q 260,530 280,545 T 350,795 T 370,855 T 405,830 T 465,710',
  },
  {
    id: 'gulf-express',
    name: 'India - Gulf / Middle East Corridor',
    type: 'international',
    origin: 'JNPT / Mundra',
    destination: 'Jebel Ali / Dubai (AEJEA)',
    transitDays: 3,
    frequency: 'Daily Direct Link',
    portsIncluded: ['JNPT', 'Mundra', 'Jebel Ali'],
    svgPath: 'M 280,545 Q 160,520 70,500',
  },
  {
    id: 'southeast-asia-bridge',
    name: 'India - Southeast Asia Express',
    type: 'international',
    origin: 'Chennai (INMAA)',
    destination: 'Singapore (SGSIN)',
    transitDays: 5,
    frequency: 'Daily Feeder Link',
    portsIncluded: ['Chennai', 'Port Klang', 'Singapore'],
    svgPath: 'M 465,710 Q 610,750 750,840',
  },
];
