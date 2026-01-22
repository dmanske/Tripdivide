import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Chave de criptografia (deve estar em variável de ambiente)
const ENCRYPTION_KEY = Deno.env.get('DOCUMENT_ENCRYPTION_KEY') || ''

async function encryptDocument(plaintext: string): Promise<{ encrypted: string; iv: string; last4: string }> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)
  
  // Gerar IV aleatório
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  // Importar chave
  const keyData = encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )
  
  // Criptografar
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  
  // Extrair last4
  const cleaned = plaintext.replace(/[^A-Za-z0-9]/g, '')
  const last4 = cleaned.slice(-4)
  
  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
    last4
  }
}

async function decryptDocument(encrypted: string, iv: string): Promise<string> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  
  // Importar chave
  const keyData = encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )
  
  // Converter de base64
  const encryptedData = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0))
  
  // Descriptografar
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivData },
    key,
    encryptedData
  )
  
  return decoder.decode(decrypted)
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Criar cliente com o token do usuário (não Service Role)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Não autenticado')
    }

    const { action, ...params } = await req.json()

    if (action === 'encrypt') {
      // Criptografar e salvar documento
      const { 
        travelerId, travelerProfileId, isProfileDocument,
        docType, docCategory, docNumber, 
        issuerCountry, issuerState, issuerAgency, issuerPlace,
        regionOrCountry, issueDate, expiryDate, visaCategory,
        entryType, stayDurationDays, licenseCategory, customLabel,
        passportDocumentId, isPrimary, notes, documentId 
      } = params
      
      const { encrypted, iv, last4 } = await encryptDocument(docNumber)
      
      if (isProfileDocument) {
        // Salvar documento de perfil global
        const docData = {
          traveler_profile_id: travelerProfileId,
          doc_type: docType,
          doc_category: docCategory,
          doc_number_enc: encrypted,
          doc_number_iv: iv,
          doc_number_last4: last4,
          issuing_country: issuerCountry || null,
          issuer_state: issuerState || null,
          issuer_agency: issuerAgency || null,
          issuer_place: issuerPlace || null,
          region_or_country: regionOrCountry || null,
          issue_date: issueDate || null,
          doc_expiry: expiryDate || null,  // CORRIGIDO: era expiry_date, agora é doc_expiry
          visa_category: visaCategory || null,
          entry_type: entryType || null,
          stay_duration_days: stayDurationDays || null,
          license_category: licenseCategory || null,
          custom_label: customLabel || null,
          passport_document_id: passportDocumentId || null,
          is_primary: isPrimary || false,
          notes: notes || null,
          updated_at: new Date().toISOString()
        }

        if (documentId) {
          // Update
          const { data, error } = await supabaseClient
            .from('td_traveler_profile_documents')
            .update(docData)
            .eq('id', documentId)
            .select()
            .single()
          
          if (error) throw error
          
          return new Response(
            JSON.stringify({ success: true, documentId: data.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Insert
          const { data, error } = await supabaseClient
            .from('td_traveler_profile_documents')
            .insert({ ...docData, created_at: new Date().toISOString() })
            .select()
            .single()
          
          if (error) throw error
          
          return new Response(
            JSON.stringify({ success: true, documentId: data.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        // Salvar documento legado via RPC
        const { data, error } = await supabaseClient.rpc('save_encrypted_document', {
          p_traveler_id: travelerId,
          p_doc_type: docType,
          p_doc_category: docCategory,
          p_doc_number_enc: encrypted,
          p_doc_number_iv: iv,
          p_doc_number_last4: last4,
          p_issuer_country: issuerCountry || null,
          p_issuer_state: issuerState || null,
          p_issuer_agency: issuerAgency || null,
          p_issuer_place: issuerPlace || null,
          p_region_or_country: regionOrCountry || null,
          p_issue_date: issueDate || null,
          p_expiry_date: expiryDate || null,
          p_visa_category: visaCategory || null,
          p_entry_type: entryType || null,
          p_stay_duration_days: stayDurationDays || null,
          p_license_category: licenseCategory || null,
          p_custom_label: customLabel || null,
          p_passport_document_id: passportDocumentId || null,
          p_is_primary: isPrimary || false,
          p_notes: notes || null,
          p_document_id: documentId || null
        })
        
        if (error) throw error
        
        return new Response(
          JSON.stringify({ success: true, documentId: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
    
    if (action === 'decrypt') {
      // Descriptografar documento
      const { documentId, isProfileDocument } = params
      
      if (isProfileDocument) {
        // Buscar documento de perfil global
        const { data, error } = await supabaseClient
          .from('td_traveler_profile_documents')
          .select('doc_number_enc, doc_number_iv')
          .eq('id', documentId)
          .single()
        
        if (error) throw error
        if (!data) throw new Error('Documento não encontrado')
        
        const decrypted = await decryptDocument(data.doc_number_enc, data.doc_number_iv)
        
        return new Response(
          JSON.stringify({ success: true, docNumber: decrypted }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // Buscar via RPC (já registra auditoria)
        const { data, error } = await supabaseClient.rpc('get_decrypted_document', {
          p_document_id: documentId
        })
        
        if (error) throw error
        if (!data || data.length === 0) throw new Error('Documento não encontrado')
        
        const { doc_number_enc, doc_number_iv } = data[0]
        const decrypted = await decryptDocument(doc_number_enc, doc_number_iv)
        
        return new Response(
          JSON.stringify({ success: true, docNumber: decrypted }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
    
    throw new Error('Ação inválida')
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
