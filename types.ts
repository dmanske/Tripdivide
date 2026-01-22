
export enum Currency {
  BRL = 'BRL',
  USD = 'USD'
}

export enum QuoteStatus {
  DRAFT = 'Novo',
  ANALYSIS = 'Em análise',
  SHORTLIST = 'Shortlist',
  CHOSEN = 'Aprovada',
  CLOSED = 'Fechada',
  REJECTED = 'Rejeitada'
}

export enum ExpenseStatus {
  PLANNED = 'planned',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export enum SplitType {
  EQUAL = 'equal',
  PERCENT = 'percent',
  FIXED = 'fixed',
  PER_PERSON = 'per_person'
}

export enum PaymentMethod {
  PIX = 'pix',
  CREDIT_CARD = 'card',
  CASH = 'cash',
  BOLETO = 'boleto',
  MILES = 'miles',
  TRANSFER = 'transfer'
}

export enum TravelerType {
  ADULT = 'Adulto',
  CHILD = 'Criança',
  INFANT = 'Infante'
}

export enum DocType {
  PASSPORT = 'Passaporte',
  RG = 'RG',
  NONE = 'Nenhum'
}

export interface Attachment {
  id: string;
  title: string;
  url: string;
  type?: string;
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  coupleId: string;
  splitType: SplitType;
  value?: number; // percentual ou valor fixo ou peso
  amountBrl: number;
}

export interface Payment {
  id: string;
  tripId: string;
  expenseId: string;
  paidByCoupleId: string;
  method: PaymentMethod;
  installments?: number;
  installmentValue?: number;
  paidAmountBrl: number;
  paidAt: string;
  proofUrl?: string;
  notes?: string;
}

export interface Reimbursement {
  id: string;
  tripId: string;
  expenseId: string;
  fromCoupleId: string;
  toCoupleId: string;
  amountBrl: number;
  status: 'pending' | 'paid';
  createdAt: string;
  paidAt?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  tripId: string;
  segmentId: string | 'general';
  category: string;
  title: string;
  vendorId?: string;
  sourceQuoteId?: string;
  currency: Currency;
  amount: number;
  exchangeRate: number;
  amountBrl: number;
  dueDate?: string;
  status: ExpenseStatus;
  notesGroup?: string;
  notesInternal?: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  
  // Detalhes herdados das cotações
  hotelDetails?: any;
  ticketDetails?: any;
  carDetails?: any;
  genericDetails?: any;
}

export interface Vendor {
  id: string;
  tripId: string;
  name: string;
  legalName?: string;
  categories: string[];
  rating: number; 
  preferred: boolean;
  tags: string[];
  riskFlags: string[];
  contacts: any[];
  attachments: any[];
  status: 'Ativo' | 'Arquivado';
  createdAt: string;
  updatedAt: string;
  websiteUrl?: string;
  instagramUrl?: string;
  slaNotes?: string;
  paymentTermsDefault?: any;
  cancellationPolicyNotes?: string;
}

export interface Traveler {
  id: string;
  tripId: string;
  coupleId: string;
  fullName: string;
  nickname?: string;
  type: TravelerType;
  goesToSegments: string[]; 
  isPayer: boolean;
  status: 'Ativo' | 'Arquivado';
  createdAt: string;
  updatedAt: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  canDrive?: boolean;
  tags?: string[];
  docType?: DocType;
  docNumber?: string;
  docExpiry?: string;
  notes?: string;
  attachments?: any[];
}

export interface Segment {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface Couple {
  id: string;
  name: string;
  members: { id: string; name: string; isChild: boolean }[];
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  segments: Segment[];
  couples: Couple[];
  categories: string[];
  consensusRule: '2/3' | '3/3';
}

export interface Quote {
  id: string;
  tripId: string;
  vendorId: string;
  segmentId: string;
  title: string;
  category: string;
  provider: string; 
  currency: Currency;
  exchangeRate: number;
  totalAmount: number; 
  amountBrl: number;   
  validUntil: string;
  status: QuoteStatus;
  votes: any[];
  completeness: number;
  paymentTerms: any;
  tags: string[];
  participantIds: string[]; 
  includes?: string;
  excludes?: string;
  notesGroup?: string;
  notesInternal?: string;
  linkUrl?: string;
  cancellationPolicy: string;
  originalId?: string;
  variationLabel?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Added missing attachments property
  attachments: Attachment[];
  hotelDetails?: any;
  ticketDetails?: any;
  carDetails?: any;
  genericDetails?: any;
  taxesFees?: number;
}

export interface Comparison {
  id: string;
  tripId: string;
  quoteIds: string[];
  notes?: string;
  createdAt: string;
}

// Fixed missing interfaces
export interface QuoteVersion {
  id: string;
  quoteId: string;
  createdAt: string;
  createdBy: string;
  changes: { label: string; old: any; new: any }[];
}

export interface QuoteTicketDetails {
  kind: 'Parque' | 'Show' | 'Jogo';
  adultQty: number;
  adultPrice: number;
  childQty: number;
  childPrice: number;
}

export interface QuoteHotelDetails {
  checkin: string;
  checkout: string;
  roomType: string;
  breakfastIncluded: boolean;
}

export interface QuoteCarDetails {
  pickupDateTime: string;
  dropoffDateTime: string;
  carClass: string;
  deductible: number;
}

export interface TravelerIssue {
  type: 'error' | 'warning';
  message: string;
}

export interface VendorContact {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  preferredMethod: 'WhatsApp' | 'Email' | 'Telefone';
  isPrimary: boolean;
}

export interface VendorQuoteRequest {
  id: string;
  tripId: string;
  vendorId: string;
  category: string;
  segmentId: string;
  message: string;
  createdAt: string;
}
