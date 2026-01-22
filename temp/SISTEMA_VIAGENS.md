# Sistema de Gerenciamento de Viagens - TripDivide

## ✅ Implementação Completa

### 1. Menu "Viagens" (Minhas Viagens)

**Localização:** Sidebar → Item "Viagens"

**Funcionalidades:**
- Lista todas as viagens do usuário (ativas e arquivadas)
- Seção separada para rascunhos
- Cada viagem mostra:
  - Nome da viagem
  - Datas (ida e volta) + duração em dias
  - Destinos
  - Status (Ativa, Arquivada, Rascunho)
  
**Ações disponíveis:**
- **Abrir:** Define a viagem como ativa e navega para o dashboard
- **Duplicar:** Cria uma cópia da viagem como rascunho
- **Arquivar:** Move viagem ativa para arquivadas
- **Excluir:** Remove viagem arquivada (com confirmação inline via Modal)

---

### 2. Trip Switcher (Seletor de Viagem)

**Localização:** Header do sidebar (abaixo do logo TripDivide)

**Funcionalidades:**
- Mostra a viagem atualmente ativa
- Dropdown com lista de todas as viagens (ativas e rascunhos)
- Botão "+ Nova Viagem" no dropdown
- Trocar viagem ativa recarrega todo o app com dados da nova viagem

**Comportamento:**
- Ao trocar viagem: filtra automaticamente quotes/expenses/payments/settlement
- Viagem ativa é persistida no banco (tabela `td_user_active_trip`)
- Ao reabrir o app, carrega automaticamente a última viagem ativa

---

### 3. Fluxo "Criar Viagem" (Wizard)

**Passo 1: Informações Básicas**
- Nome da viagem
- Data de ida
- Data de volta

**Passo 2: Destinos**
- Adicionar múltiplos destinos
- Remover destinos
- Suporte a Enter/Esc

**Passo 3: Configurações**
- Moeda base (BRL, USD, EUR)
- Taxa de câmbio padrão
- Regra padrão de divisão (igual, percentual, por pessoa)
- Regra de consenso (2/3 ou unanimidade)

**Ao salvar:**
- Viagem é criada com status "active"
- Automaticamente definida como viagem ativa
- Cria grupo padrão "Grupo Principal"
- Cria segmento padrão "Geral"
- Navega para Dashboard da viagem

---

### 4. Rascunhos

**Quando aparece:**
- Viagens com status "draft" aparecem em seção separada
- Mostram badge "RASCUNHO" em amarelo

**Ações:**
- **Finalizar:** Abre wizard para preencher nome/datas/destinos e muda status para "active"
- **Descartar:** Exclui o rascunho (com confirmação inline)

---

## 🗄️ Estrutura do Banco de Dados

### Tabela `td_trips` (atualizada)

```sql
- status: 'draft' | 'active' | 'archived'
- destinations: TEXT[] (array de destinos)
- base_currency: TEXT (moeda base)
- default_exchange_rate: NUMERIC (taxa de câmbio padrão)
- default_split_rule: TEXT (regra de divisão padrão)
```

### Tabela `td_user_active_trip` (nova)

```sql
- user_id: UUID (FK para auth.users)
- active_trip_id: UUID (FK para td_trips)
- updated_at: TIMESTAMPTZ
```

**Políticas RLS:**
- ✅ Users can view their own active trip
- ✅ Users can update their own active trip

---

## 🔄 Fluxo de Dados

### Ao abrir o app:
1. Busca viagem ativa do usuário (`td_user_active_trip`)
2. Se não houver, busca primeira viagem ativa
3. Carrega dados da viagem (couples, segments, vendors, quotes, expenses)
4. Renderiza dashboard com dados filtrados

### Ao trocar viagem:
1. Atualiza `td_user_active_trip` com novo trip_id
2. Recarrega todos os dados da nova viagem
3. Reseta view para dashboard
4. Todos os filtros são aplicados automaticamente

### Ao criar viagem:
1. Insere nova viagem no banco
2. Define como viagem ativa automaticamente
3. Cria estruturas padrão (grupo + segmento)
4. Navega para dashboard

---

## 📍 Onde a viagem aparece depois de criada

### 1. Trip Switcher (Header)
- Aparece imediatamente no dropdown
- Já vem selecionada como ativa
- Badge "Viagem Ativa" mostra o nome

### 2. Menu "Viagens"
- Aparece na lista de viagens ativas
- Mostra todas as informações (datas, destinos, etc)

### 3. Dashboard
- Todos os dados são filtrados pela viagem ativa
- Quotes, expenses, payments, settlement mostram apenas dados desta viagem

---

## ✅ Validação do Fluxo

**Teste 1: Criar viagem → vira ativa**
1. Clicar "+ Nova Viagem"
2. Preencher wizard (3 passos)
3. Salvar
4. ✅ Viagem aparece no Trip Switcher como ativa
5. ✅ Dashboard mostra dados da nova viagem

**Teste 2: Criar orçamento já entra na viagem ativa**
1. Com viagem ativa selecionada
2. Criar novo orçamento
3. ✅ Orçamento é criado com `trip_id` da viagem ativa
4. ✅ Aparece na lista de orçamentos filtrada

**Teste 3: Trocar viagem filtra tudo**
1. Criar 2 viagens com dados diferentes
2. Trocar entre elas no Trip Switcher
3. ✅ Quotes/Expenses/Payments mudam automaticamente
4. ✅ Dashboard atualiza contadores

---

## 🎨 Componentes Criados

1. **TripList.tsx** - Lista de viagens com ações
2. **TripWizard.tsx** - Wizard de criação (3 passos)
3. **TripSwitcher.tsx** - Dropdown de seleção no header
4. **Layout.tsx** - Atualizado para incluir TripSwitcher
5. **App.tsx** - Atualizado para gerenciar viagem ativa

---

## 🔐 Segurança (RLS)

Todas as políticas seguem as regras de segurança:
- ✅ Verificam `auth.uid() = user_id`
- ✅ Não usam `true` sem restrição
- ✅ Políticas para SELECT, INSERT, UPDATE, DELETE
- ✅ RLS habilitado em todas as tabelas

---

## 🚀 Próximos Passos (Opcional)

- [ ] Compartilhar viagem com outros usuários
- [ ] Exportar viagem para PDF
- [ ] Templates de viagem
- [ ] Histórico de mudanças
- [ ] Notificações de vencimento
