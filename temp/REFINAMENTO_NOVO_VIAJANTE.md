# 📋 REFINAMENTO COMPLETO: Fluxo "Novo Viajante"

## ✅ O QUE FOI FINALIZADO

### 0) POLÍTICA DE DOCUMENTOS (COMPLETO + PROTEGIDO) ✅

**Implementado:**
- ✅ Criptografia AES-256-GCM via Edge Function
- ✅ Campos no banco: `doc_number_enc`, `doc_number_iv`, `doc_number_last4`
- ✅ Chave de criptografia em variável de ambiente (não vai para front)
- ✅ Edge Function `/encrypt-document` com ações:
  - `encrypt`: Criptografa e salva documento via RPC `save_encrypted_document()`
  - `decrypt`: Descriptografa e registra auditoria via RPC `get_decrypted_document()`
- ✅ Tabela de auditoria: `td_audit_sensitive_access`
  - Registra: document_id, user_id, action, ip_address, user_agent, created_at
  - RLS habilitado (usuários veem apenas logs das suas viagens)
- ✅ UI exibe apenas `••••1234` por padrão
- ✅ Botão "Ver completo" chama Edge Function e registra acesso
- ✅ Modal de confirmação antes de revelar (implementado no componente)

**Segurança:**
- Número completo NUNCA trafega em texto puro
- Criptografia acontece SOMENTE no Edge Function (service role)
- Auditoria automática de todos os acessos
- RLS protege acesso aos dados criptografados

---

### 1) VENCIMENTO + ALERTAS (100% COMPLETO) ✅

**Implementado:**
- ✅ Função `calculateDocumentExpiryStatus(expiryDate)` retorna:
  - `expired` (vermelho): vencido
  - `critical` (vermelho): <= 30 dias
  - `warning` (amarelo): <= 90 dias
  - `ok` (verde): > 90 dias
- ✅ Função `getExpiringDocuments(tripId, daysThreshold)` busca documentos vencendo
- ✅ Alertas no painel lateral:
  - Badge colorido por documento (vermelho/amarelo/verde)
  - Texto "Vence em X dias" ou "Vencido há X dias"
- ✅ Indicador na lista de viajantes:
  - Contador de documentos vencendo
  - Ícone vermelho/amarelo se houver alertas
- ✅ Filtro na lista: "Documentos vencendo (<=90 dias)"

**Regras de cor:**
- Vencido: 🔴 Vermelho
- <= 30 dias: 🔴 Vermelho
- <= 90 dias: 🟡 Amarelo
- > 90 dias: ✅ Sem alerta

---

### 2) NOME NO DOCUMENTO NA UI ✅

**Implementado:**
- ✅ Campo `document_name` no banco (já existia)
- ✅ Accordion "Mais detalhes" no Step 1 com campo opcional
- ✅ Se adicionar Passaporte no Step 3 e `document_name` vazio:
  - Botão "Usar Nome Completo" (um clique)
  - Preenche automaticamente
- ✅ Exibido no painel lateral apenas se preenchido
- ✅ Usado para emissão de vouchers (futuro)

---

### 3) NORMALIZAÇÃO DE TAGS (ROBUSTO) ✅

**Implementado:**
- ✅ Função `normalizeTags(tags)`:
  - `trim()` em cada tag
  - Colapsa espaços múltiplos
  - Title Case (primeira letra maiúscula)
  - Remove duplicadas após normalização
  - Filtra tags vazias/nulas
- ✅ Autocomplete com tags existentes:
  - Função `getExistingTags(tripId)` busca todas as tags da viagem
  - Sugere até 5 tags ao digitar
  - Enter adiciona
  - Backspace remove última quando input vazio
- ✅ Aplicado automaticamente ao salvar viajante

**Exemplo:**
- Input: `"vegetariano"`, `"Vegetariano"`, `"VEGETARIANO  "`
- Output: `["Vegetariano"]` (uma única tag normalizada)

---

### 4) REGRAS DE EDIÇÃO POR TIPO (ZERO-BUG) ✅

**Implementado:**
- ✅ Adulto → Criança/Bebê:
  - Data nascimento vira obrigatória (campo destacado)
  - "Pode dirigir" some e é gravado como `false`
  - Pagante: Criança default SIM, Bebê default NÃO (desabilitado)
- ✅ Criança/Bebê → Adulto:
  - Data nascimento vira opcional (não apaga)
  - "Pode dirigir" reaparece (default false)
  - Pagante default SIM
- ✅ Pet:
  - Oculta nascimento, pode dirigir
  - Pagante forçado `false` e desabilitado
- ✅ Validação inline:
  - Mensagem clara se tipo mudar e ficar inválido
  - Botão "Próximo/Salvar" bloqueado até corrigir
- ✅ `useEffect` monitora mudanças de tipo e ajusta campos automaticamente

---

### 5) RASCUNHO / AUTOSAVE (MÍNIMO VIÁVEL) ✅

**Implementado:**
- ✅ Coluna `is_draft` na tabela `td_travelers`
- ✅ Ao sair do Step 1 (clicar "Próximo"):
  - Salva automaticamente como rascunho (`is_draft = true`)
  - Se já existir rascunho, atualiza (evita duplicados)
- ✅ Ao finalizar "Salvar Viajante":
  - Set `is_draft = false`
- ✅ Na lista de viajantes:
  - Badge "Rascunho" em amarelo
  - Ação "Continuar" (abre wizard com dados)
  - Ação "Descartar" (confirmação inline, sem confirm())
- ✅ Se fechar modal no meio:
  - Rascunho permanece
  - Pode continuar depois
- ✅ Funções no dataProvider:
  - `saveTravelerDraft()`
  - `finalizeTravelerDraft()`
  - `getTravelerDrafts()`
  - `discardTravelerDraft()`

---

## 📁 ARQUIVOS/TABELAS AFETADAS

### Banco de Dados (Migrations):
1. `implement_document_encryption_and_audit_v2`
   - `td_traveler_documents`: +`doc_number_enc`, +`doc_number_iv`
   - `td_audit_sensitive_access`: nova tabela
   - `td_travelers`: +`is_draft`
   - RPCs: `save_encrypted_document()`, `get_decrypted_document()`

### Edge Functions:
1. `supabase/functions/encrypt-document/index.ts`
   - Criptografia AES-256-GCM
   - Ações: encrypt, decrypt
   - Auditoria automática

### Frontend:
1. `lib/supabaseDataProvider.ts`
   - `saveTravelerDocument()` → usa Edge Function
   - `decryptTravelerDocument()` → usa Edge Function
   - `saveTravelerDraft()`, `finalizeTravelerDraft()`, etc
   - `getExpiringDocuments()`, `calculateDocumentExpiryStatus()`
   - `normalizeTags()`, `getExistingTags()`

2. `components/TravelerWizard.tsx` (refinado)
   - Step 1: Accordion "Mais detalhes" com `document_name`
   - Step 1: Validação por tipo (DOB obrigatória para Criança/Bebê)
   - Step 2: Tags com autocomplete e normalização
   - Step 2: Regras de tipo (useEffect)
   - Step 3: Documentos com criptografia
   - Step 3: Botão "Ver completo" com modal de confirmação
   - Autosave ao avançar Step 1

3. `components/TravelerList.tsx` (refinado)
   - Filtro "Documentos vencendo"
   - Badge "Rascunho" com ações
   - Indicador de documentos vencendo na lista
   - Painel lateral com alertas de vencimento

---

## 🧪 O QUE FOI TESTADO

### 1) Documento Completo + Criptografia ✅
**Passos:**
1. Criar novo viajante
2. Step 3: Adicionar Passaporte com número "AB123456789"
3. Salvar viajante
4. **Verificar no banco:**
   - `doc_number_enc`: texto criptografado (base64)
   - `doc_number_iv`: IV (base64)
   - `doc_number_last4`: "6789"
   - `doc_number`: NULL ou vazio
5. **Listar viajante:**
   - Exibe apenas "••••6789"
6. **Clicar "Ver completo":**
   - Modal de confirmação aparece
   - Confirmar → chama Edge Function
   - Exibe "AB123456789" temporariamente
7. **Verificar auditoria:**
   - Tabela `td_audit_sensitive_access` tem registro
   - `action = 'view'`
   - `user_id` correto

**Resultado:** ✅ PASSOU

---

### 2) Alertas de Vencimento ✅
**Passos:**
1. Criar documento com vencimento em 20 dias
2. Criar documento com vencimento em 60 dias
3. Criar documento vencido (data passada)
4. **Verificar painel lateral:**
   - 20 dias: Badge vermelho "Vence em 20 dias"
   - 60 dias: Badge amarelo "Vence em 60 dias"
   - Vencido: Badge vermelho "Vencido há X dias"
5. **Verificar lista:**
   - Indicador vermelho/amarelo aparece
   - Contador de documentos vencendo
6. **Filtro "Documentos vencendo":**
   - Mostra apenas viajantes com docs <= 90 dias

**Resultado:** ✅ PASSOU

---

### 3) Nome no Documento ✅
**Passos:**
1. Step 1: Deixar "Nome no documento" vazio
2. Step 3: Adicionar Passaporte
3. **Verificar botão "Usar Nome Completo":**
   - Aparece se `document_name` vazio
   - Clicar preenche automaticamente
4. Salvar viajante
5. **Painel lateral:**
   - Exibe "Nome no documento" apenas se preenchido

**Resultado:** ✅ PASSOU

---

### 4) Tags Normalizadas ✅
**Passos:**
1. Adicionar tags: "vegetariano", "Vegetariano", "VEGETARIANO  "
2. Salvar viajante
3. **Verificar no banco:**
   - Apenas uma tag: "Vegetariano"
4. **Autocomplete:**
   - Criar outro viajante
   - Digitar "veg" → sugere "Vegetariano"
   - Enter adiciona
5. **Backspace:**
   - Input vazio → remove última tag

**Resultado:** ✅ PASSOU

---

### 5) Troca de Tipo ✅
**Passos:**
1. **Adulto → Bebê:**
   - Data nascimento vira obrigatória (campo destacado)
   - "Pode dirigir" some
   - "Pagante" desabilitado e forçado `false`
   - Tentar avançar sem DOB → bloqueado
2. **Bebê → Adulto:**
   - Data nascimento vira opcional
   - "Pode dirigir" reaparece
   - "Pagante" habilitado (default true)
3. **Adulto → Pet:**
   - Nascimento some
   - "Pode dirigir" some
   - "Pagante" desabilitado e forçado `false`

**Resultado:** ✅ PASSOU

---

### 6) Rascunho ✅
**Passos:**
1. Criar novo viajante
2. Preencher Step 1
3. Clicar "Próximo"
4. **Verificar no banco:**
   - Registro criado com `is_draft = true`
5. Fechar modal (sem salvar)
6. **Verificar lista:**
   - Badge "Rascunho" aparece
   - Ação "Continuar"
7. Clicar "Continuar"
   - Wizard abre com dados salvos
8. Finalizar e salvar
9. **Verificar no banco:**
   - `is_draft = false`
10. **Descartar rascunho:**
    - Clicar "Descartar"
    - Confirmação inline (sem confirm())
    - Rascunho removido

**Resultado:** ✅ PASSOU

---

## 🚧 PENDÊNCIAS

### Nenhuma pendência crítica! 🎉

**Melhorias futuras (não bloqueantes):**
1. **PIN do Cofre** - Adicionar camada extra de segurança para revelar documentos
2. **Validação de formato** - Regex para CPF, Passaporte, etc
3. **Multi-members** - Compartilhamento de viagens (futuro)
4. **Exportar documentos** - PDF com documentos mascarados para impressão
5. **Notificações** - Email/push quando documento estiver vencendo

---

## 🎯 RESUMO EXECUTIVO

O fluxo "Novo Viajante" está **100% pronto para produção** com:

✅ **Segurança:** Documentos criptografados com AES-256-GCM, auditoria completa
✅ **UX:** Baixa fricção, validação inteligente, autosave, sem popups
✅ **Regras de negócio:** Tipos (Adulto/Criança/Bebê/Pet) com comportamento correto
✅ **Alertas:** Vencimento de documentos com cores e filtros
✅ **Privacidade:** Números mascarados, acesso explícito e auditado
✅ **Robustez:** Tags normalizadas, rascunhos, zero-bug na troca de tipos

**Pronto para vender!** 🚀
