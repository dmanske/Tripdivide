
import { Currency, Quote, QuoteStatus, PaymentMethod, SplitType } from '../../types';

interface ParseOptions {
  myNames: string[];
  myPhones: string[];
}

export interface ParsedQuoteBlock {
  id: string;
  rawText: string;
  vendorPhone: string;
  vendorName: string;
  title: string;
  category: string;
  currency: Currency;
  totalAmount: number;
  installments: number;
  installmentValue: number;
  confidence: 'alta' | 'média' | 'baixa';
  missingFields: string[];
  suggestedQuote: Partial<Quote>;
  // Novos campos para formas de pagamento
  cashPrice?: number;
  cashDiscount?: number;
  creditPrice?: number;
  pixPrice?: number;
}

interface CarRentalDetails {
  period_start: string | null;
  period_end: string | null;
  nights_or_days: number | null;
  pickup_location: string | null;
  dropoff_location: string | null;
  vehicle_category: string | null;
  vehicle_model_hint: string | null;
  seats: number | null;
  is_vip_service: boolean;
  vip_features: string[];
  included_items: string[];
  price_usd: number | null;
  price_brl: number | null;
  price_reference_date: string | null;
  payment_methods: string[];
  installments_max: number | null;
  notes: string | null;
}

/**
 * Converte nome do mês em português para número
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
 * Limpa e normaliza valor monetário
 */
const parseMoneyValue = (value: string): number => {
  // Remove tudo exceto dígitos, vírgula e ponto
  const cleaned = value.replace(/[^\d,\.]/g, '');
  // Se tem vírgula e ponto, assume formato BR (1.234,56)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  // Se tem apenas vírgula, assume decimal BR (1234,56)
  if (cleaned.includes(',')) {
    return parseFloat(cleaned.replace(',', '.'));
  }
  // Se tem apenas ponto, pode ser milhar ou decimal - verifica posição
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts[parts.length - 1].length === 2) {
      // Último grupo tem 2 dígitos = decimal
      return parseFloat(cleaned.replace(/\./g, '').slice(0, -2) + '.' + parts[parts.length - 1]);
    }
  }
  return parseFloat(cleaned);
};

/**
 * Extrai detalhes de aluguel de carro do texto
 */
const extractCarRentalDetails = (text: string): CarRentalDetails => {
  const result: CarRentalDetails = {
    period_start: null,
    period_end: null,
    nights_or_days: null,
    pickup_location: null,
    dropoff_location: null,
    vehicle_category: null,
    vehicle_model_hint: null,
    seats: null,
    is_vip_service: false,
    vip_features: [],
    included_items: [],
    price_usd: null,
    price_brl: null,
    price_reference_date: null,
    payment_methods: [],
    installments_max: null,
    notes: null
  };

  // 1) Dias/diárias
  const daysMatch = text.match(/(\d{1,2})\s*(diárias|diarias|dias)\b/i);
  if (daysMatch) {
    result.nights_or_days = parseInt(daysMatch[1]);
  }

  // 2) Período - várias tentativas
  // Formato: "06 a 21 de novembro 2026"
  let periodMatch = text.match(/(?:período|period|data).*?(\d{1,2})\s*(?:a|até)\s*(\d{1,2})\s*de\s+(\w+)\s*(\d{4})/i);
  if (periodMatch) {
    const year = periodMatch[4];
    const month = getMonthNumber(periodMatch[3]);
    result.period_start = `${year}-${month}-${periodMatch[1].padStart(2, '0')}`;
    result.period_end = `${year}-${month}-${periodMatch[2].padStart(2, '0')}`;
  } else {
    // Formato: "06/11/2026 a 21/11/2026"
    periodMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*(?:a|até|-)\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/i);
    if (periodMatch) {
      const year1 = periodMatch[3].length === 2 ? '20' + periodMatch[3] : periodMatch[3];
      const year2 = periodMatch[6].length === 2 ? '20' + periodMatch[6] : periodMatch[6];
      result.period_start = `${year1}-${periodMatch[2].padStart(2, '0')}-${periodMatch[1].padStart(2, '0')}`;
      result.period_end = `${year2}-${periodMatch[5].padStart(2, '0')}-${periodMatch[4].padStart(2, '0')}`;
    }
  }

  // 3) Locais de retirada/devolução
  const pickupMatch = text.match(/(?:retirada|pickup|pick-up)\s*(?:em|:)?\s*([A-Za-z\s]+?)(?=\s*(?:devolução|devolu[çc]ão|dropoff|drop-off|categoria|local:|veículo|veiculo|\n|$))/i);
  if (pickupMatch) {
    result.pickup_location = pickupMatch[1].trim();
  }

  const dropoffMatch = text.match(/(?:devolução|devolu[çc]ão|dropoff|drop-off)\s*(?:em|:)?\s*([A-Za-z\s]+?)(?=\s*(?:categoria|classe|veículo|veiculo|\n|$))/i);
  if (dropoffMatch) {
    result.dropoff_location = dropoffMatch[1].trim();
  }

  // 4) Categoria/modelo/lugares
  const categoryMatch = text.match(/(?:categoria|classe|class)\s*:\s*([^\n\r]+?)(?=\s*[-–—]|$)/i);
  if (categoryMatch) {
    const fullCategory = categoryMatch[1].trim();
    const parts = fullCategory.split(/[-–—]/);
    result.vehicle_category = parts[0].trim();
    if (parts.length > 1) {
      result.vehicle_model_hint = parts.slice(1).join('-').trim();
    }
  }

  const seatsMatch = text.match(/(\d{1,2})\s*lugar(?:es)?\b/i);
  if (seatsMatch) {
    result.seats = parseInt(seatsMatch[1]);
  }

  // 5) Serviço VIP
  if (/\bVIP\b/i.test(text)) {
    result.is_vip_service = true;
    
    // Capturar features VIP (bullets após "Serviço VIP")
    const vipSection = text.match(/(?:serviço\s+vip|vip\s+exclusivo)(.*?)(?=\n\n|💰|valor|o que está incluso|$)/is);
    if (vipSection) {
      const bullets = vipSection[1].match(/[•\-]\s*([^\n•\-]+)/g);
      if (bullets) {
        result.vip_features = bullets.map(b => b.replace(/^[•\-\s]+/, '').trim()).filter(Boolean);
      }
    }
  }

  // 6) Itens inclusos
  const includedSection = text.match(/(?:o que está incluso|incluso|incluído)(.*?)(?=\n\n|essa é uma opção|$)/is);
  if (includedSection) {
    const bullets = includedSection[1].match(/[🚘📱⛽🚦🛣️👶•\-]\s*([^\n🚘📱⛽🚦🛣️👶•\-]+)/g);
    if (bullets) {
      result.included_items = bullets.map(b => b.replace(/^[🚘📱⛽🚦🛣️👶•\-\s]+/, '').trim()).filter(Boolean);
    }
  }

  // 7) Preços USD e BRL
  const usdMatch = text.match(/(?:U\$S?|US\$|USD)\s*([\d\.\,]+)/i);
  if (usdMatch) {
    result.price_usd = parseMoneyValue(usdMatch[1]);
  }

  const brlMatch = text.match(/R\$\s*([\d\.\,]+)/i);
  if (brlMatch) {
    result.price_brl = parseMoneyValue(brlMatch[1]);
  }

  // 8) Data de referência do preço
  const dateRefMatch = text.match(/[–—-]\s*(\d{2})\/(\d{2})\/(\d{2,4})/);
  if (dateRefMatch) {
    const year = dateRefMatch[3].length === 2 ? '20' + dateRefMatch[3] : dateRefMatch[3];
    result.price_reference_date = `${year}-${dateRefMatch[2]}-${dateRefMatch[1]}`;
  }

  // 9) Formas de pagamento
  if (/\bpix\b/i.test(text)) {
    result.payment_methods.push('pix');
  }
  if (/transferência\s+bancária/i.test(text)) {
    result.payment_methods.push('transferencia');
  }
  if (/cartão|crédito/i.test(text)) {
    result.payment_methods.push('cartao');
  }

  // Parcelamento
  const installmentsMatch = text.match(/até\s*(\d{1,2})\s*x/i);
  if (installmentsMatch) {
    result.installments_max = parseInt(installmentsMatch[1]);
  }

  // 10) Notes - capturar frase final ou extras
  const notesMatch = text.match(/(?:essa é uma opção|você só precisa)(.*?)$/is);
  if (notesMatch) {
    result.notes = notesMatch[1].trim().substring(0, 200); // Limitar tamanho
  }

  return result;
};

/**
 * Normaliza o texto removendo caracteres invisíveis e padronizando formatos comuns
 */
const normalizeText = (text: string) => {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Caracteres invisíveis
    .replace(/[“”]/g, '"')
    .replace(/(\d+)\s*[xX]/g, '$1x') // 10 X -> 10x
    .replace(/R\$\s*/g, 'R$')
    .replace(/U\$S?\s*/g, 'U$');
};

/**
 * Tenta extrair valores monetários de um bloco de texto
 */
const extractPrices = (text: string) => {
  const brlRegex = /R\$\s*([\d.,]+)/gi;
  const usdRegex = /U\$S?\s*([\d.,]+)/gi;
  
  const parseVal = (s: string) => {
    // Remove pontos de milhar e troca vírgula por ponto
    const cleaned = s.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned);
  };

  const brlMatches = [...text.matchAll(brlRegex)].map(m => parseVal(m[1]));
  const usdMatches = [...text.matchAll(usdRegex)].map(m => parseVal(m[1]));

  // Detectar formas de pagamento específicas
  const cashMatch = text.match(/(?:a\s*vista|à\s*vista|pix).*?R\$\s*([\d.,]+)/i);
  const creditMatch = text.match(/(?:cartão|crédito|credit).*?R\$\s*([\d.,]+)/i);
  const pixMatch = text.match(/pix.*?R\$\s*([\d.,]+)/i);

  return { 
    brl: brlMatches, 
    usd: usdMatches,
    cashPrice: cashMatch ? parseVal(cashMatch[1]) : undefined,
    creditPrice: creditMatch ? parseVal(creditMatch[1]) : undefined,
    pixPrice: pixMatch ? parseVal(pixMatch[1]) : undefined
  };
};

/**
 * Analisa um bloco de mensagens para extrair campos estruturados
 */
const analyzeBlock = (text: string, vendorPhone: string): ParsedQuoteBlock => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const firstLine = lines[0] || 'Orçamento sem título';
  
  // Heurística de Categoria
  let category = 'Diversos';
  const lowerText = text.toLowerCase();
  if (/ticket|park|disney|universal|seaworld|ingress|parque|legoland|kennedy/i.test(lowerText)) {
    category = 'Ingressos/Atrações';
  } else if (/pickup|dropoff|diária|diarias|locação|locacao|carro|van|mini van|alamo|hertz|sienna|pacifica|sedan|suv|veículo|veiculo/i.test(lowerText)) {
    category = 'Aluguel de Carro';
  } else if (/hotel|hospedagem|quarto|stay|check-in|checkout/i.test(lowerText)) {
    category = 'Hospedagem';
  } else if (/voo|flight|passagem|aéreo|aereo/i.test(lowerText)) {
    category = 'Voo';
  } else if (/restaurante|refeição|jantar|almoço/i.test(lowerText)) {
    category = 'Restaurantes';
  }

  // Extrair detalhes de carro se for categoria de aluguel
  let carDetails = null;
  if (category === 'Aluguel de Carro') {
    const extracted = extractCarRentalDetails(text);
    
    // Converter para formato QuoteCarDetails
    carDetails = {
      pickupDateTime: extracted.period_start || undefined,
      dropoffDateTime: extracted.period_end || undefined,
      pickupLocation: extracted.pickup_location || undefined,
      dropoffLocation: extracted.dropoff_location || undefined,
      carClass: extracted.vehicle_category 
        ? `${extracted.vehicle_category}${extracted.vehicle_model_hint ? ' - ' + extracted.vehicle_model_hint : ''}`
        : undefined,
      deductible: 0
    };
    
    // Adicionar informações extras nas notas internas se houver
    if (extracted.is_vip_service || extracted.included_items.length > 0) {
      // Será adicionado nas notesInternal mais abaixo
    }
  }

  const prices = extractPrices(text);
  const currency = prices.usd.length > prices.brl.length ? Currency.USD : Currency.BRL;
  
  // Determinar o valor total (preferir preço à vista se disponível)
  let totalAmount = 0;
  let cashDiscount = 0;
  
  if (prices.cashPrice && prices.creditPrice) {
    totalAmount = prices.cashPrice;
    cashDiscount = prices.creditPrice - prices.cashPrice;
  } else if (prices.pixPrice) {
    totalAmount = prices.pixPrice;
  } else {
    const allPrices = currency === Currency.USD ? prices.usd : prices.brl;
    totalAmount = allPrices.length > 0 ? Math.max(...allPrices) : 0;
  }

  // Parcelas
  let installments = 1;
  const installmentMatch = text.match(/(\d+)\s*[xX]/i);
  if (installmentMatch) {
    installments = parseInt(installmentMatch[1]);
  }

  // Validação e Confiança
  const missing = [];
  if (totalAmount === 0) missing.push('Preço total');
  if (category === 'Diversos') missing.push('Categoria precisa');
  
  let confidence: 'alta' | 'média' | 'baixa' = 'alta';
  if (missing.length > 0) confidence = 'média';
  if (totalAmount === 0) confidence = 'baixa';

  // Taxa de câmbio
  const rate = currency === Currency.BRL ? 1 : 5.2;

  // Determinar métodos de pagamento
  const methods: PaymentMethod[] = [];
  if (prices.pixPrice || /pix/i.test(text)) methods.push(PaymentMethod.PIX);
  if (prices.creditPrice || /cartão|crédito|credit/i.test(text)) methods.push(PaymentMethod.CREDIT_CARD);
  if (prices.cashPrice || /dinheiro|cash/i.test(text)) methods.push(PaymentMethod.CASH);
  if (methods.length === 0) methods.push(PaymentMethod.PIX); // Default

  return {
    id: Math.random().toString(36).substr(2, 9),
    rawText: text,
    vendorPhone,
    vendorName: vendorPhone,
    title: firstLine.length > 80 ? firstLine.substring(0, 80) + '...' : firstLine,
    category,
    currency,
    totalAmount,
    installments,
    installmentValue: totalAmount / installments,
    confidence,
    missingFields: missing,
    cashPrice: prices.cashPrice,
    creditPrice: prices.creditPrice,
    pixPrice: prices.pixPrice,
    cashDiscount,
    suggestedQuote: {
      title: firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine,
      category,
      provider: vendorPhone, // Campo obrigatório - usar o telefone/nome do fornecedor
      currency,
      totalAmount,
      exchangeRate: rate,
      amountBrl: totalAmount * rate,
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: QuoteStatus.ANALYSIS,
      notesInternal: `Importado do WhatsApp\n---\n${text}`,
      participantIds: [], // Array vazio = todos participam
      attachments: [], // Array vazio de anexos
      carDetails: carDetails || undefined, // Detalhes do carro se detectados
      paymentTerms: {
        methods,
        installments,
        installmentValue: (totalAmount * rate) / installments,
        cashDiscount: cashDiscount > 0 ? cashDiscount * rate : undefined
      }
    }
  };
};

export const parseWhatsAppQuotes = (rawText: string, options: ParseOptions): ParsedQuoteBlock[] => {
  const normalized = normalizeText(rawText);
  
  // Regex para identificar mensagens: [10:30, 20/01/2024] Daniel: Mensagem
  // Ou 20/01/2024 10:30 - Daniel: Mensagem
  const msgRegex = /(?:\[?(\d{2}\/\d{2}\/\d{2,4}),?\s+(\d{2}:\d{2})(?::\d{2})?\]?)\s*(?:-\s*)?([^:]+):\s*/g;
  
  const messages: { author: string; content: string }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = msgRegex.exec(normalized)) !== null) {
    if (messages.length > 0) {
      messages[messages.length - 1].content = normalized.substring(lastIndex, match.index).trim();
    }
    messages.push({ author: match[3].trim(), content: '' });
    lastIndex = msgRegex.lastIndex;
  }
  if (messages.length > 0) {
    messages[messages.length - 1].content = normalized.substring(lastIndex).trim();
  }

  // Se não encontrou mensagens formatadas, trata como texto puro (orçamento direto)
  if (messages.length === 0 && normalized.trim().length > 50) {
    // Verifica se tem características de orçamento (preço, palavras-chave)
    const hasPrice = /R\$|U\$|valor|preço|price/i.test(normalized);
    const hasKeywords = /orçamento|orcamento|diária|diarias|período|periodo|categoria|incluso|pagamento/i.test(normalized);
    
    if (hasPrice || hasKeywords) {
      // Trata como um único orçamento de fornecedor desconhecido
      return [analyzeBlock(normalized, 'Fornecedor')];
    }
    
    return [];
  }

  // Filtragem: ignorar minhas mensagens e mensagens inúteis
  const filtered = messages.filter(m => {
    const isMe = options.myNames.some(name => m.author.includes(name)) || 
                 options.myPhones.some(phone => m.author.includes(phone));
    if (isMe) return false;
    
    // Ignorar confirmações curtas sem dados
    const lowerContent = m.content.toLowerCase();
    if (m.content.length < 10 && !/R\$|U\$|\d/.test(m.content)) return false;
    
    return true;
  });

  // Agrupamento em blocos (Heurística: nova mensagem com preço ou palavra-chave inicia bloco)
  const blocks: ParsedQuoteBlock[] = [];
  let currentBlockText = "";
  let currentAuthor = "";

  filtered.forEach((msg) => {
    const hasPrice = /R\$|U\$|Valor|Preço/i.test(msg.content);
    const hasStrongKeywords = /Aluguel|Carro|Ingresso|Ticket|Hospedagem/i.test(msg.content);

    // Se o autor mudou ou se a mensagem parece um novo orçamento, fecha o anterior
    if (currentBlockText && (msg.author !== currentAuthor || (hasPrice && currentBlockText.length > 100))) {
      blocks.push(analyzeBlock(currentBlockText, currentAuthor));
      currentBlockText = "";
    }

    currentAuthor = msg.author;
    currentBlockText += (currentBlockText ? "\n" : "") + msg.content;
  });

  if (currentBlockText) {
    blocks.push(analyzeBlock(currentBlockText, currentAuthor));
  }

  return blocks;
};
