# Refatoração Arquitetural - Perfis Globais

## ✅ IMPLEMENTADO

### 1. Estrutura de Banco de Dados
- ✅ Tabelas criadas no Supabase:
  - `td_traveler_profiles` - Perfis globais de viajantes
  - `td_vendor_profiles` - Perfis globais de fornecedores
  - `td_trip_travelers` - Vínculos viajante x viagem
  - `td_trip_vendors` - Vínculos fornecedor x viagem
- ✅ Políticas RLS configuradas para todas as tabelas

### 2. Funções no supabaseDataProvider
- ✅ `getTravelerProfiles()` - Buscar perfis de viajantes
- ✅ `saveTravelerProfile()` - Criar/editar perfil de viajante
- ✅ `deleteTravelerProfile()` - Arquivar perfil de viajante
- ✅ `getVendorProfiles()` - Buscar perfis de fornecedores
- ✅ `saveVendorProfile()` - Criar/editar perfil de fornecedor
- ✅ `deleteVendorProfile()` - Arquivar perfil de fornecedor
- ✅ `getTripTravelers()` - Buscar viajantes vinculados a uma viagem
- ✅ `linkTravelerToTrip()` - Vincular perfil a viagem
- ✅ `unlinkTravelerFromTrip()` - Desvincular perfil de viagem
- ✅ `updateTripTraveler()` - Atualizar vínculo viajante x viagem
- ✅ `getTripVendors()` - Buscar fornecedores vinculados a uma viagem
- ✅ `linkVendorToTrip()` - Vincular fornecedor a viagem
- ✅ `unlinkVendorFromTrip()` - Desvincular fornecedor de viagem
- ✅ `updateTripVendor()` - Atualizar vínculo fornecedor x viagem

### 3. Componentes Criados
- ✅ `TravelerProfileList.tsx` - Gerenciar perfis globais de viajantes
  - Listagem com busca
  - Criação/edição inline com modal
  - Arquivamento com confirmação via modal (sem window.confirm)
  - Stats: Total, Adultos, Crianças
- ✅ `VendorProfileList.tsx` - Gerenciar perfis globais de fornecedores
  - Listagem com busca
  - Criação/edição inline com modal
  - Arquivamento com confirmação via modal (sem window.confirm)
  - Stats: Total, Bem Avaliados, Com Alertas
  - Sistema de avaliação por estrelas
- ✅ `LinkTravelersModal.tsx` - Modal para vincular viajantes a viagem
  - Busca de perfis globais
  - Multi-seleção
  - Exclui perfis já vinculados
  - Vinculação em lote
- ✅ `LinkVendorsModal.tsx` - Modal para vincular fornecedores a viagem
  - Busca de perfis globais
  - Multi-seleção
  - Exclui perfis já vinculados
  - Vinculação em lote

### 4. Componentes Atualizados
- ✅ `App.tsx`
  - Importados novos componentes (TravelerProfileList, VendorProfileList)
  - Adicionado `onCloseTrip` no Layout
  - ViewState atualizado para suportar modo geral e modo viagem
  - `renderContent()` atualizado para usar perfis globais no modo geral
- ✅ `Layout.tsx`
  - Adicionado prop `onCloseTrip`
  - Menu adaptado para modo geral vs modo viagem
  - Botão "Voltar ao Geral" quando em modo viagem
- ✅ `GeneralDashboard.tsx`
  - Stats atualizados para buscar de perfis globais
  - Contadores corretos de viajantes e fornecedores
- ✅ `TravelerList.tsx` - **REFATORADO PARA PERFIS GLOBAIS**
  - Agora trabalha com `td_trip_travelers` + join com `td_traveler_profiles`
  - Botão "+ Adicionar da minha lista" abre modal de vinculação
  - Botão "Desvincular" com confirmação via modal
  - Exibe dados do perfil + badges do vínculo (pagante, segmentos)
  - Mensagens de sucesso ao vincular/desvincular
- ✅ `VendorList.tsx` - **REFATORADO PARA PERFIS GLOBAIS**
  - Agora trabalha com `td_trip_vendors` + join com `td_vendor_profiles`
  - Botão "+ Adicionar da minha lista" abre modal de vinculação
  - Botão "Desvincular" com confirmação via modal
  - Exibe dados do perfil + rating
  - Mensagens de sucesso ao vincular/desvincular

### 5. Navegação e Fluxo
- ✅ Modo Geral (sem viagem ativa):
  - Dashboard Geral
  - Lista de Viagens
  - Perfis Globais de Viajantes
  - Perfis Globais de Fornecedores
- ✅ Modo Viagem (com viagem ativa):
  - Dashboard da Viagem
  - Viajantes vinculados (NOVO: usa perfis globais)
  - Fornecedores vinculados (NOVO: usa perfis globais)
  - Orçamentos, Despesas, Pagamentos, Acerto
- ✅ Funções `openTrip()` e `closeTrip()` implementadas
- ✅ Sem seletor de viagem na sidebar (escolha apenas na tela Viagens)

### 6. Correções de Segurança
- ✅ Removido `window.confirm` de TravelerProfileList
- ✅ Removido `window.confirm` de VendorProfileList
- ✅ Substituído por modais customizados
- ✅ Corrigido acesso a `supabase.supabaseUrl` (exportado de supabase.ts)

### 7. Fluxo de Vinculação (PRIORIDADE 1 - COMPLETO)
- ✅ Modal de vinculação de viajantes com busca e multi-seleção
- ✅ Modal de vinculação de fornecedores com busca e multi-seleção
- ✅ Desvinculação com confirmação via modal
- ✅ Mensagens de sucesso/feedback visual
- ✅ Perfis já vinculados são excluídos da lista de seleção

### 8. Substituição de Telas Legadas (PRIORIDADE 2 - COMPLETO)
- ✅ TravelerList agora usa perfis globais + vínculos
- ✅ VendorList agora usa perfis globais + vínculos
- ✅ Ações de desvincular implementadas
- ✅ Build passa sem erros

### 9. Modais de Edição de Vínculos (PRIORIDADE 1 - COMPLETO)
- ✅ `EditTripTravelerModal.tsx` criado
  - Editar grupo, segmentos, pagante, pode dirigir
  - Notas específicas da viagem
  - Botão "Desvincular" com confirmação integrada
- ✅ `EditTripVendorModal.tsx` criado
  - Marcar como favorito
  - Rating customizado (ou usar global)
  - Notas específicas da viagem
  - Botão "Desvincular" com confirmação integrada
- ✅ TravelerList: ao clicar no viajante, abre modal de configuração
- ✅ VendorList: ao clicar no fornecedor, abre modal de configuração

### 10. Criação Rápida de Perfis + Vinculação (PRIORIDADE 2 - COMPLETO)
- ✅ `QuickCreateTravelerModal.tsx` criado
  - Modal de criação rápida de perfil de viajante
  - Campos essenciais: nome, email, telefone, data nascimento
- ✅ `QuickCreateVendorModal.tsx` criado
  - Modal de criação rápida de perfil de fornecedor
  - Campos essenciais: nome, categorias, contato
- ✅ `LinkTravelersModal.tsx` atualizado
  - Botão "+ Criar Novo" integrado
  - Criação + vinculação automática
- ✅ `LinkVendorsModal.tsx` atualizado
  - Botão "+ Criar Novo" integrado
  - Criação + vinculação automática
- ✅ `TravelerList.tsx` atualizado
  - Botão "+ Criar Novo" no header
  - Empty state melhorado com dois botões
  - Função `handleQuickCreate` para vincular após criar
- ✅ `VendorList.tsx` atualizado
  - Botão "+ Criar Novo" no header
  - Empty state melhorado com dois botões
  - Função `handleQuickCreate` para vincular após criar
- ✅ Build passa sem erros TypeScript
- ✅ Fluxo completo: criar perfil → vincular automaticamente → ver na lista

### 11. Wizard de Viagem com Seleção de Perfis (PRIORIDADE 3 - COMPLETO)
- ✅ `TripWizard.tsx` atualizado com step 4 "Quem vai nessa viagem?"
  - Lista de `traveler_profiles` com busca
  - Multi-seleção com visual de checkbox
  - Contador de viajantes selecionados
  - Permite pular (0 viajantes selecionados)
  - Empty state quando não há perfis cadastrados
- ✅ `TripWizard.tsx` atualizado com step 5 "Fornecedores desta viagem (opcional)"
  - Lista de `vendor_profiles` com busca
  - Multi-seleção com visual de checkbox
  - Toggle "Marcar como favoritos desta viagem" (default ON)
  - Contador de fornecedores selecionados
  - Permite pular (0 fornecedores selecionados)
  - Empty state quando não há perfis cadastrados
- ✅ `TripList.tsx` atualizado
  - Processa `selectedTravelerIds` e `selectedVendorIds` do wizard
  - Cria vínculos em `td_trip_travelers` em lote após criar viagem
  - Cria vínculos em `td_trip_vendors` em lote com `preferred` baseado no toggle
  - Vinculação automática antes de abrir a viagem
- ✅ Ícone `Check` adicionado ao `constants.tsx`
- ✅ Build passa sem erros
- ✅ Fluxo completo: criar viagem → selecionar viajantes → selecionar fornecedores → abrir viagem com todos já vinculados

### 12. Migração do Domínio Financeiro para Perfis Globais (✅ COMPLETO)
- ✅ **Banco de Dados**:
  - Adicionado `vendor_profile_id` em `td_quotes` e `td_expenses`
  - Adicionado `source_type` ('link' | 'texto' | 'manual') para quotes/expenses sem fornecedor
  - Adicionado `source_value` (string) para armazenar a fonte
  - Criados índices para performance
  - Comentários de documentação adicionados
- ✅ **Tipos TypeScript**:
  - `Quote` e `Expense` interfaces atualizadas
  - Campos novos: `vendor_profile_id`, `source_type`, `source_value`
  - Campo legado `vendorId` marcado como DEPRECATED
- ✅ **QuoteWizard.tsx** - Completamente refatorado:
  - Removida dependência de `vendors` legados
  - Carrega fornecedores vinculados via `getTripVendors()`
  - Step 1 reescrito com duas opções:
    - Opção 1: Selecionar fornecedor vinculado (lista de td_trip_vendors)
    - Botão "+ Criar novo fornecedor" integrado com QuickCreateVendorModal
    - Opção 2: Sem fornecedor (informar fonte obrigatória)
    - Abas de fonte: Link | Texto | Manual
  - Validação: fornecedor OU fonte obrigatório (não permite ambos vazios)
  - Preview atualizado para mostrar fonte quando não há fornecedor
  - Checklist atualizado para validar fornecedor OU fonte
  - Build passa sem erros
- ✅ **supabaseDataProvider.ts** - Funções atualizadas:
  - `saveQuote()`: Persiste `vendor_profile_id`, `source_type`, `source_value`
  - Validação central: deve existir vendor_profile_id OU (source_type + source_value)
  - `saveExpense()`: Mesma lógica e validação
  - `closeQuoteToExpense()`: Copia vendor_profile_id e source_type/source_value da quote para expense
  - Mantém vendor_id legado por compatibilidade (marcado como DEPRECATED)
  - Build passa sem erros
- ✅ **ComparisonTool.tsx** - Conversão Quote→Expense atualizada:
  - `handleFinalize()` copia vendor_profile_id, source_type, source_value
  - Usa campos corretos: sourceQuoteId, amount, status 'confirmed'
  - Build passa sem erros
- ✅ **QuoteList.tsx** - Exibição atualizada:
  - Mostra nome do fornecedor quando vendor_profile_id existe
  - Mostra badge "Sem fornecedor" + ícone e tipo de fonte quando não há fornecedor
  - Ícones: 🔗 link, 📄 texto, ✍️ manual
- ✅ **ExpenseList.tsx** - Exibição atualizada:
  - Nova coluna "Fornecedor / Fonte"
  - Mostra "Fornecedor vinculado" quando vendor_profile_id existe
  - Mostra badge "Sem fornecedor" + ícone e tipo de fonte quando não há fornecedor
  - Ícones: 🔗 link, 📄 texto, ✍️ manual
- ✅ Build passa sem erros
- ✅ **Todos os fluxos de criação de quotes/expenses migrados**
- 📝 **Nota**: ExpenseDetailView é apenas visualização (não edita), migração completa

## ⚠️ PENDENTE (Próximos Passos - Opcional)

### 1. Migração de Dados Legados (PRIORIDADE 4)
- ❌ Script de migração de td_travelers → td_traveler_profiles
  - Deduplicar por email/phone/nome
  - Criar vínculos em td_trip_travelers
- ❌ Script de migração de td_vendors → td_vendor_profiles
  - Deduplicar por nome/legal_name
  - Criar vínculos em td_trip_vendors
- ❌ Garantir que referências históricas não quebrem

### 2. Limpeza de Código Legado (PRIORIDADE 4)
- ❌ Remover funções antigas do dataProvider (getTravelers, getVendors legados)
- ❌ Remover referências a td_travelers no código
- ❌ Remover referências a td_vendors no código
- ❌ Atualizar tipos TypeScript

### 3. Componentes Legados a Atualizar (Opcional)
- ❌ `TravelerDetailPage.tsx` - Adaptar para perfis globais (se necessário)
- ❌ `VendorDetailView.tsx` - Adaptar para perfis globais (se necessário)

## 📊 Modelo de Dados

### Antes (Legado)
```
td_trips (viagem)
  ├── td_travelers (viajantes por viagem) ❌ Duplicação
  ├── td_vendors (fornecedores por viagem) ❌ Duplicação
  ├── td_quotes (orçamentos)
  └── td_expenses (despesas)
```

### Depois (Novo)
```
td_traveler_profiles (perfis globais) ✅ Reutilizáveis
td_vendor_profiles (perfis globais) ✅ Reutilizáveis

td_trips (viagem)
  ├── td_trip_travelers (vínculos) ✅ Apenas referências
  ├── td_trip_vendors (vínculos) ✅ Apenas referências
  ├── td_quotes (orçamentos)
  └── td_expenses (despesas)
```

## 🎯 Benefícios

1. **Sem Recadastro**: Perfis criados uma vez, usados em todas as viagens
2. **Dados Centralizados**: Atualizar perfil atualiza em todas as viagens
3. **Histórico Preservado**: Viajantes não são deletados ao deletar viagem
4. **Flexibilidade**: Configurações específicas por viagem (segmentos, pagante)
5. **Escalabilidade**: Facilita gestão de múltiplas viagens

## 🚀 Como Usar (Fluxo Atual)

### Modo Geral
1. Abrir app → Dashboard Geral
2. Ir em "Viajantes" → Gerenciar perfis globais (criar, editar, arquivar)
3. Ir em "Fornecedores" → Gerenciar perfis globais (criar, editar, arquivar)
4. Ir em "Viagens" → Escolher viagem → Abrir

### Criar Nova Viagem (NOVO - Com Seleção de Viajantes e Fornecedores)
1. Dashboard Geral → "Viagens" → "+ Nova Viagem"
2. **Step 1**: Informações básicas (nome, datas)
3. **Step 2**: Destinos (adicionar múltiplos)
4. **Step 3**: Configurações (moeda, divisão, consenso)
5. **Step 4**: Selecionar viajantes (opcional)
   - Buscar e selecionar múltiplos perfis
   - Ou pular e adicionar depois
6. **Step 5**: Selecionar fornecedores (opcional)
   - Buscar e selecionar múltiplos perfis
   - Toggle para marcar como favoritos
   - Ou pular e adicionar depois
7. Criar → Viagem aberta com viajantes e fornecedores já vinculados

### Modo Viagem
1. Dashboard da Viagem (resumo, KPIs, checklist)
2. **Viajantes** → Ver viajantes vinculados (perfis globais)
   - Botão "+ Adicionar da minha lista" → Selecionar perfis existentes
   - Botão "+ Criar Novo" → Criar perfil e vincular automaticamente
   - Clicar no viajante → Configurar vínculo (segmentos, pagante, dirigir)
   - Botão "Desvincular" → Remove vínculo (mantém perfil global)
3. **Fornecedores** → Ver fornecedores vinculados (perfis globais)
   - Botão "+ Adicionar da minha lista" → Selecionar perfis existentes
   - Botão "+ Criar Novo" → Criar perfil e vincular automaticamente
   - Clicar no fornecedor → Configurar vínculo (favorito, rating, notas)
   - Botão "Desvincular" → Remove vínculo (mantém perfil global)
4. Orçamentos, Despesas, etc → Funcionam normalmente
5. Botão "Voltar ao Geral" → Fecha viagem e volta ao modo geral

### Fluxo de Vinculação (COMPLETO)
1. **Opção A - Durante criação da viagem**:
   - Wizard → Step 4 → Selecionar viajantes
   - Wizard → Step 5 → Selecionar fornecedores (marcar como favoritos)
   - Criar viagem → Todos já aparecem vinculados ao abrir

2. **Opção B - Adicionar da lista**:
   - Abrir viagem → Viajantes → "+ Adicionar da minha lista"
   - Selecionar múltiplos perfis (busca disponível)
   - Confirmar → Perfis vinculados à viagem

3. **Opção C - Criar novo e vincular**:
   - Abrir viagem → Viajantes → "+ Criar Novo"
   - Preencher dados do perfil → Salvar
   - Perfil criado e automaticamente vinculado à viagem

4. **Configurar vínculo**:
   - Clicar no viajante/fornecedor vinculado
   - Editar configurações específicas da viagem
   - Salvar ou desvincular

### Benefícios Já Disponíveis
- ✅ Perfis criados uma vez, reutilizados em todas as viagens
- ✅ Sem necessidade de recadastro ao trocar de viagem
- ✅ Desvincular não deleta o perfil global
- ✅ Busca e multi-seleção facilitam vinculação em lote
- ✅ Criação rápida dentro do fluxo da viagem
- ✅ Wizard de viagem já vincula viajantes E fornecedores automaticamente
- ✅ Fornecedores podem ser marcados como favoritos no wizard
- ✅ Empty states claros com múltiplas opções de ação

## 📝 Notas Técnicas

- Build passa sem erros ✅
- Sem erros de TypeScript ✅
- Modais customizados (sem window.confirm) ✅
- Políticas RLS configuradas ✅
- Exportação de supabaseUrl corrigida ✅
- Validação central de fornecedor/fonte implementada ✅

## 🎉 REFATORAÇÃO COMPLETA - TODAS AS PRIORIDADES IMPLEMENTADAS

### ✅ O que foi implementado:

1. **Estrutura de Perfis Globais**
   - Tabelas criadas e políticas RLS configuradas
   - Funções CRUD completas no supabaseDataProvider
   - Componentes de gerenciamento de perfis globais

2. **Modais de Vinculação (PRIORIDADE 1)**
   - LinkTravelersModal e LinkVendorsModal com busca e multi-seleção
   - Perfis já vinculados são automaticamente excluídos
   - Mensagens de sucesso e feedback visual

3. **Modais de Edição de Vínculos (PRIORIDADE 1)**
   - EditTripTravelerModal: configurar segmentos, pagante, dirigir, notas
   - EditTripVendorModal: configurar favorito, rating, notas
   - Botão "Desvincular" integrado com confirmação

4. **Criação Rápida + Vinculação (PRIORIDADE 2)**
   - QuickCreateTravelerModal e QuickCreateVendorModal
   - Integrados em LinkModals, TravelerList e VendorList
   - Fluxo: criar perfil → vincular automaticamente → ver na lista
   - Empty states melhorados com múltiplas opções

5. **Wizard de Viagem com Seleção (PRIORIDADE 3)**
   - Step 4 adicionado: "Quem vai nessa viagem?"
   - Step 5 adicionado: "Fornecedores desta viagem (opcional)"
   - Busca e multi-seleção de perfis
   - Toggle para marcar fornecedores como favoritos
   - Vinculação automática em lote ao criar viagem
   - Permite pular ambos os steps e adicionar depois

6. **Migração Financeira Completa (PRIORIDADES 1, 3, 4)**
   - Banco de dados atualizado: vendor_profile_id, source_type, source_value
   - Tipos TypeScript atualizados
   - QuoteWizard completamente refatorado:
     - Usa fornecedores vinculados (td_trip_vendors)
     - Permite criar novo fornecedor no fluxo
     - Permite quote sem fornecedor com fonte obrigatória
     - Validação: fornecedor OU fonte (não ambos vazios)
   - supabaseDataProvider com validação central
   - ComparisonTool atualizado para copiar vendor/fonte
   - QuoteList e ExpenseList exibem fornecedor ou fonte
   - Build passa sem erros

### 🚀 Fluxo Completo Funcionando:

**Cenário 1 - Criar viagem com viajantes e fornecedores**:
1. Dashboard Geral → Nova Viagem
2. Preencher dados → Selecionar viajantes no step 4
3. Selecionar fornecedores no step 5 (marcar como favoritos)
4. Criar → Viagem aberta com todos já vinculados

**Cenário 2 - Adicionar viajante existente**:
1. Abrir viagem → Viajantes → "+ Adicionar da minha lista"
2. Selecionar perfis → Confirmar
3. Clicar no viajante → Configurar vínculo

**Cenário 3 - Criar novo viajante/fornecedor na viagem**:
1. Abrir viagem → Viajantes/Fornecedores → "+ Criar Novo"
2. Preencher dados → Salvar
3. Perfil criado e vinculado automaticamente

**Cenário 4 - Gerenciar perfis globais**:
1. Dashboard Geral → Viajantes/Fornecedores
2. Criar, editar ou arquivar perfis
3. Perfis disponíveis para todas as viagens

**Cenário 5 - Criar quote com fornecedor**:
1. Abrir viagem → Orçamentos → Nova Cotação
2. Selecionar fornecedor vinculado (ou criar novo)
3. Preencher dados → Salvar
4. Quote salvo com vendor_profile_id

**Cenário 6 - Criar quote sem fornecedor**:
1. Abrir viagem → Orçamentos → Nova Cotação
2. Escolher "Sem fornecedor"
3. Selecionar tipo de fonte (Link/Texto/Manual)
4. Preencher fonte → Salvar
5. Quote salvo com source_type e source_value

**Cenário 7 - Fechar quote e criar expense**:
1. Quote aprovada → Fechar orçamento
2. Expense criado automaticamente
3. Expense herda vendor_profile_id ou source_type/source_value
4. Aparece na lista com fornecedor ou fonte

### 📊 Impacto:

- **UX melhorada**: Fluxo contínuo sem sair do contexto da viagem
- **Sem duplicação**: Perfis reutilizáveis em todas as viagens
- **Flexibilidade**: Configurações específicas por viagem
- **Produtividade**: Criação rápida + vinculação automática
- **Onboarding**: Wizard já vincula viajantes e fornecedores na criação
- **Favoritos**: Fornecedores podem ser marcados como favoritos desde o wizard
- **Rastreabilidade**: Quotes/expenses sempre têm fornecedor OU fonte
- **Validação**: Impossível salvar sem fornecedor e sem fonte

## 📊 Prints Mentais - Como Ficou a Listagem

### QuoteList - Exemplo de Linhas:

**Linha com fornecedor:**
```
┌─────────────────────────────────────┐
│ [Hospedagem] [Aprovada]             │
│ HOTEL DISNEY CONTEMPORARY           │
│ Disney Parks & Resorts              │ ← Nome do fornecedor (vendor_profile)
│                                     │
│ R$ 15.420,00                        │
│ TOTAL CALCULADO                     │
└─────────────────────────────────────┘
```

**Linha sem fornecedor (com fonte - Link):**
```
┌─────────────────────────────────────┐
│ [Voo] [Em análise]                  │
│ VOO IDA - LATAM PREMIUM             │
│ [Sem fornecedor] 🔗 link            │ ← Badge + ícone + tipo
│                                     │
│ R$ 8.500,00                         │
│ TOTAL CALCULADO                     │
└─────────────────────────────────────┘
```

**Linha sem fornecedor (com fonte - Texto):**
```
┌─────────────────────────────────────┐
│ [Restaurante] [Novo]                │
│ JANTAR ESPECIAL EPCOT               │
│ [Sem fornecedor] 📄 texto           │ ← Badge + ícone + tipo
│                                     │
│ R$ 1.200,00                         │
│ TOTAL CALCULADO                     │
└─────────────────────────────────────┘
```

**Linha sem fornecedor (com fonte - Manual):**
```
┌─────────────────────────────────────┐
│ [Diversos] [Novo]                   │
│ GORJETAS E EXTRAS                   │
│ [Sem fornecedor] ✍️ manual          │ ← Badge + ícone + tipo
│                                     │
│ R$ 500,00                           │
│ TOTAL CALCULADO                     │
└─────────────────────────────────────┘
```

### ExpenseList - Exemplo de Linhas na Tabela:

**Linha com fornecedor:**
```
| Título / Segmento    | Categoria    | Fornecedor / Fonte      | Valor Total  | Status      |
|---------------------|--------------|-------------------------|--------------|-------------|
| Hotel Contemporary  | Hospedagem   | Fornecedor vinculado    | R$ 15.420,00 | [PAID]      |
| Orlando             |              | Disney Parks & Resorts  |              |             |
```

**Linha sem fornecedor (com fonte - Link):**
```
| Título / Segmento    | Categoria    | Fornecedor / Fonte           | Valor Total  | Status      |
|---------------------|--------------|------------------------------|--------------|-------------|
| Voo Ida LATAM       | Voo          | [Sem fornecedor] 🔗 link     | R$ 8.500,00  | [CONFIRMED] |
| Geral               |              |                              |              |             |
```

**Linha sem fornecedor (com fonte - Texto):**
```
| Título / Segmento    | Categoria    | Fornecedor / Fonte           | Valor Total  | Status      |
|---------------------|--------------|------------------------------|--------------|-------------|
| Jantar Epcot        | Restaurante  | [Sem fornecedor] 📄 texto    | R$ 1.200,00  | [PLANNED]   |
| Orlando             |              |                              |              |             |
```

**Linha sem fornecedor (com fonte - Manual):**
```
| Título / Segmento    | Categoria    | Fornecedor / Fonte           | Valor Total  | Status      |
|---------------------|--------------|------------------------------|--------------|-------------|
| Gorjetas            | Diversos     | [Sem fornecedor] ✍️ manual   | R$ 500,00    | [PLANNED]   |
| Geral               |              |                              |              |             |
```

### Detalhes Visuais:

- **Badge "Sem fornecedor"**: Fundo cinza escuro, texto cinza claro, borda sutil
- **Ícones de fonte**:
  - 🔗 = Link (fonte externa via URL)
  - 📄 = Texto (cotação colada/copiada)
  - ✍️ = Manual (informação digitada manualmente)
- **Fornecedor vinculado**: Mostra nome do perfil global, sem badge
- **Consistência**: Mesmo visual em QuoteList e ExpenseList

### 🎯 Próximos Passos (Opcional):

1. **Migração de Dados**: Script para migrar td_travelers/td_vendors legados
2. **Limpeza**: Remover código e tabelas legadas após validação
3. **Componentes Legados**: Atualizar TravelerDetailPage, VendorDetailView se necessário
