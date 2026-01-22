# 📋 STEP 3 - DOCUMENTOS COMPLETO E VENDÁVEL

## ✅ O QUE MUDOU

### 1. BANCO DE DADOS - Campos Específicos por Tipo

**Novos campos em `td_traveler_documents`:**
- `doc_category` (identity | entry) - Categorização principal
- `issuer_country` - País emissor (Passaporte, Visto, ESTA)
- `issuer_state` - Estado emissor (RG, CNH)
- `issuer_agency` - Órgão emissor (RG)
- `issuer_place` - Local de emissão (Passaporte)
- `region_or_country` - País/Região (Visto, ESTA)
- `issue_date` - Data de emissão
- `expiry_date` - Data de vencimento (substituiu doc_expiry)
- `visa_category` - Categoria do visto (B1/B2, etc)
- `entry_type` - Tipo de entrada (single | multiple)
- `stay_duration_days` - Duração da estadia
- `license_category` - Categoria da CNH (A, B, AB, etc)
- `custom_label` - Nome customizado (Outros)
- `passport_document_id` - Vínculo com passaporte
- `is_primary` - Passaporte principal (boolean)

**Campos mantidos (segurança):**
- `doc_number_enc` - Número criptografado (AES-256-GCM)
- `doc_number_iv` - IV para descriptografia
- `doc_number_last4` - Últimos 4 dígitos (exibição segura)

---

## 📝 CAMPOS POR TIPO DE DOCUMENTO

### PASSAPORTE (passport, identity)
**Obrigatórios:**
- País emissor (`issuer_country`)
- Número (`doc_number_enc/iv/last4`)
- Data de vencimento (`expiry_date`)

**Recomendados:**
- Data de emissão (`issue_date`)
- Local de emissão (`issuer_place`)
- Nome no documento (usa `traveler.document_name`)
- Observações (`notes`)

**Regras:**
- ✅ Múltiplos passaportes permitidos
- ✅ 1 passaporte principal por traveler (`is_primary`)
- ✅ Primeiro cadastrado vira principal automaticamente
- ✅ Ao deletar principal, promove automaticamente o válido mais recente
- ✅ Bloqueia duplicado: mesmo país + last4
- ✅ Validação: emissão <= vencimento

---

### RG (rg, identity)
**Obrigatórios:**
- Estado emissor (`issuer_state`)
- Número (`doc_number_enc/iv/last4`)

**Recomendados:**
- Órgão emissor (`issuer_agency`) - ex: SSP
- Data de emissão (`issue_date`)
- Data de vencimento (`expiry_date`) - opcional
- Observações (`notes`)

**Regras:**
- ✅ Múltiplos RGs permitidos (casos raros)
- ✅ Bloqueia duplicado: mesmo estado + last4
- ✅ Alertas de vencimento apenas se `expiry_date` existir

---

### CPF (cpf, identity)
**Obrigatórios:**
- Número (`doc_number_enc/iv/last4`)

**Recomendados:**
- Nome no documento (usa `traveler.document_name`)
- Observações (`notes`)

**Regras:**
- ✅ Sem vencimento
- ✅ Bloqueia duplicado: mesmo last4 no traveler
- ✅ Preparado para validação de formato (máscara + dígitos)

---

### CNH (cnh, identity)
**Obrigatórios:**
- Número de registro (`doc_number_enc/iv/last4`)
- Data de vencimento (`expiry_date`)

**Recomendados:**
- Categoria (`license_category`) - A, B, AB, C, D, E
- Data de emissão (`issue_date`)
- UF emissora (`issuer_state`)
- Observações (`notes`)

**Regras:**
- ✅ Vencimento obrigatório + alertas
- ✅ Sugestão de 1 CNH por traveler (pode ter múltiplas)
- ✅ Validação: emissão <= vencimento

---

### VISTO (visa, entry)
**Obrigatórios:**
- País/Região (`region_or_country`) - ex: EUA, Canadá, Schengen
- Validade até (`expiry_date`)

**Recomendados:**
- Categoria (`visa_category`) - ex: B1/B2, Turismo
- Entradas (`entry_type`) - single | multiple
- Duração por entrada (`stay_duration_days`)
- Número/ID do visto (`doc_number_enc/iv/last4`) - opcional
- Vincular ao passaporte (`passport_document_id`)
- Observações (`notes`)

**Regras:**
- ✅ Vencimento obrigatório + alertas
- ✅ Vínculo com passaporte (default: principal)
- ✅ Permite salvar sem vínculo se não houver passaporte

---

### ESTA / ETA (esta_eta, entry)
**Obrigatórios:**
- País/Região (`region_or_country`)
- Validade até (`expiry_date`)

**Opcional:**
- Número/ID (`doc_number_enc/iv/last4`)
- Vincular ao passaporte (`passport_document_id`)
- Observações (`notes`)

**Regras:**
- ✅ Vencimento obrigatório + alertas
- ✅ Vínculo com passaporte (default: principal)

---

### OUTRO - IDENTIDADE (other_identity, identity)
**Obrigatórios:**
- Nome do documento (`custom_label`) - ex: "Carteira do Plano"

**Opcional:**
- Número/ID (`doc_number_enc/iv/last4`)
- País/Estado emissor (`issuer_country` ou `issuer_state`)
- Emissão (`issue_date`)
- Vencimento (`expiry_date`)
- Observações (`notes`)

**Regras:**
- ✅ Alertas se tiver `expiry_date`

---

### OUTRO - ENTRADA (other_entry, entry)
**Obrigatórios:**
- Nome do documento (`custom_label`) - ex: "Autorização"

**Opcional:**
- País/Região (`region_or_country`)
- Número/ID (`doc_number_enc/iv/last4`)
- Vencimento (`expiry_date`)
- Vincular ao passaporte (`passport_document_id`)
- Observações (`notes`)

**Regras:**
- ✅ Alertas se tiver `expiry_date`

---

## 🎨 UX DO STEP 3

### Seleção Guiada (Modal)
Ao clicar "+ Adicionar Documento", abre modal com 2 grupos:

**1) Identidade (Pessoal)**
- 🛂 Passaporte
- 🪪 RG (Documento de identidade)
- 📄 CPF
- 🚗 CNH (Carteira de motorista)
- 📋 Outro (Identidade)

**2) Entrada no país (Viagem)**
- 🌍 Visto
- ✈️ ESTA / ETA
- 📋 Outro (Entrada)

### Organização da Listagem

**Seção: Identidade**
- **Passaportes (N)**
  - Badge "Principal" no passaporte principal
  - País + ••••last4
  - Status de vencimento (badge colorido)
  - Ações: Editar, Remover, Ver completo, Definir como principal

- **RG / CPF / CNH / Outros**
  - Cards individuais
  - Tipo + Estado/País + ••••last4
  - Status de vencimento
  - Ações: Editar, Remover, Ver completo

**Seção: Entrada no país**
- **Vistos**
  - País/Região + Categoria + ••••last4
  - "Vinculado ao passaporte: Brasil ••••1234 (Principal)"
  - Status de vencimento
  - Ações: Editar, Remover, Ver completo

- **ESTA/ETA**
  - País/Região + ••••last4
  - Vínculo com passaporte
  - Status de vencimento
  - Ações: Editar, Remover, Ver completo

- **Outros**
  - Nome customizado + ••••last4
  - Vínculo (se houver)
  - Status de vencimento
  - Ações: Editar, Remover, Ver completo

### Formulários Específicos

Cada tipo de documento tem seu próprio formulário com campos relevantes:
- Campos obrigatórios marcados com *
- Campos recomendados destacados
- Validações inline (emissão <= vencimento, duplicados)
- Dropdown de passaportes para vínculo (mostra país + ••••last4 + badge Principal)
- Botão "Usar Nome Completo" para preencher `document_name`

---

## 🔒 SEGURANÇA (MANTIDA E MELHORADA)

### Criptografia
- ✅ AES-256-GCM via Edge Function
- ✅ Chave em variável de ambiente (não vai para front)
- ✅ Número completo NUNCA em texto puro no banco
- ✅ Campos: `doc_number_enc`, `doc_number_iv`, `doc_number_last4`

### Auditoria
- ✅ Tabela `td_audit_sensitive_access`
- ✅ Registra: document_id, user_id, action, trip_id, traveler_id, created_at
- ✅ Toda visualização de número completo é auditada
- ✅ RLS habilitado (usuários veem apenas logs das suas viagens)

### UI
- ✅ Exibe apenas `••••1234` por padrão
- ✅ Botão "Ver completo" com modal de confirmação
- ✅ Número revelado temporariamente (não persiste)
- ✅ Log automático de acesso

---

## 🚨 ALERTAS DE VENCIMENTO

**Regras de cor (para todos os documentos com `expiry_date`):**
- 🔴 Vencido: `expiry_date < hoje`
- 🔴 Crítico: `expiry_date <= 30 dias`
- 🟡 Atenção: `expiry_date <= 90 dias`
- ✅ OK: `expiry_date > 90 dias`

**Onde aparecem:**
- ✅ Badge colorido no card do documento (Step 3)
- ✅ Painel lateral do viajante (seção Documentos)
- ✅ Indicador/contador na lista de viajantes
- ✅ Filtro "Documentos vencendo (<=90 dias)"

---

## 🗄️ TRIGGERS E VALIDAÇÕES (BANCO)

### 1. Passaporte Principal Único
**Trigger:** `ensure_single_primary_passport`
- Ao marcar passaporte como principal, desmarca os outros do mesmo traveler
- Garante apenas 1 principal por traveler

### 2. Promoção Automática
**Trigger:** `promote_primary_passport_on_delete`
- Ao deletar passaporte principal, promove automaticamente:
  1. Passaporte válido mais recente (expiry_date >= hoje)
  2. Se não houver válido, promove o mais recente

### 3. Validação de Duplicados
**Trigger:** `check_document_duplicate`
- **Passaporte:** Bloqueia mesmo país + last4
- **RG:** Bloqueia mesmo estado + last4
- **CPF:** Bloqueia mesmo last4
- Mensagem de erro clara

### 4. Validação de Datas
**RPC:** `save_encrypted_document`
- Valida: `issue_date <= expiry_date`
- Retorna erro se inválido

---

## 📊 PAINEL LATERAL - ORGANIZAÇÃO

**Seção: Documentos**

**1) Identidade**
- **Passaportes**
  - Badge "Principal" + País
  - ••••last4
  - Status de vencimento (badge colorido)
  - Emissão e vencimento
  - Botão "Ver completo"

- **RG / CPF / CNH / Outros**
  - Tipo + Estado/País
  - ••••last4
  - Status de vencimento
  - Detalhes específicos (categoria CNH, órgão emissor RG, etc)

**2) Entrada no país**
- **Vistos**
  - País/Região + Categoria
  - ••••last4 (se houver)
  - "Vinculado ao passaporte: Brasil ••••1234 (Principal)"
  - Entradas: Single/Multiple
  - Duração: X dias
  - Status de vencimento

- **ESTA/ETA**
  - País/Região
  - ••••last4 (se houver)
  - Vínculo com passaporte
  - Status de vencimento

- **Outros**
  - Nome customizado
  - Detalhes
  - Vínculo (se houver)

---

## 🧪 CENÁRIOS TESTADOS

### 1. Passaportes Múltiplos + Principal ✅
**Passos:**
1. Cadastrar Passaporte Brasil → vira principal automaticamente
2. Cadastrar Passaporte Itália → Brasil continua principal
3. Clicar "Definir como principal" no Itália → Itália vira principal, Brasil perde badge
4. Deletar Itália (principal) → Brasil é promovido automaticamente
5. **Resultado:** ✅ Sistema gerencia principal corretamente

### 2. RG + CPF + CNH (Identidade) ✅
**Passos:**
1. Cadastrar RG SP com número 123456789
2. Cadastrar CPF (sem vencimento)
3. Cadastrar CNH com vencimento em 60 dias
4. **Verificar:**
   - RG: sem alerta (sem vencimento)
   - CPF: sem alerta (sem vencimento)
   - CNH: badge amarelo "Vence em 60 dias"
5. **Resultado:** ✅ Alertas corretos por tipo

### 3. Visto Vinculado ao Passaporte ✅
**Passos:**
1. Cadastrar Passaporte Brasil (principal)
2. Cadastrar Visto EUA (B1/B2)
3. Dropdown "Vincular ao passaporte" mostra: "Brasil ••••1234 (Principal)"
4. Selecionar e salvar
5. **Verificar painel lateral:**
   - Visto mostra "Vinculado ao passaporte: Brasil ••••1234 (Principal)"
6. **Resultado:** ✅ Vínculo funciona e exibe corretamente

### 4. ESTA Vinculada ✅
**Passos:**
1. Cadastrar ESTA EUA vinculada ao passaporte principal
2. **Verificar:**
   - Vínculo salvo
   - Exibição no painel lateral
3. **Resultado:** ✅ Funciona

### 5. Alertas de Vencimento ✅
**Passos:**
1. Cadastrar documento vencendo em 20 dias → badge vermelho "Vence em 20 dias"
2. Cadastrar documento vencendo em 60 dias → badge amarelo "Vence em 60 dias"
3. Cadastrar documento vencido (data passada) → badge vermelho "Vencido há X dias"
4. **Verificar lista de viajantes:**
   - Indicador vermelho/amarelo aparece
   - Contador de documentos vencendo
5. **Filtro "Documentos vencendo":**
   - Mostra apenas viajantes com docs <= 90 dias
6. **Resultado:** ✅ Alertas funcionam em todos os lugares

### 6. Segurança + Auditoria ✅
**Passos:**
1. Cadastrar passaporte com número "AB123456789"
2. **Verificar no banco:**
   - `doc_number_enc`: texto criptografado (base64)
   - `doc_number_iv`: IV (base64)
   - `doc_number_last4`: "6789"
   - `doc_number`: NULL (não existe mais)
3. **Listar viajante:**
   - Exibe apenas "••••6789"
4. **Clicar "Ver completo":**
   - Modal de confirmação aparece
   - Confirmar → chama Edge Function
   - Exibe "AB123456789" temporariamente
5. **Verificar auditoria:**
   - Tabela `td_audit_sensitive_access` tem registro
   - `action = 'view'`
   - `user_id`, `trip_id`, `traveler_id` corretos
6. **Resultado:** ✅ Segurança 100% funcional

### 7. Duplicidade Bloqueada ✅
**Passos:**
1. Cadastrar RG SP com número terminando em "1234"
2. Tentar cadastrar outro RG SP com número terminando em "1234"
3. **Resultado:** ❌ Erro: "Já existe um RG de SP com final 1234"
4. Cadastrar Passaporte Brasil terminando em "5678"
5. Tentar cadastrar outro Passaporte Brasil terminando em "5678"
6. **Resultado:** ❌ Erro: "Já existe um passaporte de Brasil com final 5678"
7. **Resultado:** ✅ Validação de duplicados funciona

---

## 🚧 PENDÊNCIAS

### Nenhuma pendência crítica! 🎉

**Melhorias futuras (não bloqueantes):**
1. **Validação de formato CPF** - Regex + dígitos verificadores
2. **Máscara de input** - Formatar CPF, RG, etc durante digitação
3. **Upload de foto do documento** - Scan/foto para backup
4. **Notificações automáticas** - Email/push quando documento vencer em X dias
5. **Exportar PDF** - Relatório de documentos para impressão
6. **Histórico de alterações** - Audit trail de edições de documentos

---

## 🎯 RESUMO EXECUTIVO

O **Step 3 - Documentos** está **100% completo e vendável** com:

✅ **8 tipos de documentos específicos** com campos relevantes
✅ **Múltiplos documentos** por tipo (incluindo vários passaportes)
✅ **Passaporte principal** com promoção automática
✅ **Vínculos** entre vistos/ESTA e passaportes
✅ **Segurança máxima**: AES-256-GCM + auditoria completa
✅ **Alertas de vencimento** para todos os tipos
✅ **Validações robustas**: duplicados, datas, obrigatoriedade
✅ **UX organizada**: seleção guiada + seções por categoria
✅ **Painel lateral completo**: identidade + entrada no país

**Pronto para vender!** 🚀
