
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
  const usdRegex = /U\$\s*([\d.,]+)/gi;
  
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
  } else if (/pickup|dropoff|diária|diarias|locação|locacao|carro|van|mini van|alamo|hertz|sienna|pacifica/i.test(lowerText)) {
    category = 'Aluguel de Carro';
  } else if (/hotel|hospedagem|quarto|stay|check-in|checkout/i.test(lowerText)) {
    category = 'Hospedagem';
  } else if (/voo|flight|passagem|aéreo|aereo/i.test(lowerText)) {
    category = 'Voo';
  } else if (/restaurante|refeição|jantar|almoço/i.test(lowerText)) {
    category = 'Restaurantes';
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
      currency,
      totalAmount,
      exchangeRate: rate,
      amountBrl: totalAmount * rate,
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: QuoteStatus.ANALYSIS,
      notesInternal: `Importado do WhatsApp\n---\n${text}`,
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
