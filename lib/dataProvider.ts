
import { Trip, Quote, Expense, Payment, QuoteStatus, Currency, Vendor, PaymentMethod, Traveler, ExpenseStatus, ExpenseSplit, SplitType, Reimbursement, Comparison, TravelerType, TravelerIssue, QuoteVersion, VendorQuoteRequest } from '../types';
import { Money } from './money';

let trips: Trip[] = [];
let vendors: Vendor[] = [];
let travelers: Traveler[] = [];
let quotes: Quote[] = [];
let quoteVersions: QuoteVersion[] = [];
let expenses: Expense[] = [];
let splits: ExpenseSplit[] = [];
let payments: Payment[] = [];
let reimbursements: Reimbursement[] = [];
let comparisons: Comparison[] = [];

export const dataProvider = {
  getTrips: async () => trips,
  saveTrip: async (trip: Trip) => {
    const idx = trips.findIndex(t => t.id === trip.id);
    if (idx >= 0) trips[idx] = trip;
    else trips.push(trip);
    return trip;
  },

  getTravelers: async (tripId: string) => travelers.filter(t => t.tripId === tripId && t.status === 'Ativo'),
  saveTraveler: async (t: Traveler) => {
    const idx = travelers.findIndex(item => item.id === t.id);
    if (idx >= 0) travelers[idx] = { ...t, updatedAt: new Date().toISOString() };
    else travelers.push({ ...t, id: t.id || Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return t;
  },
  deleteTraveler: async (id: string) => {
    const idx = travelers.findIndex(item => item.id === id);
    if (idx >= 0) travelers[idx].status = 'Arquivado';
  },
  computeTravelerIssues: (t: Traveler, trip: Trip): TravelerIssue[] => {
    const issues: TravelerIssue[] = [];
    if (!t.phone) issues.push({ type: 'warning', message: 'Sem telefone de contato' });
    if (t.docType === 'Passaporte' && (!t.docNumber || !t.docExpiry)) issues.push({ type: 'error', message: 'Dados de passaporte pendentes' });
    return issues;
  },
  
  bulkImportTravelers: async (tripId: string, raw: string) => {
    const lines = raw.split('\n').filter(l => l.trim());
    let count = 0;
    lines.forEach(line => {
      const parts = line.split(';');
      const fullName = parts[0]?.trim();
      const typeStr = parts[1]?.trim();
      const coupleId = parts[2]?.trim();
      const segmentsStr = parts[3]?.trim();
      const phone = parts[4]?.trim();

      if (fullName) {
        const t: Traveler = {
          id: Math.random().toString(36).substr(2, 9),
          tripId,
          fullName,
          type: (typeStr as any) || TravelerType.ADULT,
          coupleId: coupleId || (trips.length > 0 ? trips[0].couples[0]?.id : ''),
          goesToSegments: segmentsStr ? segmentsStr.split(',') : ['seg-all'],
          phone: phone || '',
          isPayer: true,
          status: 'Ativo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        travelers.push(t);
        count++;
      }
    });
    return count;
  },

  getQuotes: async (tripId: string) => quotes.filter(q => q.tripId === tripId),
  getQuoteById: async (id: string) => quotes.find(q => q.id === id),
  saveQuote: async (quote: Quote) => {
    const idx = quotes.findIndex(q => q.id === quote.id);
    const rate = quote.currency === Currency.BRL ? 1 : (quote.exchangeRate || 1);
    const amountBrl = Money.sanitize(quote.totalAmount * rate);
    
    const updatedQuote = { 
      ...quote, 
      exchangeRate: rate, 
      amountBrl: amountBrl,
      updatedAt: new Date().toISOString() 
    };

    if (idx >= 0) {
      if (Math.abs(quotes[idx].totalAmount - updatedQuote.totalAmount) > 0.009) {
         quoteVersions.push({
           id: Math.random().toString(36).substr(2, 9),
           quoteId: quote.id,
           createdAt: new Date().toISOString(),
           createdBy: 'Usuário',
           changes: [{ label: 'Valor Total', old: quotes[idx].totalAmount, new: updatedQuote.totalAmount }]
         });
      }
      quotes[idx] = updatedQuote;
    } else {
      updatedQuote.id = updatedQuote.id || Math.random().toString(36).substr(2, 9);
      updatedQuote.createdAt = new Date().toISOString();
      quotes.push(updatedQuote);
    }
    return updatedQuote;
  },

  saveQuoteFromWhatsApp: async (tripId: string, block: any) => {
    if (!block.totalAmount || block.totalAmount === 0) return null;

    let vendor = vendors.find(v => v.contacts.some(c => c.phone === block.vendorPhone));
    if (!vendor) {
      vendor = {
        id: Math.random().toString(36).substr(2, 9),
        tripId,
        name: `Fornecedor ${block.vendorPhone}`,
        categories: [block.category],
        rating: 3, preferred: false, tags: ['Importado'], riskFlags: [], status: 'Ativo',
        contacts: [{id: 'c1', name: 'WhatsApp', role: 'Vendas', phone: block.vendorPhone, preferredMethod: 'WhatsApp', isPrimary: true}],
        attachments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      };
      vendors.push(vendor);
    }

    const rate = block.currency === Currency.BRL ? 1 : 5.2; 
    const amountBrl = Money.sanitize(block.totalAmount * rate);

    const quote: Quote = {
      ...block.suggestedQuote,
      id: Math.random().toString(36).substr(2, 9),
      tripId,
      vendorId: vendor.id,
      provider: vendor.name,
      segmentId: 'seg-all',
      participantIds: ['ALL'],
      exchangeRate: rate,
      amountBrl: amountBrl,
      tags: ['WhatsApp'],
      createdBy: 'Importador WhatsApp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completeness: 70,
      votes: [],
      cancellationPolicy: 'Ver notas'
    } as any;
    quotes.push(quote);
    return quote;
  },

  getVendors: async (tripId: string) => vendors.filter(v => v.tripId === tripId && v.status === 'Ativo'),
  saveVendor: async (vendor: Vendor) => {
    const idx = vendors.findIndex(v => v.id === vendor.id);
    if (idx >= 0) vendors[idx] = { ...vendor, updatedAt: new Date().toISOString() };
    else vendors.push({ ...vendor, id: vendor.id || Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return vendor;
  },

  getExpenses: async (tripId: string) => expenses.filter(e => e.tripId === tripId && e.status !== ExpenseStatus.CANCELLED),
  getExpenseById: async (id: string) => expenses.find(e => e.id === id),
  saveExpense: async (expense: Expense) => {
    const idx = expenses.findIndex(e => e.id === expense.id);
    if (idx >= 0) expenses[idx] = { ...expense, updatedAt: new Date().toISOString() };
    else expenses.push({ ...expense, id: expense.id || Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return expense;
  },

  closeQuoteToExpense: async (tripId: string, quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    const trip = trips.find(t => t.id === tripId);
    if (!quote || !trip) return null;

    const expense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      tripId,
      segmentId: quote.segmentId || 'seg-all',
      category: quote.category,
      title: quote.title,
      vendorId: quote.vendorId,
      sourceQuoteId: quote.id,
      currency: quote.currency,
      amount: quote.totalAmount,
      exchangeRate: quote.exchangeRate,
      amountBrl: quote.amountBrl,
      status: ExpenseStatus.CONFIRMED,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hotelDetails: quote.hotelDetails,
      ticketDetails: quote.ticketDetails,
      carDetails: quote.carDetails,
      genericDetails: quote.genericDetails
    };
    expenses.push(expense);

    const activeCouples = quote.participantIds.includes('ALL') ? trip.couples : trip.couples.filter(c => quote.participantIds.includes(c.id));
    const splitAmounts = Money.splitEqual(expense.amountBrl, activeCouples.length);
    
    activeCouples.forEach((c, i) => {
      splits.push({ 
        id: Math.random().toString(36).substr(2, 9), 
        expenseId: expense.id, 
        coupleId: c.id, 
        splitType: SplitType.EQUAL, 
        amountBrl: splitAmounts[i] 
      });
    });

    quote.status = QuoteStatus.CHOSEN;
    return expense;
  },

  getExpenseSplits: async (expenseId: string) => splits.filter(s => s.expenseId === expenseId),
  getExpenseSplitsByTrip: async (tripId: string) => {
    const activeExpenseIds = expenses
      .filter(e => e.tripId === tripId && e.status !== ExpenseStatus.CANCELLED)
      .map(e => e.id);
    return splits.filter(s => activeExpenseIds.includes(s.expenseId));
  },

  getPaymentsByTrip: async (tripId: string) => {
    const activeExpenseIds = expenses
      .filter(e => e.tripId === tripId && e.status !== ExpenseStatus.CANCELLED)
      .map(e => e.id);
    return payments.filter(p => activeExpenseIds.includes(p.expenseId));
  },
  
  updateExpenseSplits: async (expenseId: string, newSplits: ExpenseSplit[]) => {
    const sanitized = newSplits.map(s => ({ ...s, amountBrl: Money.sanitize(s.amountBrl) }));
    splits = splits.filter(s => s.expenseId !== expenseId).concat(sanitized);
    dataProvider.generateReimbursementsForExpense(expenseId);
  },

  getPaymentsByExpense: async (expenseId: string) => payments.filter(p => p.expenseId === expenseId),
  savePayment: async (payment: Payment) => {
    const amountBrl = Money.sanitize(payment.paidAmountBrl);
    const newP = { ...payment, id: Math.random().toString(36).substr(2, 9), paidAmountBrl: amountBrl, paidAt: payment.paidAt || new Date().toISOString() };
    payments.push(newP);
    
    const expense = expenses.find(e => e.id === payment.expenseId);
    if (expense) {
      const totalPaid = payments.filter(p => p.expenseId === expense.id).reduce((sum, p) => sum + Money.toCents(p.paidAmountBrl), 0);
      const targetCents = Money.toCents(expense.amountBrl);
      if (totalPaid >= targetCents - 1) expense.status = ExpenseStatus.PAID;
    }

    dataProvider.generateReimbursementsForExpense(payment.expenseId);
    return newP;
  },

  getReimbursements: async (tripId: string) => reimbursements.filter(r => r.tripId === tripId),
  
  generateReimbursementsForExpense: (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense || expense.status === ExpenseStatus.CANCELLED) return;

    const expSplits = splits.filter(s => s.expenseId === expenseId);
    const expPayments = payments.filter(p => p.expenseId === expenseId);

    reimbursements = reimbursements.filter(r => r.expenseId !== expenseId || r.status === 'paid');

    const balancesCents: Record<string, number> = {}; 
    expSplits.forEach(s => { 
      balancesCents[s.coupleId] = (balancesCents[s.coupleId] || 0) - Money.toCents(s.amountBrl); 
    });
    expPayments.forEach(p => { 
      balancesCents[p.paidByCoupleId] = (balancesCents[p.paidByCoupleId] || 0) + Money.toCents(p.paidAmountBrl); 
    });

    const creditors = Object.keys(balancesCents).filter(k => balancesCents[k] > 0).map(k => ({ id: k, cents: balancesCents[k] }));
    const debtors = Object.keys(balancesCents).filter(k => balancesCents[k] < 0).map(k => ({ id: k, cents: Math.abs(balancesCents[k]) }));

    let cIdx = 0; let dIdx = 0;
    while (cIdx < creditors.length && dIdx < debtors.length) {
      const amountCents = Math.min(creditors[cIdx].cents, debtors[dIdx].cents);
      if (amountCents > 0) {
        reimbursements.push({ 
          id: Math.random().toString(36).substr(2, 9), 
          tripId: expense.tripId, 
          expenseId, 
          fromCoupleId: debtors[dIdx].id, 
          toCoupleId: creditors[cIdx].id, 
          amountBrl: Money.fromCents(amountCents), 
          status: 'pending', 
          createdAt: new Date().toISOString() 
        });
      }
      creditors[cIdx].cents -= amountCents;
      debtors[dIdx].cents -= amountCents;
      if (creditors[cIdx].cents <= 0) cIdx++;
      if (debtors[dIdx].cents <= 0) dIdx++;
    }
  },

  markReimbursementAsPaid: async (id: string) => {
    const r = reimbursements.find(item => item.id === id);
    if (r) { r.status = 'paid'; r.paidAt = new Date().toISOString(); }
  },

  getQuoteVersions: async (quoteId: string) => quoteVersions.filter(v => v.quoteId === quoteId),
  restoreQuoteVersion: async (id: string) => {
     const version = quoteVersions.find(v => v.id === id);
     if (!version) return null;
     const quote = quotes.find(q => q.id === version.quoteId);
     if (quote) {
        quote.totalAmount = version.changes[0].old;
        return quote;
     }
     return null;
  },

  createQuoteVariation: async (quoteId: string, label: string) => {
    const original = quotes.find(q => q.id === quoteId);
    if (!original) return null;

    const variation: Quote = {
      ...original,
      id: Math.random().toString(36).substr(2, 9),
      originalId: original.originalId || original.id,
      variationLabel: label,
      status: QuoteStatus.DRAFT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      votes: []
    };
    quotes.push(variation);
    return variation;
  },
  
  getVendorRequests: async (vendorId: string) => [],
  saveVendorRequest: async (req: any) => {},
  saveComparison: async (comp: Comparison) => {
    comparisons.push({ ...comp, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() });
    return comp;
  }
};
