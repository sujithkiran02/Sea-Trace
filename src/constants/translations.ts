/**
 * Multilingual Support for Indian Coastal Shipping Portal
 * Languages: English (en), Hindi (hi), Tamil (ta), Marathi (mr), Gujarati (gu)
 */

export type LanguageCode = 'en' | 'hi' | 'ta' | 'mr' | 'gu';

export interface TranslationStrings {
  badge: string;
  tagline: string;
  headlinePart1: string;
  headlinePart2: string;
  subtitle: string;
  trackButton: string;
  routesButton: string;
  quoteButton: string;
  trackPlaceholder: string;
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  greetingNight: string;
  portsLabel: string;
  scheduleLabel: string;
  teuLabel: string;
  trackingLabel: string;
  talkToTeam: string;
  getQuote: string;
  whatsappMessage: string;
}

export const LANGUAGES: { code: LanguageCode; label: string; nativeName: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', label: 'Gujarati', nativeName: 'ગુજરાતી' },
];

export const TRANSLATIONS: Record<LanguageCode, TranslationStrings> = {
  en: {
    badge: 'INDIAN EEZ OIL SPILL RADAR & VESSEL MANAGEMENT',
    tagline: 'Autonomous Oil-Spill Early Warning & Attribution Platform',
    headlinePart1: "Shielding Bharat's Seas,",
    headlinePart2: 'Oil Spill Detection & Vessel Management.',
    subtitle:
      "Continuous AI satellite radar surveillance across India's 7,500 km coastline and 2.37M km² EEZ. Rapid Sentinel-1 SAR oil spill detection, reverse ocean drift backtracking, and AIS vessel attribution & management from Kandla to Chennai.",
    trackButton: 'Launch Command Suite →',
    routesButton: 'Live Surveillance Map',
    quoteButton: 'Report Spill Incident',
    trackPlaceholder: 'Search Vessel MMSI, IMO, Name or Spill Incident ID (e.g. IN-2026-61C2)...',
    greetingMorning: '24/7 Satellite SAR Active • Arabian Sea Tanker Sector Monitored',
    greetingAfternoon: '24/7 Satellite SAR Active • Bay of Bengal & Andaman EEZ Sector',
    greetingEvening: '24/7 Satellite SAR Active • Gulf of Kutch & Mumbai High Waters',
    greetingNight: '24/7 Satellite SAR Active • Live AIS Vessel Feeds Synchronized',
    portsLabel: 'Coastline Monitored',
    scheduleLabel: 'Spill Detection Latency',
    teuLabel: 'Attribution Accuracy',
    trackingLabel: 'EEZ Under Surveillance',
    talkToTeam: 'Coast Guard MRCC Emergency Hotline',
    getQuote: 'Report Maritime Spill',
    whatsappMessage: 'Urgent inquiry regarding SeaTrace AI Oil Spill Detection & Vessel Management.',
  },
  hi: {
    badge: 'भारतीय विशेष आर्थिक क्षेत्र (EEZ) तेल रिसाव निगरानी व जहाज प्रबंधन',
    tagline: 'भारत के समुद्री जलक्षेत्र में स्वायत्त तेल रिसाव चेतावनी व जहाज प्रबंधन प्रणाली',
    headlinePart1: 'भारत के महासागरों की सुरक्षा,',
    headlinePart2: 'तेल रिसाव पहचान व जहाज प्रबंधन।',
    subtitle:
      'भारत की 7,500 किमी तटरेखा और 23.7 लाख वर्ग किमी EEZ पर उपग्रह रडार से 24/7 निगरानी। सेंटिनल-1 सार से तेल रिसाव की त्वरित पहचान, महासागरीय बहाव विश्लेषण और संदेहास्पद जहाजों का सटीक प्रबंधन।',
    trackButton: 'कमांड कंसोल खोलें →',
    routesButton: 'लाइव सैटेलाइट मैप',
    quoteButton: 'घटना दर्ज करें',
    trackPlaceholder: 'जहाज का नाम, MMSI, IMO या घटना ID दर्ज करें...',
    greetingMorning: '24/7 लाइव रडार सक्रिय • अरब सागर तेल टैंकर क्षेत्र',
    greetingAfternoon: '24/7 लाइव रडार सक्रिय • बंगाल की खाड़ी क्षेत्र',
    greetingEvening: '24/7 लाइव रडार सक्रिय • कच्छ की खाड़ी व मुंबई हाई जलक्षेत्र',
    greetingNight: '24/7 लाइव उपग्रह रडार व AIS जहाज डेटा समन्वित',
    portsLabel: 'तटरेखा निगरानी',
    scheduleLabel: 'पहचान समय < 15 मिनट',
    teuLabel: 'जहाज पहचान सटीकता 94.8%',
    trackingLabel: '23.7 लाख किमी² EEZ कवरेज',
    talkToTeam: 'तटरक्षक बल समुद्री आपातकालीन हॉटलाइन',
    getQuote: 'रिसाव रिपोर्ट करें',
    whatsappMessage: 'सीट्रेस एआई तेल रिसाव पहचान व जहाज निगरानी से संबंधित संदेश।',
  },
  ta: {
    badge: 'இந்திய கடல்சார் பிரத்யேக பொருளாதார மண்டல எண்ணெய் கசிவு & கப்பல் மேலாண்மை',
    tagline: 'தானியங்கி கடல்சார் எண்ணெய் கசிவு எச்சரிக்கை மற்றும் கப்பல் கண்காணிப்பு',
    headlinePart1: 'பாரதத்தின் பெருங்கடல்களை பாதுகாத்தல்,',
    headlinePart2: 'எண்ணெய் கசிவு கண்டறிதல் மற்றும் கப்பல் மேலாண்மை.',
    subtitle:
      'இந்தியாவின் 7,500 கி.மீ கடற்கரை மற்றும் 23.7 லட்சம் ச.கி.மீ கடல் பரப்பில் செயற்கைக்கோள் ரேடார் மூலம் 24 மணி நேர நேரடி கண்காணிப்பு. சென்டினல்-1 ரேடார் மூலம் எண்ணெய் கசிவு கண்டறிதல் மற்றும் கப்பல் பொறுப்பேற்பு.',
    trackButton: 'கட்டளை மையத்தை திறக்கவும் →',
    routesButton: 'நேரலை வரைபடம்',
    quoteButton: 'நிகழ்வை பதிவு செய்க',
    trackPlaceholder: 'கப்பல் பெயர், MMSI, IMO அல்லது நிகழ்வு எண் உள்ளிடவும்...',
    greetingMorning: '24/7 நேரலை ரேடார் விழிப்புடன் உள்ளது • அரபிக்கடல் பிரிவு',
    greetingAfternoon: '24/7 நேரலை ரேடார் விழிப்புடன் உள்ளது • வங்காள விரிகுடா பிரிவு',
    greetingEvening: '24/7 நேரலை ரேடார் விழிப்புடன் உள்ளது • கட்ச் வளைகுடா பிரிவு',
    greetingNight: '24/7 கடல்சார் நேரலை ரேடார் மற்றும் AIS கப்பல் தரவு ஒருங்கிணைக்கப்பட்டுள்ளது',
    portsLabel: 'கண்காணிக்கப்படும் கடற்கரை',
    scheduleLabel: 'கண்டறிதல் வேகம் < 15 நிமிடம்',
    teuLabel: 'துல்லிய கப்பல் தொடர்பு 94.8%',
    trackingLabel: '23.7 லட்சம் ச.கி.மீ கண்காணிப்பு',
    talkToTeam: 'கடலோர காவல்படை அவசர அழைப்பு',
    getQuote: 'கசிவை பதிவு செய்க',
    whatsappMessage: 'கடல்சார் எண்ணெய் கசிவு கண்டறிதல் குறித்த அவசர தகவல்.',
  },
  mr: {
    badge: 'भारतीय सागरी विशेष आर्थिक क्षेत्र तेल गळती शोध व जहाज व्यवस्थापन',
    tagline: 'स्वायत्त सागरी तेल गळती शोध व जहाज तपासणी आणि व्यवस्थापन प्रणाली',
    headlinePart1: 'भारताच्या सागरी सीमांचे रक्षण,',
    headlinePart2: 'तेल गळती शोध व जहाज व्यवस्थापन.',
    subtitle:
      'भारताच्या ७,५०० किमी किनारपट्टीवर आणि २३.७ लाख चौ.किमी सागरी क्षेत्रात उपग्रह रडारद्वारे २४/७ देखरेख. सेंटिनेल-१ द्वारे तेल गळतीची अचूक ओळख आणि संशयित जहाजांचे व्यवस्थापन.',
    trackButton: 'कमांड सेंटर उघडा →',
    routesButton: 'थेट उपग्रह नकाशा',
    quoteButton: 'घटना नोंदवा',
    trackPlaceholder: 'जहाज नाव, MMSI किंवा घटना क्रमांक टाका...',
    greetingMorning: '२४/७ थेट रडार सक्रिय • अरबी समुद्र क्षेत्र',
    greetingAfternoon: '२४/७ थेट रडार सक्रिय • बंगालचा उपसागर क्षेत्र',
    greetingEvening: '२४/७ थेट रडार सक्रिय • कच्छचे आखात व मुंबई हाय',
    greetingNight: '२४/७ अखंड सागरी उपग्रह व AIS जहाज डेटा कार्यरत',
    portsLabel: 'किनारपट्टी देखरेख',
    scheduleLabel: 'शोध कालावधी < १५ मिनिटे',
    teuLabel: 'जहाज शोध अचूकता ९४.८%',
    trackingLabel: '२३.७ लाख चौ.किमी सागरी सुरक्षा',
    talkToTeam: 'तटरक्षक दल सागरी आपत्कालीन हॉटलाईन',
    getQuote: 'गळती नोंदवा',
    whatsappMessage: 'सागरी तेल गळती शोध व नियंत्रण चौकशी.',
  },
  gu: {
    badge: 'ભારતીય દરિયાઈ સુરક્ષા: ઓઇલ સ્પીલ ડિટેક્શન અને જહાજ વ્યવસ્થાપન',
    tagline: 'ભારતના સમુદ્ર ક્ષેત્રમાં સેટેલાઇટ આધારિત ઓઇલ સ્પીલ મોનિટરિંગ અને જહાજ નિરીક્ષણ',
    headlinePart1: 'ભારતના મહાસાગરોનું રક્ષણ,',
    headlinePart2: 'ઓઇલ સ્પીલ ડિટેક્શન અને જહાજ વ્યવસ્થાપન.',
    subtitle:
      'ભારતના ૭,૫૦૦ કિમી દરિયાકાંઠે અને ૨૩.૭ લાખ ચોરસ કિમી EEZ વિસ્તારમાં ૨૪/૭ સેટેલાઇટ રડાર મોનિટરિંગ. સેન્ટિનેલ-૧ SAR દ્વારા તાત્કાલિક ઓઇલ સ્પીલ ઓળખ અને જહાજ સંચાલન.',
    trackButton: 'કમાન્ડ સેન્ટર ખોલો →',
    routesButton: 'લાઈવ સેટેલાઇટ મેપ',
    quoteButton: 'ઘટના નોંધો',
    trackPlaceholder: 'જહાજનું નામ, MMSI, IMO અથવા Incident ID દાખલ કરો...',
    greetingMorning: '૨૪/૭ લાઈવ રડાર સક્રિય • અરબી સમુદ્ર વિસ્તાર',
    greetingAfternoon: '૨૪/૭ લાઈવ રડાર સક્રિય • બંગાળની ખાડી વિસ્તાર',
    greetingEvening: '૨૪/૭ લાઈવ રડાર સક્રિય • કચ્છનો અખાત અને મુંબઈ હાઈ',
    greetingNight: '૨૪/૭ સતત દરિયાઈ સેટેલાઇટ અને AIS જહાજ સુરક્ષા ચાલુ છે',
    portsLabel: 'દરિયાકાંઠા મોનિટરિંગ',
    scheduleLabel: 'ડિટેક્શન સમય < ૧૫ મિનિટ',
    teuLabel: 'જહાજ સંલગ્નતા ચોકસાઈ ૯૪.૮%',
    trackingLabel: '૨૩.૭ લાખ ચો.કિમી EEZ સુરક્ષા',
    talkToTeam: 'કોસ્ટ ગાર્ડ મેરીટાઇમ ઇમરજન્સી હેલ્પલાઇન',
    getQuote: 'સ્પીલ રિપોર્ટ કરો',
    whatsappMessage: 'દરિયાઈ ઓઇલ સ્પીલ મોનિટરિંગ અંગે તાત્કાલિક પૂછપરછ.',
  },
};
