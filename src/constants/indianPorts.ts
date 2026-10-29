/**
 * Official Indian Major Ports & Non-Major Maritime Hubs with UN/LOCODE
 * Verified against Indian Ministry of Ports, Shipping and Waterways (MoPSW) & UNECE.
 */

export interface IndianPort {
  id: string;
  name: string;
  unLocode: string;
  state: string;
  coast: 'west' | 'east';
  isMajor: boolean;
  latitude: number;
  longitude: number;
  svgCoord: [number, number]; // Projected for the official Survey of India SVG canvas (0..800 x 0..900)
  description: string;
}

export const INDIAN_PORTS: IndianPort[] = [
  // West Coast Ports
  {
    id: 'kandla',
    name: 'Deendayal / Kandla',
    unLocode: 'INKDL',
    state: 'Gujarat',
    coast: 'west',
    isMajor: true,
    latitude: 23.01,
    longitude: 70.22,
    svgCoord: [210, 420],
    description: "India's highest cargo throughput port by volume in the Gulf of Kutch.",
  },
  {
    id: 'mundra',
    name: 'Mundra',
    unLocode: 'INMUN',
    state: 'Gujarat',
    coast: 'west',
    isMajor: false, // Private / Commercial mega-hub
    latitude: 22.75,
    longitude: 69.70,
    svgCoord: [195, 435],
    description: "India's largest commercial deep-draft container gateway.",
  },
  {
    id: 'pipavav',
    name: 'Pipavav',
    unLocode: 'INPAV',
    state: 'Gujarat',
    coast: 'west',
    isMajor: false,
    latitude: 20.91,
    longitude: 71.50,
    svgCoord: [240, 480],
    description: 'Premier intermodal port connecting north-western industrial hinterlands.',
  },
  {
    id: 'jnpt',
    name: 'JNPT / Nhava Sheva',
    unLocode: 'INNSA',
    state: 'Maharashtra',
    coast: 'west',
    isMajor: true,
    latitude: 18.95,
    longitude: 72.95,
    svgCoord: [280, 545],
    description: "India's premier container transshipment port handling over 50% of national box trade.",
  },
  {
    id: 'mormugao',
    name: 'Mormugao / Goa',
    unLocode: 'INMRM',
    state: 'Goa',
    coast: 'west',
    isMajor: true,
    latitude: 15.42,
    longitude: 73.80,
    svgCoord: [300, 645],
    description: 'Natural deep-water port on the Zuari river estuary.',
  },
  {
    id: 'new-mangalore',
    name: 'New Mangalore',
    unLocode: 'INNMB',
    state: 'Karnataka',
    coast: 'west',
    isMajor: true,
    latitude: 12.92,
    longitude: 74.82,
    svgCoord: [320, 715],
    description: 'Major coastal hub for coffee, cashew, chemicals and coastal container feeder cargo.',
  },
  {
    id: 'cochin',
    name: 'Cochin / Kochi',
    unLocode: 'INCOK',
    state: 'Kerala',
    coast: 'west',
    isMajor: true,
    latitude: 9.96,
    longitude: 76.27,
    svgCoord: [350, 795],
    description: 'International container transshipment terminal at Vallarpadam on main east-west sea route.',
  },
  {
    id: 'vizhinjam',
    name: 'Vizhinjam',
    unLocode: 'INVIZ',
    state: 'Kerala',
    coast: 'west',
    isMajor: false,
    latitude: 8.37,
    longitude: 76.99,
    svgCoord: [370, 840],
    description: "India's ultra-deepwater automated mega-transshipment container terminal.",
  },

  // East Coast Ports
  {
    id: 'tuticorin',
    name: 'V.O. Chidambaranar / Tuticorin',
    unLocode: 'INTUT',
    state: 'Tamil Nadu',
    coast: 'east',
    isMajor: true,
    latitude: 8.76,
    longitude: 78.13,
    svgCoord: [405, 830],
    description: 'All-weather port situated strategically in the Gulf of Mannar near Colombo feeder route.',
  },
  {
    id: 'chennai',
    name: 'Chennai',
    unLocode: 'INMAA',
    state: 'Tamil Nadu',
    coast: 'east',
    isMajor: true,
    latitude: 13.08,
    longitude: 80.27,
    svgCoord: [465, 710],
    description: "South India's primary gateway for automotive, electronics, and engineering EXIM freight.",
  },
  {
    id: 'ennore',
    name: 'Kamarajar / Ennore',
    unLocode: 'INENR',
    state: 'Tamil Nadu',
    coast: 'east',
    isMajor: true,
    latitude: 13.27,
    longitude: 80.33,
    svgCoord: [470, 695],
    description: "India's first corporatized major port with dedicated modern container berths.",
  },
  {
    id: 'visakhapatnam',
    name: 'Visakhapatnam / Vizag',
    unLocode: 'INVTZ',
    state: 'Andhra Pradesh',
    coast: 'east',
    isMajor: true,
    latitude: 17.68,
    longitude: 83.21,
    svgCoord: [545, 575],
    description: 'Deep-water natural harbor connecting Central and South-Eastern mineral and agro corridors.',
  },
  {
    id: 'paradip',
    name: 'Paradip',
    unLocode: 'INPBD',
    state: 'Odisha',
    coast: 'east',
    isMajor: true,
    latitude: 20.31,
    longitude: 86.61,
    svgCoord: [630, 495],
    description: 'Major bulk and container maritime outlet serving Eastern and Northern Indian industries.',
  },
  {
    id: 'kolkata-haldia',
    name: 'Syama Prasad Mookerjee / Haldia & Kolkata',
    unLocode: 'INHAL / INCCU',
    state: 'West Bengal',
    coast: 'east',
    isMajor: true,
    latitude: 22.02,
    longitude: 88.06,
    svgCoord: [675, 450],
    description: "India's oldest riverine port complex serving landlocked North-East, Nepal and Bhutan.",
  },
];
