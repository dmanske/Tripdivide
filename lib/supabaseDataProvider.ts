import { supabase } from './supabase';
import { Trip, Quote, Expense, Payment, Vendor, Traveler, ExpenseSplit, Reimbursement, Couple } from '../types';

export const supabaseDataProvider = {
  // ==================== TRIPS ====================
  getTrips: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('td_trips')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;
    return data || [];
  },

  getTripById: async (tripId: string) => {
    const { data, error } = await supabase
      .from('td_trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (error) throw error;
    return data;
  },

  saveTrip: async (trip: Partial<Trip>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    if (trip.id) {
      // Update
      const { data, error } = await supabase
        .from('td_trips')
        .update({
          name: trip.name,
          start_date: trip.startDate,
          end_date: trip.endDate,
          consensus_rule: trip.consensusRule,
          categories: trip.categories,
          updated_at: new Date().toISOString()
        })
        .eq('id', trip.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('td_trips')
        .insert({
          user_id: user.id,
          name: trip.name,
          start_date: trip.startDate,
          end_date: trip.endDate,
          consensus_rule: trip.consensusRule || '2/3',
          categories: trip.categories || ['Voo', 'Hospedagem', 'Aluguel de Carro', 'Restaurantes', 'Diversos']
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // ==================== COUPLES ====================
  getCouples: async (tripId: string) => {
    const { data, error } = await supabase
      .from('td_couples')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  saveCouple: async (tripId: string, couple: { id?: string; name: string }) => {
    if (couple.id) {
      // Update
      const { data, error } = await supabase
        .from('td_couples')
        .update({ name: couple.name })
        .eq('id', couple.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('td_couples')
        .insert({
          trip_id: tripId,
          name: couple.name
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  deleteCouple: async (coupleId: string) => {
    // Verificar se há viajantes neste casal
    const { data: travelers } = await supabase
      .from('td_travelers')
      .select('id')
      .eq('couple_id', coupleId)
      .eq('status', 'Ativo')
      .limit(1);

    if (travelers && travelers.length > 0) {
      throw new Error('Não é possível excluir um grupo que possui viajantes. Remova os viajantes primeiro.');
    }

    const { error } = await supabase
      .from('td_couples')
      .delete()
      .eq('id', coupleId);

    if (error) throw error;
    return true;
  },

  // ==================== SEGMENTS ====================
  getSegments: async (tripId: string) => {
    const { data, error } = await supabase
      .from('td_segments')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  saveSegment: async (segment: any) => {
    if (segment.id) {
      const { data, error } = await supabase
        .from('td_segments')
        .update({
          name: segment.name,
          start_date: segment.startDate,
          end_date: segment.endDate
        })
        .eq('id', segment.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('td_segments')
        .insert({
          trip_id: segment.tripId,
          name: segment.name,
          start_date: segment.startDate,
          end_date: segment.endDate
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // ==================== TRAVELERS ====================
  getTravelers: async (tripId: string) => {
    const { data, error } = await supabase
      .from('td_travelers')
      .select('*')
      .eq('trip_id', tripId)
      .eq('status', 'Ativo')
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Mapear snake_case do banco para camelCase do TypeScript
    return (data || []).map(t => ({
      id: t.id,
      tripId: t.trip_id,
      coupleId: t.couple_id,
      fullName: t.full_name,
      nickname: t.nickname,
      type: t.type,
      goesToSegments: t.goes_to_segments || [],
      isPayer: t.is_payer,
      status: t.status,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      phone: t.phone,
      email: t.email,
      birthDate: t.birth_date,
      canDrive: t.can_drive,
      docType: t.doc_type,
      docNumber: t.doc_number,
      docExpiry: t.doc_expiry,
      notes: t.notes
    }));
  },

  saveTraveler: async (traveler: Partial<Traveler>) => {
    if (traveler.id) {
      // Update
      const { data, error } = await supabase
        .from('td_travelers')
        .update({
          couple_id: traveler.coupleId,
          full_name: traveler.fullName,
          nickname: traveler.nickname,
          type: traveler.type,
          goes_to_segments: traveler.goesToSegments,
          is_payer: traveler.isPayer,
          phone: traveler.phone,
          email: traveler.email,
          birth_date: traveler.birthDate,
          can_drive: traveler.canDrive,
          doc_type: traveler.docType,
          doc_number: traveler.docNumber,
          doc_expiry: traveler.docExpiry,
          notes: traveler.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', traveler.id)
        .select()
        .single();

      if (error) throw error;
      
      // Mapear resposta
      return {
        id: data.id,
        tripId: data.trip_id,
        coupleId: data.couple_id,
        fullName: data.full_name,
        nickname: data.nickname,
        type: data.type,
        goesToSegments: data.goes_to_segments || [],
        isPayer: data.is_payer,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        phone: data.phone,
        email: data.email,
        birthDate: data.birth_date,
        canDrive: data.can_drive,
        docType: data.doc_type,
        docNumber: data.doc_number,
        docExpiry: data.doc_expiry,
        notes: data.notes
      };
    } else {
      // Insert
      const { data, error } = await supabase
        .from('td_travelers')
        .insert({
          trip_id: traveler.tripId,
          couple_id: traveler.coupleId,
          full_name: traveler.fullName,
          nickname: traveler.nickname,
          type: traveler.type,
          goes_to_segments: traveler.goesToSegments,
          is_payer: traveler.isPayer,
          phone: traveler.phone,
          email: traveler.email,
          birth_date: traveler.birthDate,
          can_drive: traveler.canDrive,
          doc_type: traveler.docType,
          doc_number: traveler.docNumber,
          doc_expiry: traveler.docExpiry,
          notes: traveler.notes,
          status: 'Ativo'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Mapear resposta
      return {
        id: data.id,
        tripId: data.trip_id,
        coupleId: data.couple_id,
        fullName: data.full_name,
        nickname: data.nickname,
        type: data.type,
        goesToSegments: data.goes_to_segments || [],
        isPayer: data.is_payer,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        phone: data.phone,
        email: data.email,
        birthDate: data.birth_date,
        canDrive: data.can_drive,
        docType: data.doc_type,
        docNumber: data.doc_number,
        docExpiry: data.doc_expiry,
        notes: data.notes
      };
    }
  },

  deleteTraveler: async (id: string) => {
    const { error } = await supabase
      .from('td_travelers')
      .update({ status: 'Arquivado' })
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== TRAVELER DOCUMENTS ====================
  getTravelerDocuments: async (travelerId: string) => {
    const { data, error } = await supabase
      .from('td_traveler_documents')
      .select('*')
      .eq('traveler_id', travelerId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(d => ({
      id: d.id,
      travelerId: d.traveler_id,
      docType: d.doc_type,
      docNumber: d.doc_number,
      docExpiry: d.doc_expiry,
      issuingCountry: d.issuing_country,
      notes: d.notes,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  },

  saveTravelerDocument: async (doc: any) => {
    if (doc.id) {
      // Update
      const { data, error } = await supabase
        .from('td_traveler_documents')
        .update({
          doc_type: doc.docType,
          doc_number: doc.docNumber,
          doc_expiry: doc.docExpiry,
          issuing_country: doc.issuingCountry,
          notes: doc.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', doc.id)
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        travelerId: data.traveler_id,
        docType: data.doc_type,
        docNumber: data.doc_number,
        docExpiry: data.doc_expiry,
        issuingCountry: data.issuing_country,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } else {
      // Insert
      const { data, error } = await supabase
        .from('td_traveler_documents')
        .insert({
          traveler_id: doc.travelerId,
          doc_type: doc.docType,
          doc_number: doc.docNumber,
          doc_expiry: doc.docExpiry,
          issuing_country: doc.issuingCountry,
          notes: doc.notes
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        travelerId: data.traveler_id,
        docType: data.doc_type,
        docNumber: data.doc_number,
        docExpiry: data.doc_expiry,
        issuingCountry: data.issuing_country,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }
  },

  deleteTravelerDocument: async (id: string) => {
    const { error } = await supabase
      .from('td_traveler_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== VENDORS ====================
  getVendors: async (tripId: string) => {
    const { data, error } = await supabase
      .from('td_vendors')
      .select('*')
      .eq('trip_id', tripId)
      .eq('status', 'Ativo')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  saveVendor: async (vendor: Partial<Vendor>) => {
    if (vendor.id) {
      const { data, error } = await supabase
        .from('td_vendors')
        .update({
          name: vendor.name,
          legal_name: vendor.legalName,
          categories: vendor.categories,
          rating: vendor.rating,
          preferred: vendor.preferred,
          tags: vendor.tags,
          risk_flags: vendor.riskFlags,
          contacts: vendor.contacts,
          website_url: vendor.websiteUrl,
          instagram_url: vendor.instagramUrl,
          sla_notes: vendor.slaNotes,
          payment_terms_default: vendor.paymentTermsDefault,
          cancellation_policy_notes: vendor.cancellationPolicyNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('td_vendors')
        .insert({
          trip_id: vendor.tripId,
          name: vendor.name,
          legal_name: vendor.legalName,
          categories: vendor.categories,
          rating: vendor.rating,
          preferred: vendor.preferred,
          tags: vendor.tags,
          risk_flags: vendor.riskFlags,
          contacts: vendor.contacts,
          website_url: vendor.websiteUrl,
          instagram_url: vendor.instagramUrl,
          sla_notes: vendor.slaNotes,
          payment_terms_default: vendor.paymentTermsDefault,
          cancellation_policy_notes: vendor.cancellationPolicyNotes,
          status: 'Ativo'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // ==================== QUOTES ====================
  getQuotes: async (tripId: string) => {
    const { data, error } = await supabase
      .from('td_quotes')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getQuoteById: async (id: string) => {
    const { data, error } = await supabase
      .from('td_quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  saveQuote: async (quote: Partial<Quote>) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (quote.id) {
      const { data, error } = await supabase
        .from('td_quotes')
        .update({
          vendor_id: quote.vendorId,
          segment_id: quote.segmentId,
          title: quote.title,
          category: quote.category,
          provider: quote.provider,
          currency: quote.currency,
          exchange_rate: quote.exchangeRate,
          total_amount: quote.totalAmount,
          amount_brl: quote.amountBrl,
          valid_until: quote.validUntil,
          status: quote.status,
          votes: quote.votes,
          completeness: quote.completeness,
          payment_terms: quote.paymentTerms,
          tags: quote.tags,
          participant_ids: quote.participantIds,
          includes: quote.includes,
          excludes: quote.excludes,
          notes_group: quote.notesGroup,
          notes_internal: quote.notesInternal,
          link_url: quote.linkUrl,
          cancellation_policy: quote.cancellationPolicy,
          hotel_details: quote.hotelDetails,
          ticket_details: quote.ticketDetails,
          car_details: quote.carDetails,
          generic_details: quote.genericDetails,
          taxes_fees: quote.taxesFees,
          updated_at: new Date().toISOString()
        })
        .eq('id', quote.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('td_quotes')
        .insert({
          trip_id: quote.tripId,
          vendor_id: quote.vendorId,
          segment_id: quote.segmentId,
          title: quote.title,
          category: quote.category,
          provider: quote.provider,
          currency: quote.currency,
          exchange_rate: quote.exchangeRate,
          total_amount: quote.totalAmount,
          amount_brl: quote.amountBrl,
          valid_until: quote.validUntil,
          status: quote.status || 'Novo',
          votes: quote.votes || [],
          completeness: quote.completeness || 0,
          payment_terms: quote.paymentTerms,
          tags: quote.tags || [],
          participant_ids: quote.participantIds || [],
          includes: quote.includes,
          excludes: quote.excludes,
          notes_group: quote.notesGroup,
          notes_internal: quote.notesInternal,
          link_url: quote.linkUrl,
          cancellation_policy: quote.cancellationPolicy,
          hotel_details: quote.hotelDetails,
          ticket_details: quote.ticketDetails,
          car_details: quote.carDetails,
          generic_details: quote.genericDetails,
          taxes_fees: quote.taxesFees,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // ==================== EXPENSES ====================
  getExpenses: async (tripId: string) => {
    const { data, error } = await supabase
      .from('td_expenses')
      .select('*')
      .eq('trip_id', tripId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getExpenseById: async (id: string) => {
    const { data, error } = await supabase
      .from('td_expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  saveExpense: async (expense: Partial<Expense>) => {
    if (expense.id) {
      const { data, error } = await supabase
        .from('td_expenses')
        .update({
          segment_id: expense.segmentId,
          category: expense.category,
          title: expense.title,
          vendor_id: expense.vendorId,
          source_quote_id: expense.sourceQuoteId,
          currency: expense.currency,
          amount: expense.amount,
          exchange_rate: expense.exchangeRate,
          amount_brl: expense.amountBrl,
          due_date: expense.dueDate,
          status: expense.status,
          notes_group: expense.notesGroup,
          notes_internal: expense.notesInternal,
          hotel_details: expense.hotelDetails,
          ticket_details: expense.ticketDetails,
          car_details: expense.carDetails,
          generic_details: expense.genericDetails,
          updated_at: new Date().toISOString()
        })
        .eq('id', expense.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('td_expenses')
        .insert({
          trip_id: expense.tripId,
          segment_id: expense.segmentId,
          category: expense.category,
          title: expense.title,
          vendor_id: expense.vendorId,
          source_quote_id: expense.sourceQuoteId,
          currency: expense.currency,
          amount: expense.amount,
          exchange_rate: expense.exchangeRate,
          amount_brl: expense.amountBrl,
          due_date: expense.dueDate,
          status: expense.status || 'planned',
          notes_group: expense.notesGroup,
          notes_internal: expense.notesInternal,
          hotel_details: expense.hotelDetails,
          ticket_details: expense.ticketDetails,
          car_details: expense.carDetails,
          generic_details: expense.genericDetails
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // ==================== PAYMENTS ====================
  getPaymentsByTrip: async (tripId: string) => {
    const { data, error } = await supabase
      .from('td_payments')
      .select('*')
      .eq('trip_id', tripId)
      .order('paid_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getPaymentsByExpense: async (expenseId: string) => {
    const { data, error } = await supabase
      .from('td_payments')
      .select('*')
      .eq('expense_id', expenseId)
      .order('paid_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  savePayment: async (payment: Partial<Payment>) => {
    const { data, error } = await supabase
      .from('td_payments')
      .insert({
        trip_id: payment.tripId,
        expense_id: payment.expenseId,
        paid_by_couple_id: payment.paidByCoupleId,
        method: payment.method,
        installments: payment.installments,
        installment_value: payment.installmentValue,
        paid_amount_brl: payment.paidAmountBrl,
        paid_at: payment.paidAt,
        proof_url: payment.proofUrl,
        notes: payment.notes
      })
      .select()
      .single();

    if (error) throw error;

    // Verificar se expense está totalmente pago
    if (payment.expenseId) {
      const { data: allPayments } = await supabase
        .from('td_payments')
        .select('paid_amount_brl')
        .eq('expense_id', payment.expenseId);

      const { data: expense } = await supabase
        .from('td_expenses')
        .select('amount_brl')
        .eq('id', payment.expenseId)
        .single();

      if (allPayments && expense) {
        const totalPaid = allPayments.reduce((sum, p) => sum + p.paid_amount_brl, 0);
        
        if (totalPaid >= expense.amount_brl - 0.01) {
          await supabase
            .from('td_expenses')
            .update({ status: 'paid' })
            .eq('id', payment.expenseId);
        }
      }

      // Gerar reembolsos
      await supabaseDataProvider.generateReimbursementsForExpense(payment.expenseId);
    }

    return data;
  },

  // ==================== EXPENSE SPLITS ====================
  getExpenseSplits: async (expenseId: string) => {
    const { data, error } = await supabase
      .from('td_expense_splits')
      .select('*')
      .eq('expense_id', expenseId);

    if (error) throw error;
    return data || [];
  },

  updateExpenseSplits: async (expenseId: string, splits: Partial<ExpenseSplit>[]) => {
    // Delete existing splits
    await supabase
      .from('td_expense_splits')
      .delete()
      .eq('expense_id', expenseId);

    // Insert new splits
    const { data, error } = await supabase
      .from('td_expense_splits')
      .insert(
        splits.map(s => ({
          expense_id: expenseId,
          couple_id: s.coupleId,
          split_type: s.splitType,
          value: s.value,
          amount_brl: s.amountBrl
        }))
      )
      .select();

    if (error) throw error;

    // Gerar reembolsos após atualizar splits
    await supabaseDataProvider.generateReimbursementsForExpense(expenseId);

    return data;
  },

  // ==================== REIMBURSEMENTS ====================
  getReimbursements: async (tripId: string) => {
    const { data, error } = await supabase
      .from('td_reimbursements')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  markReimbursementAsPaid: async (id: string) => {
    const { error } = await supabase
      .from('td_reimbursements')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== HELPER FUNCTIONS ====================
  getExpenseSplitsByTrip: async (tripId: string) => {
    const { data: expenses } = await supabase
      .from('td_expenses')
      .select('id')
      .eq('trip_id', tripId)
      .neq('status', 'cancelled');

    if (!expenses || expenses.length === 0) return [];

    const expenseIds = expenses.map(e => e.id);
    
    const { data, error } = await supabase
      .from('td_expense_splits')
      .select('*')
      .in('expense_id', expenseIds);

    if (error) throw error;
    return data || [];
  },

  closeQuoteToExpense: async (tripId: string, quoteId: string) => {
    // Get quote
    const { data: quote } = await supabase
      .from('td_quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (!quote) return null;

    // Get trip couples
    const { data: couples } = await supabase
      .from('td_couples')
      .select('id')
      .eq('trip_id', tripId);

    if (!couples) return null;

    // Create expense
    const { data: expense, error: expenseError } = await supabase
      .from('td_expenses')
      .insert({
        trip_id: tripId,
        segment_id: quote.segment_id || null,
        category: quote.category,
        title: quote.title,
        vendor_id: quote.vendor_id,
        source_quote_id: quote.id,
        currency: quote.currency,
        amount: quote.total_amount,
        exchange_rate: quote.exchange_rate,
        amount_brl: quote.amount_brl,
        status: 'confirmed',
        hotel_details: quote.hotel_details,
        ticket_details: quote.ticket_details,
        car_details: quote.car_details,
        generic_details: quote.generic_details
      })
      .select()
      .single();

    if (expenseError) throw expenseError;

    // Create equal splits for all couples
    const activeCouples = quote.participant_ids?.includes('ALL') 
      ? couples 
      : couples.filter(c => quote.participant_ids?.includes(c.id));

    const splitAmount = expense.amount_brl / activeCouples.length;

    const splits = activeCouples.map(c => ({
      expense_id: expense.id,
      couple_id: c.id,
      split_type: 'equal',
      amount_brl: splitAmount
    }));

    await supabase
      .from('td_expense_splits')
      .insert(splits);

    // Update quote status
    await supabase
      .from('td_quotes')
      .update({ status: 'Fechada' })
      .eq('id', quoteId);

    return expense;
  },

  createQuoteVariation: async (quoteId: string, label: string) => {
    const { data: original } = await supabase
      .from('td_quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (!original) return null;

    const { data: { user } } = await supabase.auth.getUser();

    const { data: variation, error } = await supabase
      .from('td_quotes')
      .insert({
        trip_id: original.trip_id,
        vendor_id: original.vendor_id,
        segment_id: original.segment_id,
        title: original.title,
        category: original.category,
        provider: original.provider,
        currency: original.currency,
        exchange_rate: original.exchange_rate,
        total_amount: original.total_amount,
        amount_brl: original.amount_brl,
        valid_until: original.valid_until,
        status: 'Novo',
        votes: [],
        completeness: original.completeness,
        payment_terms: original.payment_terms,
        tags: original.tags,
        participant_ids: original.participant_ids,
        includes: original.includes,
        excludes: original.excludes,
        notes_group: original.notes_group,
        notes_internal: original.notes_internal,
        link_url: original.link_url,
        cancellation_policy: original.cancellation_policy,
        hotel_details: original.hotel_details,
        ticket_details: original.ticket_details,
        car_details: original.car_details,
        generic_details: original.generic_details,
        taxes_fees: original.taxes_fees,
        original_id: original.original_id || original.id,
        variation_label: label,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return variation;
  },

  bulkImportTravelers: async (tripId: string, raw: string) => {
    const lines = raw.split('\n').filter(l => l.trim());
    let count = 0;

    // Get first couple as default
    const { data: couples } = await supabase
      .from('td_couples')
      .select('id')
      .eq('trip_id', tripId)
      .limit(1);

    const defaultCoupleId = couples?.[0]?.id;
    if (!defaultCoupleId) return 0;

    for (const line of lines) {
      const parts = line.split(';');
      const fullName = parts[0]?.trim();
      const type = parts[1]?.trim() || 'Adulto';
      const coupleId = parts[2]?.trim() || defaultCoupleId;
      const phone = parts[4]?.trim();

      if (fullName) {
        await supabase
          .from('td_travelers')
          .insert({
            trip_id: tripId,
            couple_id: coupleId,
            full_name: fullName,
            type: type,
            goes_to_segments: [],
            is_payer: true,
            phone: phone || null,
            status: 'Ativo'
          });
        count++;
      }
    }

    return count;
  },

  // ==================== QUOTE VERSIONS (Auditoria) ====================
  getQuoteVersions: async (quoteId: string) => {
    // Por enquanto, vamos criar um histórico simples baseado em updated_at
    // Em produção, você pode criar uma tabela td_quote_versions separada
    const { data: quote } = await supabase
      .from('td_quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (!quote) return [];

    // Retorna um histórico básico
    return [{
      id: 'v1',
      quoteId: quote.id,
      createdAt: quote.updated_at || quote.created_at,
      createdBy: 'Sistema',
      changes: [{
        label: 'Valor Total',
        old: quote.total_amount,
        new: quote.total_amount
      }]
    }];
  },

  restoreQuoteVersion: async (versionId: string) => {
    // Placeholder - em produção, você restauraria de td_quote_versions
    return null;
  },

  // ==================== VENDOR REQUESTS ====================
  getVendorRequests: async (vendorId: string) => {
    // Criar tabela td_vendor_requests se necessário
    // Por enquanto retorna array vazio
    return [];
  },

  saveVendorRequest: async (req: any) => {
    // Salvar histórico de pedidos de orçamento
    // Por enquanto apenas retorna
    return req;
  },

  // ==================== COMPARISONS ====================
  saveComparison: async (comp: any) => {
    // Criar tabela td_comparisons se necessário
    const { data, error } = await supabase
      .from('td_quotes')
      .select('id')
      .in('id', comp.quoteIds);

    if (error) throw error;

    // Por enquanto apenas valida que os quotes existem
    return { ...comp, id: Math.random().toString(36).substr(2, 9) };
  },

  // ==================== WHATSAPP IMPORT ====================
  saveQuoteFromWhatsApp: async (tripId: string, block: any) => {
    if (!block.totalAmount || block.totalAmount === 0) return null;

    const { data: { user } } = await supabase.auth.getUser();

    // Verificar se vendor existe ou criar
    let vendorId = null;
    
    if (block.vendorPhone) {
      const { data: existingVendors } = await supabase
        .from('td_vendors')
        .select('id, contacts')
        .eq('trip_id', tripId)
        .eq('status', 'Ativo');

      const vendor = existingVendors?.find(v => 
        v.contacts?.some((c: any) => c.phone === block.vendorPhone)
      );

      if (vendor) {
        vendorId = vendor.id;
      } else {
        // Criar novo vendor
        const { data: newVendor } = await supabase
          .from('td_vendors')
          .insert({
            trip_id: tripId,
            name: `Fornecedor ${block.vendorPhone}`,
            categories: [block.category || 'Diversos'],
            rating: 3,
            preferred: false,
            tags: ['Importado WhatsApp'],
            risk_flags: [],
            status: 'Ativo',
            contacts: [{
              id: 'c1',
              name: 'WhatsApp',
              role: 'Vendas',
              phone: block.vendorPhone,
              preferredMethod: 'WhatsApp',
              isPrimary: true
            }]
          })
          .select()
          .single();

        vendorId = newVendor?.id;
      }
    }

    // Calcular taxa de câmbio
    const rate = block.currency === 'BRL' ? 1 : (block.exchangeRate || 5.2);
    const amountBrl = block.totalAmount * rate;

    // Criar quote
    const { data: quote, error } = await supabase
      .from('td_quotes')
      .insert({
        trip_id: tripId,
        vendor_id: vendorId,
        title: block.suggestedQuote?.title || `Orçamento ${block.category}`,
        category: block.category || 'Diversos',
        provider: block.suggestedQuote?.provider || `Fornecedor ${block.vendorPhone}`,
        currency: block.currency || 'BRL',
        exchange_rate: rate,
        total_amount: block.totalAmount,
        amount_brl: amountBrl,
        status: 'Novo',
        votes: [],
        completeness: 70,
        tags: ['WhatsApp'],
        participant_ids: ['ALL'],
        payment_terms: {
          installments: block.installments || 1,
          installmentValue: block.installmentValue || block.totalAmount,
          methods: ['PIX', 'Cartão']
        },
        notes_group: block.rawText || '',
        cancellation_policy: 'Ver notas',
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return quote;
  },

  // ==================== REIMBURSEMENT GENERATION ====================
  generateReimbursementsForExpense: async (expenseId: string) => {
    // Buscar expense
    const { data: expense } = await supabase
      .from('td_expenses')
      .select('*, trip_id')
      .eq('id', expenseId)
      .single();

    if (!expense || expense.status === 'cancelled') return;

    // Buscar splits e payments
    const [{ data: splits }, { data: payments }] = await Promise.all([
      supabase.from('td_expense_splits').select('*').eq('expense_id', expenseId),
      supabase.from('td_payments').select('*').eq('expense_id', expenseId)
    ]);

    if (!splits || !payments) return;

    // Calcular balanços
    const balances: Record<string, number> = {};
    
    splits.forEach(s => {
      balances[s.couple_id] = (balances[s.couple_id] || 0) - s.amount_brl;
    });

    payments.forEach(p => {
      balances[p.paid_by_couple_id] = (balances[p.paid_by_couple_id] || 0) + p.paid_amount_brl;
    });

    // Deletar reimbursements pendentes antigos
    await supabase
      .from('td_reimbursements')
      .delete()
      .eq('expense_id', expenseId)
      .eq('status', 'pending');

    // Criar novos reimbursements
    const creditors = Object.entries(balances)
      .filter(([_, amount]) => amount > 0.01)
      .map(([id, amount]) => ({ id, amount }));

    const debtors = Object.entries(balances)
      .filter(([_, amount]) => amount < -0.01)
      .map(([id, amount]) => ({ id, amount: Math.abs(amount) }));

    const reimbursements = [];
    let cIdx = 0;
    let dIdx = 0;

    while (cIdx < creditors.length && dIdx < debtors.length) {
      const amount = Math.min(creditors[cIdx].amount, debtors[dIdx].amount);
      
      if (amount > 0.01) {
        reimbursements.push({
          trip_id: expense.trip_id,
          expense_id: expenseId,
          from_couple_id: debtors[dIdx].id,
          to_couple_id: creditors[cIdx].id,
          amount_brl: amount,
          status: 'pending'
        });
      }

      creditors[cIdx].amount -= amount;
      debtors[dIdx].amount -= amount;

      if (creditors[cIdx].amount <= 0.01) cIdx++;
      if (debtors[dIdx].amount <= 0.01) dIdx++;
    }

    if (reimbursements.length > 0) {
      await supabase
        .from('td_reimbursements')
        .insert(reimbursements);
    }
  }
};
