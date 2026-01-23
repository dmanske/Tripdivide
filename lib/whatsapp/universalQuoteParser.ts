/**
 * Universal Quote Parser - Sistema de extração multi-categoria
 * 
 * Filosofia: texto livre → estrutura tipada com confidence + warnings
 * Nunca bloqueia o usuário, sempre salva algo útil
 */

export type Category = 
  | 'Voo' 
  | 'Hospedagem' 
  | 'Aluguel de Carro' 
  | 'Parques Temáticos' 
  | 'Restaurantes' 
  | 'Compras' 
  | 'Seguro Viagem' 
  | 'Diversos';

export interface ParsedQuoteResult {
  normalized_title: string | null;
  detected_category: Category | null;
  amount: number | null;
  currency: 'USD' | 'BRL' | string | null;
  people: {
    adults?: number | null;
    children?: number | null;
    total?: number | null;
  } | null;
  dates: {
    start?: string | null;
    end?: string | null;
  } | null;
  locations: {
    pickup?: string | null;
    dropoff?: string | null;
    origin?: string | null;
    destination?: string | null;
    city?: string | null;
  } | null;
  details_json: object | null;
  confidence: number;
  warnings: string[];
}

// Continua no próximo append...

// ============ SCHEMAS POR CATEGORIA ============

export interface FlightDetails {
  airline: string | null;
  origin: string | null;
  destination: string | null;
  depart_datetime: string | null;
  return_datetime: string | null;
  cabin_class: 'economy' | 'premium_economy' | 'business' | 'first' | string | null;
  passengers: {
    adults: number | null;
    children: number | null;
    infants: number | null;
    total: number | null;
  };
  baggage: {
    carry_on: string | null;
    checked: string | null;
  } | null;
  stops: number | null;
  is_direct: boolean | null;
  flight_numbers: string[];
  price_per_person: number | null;
  total_price: number | null;
  currency: string | null;
  booking_link: string | null;
}

export interface LodgingDetails {
  provider: 'airbnb' | 'booking' | 'hotel' | 'casa' | 'outro' | null;
  property_name: string | null;
  checkin_date: string | null;
  checkout_date: string | null;
  nights: number | null;
  city_area: string | null;
  address_hint: string | null;
  rooms: number | null;
  room_type: string | null;
  guests: {
    adults: number | null;
    children: number | null;
    total: number | null;
  };
  meal_plan: 'none' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive' | string | null;
  cancellation_policy: string | null;
  taxes_included: boolean | null;
  price_per_night: number | null;
  total_price: number | null;
  currency: string | null;
  link: string | null;
}

export interface ParkDetails {
  brand: 'disney' | 'universal' | 'seaworld' | 'legoland' | 'outro' | null;
  park_name: string | null;
  visit_dates: string[];
  ticket_type: string | null;
  days: number | null;
  adults: number | null;
  children: number | null;
  add_ons: {
    express: boolean | null;
    genie: boolean | null;
    photo_pass: boolean | null;
    meal_plan: boolean | null;
  } | null;
  price_per_person: number | null;
  total_price: number | null;
  currency: string | null;
  link: string | null;
}

export interface RestaurantDetails {
  restaurant_name: string | null;
  reservation_datetime: string | null;
  city_area: string | null;
  party_size: number | null;
  experience: string | null;
  includes_drinks: boolean | null;
  price_per_person: number | null;
  total_price: number | null;
  currency: string | null;
  link: string | null;
}

export interface ShoppingDetails {
  store: string | null;
  location: string | null;
  items: Array<{
    name: string | null;
    qty: number | null;
    unit_price: number | null;
    total: number | null;
    currency: string | null;
  }>;
  overall_total: number | null;
  currency: string | null;
  link: string | null;
}

export interface InsuranceDetails {
  insurer: string | null;
  coverage_amount: number | null;
  coverage_currency: string | null;
  period_start: string | null;
  period_end: string | null;
  people_total: number | null;
  includes: string[];
  price_per_person_day: number | null;
  total_price: number | null;
  currency: string | null;
  link: string | null;
}

export interface MiscDetails {
  raw_tags: string[];
  detected_entities: string[];
  notes_hint: string | null;
}

// ============ UTILIDADES ============

/**
 * Converte nome do mês PT-BR para número
 */
const getMonthNumber = (monthName: string): string => {
  const months: { [key: string]: string } = {
    'janeiro': '01', 'jan': '01',
    'fevereiro': '02', 'fev': '02',
    'março': '03', 'mar': '03', 'marco': '03',
    'abril': '04', 'abr': '04',
    'maio': '05', 'mai': '05',
    'junho': '06', 'jun': '06',
    'julho': '07', 'jul': '07',
    'agosto': '08', 'ago': '08',
    'setembro': '09', 'set': '09',
    'outubro': '10', 'out': '10',
    'novembro': '11', 'nov': '11',
    'dezembro': '12', 'dez': '12'
  };
  return months[monthName.toLowerCase()] || '01';
};

/**
 * Parse robusto de valores monetários
 */
const parseMoneyValue = (value: string): number => {
  const cleaned = value.replace(/[^\d,\.]/g, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  if (cleaned.includes(',')) {
    return parseFloat(cleaned.replace(',', '.'));
  }
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts[parts.length - 1].length === 2) {
      return parseFloat(cleaned.replace(/\./g, '').slice(0, -2) + '.' + parts[parts.length - 1]);
    }
  }
  return parseFloat(cleaned);
};

/**
 * Extrai datas em vários formatos
 */
const extractDates = (text: string): { start: string | null; end: string | null } => {
  // Formato: "06 a 21 de novembro 2026"
  let match = text.match(/(\d{1,2})\s*(?:a|até)\s*(\d{1,2})\s*de\s+(\w+)\s*(\d{4})/i);
  if (match) {
    const year = match[4];
    const month = getMonthNumber(match[3]);
    return {
      start: `${year}-${month}-${match[1].padStart(2, '0')}`,
      end: `${year}-${month}-${match[2].padStart(2, '0')}`
    };
  }
  
  // Formato: "06/11/2026 a 21/11/2026"
  match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*(?:a|até|-)\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/i);
  if (match) {
    const year1 = match[3].length === 2 ? '20' + match[3] : match[3];
    const year2 = match[6].length === 2 ? '20' + match[6] : match[6];
    return {
      start: `${year1}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`,
      end: `${year2}-${match[5].padStart(2, '0')}-${match[4].padStart(2, '0')}`
    };
  }
  
  return { start: null, end: null };
};

/**
 * Extrai quantidade de pessoas
 */
const extractPeople = (text: string): { adults: number | null; children: number | null; total: number | null } => {
  const adultsMatch = text.match(/(\d+)\s*adult(?:o|os)?/i);
  const childrenMatch = text.match(/(\d+)\s*(?:criança|crianças|child|children)/i);
  const totalMatch = text.match(/(\d+)\s*(?:pessoas|pax|passageiros|guests)/i);
  
  const adults = adultsMatch ? parseInt(adultsMatch[1]) : null;
  const children = childrenMatch ? parseInt(childrenMatch[1]) : null;
  const total = totalMatch ? parseInt(totalMatch[1]) : (adults && children ? adults + children : adults || children);
  
  return { adults, children, total };
};

/**
 * Detecta categoria por keywords
 */
const detectCategory = (text: string): Category | null => {
  const lower = text.toLowerCase();
  
  if (/\b(voo|flight|ida|volta|escala|companhia aérea|airline)\b/i.test(lower)) return 'Voo';
  if (/\b(check-?in|check-?out|noites?|hotel|airbnb|booking|hospedagem)\b/i.test(lower)) return 'Hospedagem';
  if (/\b(diárias?|retirada|devolução|locação|aluguel.*carro|van|veículo)\b/i.test(lower)) return 'Aluguel de Carro';
  if (/\b(disney|universal|seaworld|legoland|ingresso|parque|park)\b/i.test(lower)) return 'Parques Temáticos';
  if (/\b(restaurante|reserva|rodízio|buffet|jantar|almoço)\b/i.test(lower)) return 'Restaurantes';
  if (/\b(seguro|cobertura|assist|insurance)\b/i.test(lower)) return 'Seguro Viagem';
  if (/\b(outlet|loja|compra|shopping|pares?)\b/i.test(lower)) return 'Compras';
  
  return 'Diversos';
};

// Continua com extractors específicos...

// ============ EXTRACTORS POR CATEGORIA ============

function extractFlightDetails(text: string): FlightDetails {
  const airlines = ['LATAM', 'GOL', 'Azul', 'American', 'United', 'Delta', 'TAP', 'Avianca'];
  const airlineMatch = airlines.find(a => new RegExp(a, 'i').test(text));
  
  const originDestMatch = text.match(/(?:origem|origin|de|from).*?([A-Z]{3}|[A-Za-z\s]+?)\s*(?:→|->|para|to|destino|destination).*?([A-Z]{3}|[A-Za-z\s]+?)(?=\n|$)/i);
  const departMatch = text.match(/(?:ida|depart|saída|partida).*?(\d{1,2}\/\d{1,2}\/\d{2,4})(?:\s*às?\s*(\d{1,2}:\d{2}))?/i);
  const returnMatch = text.match(/(?:volta|return|retorno).*?(\d{1,2}\/\d{1,2}\/\d{2,4})(?:\s*às?\s*(\d{1,2}:\d{2}))?/i);
  
  const people = extractPeople(text);
  const cabinMatch = text.match(/(?:classe|class|cabin).*?(econômica|economy|executiva|business|primeira|first)/i);
  const baggageMatch = text.match(/(?:bagagem|baggage|mala).*?(\d+\s*kg)/i);
  const directMatch = /\b(direto|direct|sem escalas?|non-stop)\b/i.test(text);
  const stopsMatch = text.match(/(\d+)\s*(?:escala|stop|conexão)/i);
  
  const pricePerMatch = text.match(/(?:por pessoa|per person|cada).*?(?:R\$|U\$S?)\s*([\d\.,]+)/i);
  const totalMatch = text.match(/(?:total|valor total).*?(?:R\$|U\$S?)\s*([\d\.,]+)/i);
  const currencyMatch = text.match(/(R\$|U\$S?|USD|BRL)/i);
  
  return {
    airline: airlineMatch || null,
    origin: originDestMatch ? originDestMatch[1].trim() : null,
    destination: originDestMatch ? originDestMatch[2].trim() : null,
    depart_datetime: departMatch ? `${departMatch[1]}${departMatch[2] ? ' ' + departMatch[2] : ''}` : null,
    return_datetime: returnMatch ? `${returnMatch[1]}${returnMatch[2] ? ' ' + returnMatch[2] : ''}` : null,
    cabin_class: cabinMatch ? cabinMatch[1].toLowerCase() : null,
    passengers: {
      adults: people.adults,
      children: people.children,
      infants: null,
      total: people.total
    },
    baggage: baggageMatch ? { carry_on: null, checked: baggageMatch[1] } : null,
    stops: stopsMatch ? parseInt(stopsMatch[1]) : (directMatch ? 0 : null),
    is_direct: directMatch,
    flight_numbers: [],
    price_per_person: pricePerMatch ? parseMoneyValue(pricePerMatch[1]) : null,
    total_price: totalMatch ? parseMoneyValue(totalMatch[1]) : null,
    currency: currencyMatch ? (currencyMatch[1].includes('R') ? 'BRL' : 'USD') : null,
    booking_link: null
  };
}

function extractLodgingDetails(text: string): LodgingDetails {
  const providerMatch = text.match(/\b(airbnb|booking|hotel|pousada|resort)\b/i);
  const nameMatch = text.match(/^([^\n]+?)(?=\n|check-?in|período)/i);
  
  const checkinMatch = text.match(/(?:check-?in|entrada).*?(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  const checkoutMatch = text.match(/(?:check-?out|saída).*?(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  const nightsMatch = text.match(/(\d+)\s*(?:noites?|nights?|diárias?)/i);
  
  const roomsMatch = text.match(/(\d+)\s*(?:quartos?|rooms?)/i);
  const roomTypeMatch = text.match(/(?:quarto|room|tipo).*?([^\n]+?)(?=\n|café|cancelamento|$)/i);
  
  const people = extractPeople(text);
  const mealMatch = text.match(/\b(café.*?manhã|breakfast|meia.*?pensão|half.*?board|pensão.*?completa|full.*?board|all.*?inclusive)\b/i);
  const cancelMatch = text.match(/(?:cancelamento|cancellation).*?([^\n]+)/i);
  
  const pricePerNightMatch = text.match(/(?:por noite|per night|diária).*?(?:R\$|U\$S?)\s*([\d\.,]+)/i);
  const totalMatch = text.match(/(?:total|valor total).*?(?:R\$|U\$S?)\s*([\d\.,]+)/i);
  const currencyMatch = text.match(/(R\$|U\$S?)/i);
  
  return {
    provider: providerMatch ? providerMatch[1].toLowerCase() as any : 'hotel',
    property_name: nameMatch ? nameMatch[1].trim() : null,
    checkin_date: checkinMatch ? checkinMatch[1] : null,
    checkout_date: checkoutMatch ? checkoutMatch[1] : null,
    nights: nightsMatch ? parseInt(nightsMatch[1]) : null,
    city_area: null,
    address_hint: null,
    rooms: roomsMatch ? parseInt(roomsMatch[1]) : null,
    room_type: roomTypeMatch ? roomTypeMatch[1].trim() : null,
    guests: { adults: people.adults, children: people.children, total: people.total },
    meal_plan: mealMatch ? (mealMatch[1].toLowerCase().includes('café') ? 'breakfast' : 'none') : null,
    cancellation_policy: cancelMatch ? cancelMatch[1].trim() : null,
    taxes_included: null,
    price_per_night: pricePerNightMatch ? parseMoneyValue(pricePerNightMatch[1]) : null,
    total_price: totalMatch ? parseMoneyValue(totalMatch[1]) : null,
    currency: currencyMatch ? (currencyMatch[1].includes('R') ? 'BRL' : 'USD') : null,
    link: null
  };
}

function extractParkDetails(text: string): ParkDetails {
  const brands = { disney: /disney|magic kingdom|epcot|hollywood studios|animal kingdom/i, universal: /universal|islands of adventure/i, seaworld: /seaworld/i, legoland: /legoland/i };
  let brand: any = 'outro';
  for (const [key, regex] of Object.entries(brands)) {
    if (regex.test(text)) { brand = key; break; }
  }
  
  const parkNameMatch = text.match(/\b(magic kingdom|epcot|hollywood studios|animal kingdom|islands of adventure|universal studios|seaworld|legoland)\b/i);
  const dateMatch = text.match(/(?:data|visita|visit).*?(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  const ticketTypeMatch = text.match(/(?:ingresso|ticket).*?([^\n]+?)(?=\n|adulto|criança|$)/i);
  const daysMatch = text.match(/(\d+)\s*(?:dias?|day)/i);
  
  const people = extractPeople(text);
  const pricePerMatch = text.match(/(?:por pessoa|each|cada).*?(?:R\$|U\$S?)\s*([\d\.,]+)/i);
  const totalMatch = text.match(/(?:total).*?(?:R\$|U\$S?)\s*([\d\.,]+)/i);
  const currencyMatch = text.match(/(R\$|U\$S?)/i);
  
  return {
    brand,
    park_name: parkNameMatch ? parkNameMatch[1] : null,
    visit_dates: dateMatch ? [dateMatch[1]] : [],
    ticket_type: ticketTypeMatch ? ticketTypeMatch[1].trim() : null,
    days: daysMatch ? parseInt(daysMatch[1]) : null,
    adults: people.adults,
    children: people.children,
    add_ons: null,
    price_per_person: pricePerMatch ? parseMoneyValue(pricePerMatch[1]) : null,
    total_price: totalMatch ? parseMoneyValue(totalMatch[1]) : null,
    currency: currencyMatch ? (currencyMatch[1].includes('R') ? 'BRL' : 'USD') : null,
    link: null
  };
}

function extractRestaurantDetails(text: string): RestaurantDetails {
  const nameMatch = text.match(/^([^\n]+?)(?=\n|reserva|data)/i);
  const reservationMatch = text.match(/(?:reserva|reservation).*?(\d{1,2}\/\d{1,2}\/\d{2,4})(?:\s*às?\s*(\d{1,2}:\d{2}))?/i);
  const people = extractPeople(text);
  const experienceMatch = text.match(/\b(rodízio|buffet|tasting|menu|degustação)\b/i);
  const drinksMatch = /\b(bebidas?\s*(?:não\s*)?incluídas?|drinks?\s*(?:not\s*)?included)\b/i.test(text);
  
  const pricePerMatch = text.match(/(?:por pessoa|per person|cada).*?(?:R\$|U\$S?)\s*([\d\.,]+)/i);
  const totalMatch = text.match(/(?:total).*?(?:R\$|U\$S?)\s*([\d\.,]+)/i);
  const currencyMatch = text.match(/(R\$|U\$S?)/i);
  
  return {
    restaurant_name: nameMatch ? nameMatch[1].trim() : null,
    reservation_datetime: reservationMatch ? `${reservationMatch[1]}${reservationMatch[2] ? ' ' + reservationMatch[2] : ''}` : null,
    city_area: null,
    party_size: people.total,
    experience: experienceMatch ? experienceMatch[1] : null,
    includes_drinks: drinksMatch,
    price_per_person: pricePerMatch ? parseMoneyValue(pricePerMatch[1]) : null,
    total_price: totalMatch ? parseMoneyValue(totalMatch[1]) : null,
    currency: currencyMatch ? (currencyMatch[1].includes('R') ? 'BRL' : 'USD') : null,
    link: null
  };
}

function extractShoppingDetails(text: string): ShoppingDetails {
  const storeMatch = text.match(/^([^\n]+?)(?=\n|outlet|loja)/i);
  const itemMatches = text.matchAll(/([^\n]+?)\s*(\d+)\s*(?:pares?|unidades?|un).*?(?:R\$|U\$S?)\s*([\d\.,]+)/gi);
  
  const items = [];
  for (const match of itemMatches) {
    items.push({
      name: match[1].trim(),
      qty: parseInt(match[2]),
      unit_price: parseMoneyValue(match[3]),
      total: null,
      currency: null
    });
  }
  
  const totalMatch = text.match(/(?:total).*?(?:R\$|U\$S?)\s*([\d\.,]+)/i);
  const currencyMatch = text.match(/(R\$|U\$S?)/i);
  
  return {
    store: storeMatch ? storeMatch[1].trim() : null,
    location: null,
    items,
    overall_total: totalMatch ? parseMoneyValue(totalMatch[1]) : null,
    currency: currencyMatch ? (currencyMatch[1].includes('R') ? 'BRL' : 'USD') : null,
    link: null
  };
}

function extractInsuranceDetails(text: string): InsuranceDetails {
  const insurers = ['Assist Card', 'Allianz', 'Travel Ace', 'GTA', 'Affinity'];
  const insurerMatch = insurers.find(i => new RegExp(i, 'i').test(text));
  
  const coverageMatch = text.match(/(?:cobertura|coverage).*?(?:USD|U\$S?|R\$)\s*([\d\.,]+)/i);
  const dates = extractDates(text);
  const people = extractPeople(text);
  
  const includesMatches = text.matchAll(/[•\-]\s*([^\n•\-]+)/g);
  const includes = [];
  for (const match of includesMatches) {
    includes.push(match[1].trim());
  }
  
  const pricePerDayMatch = text.match(/(?:por pessoa|por dia).*?(?:R\$|U\$S?)\s*([\d\.,]+)/i);
  const totalMatch = text.match(/(?:total).*?(?:R\$|U\$S?)\s*([\d\.,]+)/i);
  const currencyMatch = text.match(/(R\$|U\$S?)/i);
  
  return {
    insurer: insurerMatch || null,
    coverage_amount: coverageMatch ? parseMoneyValue(coverageMatch[1]) : null,
    coverage_currency: coverageMatch ? 'USD' : null,
    period_start: dates.start,
    period_end: dates.end,
    people_total: people.total,
    includes,
    price_per_person_day: pricePerDayMatch ? parseMoneyValue(pricePerDayMatch[1]) : null,
    total_price: totalMatch ? parseMoneyValue(totalMatch[1]) : null,
    currency: currencyMatch ? (currencyMatch[1].includes('R') ? 'BRL' : 'USD') : null,
    link: null
  };
}

function extractMiscDetails(text: string): MiscDetails {
  return {
    raw_tags: [],
    detected_entities: [],
    notes_hint: text.substring(0, 200)
  };
}

// ============ FUNÇÃO PRINCIPAL ============

export function parseQuoteText(rawText: string, category?: Category): ParsedQuoteResult {
  const detectedCategory = category || detectCategory(rawText);
  const warnings: string[] = [];
  let confidence = 0;
  let details_json: any = null;
  
  // Extrair dados comuns
  const dates = extractDates(rawText);
  const people = extractPeople(rawText);
  
  // Extrair valores monetários
  const usdMatch = rawText.match(/(?:U\$S?|USD)\s*([\d\.,]+)/i);
  const brlMatch = rawText.match(/R\$\s*([\d\.,]+)/i);
  const amount = brlMatch ? parseMoneyValue(brlMatch[1]) : (usdMatch ? parseMoneyValue(usdMatch[1]) : null);
  const currency = brlMatch ? 'BRL' : (usdMatch ? 'USD' : null);
  
  // Extrair título normalizado (primeira linha limpa)
  const lines = rawText.split('\n').filter(l => l.trim());
  const normalized_title = lines[0] ? lines[0].substring(0, 100) : null;
  
  // Extrair locais genéricos
  const pickupMatch = rawText.match(/(?:retirada|pickup).*?([A-Za-z\s]+?)(?=\n|devolução|$)/i);
  const dropoffMatch = rawText.match(/(?:devolução|dropoff).*?([A-Za-z\s]+?)(?=\n|$)/i);
  const originMatch = rawText.match(/(?:origem|origin|de).*?([A-Za-z\s]+?)(?=\n|destino|$)/i);
  const destinationMatch = rawText.match(/(?:destino|destination|para).*?([A-Za-z\s]+?)(?=\n|$)/i);
  
  const locations = {
    pickup: pickupMatch ? pickupMatch[1].trim() : null,
    dropoff: dropoffMatch ? dropoffMatch[1].trim() : null,
    origin: originMatch ? originMatch[1].trim() : null,
    destination: destinationMatch ? destinationMatch[1].trim() : null,
    city: null
  };
  
  // Extrair details_json específico por categoria
  switch (detectedCategory) {
    case 'Voo':
      details_json = extractFlightDetails(rawText);
      if (!details_json.origin || !details_json.destination) warnings.push('Origem/destino não encontrados');
      if (!details_json.depart_datetime) warnings.push('Data de ida não encontrada');
      break;
      
    case 'Hospedagem':
      details_json = extractLodgingDetails(rawText);
      if (!details_json.checkin_date || !details_json.checkout_date) warnings.push('Datas de check-in/out não encontradas');
      if (!details_json.total_price && !details_json.price_per_night) warnings.push('Preço não encontrado');
      break;
      
    case 'Aluguel de Carro':
      // Usar extração existente do parseWhatsAppQuotes.ts
      details_json = { note: 'Usar extractCarRentalDetails existente' };
      break;
      
    case 'Parques Temáticos':
      details_json = extractParkDetails(rawText);
      if (details_json.visit_dates.length === 0 && !details_json.days) warnings.push('Datas de visita não encontradas');
      if (!details_json.adults && !details_json.children) warnings.push('Quantidade de pessoas não encontrada');
      break;
      
    case 'Restaurantes':
      details_json = extractRestaurantDetails(rawText);
      if (!details_json.party_size && details_json.price_per_person) warnings.push('Quantidade de pessoas não encontrada');
      break;
      
    case 'Compras':
      details_json = extractShoppingDetails(rawText);
      if (details_json.items.length === 0) warnings.push('Itens não identificados');
      break;
      
    case 'Seguro Viagem':
      details_json = extractInsuranceDetails(rawText);
      if (!details_json.period_start || !details_json.period_end) warnings.push('Período não encontrado');
      if (!details_json.people_total && details_json.price_per_person_day) warnings.push('Quantidade de pessoas não encontrada');
      break;
      
    case 'Diversos':
    default:
      details_json = extractMiscDetails(rawText);
      break;
  }
  
  // Calcular confidence score
  if (dates.start && dates.end) confidence += 0.2;
  if (amount && currency) confidence += 0.2;
  if (locations.origin || locations.destination || locations.pickup || locations.dropoff) confidence += 0.2;
  if (people.total || people.adults) confidence += 0.2;
  if (detectedCategory !== 'Diversos') confidence += 0.2;
  
  return {
    normalized_title,
    detected_category: detectedCategory,
    amount,
    currency,
    people: people.total || people.adults || people.children ? people : null,
    dates: dates.start || dates.end ? dates : null,
    locations: Object.values(locations).some(v => v) ? locations : null,
    details_json,
    confidence: Math.min(confidence, 1.0),
    warnings
  };
}

// Exportar função de resumo para UI
export function getQuoteSummary(category: Category, details_json: any): string {
  if (!details_json) return '';
  
  switch (category) {
    case 'Voo':
      const f = details_json as FlightDetails;
      return `${f.origin || '?'}→${f.destination || '?'} • ${f.passengers.adults || 0}A${f.passengers.children ? '+' + f.passengers.children + 'C' : ''}`;
      
    case 'Hospedagem':
      const l = details_json as LodgingDetails;
      return `${l.nights || '?'} noites • ${l.rooms || '?'} quarto${l.rooms !== 1 ? 's' : ''}${l.meal_plan === 'breakfast' ? ' • café' : ''}`;
      
    case 'Parques Temáticos':
      const p = details_json as ParkDetails;
      return `${p.park_name || p.brand || '?'} • ${p.days || '?'} dia${p.days !== 1 ? 's' : ''} • ${p.adults || 0}A${p.children ? '+' + p.children + 'C' : ''}`;
      
    case 'Restaurantes':
      const r = details_json as RestaurantDetails;
      return `${r.restaurant_name || '?'} • ${r.party_size || '?'} pessoas${r.experience ? ' • ' + r.experience : ''}`;
      
    case 'Seguro Viagem':
      const i = details_json as InsuranceDetails;
      return `${i.insurer || '?'} • ${i.people_total || '?'} pessoas • ${i.coverage_amount ? 'USD ' + i.coverage_amount.toLocaleString() : '?'}`;
      
    default:
      return '';
  }
}
