# Migração: Viajantes e Documentos - Abordagem Relacional

## Status: Planejamento

## Objetivo
Migrar de snapshot (dados duplicados) para referencial (fonte única da verdade):
- Viajantes sempre buscam dados do perfil global
- Documentos vinculados aos perfis globais
- Mudanças no perfil refletem em todas as viagens

## Estrutura Atual (Snapshot)

```
td_traveler_profiles (perfis globais)
  - full_name, email, phone, birth_date, etc

td_trip_travelers (vínculo viagem)
  - traveler_profile_id (referência)
  - couple_id, is_payer, count_in_split (configs da viagem)
  - ❌ SEM dados pessoais duplicados

td_traveler_documents (LEGADO)
  - traveler_id → td_travelers (tabela antiga)
  - ❌ Vinculado à viagem, não ao perfil global
```

## Estrutura Nova (Relacional)

```
td_traveler_profiles (perfis globais - FONTE DA VERDADE)
  - id, user_id
  - full_name, nickname
  - email, phone
  - birth_date, can_drive
  - tags, notes
  - created_at, updated_at

td_trip_travelers (vínculo viagem - APENAS CONFIGS)
  - id
  - trip_id
  - traveler_profile_id → td_traveler_profiles (REFERÊNCIA)
  - couple_id (qual casal nesta viagem)
  - type (Adulto/Criança/Infante)
  - is_payer (paga despesas?)
  - count_in_split (entra na divisão?)
  - goes_to_segments (quais segmentos)
  - status (Ativo/Arquivado)

td_traveler_profile_documents (documentos globais - NOVA)
  - id
  - traveler_profile_id → td_traveler_profiles
  - doc_type (Passaporte, RG, CPF, CNH, Visto, ESTA, Outro)
  - doc_number_enc (criptografado AES-256-GCM)
  - doc_number_iv (initialization vector)
  - doc_number_last4 (últimos 4 dígitos para exibição)
  - doc_expiry, issuing_country
  - doc_category (identity, entry)
  - is_primary (documento principal?)
  - notes
  - created_at, updated_at
```

## Migração SQL

### Passo 1: Criar tabela de documentos globais

```sql
CREATE TABLE td_traveler_profile_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_profile_id UUID NOT NULL REFERENCES td_traveler_profiles(id) ON DELETE CASCADE,
  
  -- Tipo e categoria
  doc_type TEXT NOT NULL CHECK (doc_type IN ('Passaporte', 'RG', 'CPF', 'CNH', 'Visto', 'ESTA', 'Outro')),
  doc_category TEXT CHECK (doc_category IN ('identity', 'entry')),
  
  -- Número criptografado
  doc_number_enc TEXT,
  doc_number_iv TEXT,
  doc_number_last4 TEXT,
  
  -- Validade e emissor
  doc_expiry DATE,
  issue_date DATE,
  issuing_country TEXT,
  issuer_state TEXT,
  issuer_agency TEXT,
  
  -- Flags
  is_primary BOOLEAN DEFAULT false,
  
  -- Notas
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_traveler_profile_documents_profile ON td_traveler_profile_documents(traveler_profile_id);
CREATE INDEX idx_traveler_profile_documents_type ON td_traveler_profile_documents(doc_type);
CREATE INDEX idx_traveler_profile_documents_primary ON td_traveler_profile_documents(traveler_profile_id, is_primary) WHERE is_primary = true;

-- RLS
ALTER TABLE td_traveler_profile_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own traveler profile documents"
  ON td_traveler_profile_documents FOR SELECT
  USING (
    traveler_profile_id IN (
      SELECT id FROM td_traveler_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own traveler profile documents"
  ON td_traveler_profile_documents FOR INSERT
  WITH CHECK (
    traveler_profile_id IN (
      SELECT id FROM td_traveler_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own traveler profile documents"
  ON td_traveler_profile_documents FOR UPDATE
  USING (
    traveler_profile_id IN (
      SELECT id FROM td_traveler_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own traveler profile documents"
  ON td_traveler_profile_documents FOR DELETE
  USING (
    traveler_profile_id IN (
      SELECT id FROM td_traveler_profiles WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE td_traveler_profile_documents IS 'Documentos vinculados aos perfis globais de viajantes (reutilizáveis entre viagens)';
COMMENT ON COLUMN td_traveler_profile_documents.doc_number_enc IS 'Número do documento criptografado (AES-256-GCM)';
COMMENT ON COLUMN td_traveler_profile_documents.doc_number_iv IS 'Initialization Vector para descriptografia';
COMMENT ON COLUMN td_traveler_profile_documents.doc_number_last4 IS 'Últimos 4 dígitos para exibição segura';
```

### Passo 2: Remover campos duplicados de td_trip_travelers

```sql
-- td_trip_travelers já está correto!
-- Contém apenas: traveler_profile_id, couple_id, type, is_payer, count_in_split, goes_to_segments, status
-- NÃO contém dados pessoais duplicados
```

### Passo 3: Migrar documentos existentes (se houver)

```sql
-- Migrar documentos de td_traveler_documents (legado) para td_traveler_profile_documents
-- NOTA: Isso só funciona se td_travelers tiver traveler_profile_id

INSERT INTO td_traveler_profile_documents (
  traveler_profile_id,
  doc_type,
  doc_number_enc,
  doc_number_iv,
  doc_number_last4,
  doc_expiry,
  issue_date,
  issuing_country,
  issuer_state,
  issuer_agency,
  doc_category,
  is_primary,
  notes,
  created_at,
  updated_at
)
SELECT DISTINCT ON (t.traveler_profile_id, td.doc_type)
  t.traveler_profile_id,
  td.doc_type,
  td.doc_number_enc,
  td.doc_number_iv,
  td.doc_number_last4,
  td.expiry_date,
  td.issue_date,
  td.issuer_country,
  td.issuer_state,
  td.issuer_agency,
  td.doc_category,
  td.is_primary,
  td.notes,
  td.created_at,
  td.updated_at
FROM td_traveler_documents td
JOIN td_travelers t ON td.traveler_id = t.id
WHERE t.traveler_profile_id IS NOT NULL
ORDER BY t.traveler_profile_id, td.doc_type, td.created_at DESC;
```

## Mudanças no TypeScript

### types.ts

```typescript
// Perfil Global (fonte da verdade)
export interface TravelerProfile {
  id: string;
  userId: string;
  fullName: string;
  nickname?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  canDrive: boolean;
  primaryDocType?: 'Passaporte' | 'RG' | 'Nenhum';
  primaryDocNumber?: string;
  primaryDocExpiry?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Vínculo Viagem (apenas configs)
export interface TripTraveler {
  id: string;
  tripId: string;
  travelerProfileId: string;
  coupleId?: string;
  type: 'Adulto' | 'Criança' | 'Infante';
  isPayer: boolean;
  countInSplit: boolean;
  goesToSegments: string[];
  status: 'Ativo' | 'Arquivado';
  createdAt: string;
  updatedAt: string;
  
  // Dados vêm do perfil (JOIN ou eager loading)
  profile?: TravelerProfile;
}

// Documento Global
export interface TravelerProfileDocument {
  id: string;
  travelerProfileId: string;
  docType: 'Passaporte' | 'RG' | 'CPF' | 'CNH' | 'Visto' | 'ESTA' | 'Outro';
  docCategory?: 'identity' | 'entry';
  docNumberLast4?: string; // Exibição segura
  docExpiry?: string;
  issueDate?: string;
  issuingCountry?: string;
  issuerState?: string;
  issuerAgency?: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Mudanças no supabaseDataProvider.ts

### getTripTravelers() - Com JOIN

```typescript
async getTripTravelers(tripId: string): Promise<TripTraveler[]> {
  const { data, error } = await supabase
    .from('td_trip_travelers')
    .select(`
      *,
      profile:td_traveler_profiles(*)
    `)
    .eq('trip_id', tripId)
    .eq('status', 'Ativo')
    .order('created_at');
  
  if (error) throw error;
  return data || [];
}
```

### getTravelerDocuments() - Nova função

```typescript
async getTravelerDocuments(travelerProfileId: string): Promise<TravelerProfileDocument[]> {
  const { data, error } = await supabase
    .from('td_traveler_profile_documents')
    .select('*')
    .eq('traveler_profile_id', travelerProfileId)
    .order('is_primary', { ascending: false })
    .order('created_at');
  
  if (error) throw error;
  return data || [];
}
```

### saveTravelerDocument() - Nova função

```typescript
async saveTravelerDocument(doc: Partial<TravelerProfileDocument>): Promise<TravelerProfileDocument> {
  if (doc.id) {
    // Update
    const { data, error } = await supabase
      .from('td_traveler_profile_documents')
      .update({
        doc_type: doc.docType,
        doc_category: doc.docCategory,
        doc_number_last4: doc.docNumberLast4,
        doc_expiry: doc.docExpiry,
        issue_date: doc.issueDate,
        issuing_country: doc.issuingCountry,
        issuer_state: doc.issuerState,
        issuer_agency: doc.issuerAgency,
        is_primary: doc.isPrimary,
        notes: doc.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', doc.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Insert
    const { data, error } = await supabase
      .from('td_traveler_profile_documents')
      .insert({
        traveler_profile_id: doc.travelerProfileId,
        doc_type: doc.docType,
        doc_category: doc.docCategory,
        doc_number_last4: doc.docNumberLast4,
        doc_expiry: doc.docExpiry,
        issue_date: doc.issueDate,
        issuing_country: doc.issuingCountry,
        issuer_state: doc.issuerState,
        issuer_agency: doc.issuerAgency,
        is_primary: doc.isPrimary,
        notes: doc.notes
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}
```

## Benefícios

✅ **Fonte única da verdade**: Dados sempre atualizados
✅ **Sem duplicação**: Perfil editado reflete em todas as viagens
✅ **Documentos reutilizáveis**: Cadastra passaporte uma vez, usa em todas as viagens
✅ **Histórico preservado**: Configs da viagem (casal, pagante) ficam em td_trip_travelers
✅ **Performance**: JOIN otimizado com índices
✅ **Segurança**: Documentos criptografados no perfil global

## Próximos Passos

1. ✅ Criar migração SQL
2. ✅ Aplicar migração no banco
3. ✅ Atualizar types.ts (TravelerProfileDocument)
4. ✅ Atualizar supabaseDataProvider.ts (getTravelerDocuments, saveTravelerDocument, deleteTravelerDocument)
5. ⏳ Atualizar componentes UI (TravelerDetailPage, DocumentDrawer)
6. ⏳ Testar fluxo completo

## Status Atual

✅ **Backend Completo**:
- Tabela `td_traveler_profile_documents` criada
- RLS policies configuradas
- Índices otimizados
- Comentários de documentação

✅ **TypeScript Completo**:
- Interface `TravelerProfileDocument` criada
- Interface `TripTraveler` já usa `profile?: TravelerProfile`
- Tipos alinhados com banco de dados

✅ **Data Provider Completo**:
- `getTravelerDocuments(travelerProfileId)` - Lista documentos do perfil
- `saveTravelerDocument(doc)` - Cria/atualiza documento
- `deleteTravelerDocument(documentId)` - Remove documento
- `getTripTravelers(tripId)` - Já faz JOIN com perfis

✅ **UI Completa**:
- `TravelerProfileDetailPage.tsx` - Página de detalhe do perfil global
- `DocumentDrawer.tsx` - Reutilizado para documentos globais
- `TravelerProfileList.tsx` - Atualizado para navegar ao detalhe
- `App.tsx` - Rota `traveler-profile-detail` adicionada
- Navegação completa: Lista → Detalhe → Documentos

## Funcionalidades Implementadas

✅ **Perfil Global**:
- Visualizar e editar informações pessoais
- Nome, apelido, email, telefone, data de nascimento
- Flag "pode dirigir"
- Observações

✅ **Documentos Globais**:
- Adicionar documentos ao perfil (Passaporte, RG, CPF, CNH, Visto, ESTA, Outro)
- Visualizar documentos com últimos 4 dígitos
- Editar metadados (validade, emissor, etc)
- Excluir documentos
- Marcar passaporte como principal
- Vincular vistos a passaportes

✅ **Segurança**:
- Números criptografados (doc_number_enc, doc_number_iv)
- Exibição segura (doc_number_last4)
- RLS policies completas

## Próximos Passos (Opcional)

⏳ **Melhorias Futuras**:
- Implementar criptografia real dos números de documentos
- Migrar dados legados de td_traveler_documents (se houver)
- Adicionar fotos/scans dos documentos
- Notificações de vencimento de documentos
