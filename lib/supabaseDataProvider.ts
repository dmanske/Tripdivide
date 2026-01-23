import { supabase, supabaseUrl } from './supabase';
import { Trip, Quote, Expense, Payment, Vendor, Traveler, ExpenseSplit, Reimbursement, Couple } from '../types';

export const supabaseDataProvider = {
  // ==================== TRIPS ====================
  getTrips: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('td_trips')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getActiveTrip: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('td_user_active_trip')
      .select('active_trip_id')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.active_trip_id || null;
  },

  setActiveTrip: async (tripId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('td_user_active_trip')
      .upsert({
        user_id: user.id,
        active_trip_id: tripId,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return true;
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

  saveTrip: async (trip: Partial<Trip> & { status?: string; destinations?: string[]; baseCurrency?: string; defaultExchangeRate?: number; defaultSplitRule?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Converter strings vazias para null
    const startDate = trip.startDate && trip.startDate.trim() ? trip.startDate : null;
    const endDate = trip.endDate && trip.endDate.trim() ? trip.endDate : null;

    if (trip.id) {
      // Update
      const { data, error } = await supabase
        .from('td_trips')
        .update({
          name: trip.name,
          start_date: startDate,
          end_date: endDate,
          consensus_rule: trip.consensusRule,
          categories: trip.categories,
          status: trip.status,
          destinations: trip.destinations,
          base_currency: trip.baseCurrency,
          default_exchange_rate: trip.defaultExchangeRate,
          default_split_rule: trip.defaultSplitRule,
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
          start_date: startDate,
          end_date: endDate,
          consensus_rule: trip.consensusRule || '2/3',
          categories: trip.categories || ['Voo', 'Hospedagem', 'Aluguel de Carro', 'Restaurantes', 'Diversos'],
          status: trip.status || 'active',
          destinations: trip.destinations || [],
          base_currency: trip.baseCurrency || 'BRL',
          default_exchange_rate: trip.defaultExchangeRate || 1.0,
          default_split_rule: trip.defaultSplitRule || 'equal'
        })
        .select()
        .single();

      if (error) throw error;

      // Definir como viagem ativa automaticamente
      await supabaseDataProvider.setActiveTrip(data.id);

      return data;
    }
  },

  duplicateTrip: async (tripId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar viagem original
    const { data: originalTrip } = await supabase
      .from('td_trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (!originalTrip) throw new Error('Viagem não encontrada');

    // Criar cópia
    const { data: newTrip, error } = await supabase
      .from('td_trips')
      .insert({
        user_id: user.id,
        name: `${originalTrip.name} (Cópia)`,
        start_date: originalTrip.start_date,
        end_date: originalTrip.end_date,
        consensus_rule: originalTrip.consensus_rule,
        categories: originalTrip.categories,
        status: 'draft',
        destinations: originalTrip.destinations,
        base_currency: originalTrip.base_currency,
        default_exchange_rate: originalTrip.default_exchange_rate,
        default_split_rule: originalTrip.default_split_rule
      })
      .select()
      .single();

    if (error) throw error;

    // Copiar couples
    const { data: couples } = await supabase
      .from('td_couples')
      .select('*')
      .eq('trip_id', tripId);

    if (couples && couples.length > 0) {
      await supabase
        .from('td_couples')
        .insert(couples.map(c => ({
          trip_id: newTrip.id,
          name: c.name
        })));
    }

    // Copiar segments
    const { data: segments } = await supabase
      .from('td_segments')
      .select('*')
      .eq('trip_id', tripId);

    if (segments && segments.length > 0) {
      await supabase
        .from('td_segments')
        .insert(segments.map(s => ({
          trip_id: newTrip.id,
          name: s.name,
          start_date: s.start_date,
          end_date: s.end_date
        })));
    }

    return newTrip;
  },

  archiveTrip: async (tripId: string) => {
    const { error } = await supabase
      .from('td_trips')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', tripId);

    if (error) throw error;
    return true;
  },

  deleteTrip: async (tripId: string) => {
    const { error } = await supabase
      .from('td_trips')
      .delete()
      .eq('id', tripId);

    if (error) throw error;
    return true;
  },

  finalizeTripDraft: async (tripId: string, data: { name: string; startDate: string; endDate: string; destinations: string[] }) => {
    const { error } = await supabase
      .from('td_trips')
      .update({
        name: data.name,
        start_date: data.startDate,
        end_date: data.endDate,
        destinations: data.destinations,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', tripId);

    if (error) throw error;

    // Definir como viagem ativa
    await supabaseDataProvider.setActiveTrip(tripId);

    return true;
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
    // Converter strings vazias para null
    const startDate = segment.startDate && segment.startDate.trim() ? segment.startDate : null;
    const endDate = segment.endDate && segment.endDate.trim() ? segment.endDate : null;

    if (segment.id) {
      const { data, error } = await supabase
        .from('td_segments')
        .update({
          name: segment.name,
          start_date: startDate,
          end_date: endDate
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
          start_date: startDate,
          end_date: endDate
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
      documentName: t.document_name,
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
      tags: t.tags,
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
          document_name: traveler.documentName,
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
          tags: traveler.tags,
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
        documentName: data.document_name,
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
        tags: data.tags,
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
          document_name: traveler.documentName,
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
          tags: traveler.tags,
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
        documentName: data.document_name,
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
        tags: data.tags,
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');

    const { data, error } = await supabase
      .from('td_traveler_documents')
      .select('*')
      .eq('traveler_id', travelerId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Descriptografar todos os documentos para mostrar número completo
    const documentsWithDecrypted = await Promise.all(
      (data || []).map(async (d) => {
        try {
          // Descriptografar via Edge Function
          const response = await fetch(`${supabaseUrl}/functions/v1/encrypt-document`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: 'decrypt',
              documentId: d.id
            })
          });

          const result = await response.json();
          const docNumber = result.success ? result.docNumber : ('••••' + d.doc_number_last4);

          return {
            id: d.id,
            travelerId: d.traveler_id,
            docType: d.doc_type,
            docCategory: d.doc_category,
            docNumber: docNumber, // Número completo descriptografado
            docNumberLast4: d.doc_number_last4,
            issuerCountry: d.issuer_country,
            issuerState: d.issuer_state,
            issuerAgency: d.issuer_agency,
            issuerPlace: d.issuer_place,
            regionOrCountry: d.region_or_country,
            issueDate: d.issue_date,
            expiryDate: d.expiry_date,
            visaCategory: d.visa_category,
            entryType: d.entry_type,
            stayDurationDays: d.stay_duration_days,
            licenseCategory: d.license_category,
            customLabel: d.custom_label,
            passportDocumentId: d.passport_document_id,
            isPrimary: d.is_primary,
            notes: d.notes,
            createdAt: d.created_at,
            updatedAt: d.updated_at
          };
        } catch (err) {
          // Se falhar a descriptografia, mostrar mascarado
          return {
            id: d.id,
            travelerId: d.traveler_id,
            docType: d.doc_type,
            docCategory: d.doc_category,
            docNumber: '••••' + d.doc_number_last4,
            docNumberLast4: d.doc_number_last4,
            issuerCountry: d.issuer_country,
            issuerState: d.issuer_state,
            issuerAgency: d.issuer_agency,
            issuerPlace: d.issuer_place,
            regionOrCountry: d.region_or_country,
            issueDate: d.issue_date,
            expiryDate: d.expiry_date,
            visaCategory: d.visa_category,
            entryType: d.entry_type,
            stayDurationDays: d.stay_duration_days,
            licenseCategory: d.license_category,
            customLabel: d.custom_label,
            passportDocumentId: d.passport_document_id,
            isPrimary: d.is_primary,
            notes: d.notes,
            createdAt: d.created_at,
            updatedAt: d.updated_at
          };
        }
      })
    );

    return documentsWithDecrypted;
  },

  saveTravelerDocument: async (doc: any) => {
    // Usar Edge Function para criptografar
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');

    console.log('📤 Enviando documento para criptografia:', {
      travelerId: doc.travelerId,
      docType: doc.docType,
      docCategory: doc.docCategory,
      docNumber: doc.docNumber ? '***' + doc.docNumber.slice(-4) : 'vazio'
    });

    const response = await fetch(`${supabaseUrl}/functions/v1/encrypt-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'encrypt',
        travelerId: doc.travelerId,
        docType: doc.docType,
        docCategory: doc.docCategory || (doc.docType === 'Visto' || doc.docType === 'ESTA' ? 'entry' : 'identity'),
        docNumber: doc.docNumber,
        issuerCountry: doc.issuerCountry,
        issuerState: doc.issuerState,
        issuerAgency: doc.issuerAgency,
        issuerPlace: doc.issuerPlace,
        regionOrCountry: doc.regionOrCountry,
        issueDate: doc.issueDate,
        expiryDate: doc.docExpiry,
        visaCategory: doc.visaCategory,
        entryType: doc.entryType,
        stayDurationDays: doc.stayDurationDays,
        licenseCategory: doc.licenseCategory,
        customLabel: doc.customLabel,
        passportDocumentId: doc.passportDocumentId,
        isPrimary: doc.isPrimary,
        notes: doc.notes,
        documentId: doc.id
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Erro ao salvar documento:', result.error);
      throw new Error(result.error || 'Erro ao salvar documento');
    }

    // Retornar com número completo (mantido em memória no frontend)
    return {
      id: result.documentId,
      travelerId: doc.travelerId,
      docType: doc.docType,
      docCategory: doc.docCategory,
      docNumber: doc.docNumber, // Número completo no frontend
      docNumberLast4: doc.docNumber.replace(/[^A-Za-z0-9]/g, '').slice(-4),
      issuerCountry: doc.issuerCountry,
      issuerState: doc.issuerState,
      issuerAgency: doc.issuerAgency,
      issuerPlace: doc.issuerPlace,
      regionOrCountry: doc.regionOrCountry,
      issueDate: doc.issueDate,
      expiryDate: doc.docExpiry,
      visaCategory: doc.visaCategory,
      entryType: doc.entryType,
      stayDurationDays: doc.stayDurationDays,
      licenseCategory: doc.licenseCategory,
      customLabel: doc.customLabel,
      passportDocumentId: doc.passportDocumentId,
      isPrimary: doc.isPrimary,
      notes: doc.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  decryptTravelerDocument: async (documentId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');

    const response = await fetch(`${supabaseUrl}/functions/v1/encrypt-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'decrypt',
        documentId
      })
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error);

    return result.docNumber;
  },

  deleteTravelerDocument: async (id: string) => {
    const { error } = await supabase
      .from('td_traveler_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== RASCUNHOS ====================
  saveTravelerDraft: async (traveler: Partial<Traveler>) => {
    const draftData = {
      ...traveler,
      is_draft: true
    };
    return supabaseDataProvider.saveTraveler(draftData);
  },

  finalizeTravelerDraft: async (travelerId: string) => {
    const { error } = await supabase
      .from('td_travelers')
      .update({ is_draft: false })
      .eq('id', travelerId);

    if (error) throw error;
  },

  getTravelerDrafts: async (tripId: string) => {
    const { data, error } = await supabase
      .from('td_travelers')
      .select('*')
      .eq('trip_id', tripId)
      .eq('is_draft', true)
      .eq('status', 'Ativo')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(t => ({
      id: t.id,
      tripId: t.trip_id,
      coupleId: t.couple_id,
      fullName: t.full_name,
      documentName: t.document_name,
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
      tags: t.tags,
      notes: t.notes,
      isDraft: true
    }));
  },

  discardTravelerDraft: async (travelerId: string) => {
    const { error } = await supabase
      .from('td_travelers')
      .delete()
      .eq('id', travelerId)
      .eq('is_draft', true);

    if (error) throw error;
  },

  // ==================== ALERTAS DE VENCIMENTO ====================
  getExpiringDocuments: async (tripId: string, daysThreshold: number = 90) => {
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);

    const { data, error } = await supabase
      .from('td_traveler_documents')
      .select(`
        *,
        traveler:td_travelers!inner(
          id,
          full_name,
          trip_id
        )
      `)
      .eq('traveler.trip_id', tripId)
      .not('doc_expiry', 'is', null)
      .lte('doc_expiry', thresholdDate.toISOString().split('T')[0]);

    if (error) throw error;

    return (data || []).map(d => ({
      documentId: d.id,
      travelerId: d.traveler.id,
      travelerName: d.traveler.full_name,
      docType: d.doc_type,
      docNumberLast4: d.doc_number_last4,
      docExpiry: d.doc_expiry,
      daysUntilExpiry: Math.ceil((new Date(d.doc_expiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      isExpired: new Date(d.doc_expiry) < today
    }));
  },

  calculateDocumentExpiryStatus: (expiryDate: string) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return { status: 'expired', color: 'red', label: 'Vencido', days: Math.abs(daysUntil) };
    } else if (daysUntil <= 30) {
      return { status: 'critical', color: 'red', label: `Vence em ${daysUntil} dias`, days: daysUntil };
    } else if (daysUntil <= 90) {
      return { status: 'warning', color: 'yellow', label: `Vence em ${daysUntil} dias`, days: daysUntil };
    }
    
    return { status: 'ok', color: 'green', label: `Válido por ${daysUntil} dias`, days: daysUntil };
  },

  // ==================== TAGS NORMALIZADAS ====================
  normalizeTags: (tags: string[]): string[] => {
    if (!tags || tags.length === 0) return [];
    
    const normalized = tags
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.replace(/\s+/g, ' ')) // Colapsar espaços múltiplos
      .map(tag => tag.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')); // Title Case
    
    // Remover duplicadas
    return [...new Set(normalized)];
  },

  getExistingTags: async (tripId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from('td_travelers')
      .select('tags')
      .eq('trip_id', tripId)
      .eq('status', 'Ativo')
      .not('tags', 'is', null);

    if (error) throw error;

    const allTags = (data || [])
      .flatMap(t => t.tags || [])
      .filter(tag => tag && tag.trim().length > 0);

    return supabaseDataProvider.normalizeTags(allTags);
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
    
    // Validação: deve ter vendor_profile_id OU (source_type + source_value)
    const hasVendor = !!quote.vendor_profile_id;
    const hasSource = !!(quote.source_type && quote.source_value);
    
    if (!hasVendor && !hasSource) {
      throw new Error('Quote deve ter um fornecedor OU uma fonte informada');
    }
    
    if (quote.id) {
      const { data, error } = await supabase
        .from('td_quotes')
        .update({
          vendor_profile_id: quote.vendor_profile_id || null,
          source_type: quote.source_type || null,
          source_value: quote.source_value || null,
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
          vendor_profile_id: quote.vendor_profile_id || null,
          source_type: quote.source_type || null,
          source_value: quote.source_value || null,
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
    // Validação: deve ter vendor_profile_id OU (source_type + source_value)
    const hasVendor = !!expense.vendor_profile_id;
    const hasSource = !!(expense.source_type && expense.source_value);
    
    if (!hasVendor && !hasSource) {
      throw new Error('Expense deve ter um fornecedor OU uma fonte informada');
    }
    
    if (expense.id) {
      const { data, error } = await supabase
        .from('td_expenses')
        .update({
          segment_id: expense.segmentId,
          category: expense.category,
          title: expense.title,
          vendor_profile_id: expense.vendor_profile_id || null,
          source_type: expense.source_type || null,
          source_value: expense.source_value || null,
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
          vendor_profile_id: expense.vendor_profile_id || null,
          source_type: expense.source_type || null,
          source_value: expense.source_value || null,
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

    // Create expense - copiar vendor_profile_id e source se existirem
    const { data: expense, error: expenseError } = await supabase
      .from('td_expenses')
      .insert({
        trip_id: tripId,
        segment_id: quote.segment_id || null,
        category: quote.category,
        title: quote.title,
        vendor_profile_id: quote.vendor_profile_id || null,
        source_type: quote.source_type || null,
        source_value: quote.source_value || null,
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
        vendor_profile_id: original.vendor_profile_id,
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
  getVendorRequests: async (vendor_profile_id: string) => {
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

    // Calcular taxa de câmbio
    const rate = block.currency === 'BRL' ? 1 : (block.exchangeRate || 5.2);
    const amountBrl = block.totalAmount * rate;

    // Criar quote sem fornecedor (fonte: WhatsApp)
    const { data: quote, error } = await supabase
      .from('td_quotes')
      .insert({
        trip_id: tripId,
        source_type: 'texto',
        source_value: block.rawText || `WhatsApp: ${block.vendorPhone || 'Desconhecido'}`,
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
  },

  // ==================== TRAVELER PROFILES (GLOBAL) ====================
  getTravelerProfiles: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('td_traveler_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getTravelerProfileById: async (profileId: string) => {
    const { data, error } = await supabase
      .from('td_traveler_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) throw error;
    return data;
  },

  saveTravelerProfile: async (profile: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Helper para converter string vazia em null para campos de data
    const cleanDate = (date: any) => {
      if (!date || date === '') return null;
      return date;
    };

    if (profile.id) {
      // Update
      const { data, error } = await supabase
        .from('td_traveler_profiles')
        .update({
          full_name: profile.fullName || profile.full_name,
          nickname: profile.nickname || null,
          phone: profile.phone || null,
          email: profile.email || null,
          birth_date: cleanDate(profile.birthDate || profile.birth_date),
          type: profile.type || 'Adulto',
          can_drive: profile.canDrive !== undefined ? profile.canDrive : profile.can_drive,
          primary_doc_type: profile.primaryDocType || profile.primary_doc_type || null,
          primary_doc_number: profile.primaryDocNumber || profile.primary_doc_number || null,
          primary_doc_expiry: cleanDate(profile.primaryDocExpiry || profile.primary_doc_expiry),
          notes: profile.notes || null,
          tags: profile.tags || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('td_traveler_profiles')
        .insert({
          user_id: user.id,
          full_name: profile.fullName || profile.full_name,
          nickname: profile.nickname || null,
          phone: profile.phone || null,
          email: profile.email || null,
          birth_date: cleanDate(profile.birthDate || profile.birth_date),
          type: profile.type || 'Adulto',
          can_drive: profile.canDrive !== undefined ? profile.canDrive : (profile.can_drive || false),
          primary_doc_type: profile.primaryDocType || profile.primary_doc_type || null,
          primary_doc_number: profile.primaryDocNumber || profile.primary_doc_number || null,
          primary_doc_expiry: cleanDate(profile.primaryDocExpiry || profile.primary_doc_expiry),
          notes: profile.notes || null,
          tags: profile.tags || []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  deleteTravelerProfile: async (profileId: string) => {
    // Verificar se há vínculos com viagens
    const { data: links } = await supabase
      .from('td_trip_travelers')
      .select('id')
      .eq('traveler_profile_id', profileId)
      .limit(1);

    if (links && links.length > 0) {
      throw new Error('Não é possível excluir um perfil que está vinculado a viagens. Remova os vínculos primeiro.');
    }

    const { error } = await supabase
      .from('td_traveler_profiles')
      .delete()
      .eq('id', profileId);

    if (error) throw error;
  },

  // ==================== TRAVELER PROFILE DOCUMENTS ====================
  getTravelerProfileDocuments: async (profileId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');

    const { data, error } = await supabase
      .from('td_traveler_profile_documents')
      .select('*')
      .eq('traveler_profile_id', profileId)
      .order('created_at', { ascending: true});

    if (error) throw error;
    
    // Descriptografar todos os documentos
    const documentsWithDecrypted = await Promise.all(
      (data || []).map(async (d) => {
        try {
          // Descriptografar via Edge Function
          const response = await fetch(`${supabaseUrl}/functions/v1/encrypt-document`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: 'decrypt',
              documentId: d.id,
              isProfileDocument: true
            })
          });

          const result = await response.json();
          const docNumber = result.success ? result.docNumber : ('••••' + d.doc_number_last4);

          return {
            id: d.id,
            travelerProfileId: d.traveler_profile_id,
            docType: d.doc_type,
            docCategory: d.doc_category,
            docNumber: docNumber,
            docNumberLast4: d.doc_number_last4,
            docExpiry: d.doc_expiry,
            issueDate: d.issue_date,
            issuingCountry: d.issuing_country,
            issuerState: d.issuer_state,
            issuerAgency: d.issuer_agency,
            isPrimary: d.is_primary,
            notes: d.notes,
            createdAt: d.created_at,
            updatedAt: d.updated_at
          };
        } catch (err) {
          return {
            id: d.id,
            travelerProfileId: d.traveler_profile_id,
            docType: d.doc_type,
            docCategory: d.doc_category,
            docNumber: '••••' + d.doc_number_last4,
            docNumberLast4: d.doc_number_last4,
            docExpiry: d.doc_expiry,
            issueDate: d.issue_date,
            issuingCountry: d.issuing_country,
            issuerState: d.issuer_state,
            issuerAgency: d.issuer_agency,
            isPrimary: d.is_primary,
            notes: d.notes,
            createdAt: d.created_at,
            updatedAt: d.updated_at
          };
        }
      })
    );

    return documentsWithDecrypted;
  },

  saveTravelerProfileDocument: async (doc: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');

    const response = await fetch(`${supabaseUrl}/functions/v1/encrypt-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'encrypt',
        isProfileDocument: true,
        travelerProfileId: doc.travelerProfileId,
        docType: doc.docType,
        docCategory: doc.docCategory || (doc.docType === 'Visto' || doc.docType === 'ESTA' ? 'entry' : 'identity'),
        docNumber: doc.docNumber,
        issuerCountry: doc.issuerCountry || doc.issuingCountry || null,
        issuerState: doc.issuerState || null,
        issuerAgency: doc.issuerAgency || null,
        issuerPlace: doc.issuerPlace || null,
        regionOrCountry: doc.regionOrCountry || null,
        issueDate: doc.issueDate || null,
        expiryDate: doc.expiryDate || doc.docExpiry || null,
        visaCategory: doc.visaCategory || null,
        entryType: doc.entryType || null,
        stayDurationDays: doc.stayDurationDays || null,
        licenseCategory: doc.licenseCategory || null,
        customLabel: doc.customLabel || null,
        passportDocumentId: doc.passportDocumentId || null,
        isPrimary: doc.isPrimary || false,
        notes: doc.notes || null,
        documentId: doc.id || null
      })
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erro ao salvar documento');
    }

    return result.documentId;
  },

  deleteTravelerProfileDocument: async (documentId: string) => {
    const { error } = await supabase
      .from('td_traveler_profile_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  },

  // ==================== TRIP TRAVELERS (LINK) ====================
  getTripTravelers: async (tripId: string) => {
    const { data, error } = await supabase
      .from('td_trip_travelers')
      .select(`
        *,
        profile:td_traveler_profiles(*)
      `)
      .eq('trip_id', tripId)
      .eq('status', 'Ativo')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  linkTravelerToTrip: async (link: any) => {
    const { data, error } = await supabase
      .from('td_trip_travelers')
      .insert({
        trip_id: link.tripId,
        traveler_profile_id: link.travelerProfileId,
        couple_id: link.coupleId,
        type: link.type,
        is_payer: link.isPayer,
        goes_to_segments: link.goesToSegments,
        status: 'Ativo',
        count_in_split: link.countInSplit !== undefined ? link.countInSplit : true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateTripTraveler: async (linkId: string, updates: any) => {
    const { data, error } = await supabase
      .from('td_trip_travelers')
      .update({
        couple_id: updates.coupleId,
        type: updates.type,
        is_payer: updates.isPayer,
        goes_to_segments: updates.goesToSegments,
        count_in_split: updates.countInSplit,
        updated_at: new Date().toISOString()
      })
      .eq('id', linkId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  unlinkTravelerFromTrip: async (linkId: string) => {
    const { error } = await supabase
      .from('td_trip_travelers')
      .update({ status: 'Arquivado' })
      .eq('id', linkId);

    if (error) throw error;
  },

  // ==================== VENDOR PROFILES (GLOBAL) ====================
  getVendorProfiles: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('td_vendor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  getVendorProfileById: async (profileId: string) => {
    const { data, error } = await supabase
      .from('td_vendor_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) throw error;
    return data;
  },

  saveVendorProfile: async (profile: any) => {
    console.log('🔍 saveVendorProfile chamado:', { id: profile.id, name: profile.name });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const profileData = {
      user_id: user.id,
      name: profile.name,
      legal_name: profile.legalName,
      categories: profile.categories || [],
      rating: profile.rating || 3,
      tags: profile.tags || [],
      risk_flags: profile.riskFlags || [],
      contacts: profile.contacts || [],
      website_url: profile.websiteUrl,
      instagram_url: profile.instagramUrl,
      youtube_url: profile.youtubeUrl,
      payment_terms_default: profile.paymentTermsDefault,
      cancellation_policy_notes: profile.cancellationPolicyNotes,
      updated_at: new Date().toISOString()
    };

    if (profile.id) {
      console.log('📝 Atualizando perfil existente:', profile.id);
      const { data, error } = await supabase
        .from('td_vendor_profiles')
        .update(profileData)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Perfil atualizado:', data.id);
      return data;
    } else {
      console.log('➕ Criando novo perfil');
      const { data, error } = await supabase
        .from('td_vendor_profiles')
        .insert({ ...profileData, created_at: new Date().toISOString() })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Perfil criado:', data.id);
      return data;
    }
  },

  deleteVendorProfile: async (profileId: string) => {
    const { error } = await supabase
      .from('td_vendor_profiles')
      .delete()
      .eq('id', profileId);

    if (error) throw error;
  },

  // ==================== TRIP SETUP STATS ====================
  getTripSetupStats: async (tripId: string) => {
    // Contar viajantes vinculados
    const { count: travelersCount } = await supabase
      .from('td_trip_travelers')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId)
      .eq('status', 'Ativo');

    // Contar fornecedores vinculados
    const { count: vendorsCount } = await supabase
      .from('td_trip_vendors')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId)
      .eq('status', 'Ativo');

    // Contar cotações
    const { count: quotesCount } = await supabase
      .from('td_quotes')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId);

    // Contar despesas
    const { count: expensesCount } = await supabase
      .from('td_expenses')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId);

    // Contar pagamentos
    const { count: paymentsCount } = await supabase
      .from('td_payments')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId);

    return {
      travelersCount: travelersCount || 0,
      vendorsCount: vendorsCount || 0,
      quotesCount: quotesCount || 0,
      expensesCount: expensesCount || 0,
      paymentsCount: paymentsCount || 0
    };
  },

  // ==================== VÍNCULOS - FORNECEDORES X VIAGEM ====================
  getTripVendors: async (tripId: string) => {
    const { data, error } = await supabase
      .from('td_trip_vendors')
      .select(`
        *,
        profile:td_vendor_profiles(*)
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  linkVendorToTrip: async (tripId: string, profileId: string, options: any = {}) => {
    console.log('🔗 linkVendorToTrip chamado:', { tripId, profileId, options });
    
    const { data, error } = await supabase
      .from('td_trip_vendors')
      .insert({
        trip_id: tripId,
        vendor_profile_id: profileId,
        preferred: options.preferred || false,
        custom_rating: options.customRating,
        custom_notes: options.customNotes
      })
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Fornecedor vinculado:', data.id);
    return data;
  },

  unlinkVendorFromTrip: async (tripVendorId: string) => {
    const { error } = await supabase
      .from('td_trip_vendors')
      .delete()
      .eq('id', tripVendorId);

    if (error) throw error;
  },

  updateTripVendor: async (tripVendorId: string, updates: any) => {
    const { data, error } = await supabase
      .from('td_trip_vendors')
      .update({
        preferred: updates.preferred,
        custom_rating: updates.customRating,
        custom_notes: updates.customNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', tripVendorId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==================== VENDOR PROFILE HISTORY ====================
  getVendorProfileHistory: async (profileId: string) => {
    // Buscar viagens onde este fornecedor está vinculado
    const { data: tripVendors, error: tvError } = await supabase
      .from('td_trip_vendors')
      .select(`
        id,
        created_at,
        preferred,
        trip:td_trips(id, name, start_date, end_date, status)
      `)
      .eq('vendor_profile_id', profileId)
      .order('created_at', { ascending: false });

    if (tvError) throw tvError;

    // Buscar orçamentos deste fornecedor
    const { data: quotes, error: qError } = await supabase
      .from('td_quotes')
      .select(`
        id,
        title,
        category,
        total_amount,
        currency,
        amount_brl,
        status,
        created_at,
        trip:td_trips(id, name)
      `)
      .eq('vendor_profile_id', profileId)
      .order('created_at', { ascending: false });

    if (qError) throw qError;

    return {
      trips: tripVendors || [],
      quotes: quotes || [],
      totalTrips: (tripVendors || []).length,
      totalQuotes: (quotes || []).length,
      totalValue: (quotes || []).reduce((sum, q) => sum + (q.amount_brl || 0), 0)
    };
  }
};
