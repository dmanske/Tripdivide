# Status da Refatoração - Perfis Globais de Viajantes

## ✅ CONCLUÍDO

### Backend (lib/supabaseDataProvider.ts)
- ✅ getTravelerProfiles() - Listar perfis globais
- ✅ getTravelerProfileById() - Buscar perfil específico
- ✅ saveTravelerProfile() - Criar/atualizar perfil global
- ✅ deleteTravelerProfile() - Excluir perfil (com verificação de vínculos)
- ✅ getTravelerProfileDocuments() - Buscar documentos do perfil (com descriptografia)
- ✅ saveTravelerProfileDocument() - Salvar documento (com criptografia via Edge Function)
- ✅ deleteTravelerProfileDocument() - Excluir documento
- ✅ getTripTravelers() - Buscar viajantes vinculados à viagem (com join de perfil)
- ✅ linkTravelerToTrip() - Criar vínculo viagem-viajante
- ✅ updateTripTraveler() - Atualizar configurações do vínculo
- ✅ unlinkTravelerFromTrip() - Arquivar vínculo

### Navegação (App.tsx)
- ✅ Botão "Ver Perfil" em TravelerList
- ✅ ViewState para traveler-profile-detail com returnTo
- ✅ Navegação correta entre listas e detalhes

## 🚧 EM ANDAMENTO

### Frontend - Wizard e Detalhes
- ⏳ TravelerWizard.tsx - PRECISA SER RECRIADO
  - Modo dual (com/sem tripId)
  - Step 1: Salvar perfil global (saveTravelerProfile)
  - Step 2: Se tripId existe, criar/atualizar vínculo (linkTravelerToTrip/updateTripTraveler)
  - Step 3: Documentos (saveTravelerProfileDocument)
  - Copiar UI EXATA de temp/components/TravelerWizard.tsx

- ⏳ TravelerProfileDetailPage.tsx - PRECISA SER CRIADO
  - Copiar layout de temp/components/TravelerDetailPage.tsx
  - Usar getTravelerProfileById() e getTravelerProfileDocuments()
  - Manter seções, DocumentDrawer, alertas de vencimento

- ⏳ TravelerProfileList.tsx - PRECISA SER CRIADO
  - Listar perfis globais (getTravelerProfiles)
  - Botão "+ Novo viajante" abre wizard sem tripId
  - Click no item abre TravelerProfileDetailPage

## 📋 PRÓXIMOS PASSOS

1. **RECRIAR TravelerWizard.tsx** (ARQUIVO FOI DELETADO)
   ```typescript
   interface TravelerWizardProps {
     tripId?: string;
     trip?: Trip;
     existingProfileId?: string;
     onDone?: (profileId: string) => void;
     onCancel: () => void;
   }
   ```
   - Copiar UI completa de temp/components/TravelerWizard.tsx (942 linhas)
   - Mudar apenas persistência:
     * Step 1: saveTravelerProfile() → retorna profileId
     * Step 2: linkTravelerToTrip() se tripId existe
     * Step 3: saveTravelerProfileDocument(profileId, doc)

2. **CRIAR TravelerProfileDetailPage.tsx**
   - Copiar layout de temp/components/TravelerDetailPage.tsx (774 linhas)
   - Trocar fontes de dados:
     * getTravelerProfileById(profileId)
     * getTravelerProfileDocuments(profileId)
   - Manter: seções, DocumentDrawer, alertas, máscaras

3. **CRIAR TravelerProfileList.tsx**
   - Similar a VendorProfileList
   - getTravelerProfiles() para listar
   - "+ Novo viajante" → TravelerWizard sem tripId
   - Click → TravelerProfileDetailPage

4. **ATUALIZAR App.tsx**
   - Adicionar rotas para profile-list e profile-detail
   - Garantir navegação correta entre modos (geral/viagem)

## 🎯 REGRAS CRÍTICAS

- ❌ NUNCA gravar em td_travelers / td_traveler_documents (legado)
- ✅ SEMPRE usar td_traveler_profiles / td_traveler_profile_documents
- ✅ Vínculos viagem em td_trip_travelers
- ✅ Copiar UI 1:1 de /temp (não inventar)
- ✅ Documentos com criptografia via Edge Function (isProfileDocument: true)

## 📁 ARQUIVOS DE REFERÊNCIA

- `temp/components/TravelerWizard.tsx` - UI completa do wizard (942 linhas)
- `temp/components/TravelerDetailPage.tsx` - Layout rico de detalhes (774 linhas)
- `components/DocumentDrawer.tsx` - Reutilizar como está
- `lib/supabaseDataProvider.ts` - Métodos já implementados (linhas 990+)

## ⚠️ ATENÇÃO

O arquivo `components/TravelerWizard.tsx` foi DELETADO e precisa ser recriado do zero.
Use o arquivo de referência `temp/components/TravelerWizard.tsx` como base para a UI.
