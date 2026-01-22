# ✅ FEATURE COMPLETA: Regras de Split por Despesa

## 📋 Resumo

Sistema completo que permite configurar, por despesa, como o valor será dividido entre os participantes da viagem, com controle granular de quem participa e como.

## 🎯 Funcionalidades Implementadas

### 1. Modos de Divisão (Split Mode)
- **Por Casal** (`by_couple`): Divide igualmente entre casais/grupos
- **Por Pessoa** (`per_person`): Divide igualmente entre pessoas
- **Custom** (`custom`): Permite edição manual dos valores

### 2. Modos de Participação (Participation Mode)
- **Herdar da viagem** (`inherit`): Usa configuração padrão da viagem
- **Todos** (`all`): Inclui todos com `count_in_split = true`
- **Só pagantes** (`paying_only`): Inclui apenas `is_payer = true` e `count_in_split = true`
- **Manual** (`manual`): Seleção customizada de viajantes ou casais

### 3. Controle por Viajante
- **`count_in_split`**: Define se o viajante entra na divisão por pessoa
- **`is_payer`**: Define se o viajante é pagante (usado no modo `paying_only`)
- **`couple_id`**: Agrupa viajantes em casais para divisão `by_couple`

## 🗄️ Estrutura de Banco de Dados

### Tabelas Modificadas

**td_trips** (padrões da viagem):
```sql
default_split_mode: 'by_couple' | 'per_person' | 'custom'
default_participation_mode: 'all' | 'paying_only'
```

**td_expenses** (override por despesa):
```sql
split_mode: 'by_couple' | 'per_person' | 'custom' (nullable, herda da viagem)
participation_mode: 'inherit' | 'all' | 'paying_only' | 'manual'
include_children_default: boolean (sugestão de UI, não é fonte da verdade)
```

**td_trip_travelers** (controle de participação):
```sql
count_in_split: boolean (se entra na divisão por pessoa)
is_payer: boolean (se é pagante)
couple_id: uuid (grupo/casal)
```

**td_expense_splits** (fonte da verdade):
```sql
trip_id: uuid
trip_traveler_id: uuid (quando split por pessoa)
couple_id: uuid (quando split por casal)
participant_type: 'traveler' | 'couple'
amount_brl: numeric
```

### Constraints
- `participant_type = 'traveler'` → `trip_traveler_id NOT NULL`
- `participant_type = 'couple'` → `couple_id NOT NULL`
- `amount >= 0`

## 🔧 Backend

### Função Principal: `recalculateExpenseSplits()`

**Localização**: `lib/supabaseDataProvider.ts`

**Parâmetros**:
```typescript
recalculateExpenseSplits(
  expenseId: string,
  opts?: {
    splitMode?: 'by_couple' | 'per_person' | 'custom';
    participationMode?: 'inherit' | 'all' | 'paying_only' | 'manual';
    manualSelectedTripTravelerIds?: string[];
    manualSelectedCoupleIds?: string[];
  }
)
```

**Fluxo**:
1. Carrega expense + trip defaults
2. Determina `effectiveSplitMode` (expense.split_mode ?? trip.default_split_mode)
3. Determina `effectiveParticipationMode` (resolve `inherit`)
4. Carrega participantes (trip_travelers + couples)
5. Deleta splits antigos
6. Gera novos splits conforme regras
7. Insere em lote
8. Retorna resumo

**Regras de Cálculo**:

**Per Person**:
- Filtra viajantes por `count_in_split` e/ou `is_payer` conforme modo
- Divide `expense.amount_brl / N`
- Cria N splits do tipo `traveler`

**By Couple**:
- Deriva casais por `couple_id`
- Viajantes sem `couple_id` não entram (warning na UI)
- Divide `expense.amount_brl / M`
- Cria M splits do tipo `couple`

**Custom**:
- Não recalcula automaticamente
- UI gerencia splits manualmente

## 🎨 Componentes UI

### 1. ExpenseSplitRulesPanel.tsx
**Localização**: `components/expense/ExpenseSplitRulesPanel.tsx`

**Props**:
```typescript
{
  tripId: string;
  expenseId: string;
  expenseTotal: number;
  currentSplitMode?: SplitMode | null;
  currentParticipationMode: ParticipationMode;
  onUpdated?: () => void;
}
```

**Funcionalidades**:
- Radio buttons para modo de split
- Radio buttons para modo de participação
- Resumo inteligente do estado atual
- Warnings contextuais (ex: viajantes sem grupo)
- Botão "Recalcular split" com loading
- Modal de confirmação ao sobrescrever custom
- Toasts de sucesso
- Mensagens de erro inline

### 2. ManualTravelerPicker.tsx
**Localização**: `components/expense/ManualTravelerPicker.tsx`

**Funcionalidades**:
- Busca de viajantes
- Multi-seleção com checkboxes
- Botões "Selecionar todos" / "Limpar"
- Contador de selecionados
- Exibe: tipo, pagante, count_in_split

### 3. ManualCouplePicker.tsx
**Localização**: `components/expense/ManualCouplePicker.tsx`

**Funcionalidades**:
- Lista de casais com membros
- Multi-seleção
- Contador de selecionados

### 4. CustomSplitEditor.tsx
**Localização**: `components/expense/CustomSplitEditor.tsx`

**Funcionalidades**:
- Tabela editável de splits
- Adicionar/remover participantes (viajante ou casal)
- Editar valores individuais
- Resumo: total, soma atual, diferença (verde/vermelho)
- Validação: soma = total (tolerância 0.01)
- Botão "Ajustar automaticamente" (divide igualmente)
- Salva diretamente em `td_expense_splits`
- Mensagens de erro inline

## 🔗 Integração

### ExpenseDetailView.tsx
**Localização**: `components/ExpenseDetailView.tsx`

O `ExpenseSplitRulesPanel` foi integrado na aba "Splits", acima da tabela de splits existente:

```tsx
{activeTab === 'split' && (
  <div className="space-y-6">
    <ExpenseSplitRulesPanel
      tripId={trip.id}
      expenseId={expense.id}
      expenseTotal={expense.amountBrl}
      currentSplitMode={expense.splitMode}
      currentParticipationMode={expense.participationMode || ParticipationMode.INHERIT}
      onUpdated={() => {
        loadData();
        onRefresh();
      }}
    />
    
    {/* Tabela de splits existente */}
  </div>
)}
```

## 📊 Demonstração (Reset Demo)

O `resetDemo()` foi atualizado para demonstrar os diferentes modos:

**Expense 1 - Ingressos Disney**:
- `split_mode: 'by_couple'`
- `participation_mode: 'all'`
- Resultado: 3 splits (R$ 1.400 por casal)

**Expense 2 - Aluguel Carro**:
- `split_mode: 'by_couple'`
- `participation_mode: 'all'`
- Resultado: 3 splits (R$ 1.000 por casal)

**Expense 3 - Seguro Viagem**:
- `split_mode: 'per_person'`
- `participation_mode: 'all'`
- Resultado: 7 splits (R$ 121,43 por pessoa)
  - Casal 1: 2 pessoas = R$ 242,86
  - Casal 2: 3 pessoas (incluindo criança) = R$ 364,29
  - Casal 3: 2 pessoas = R$ 242,86

## ✅ Checklist de Teste

1. ✅ Expense per_person + all → criança entra (se count_in_split=true)
2. ✅ Mudar para manual e desmarcar criança → recalcular → valores mudam
3. ✅ Mudar para paying_only → recalcular → só pagantes entram
4. ✅ Mudar para by_couple → 3 splits de casal
5. ✅ Custom → editar → soma bate com total
6. ✅ Trocar custom → per_person → pede confirmação
7. ✅ Warning by_couple com viajante sem grupo aparece

## 🎯 Casos de Uso

### Caso 1: Ingressos (criança paga)
- Modo: `per_person`
- Participação: `all`
- Resultado: Divide entre todos (incluindo criança)

### Caso 2: Casa/Hotel (criança não paga)
- Modo: `per_person`
- Participação: `paying_only` ou `manual` (sem criança)
- Resultado: Divide apenas entre adultos pagantes

### Caso 3: Carro (por casal)
- Modo: `by_couple`
- Participação: `all`
- Resultado: Divide igualmente entre casais (independente de criança)

### Caso 4: Seguro (por pessoa, todos)
- Modo: `per_person`
- Participação: `all`
- Resultado: Divide entre todos que têm `count_in_split=true`

### Caso 5: Despesa específica (custom)
- Modo: `custom`
- Resultado: Valores editados manualmente, validação de soma

## 🚀 Status

✅ **Backend**: 100% implementado e testado
✅ **Frontend**: 100% implementado e integrado
✅ **UX**: Sem window.confirm/alert, validações inline, feedback visual
✅ **Build**: Passa sem erros
✅ **Demo**: Atualizado com exemplos funcionais

## 📝 Notas Técnicas

- **Fonte da verdade**: `td_expense_splits` sempre contém os valores finais
- **count_in_split**: Controla se viajante entra na divisão (independente de is_payer)
- **is_payer**: Usado apenas no modo `paying_only`
- **couple_id**: Agrupa viajantes para divisão `by_couple`
- **Validação**: Soma dos splits deve = total da despesa (tolerância 0.01)
- **Warnings**: Aparecem apenas quando relevante (ex: viajantes sem grupo)

## 🔄 Próximos Passos (Opcional)

- [ ] Adicionar histórico de mudanças de split
- [ ] Permitir templates de split (salvar configurações)
- [ ] Exportar relatório de splits por viajante
- [ ] Gráficos visuais de distribuição

---

**Data de Implementação**: Janeiro 2026
**Status**: ✅ Completo e Funcional
