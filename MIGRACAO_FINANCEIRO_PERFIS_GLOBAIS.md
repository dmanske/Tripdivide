# Migração do Domínio Financeiro para Perfis Globais

## Status: Em Progresso

## Objetivo
Migrar Quotes e Expenses para usar `vendor_profile_id` (perfis globais) ao invés de `vendor_id` (legado), e permitir quotes/expenses sem fornecedor com fonte obrigatória.

## ✅ Concluído

### 1. Banco de Dados
- ✅ Adicionado `vendor_profile_id` em `td_quotes` e `td_expenses`
- ✅ Adicionado `source_type` ('link' | 'texto' | 'manual')
- ✅ Adicionado `source_value` (string)
- ✅ Criados índices para performance
- ✅ Comentários de documentação adicionados

### 2. Tipos TypeScript
- ✅ `Quote` interface atualizada:
  - `vendor_profile_id?: string` (novo)
  - `source_type?: 'link' | 'texto' | 'manual'`
  - `source_value?: string`
  - `vendorId?: string` (marcado como DEPRECATED)
- ✅ `Expense` interface atualizada:
  - `vendor_profile_id?: string` (novo)
  - `source_type?: 'link' | 'texto' | 'manual'`
  - `source_value?: string`
  - `vendorId?: string` (marcado como DEPRECATED)

### 3. QuoteWizard (components/QuoteWizard.tsx)
- ✅ Props atualizadas: removido `vendors: Vendor[]`
- ✅ Imports adicionados: `supabaseDataProvider`, `QuickCreateVendorModal`
- ✅ Estados adicionados: `tripVendors`, `hasVendor`, `sourceType`, `sourceValue`, `isQuickCreateOpen`
- ✅ useEffect para carregar fornecedores vinculados via `getTripVendors()`
- ✅ Cálculo de completude atualizado para validar fornecedor OU fonte
- ✅ Step 1 reescrito com opção fornecedor/fonte:
  - Radio button: "Selecionar fornecedor vinculado"
  - Select de fornecedores vinculados (td_trip_vendors)
  - Botão "+ Criar novo fornecedor"
  - Radio button: "Sem fornecedor (informar fonte)"
  - Abas: Link | Texto | Manual
  - Campos de fonte conforme tipo selecionado
- ✅ QuickCreateVendorModal integrado
- ✅ Preview atualizado para mostrar fonte quando não há fornecedor
- ✅ Checklist atualizado para validar fornecedor OU fonte
- ✅ Build passa sem erros

### 4. supabaseDataProvider.ts (PRIORIDADE 1 - COMPLETO)
- ✅ **saveQuote()** atualizado:
  - Persiste `vendor_profile_id`, `source_type`, `source_value`
  - Validação central: deve existir vendor_profile_id OU (source_type + source_value)
  - Lança erro se ambos estiverem vazios
  - Mantém vendor_id por compatibilidade (DEPRECATED)
- ✅ **saveExpense()** atualizado:
  - Mesma lógica e validação do saveQuote
  - Persiste `vendor_profile_id`, `source_type`, `source_value`
  - Validação central implementada
- ✅ **closeQuoteToExpense()** atualizado (PRIORIDADE 3):
  - Copia `vendor_profile_id` da quote para expense
  - Copia `source_type` e `source_value` quando não há fornecedor
  - Garante consistência: expense sempre tem fornecedor OU fonte
- ✅ Build passa sem erros

### 5. ComparisonTool.tsx (PRIORIDADE 3 - COMPLETO)
- ✅ **handleFinalize()** atualizado:
  - Copia `vendor_profile_id`, `source_type`, `source_value` da quote para expense
  - Usa `sourceQuoteId` ao invés de `quoteId`
  - Usa `amount` ao invés de `value`
  - Status correto: 'confirmed'
  - Remove campo `splits` (criado automaticamente pelo backend)
- ✅ Build passa sem erros

## 🚧 Pendente

### 5. ExpenseDetailView (PRIORIDADE 2)

**Mudanças necessárias:**

1. **Props**: Remover `vendors: Vendor[]`, adicionar `tripId: string`
2. **Estado**: Adicionar campos de fonte
   ```tsx
   const [hasVendor, setHasVendor] = useState(true);
   const [sourceType, setSourceType] = useState<'link' | 'texto' | 'manual'>('link');
   const [sourceValue, setSourceValue] = useState('');
   const [tripVendors, setTripVendors] = useState<any[]>([]);
   const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
   ```

3. **useEffect**: Carregar fornecedores vinculados
   ```tsx
   useEffect(() => {
     loadTripVendors();
   }, []);
   
   const loadTripVendors = async () => {
     const vendors = await supabaseDataProvider.getTripVendors(tripId);
     setTripVendors(vendors);
   };
   ```

4. **Step 1 - Fornecedor**: Substituir select de vendors por:
   ```tsx
   <div className="space-y-3">
     <label className="flex items-center gap-2">
       <input type="radio" checked={hasVendor} onChange={() => setHasVendor(true)} />
       <span>Selecionar fornecedor vinculado</span>
     </label>
     
     {hasVendor && (
       <div className="space-y-2">
         <select value={formData.vendor_profile_id} onChange={...}>
           <option value="">Selecione...</option>
           {tripVendors.map(tv => (
             <option key={tv.id} value={tv.profile.id}>
               {tv.profile.name}
             </option>
           ))}
         </select>
         <Button onClick={() => setIsQuickCreateOpen(true)}>
           + Criar novo fornecedor
         </Button>
       </div>
     )}
     
     <label className="flex items-center gap-2">
       <input type="radio" checked={!hasVendor} onChange={() => setHasVendor(false)} />
       <span>Sem fornecedor (informar fonte)</span>
     </label>
     
     {!hasVendor && (
       <div className="space-y-3">
         <div className="flex gap-2">
           <button onClick={() => setSourceType('link')}>Link</button>
           <button onClick={() => setSourceType('texto')}>Texto</button>
           <button onClick={() => setSourceType('manual')}>Manual</button>
         </div>
         
         {sourceType === 'link' && (
           <Input 
             label="URL da Fonte *" 
             value={sourceValue}
             onChange={e => setSourceValue(e.target.value)}
             placeholder="https://..."
           />
         )}
         
         {sourceType === 'texto' && (
           <textarea 
             placeholder="Cole o texto da cotação aqui..."
             value={sourceValue}
             onChange={e => setSourceValue(e.target.value)}
           />
         )}
         
         {sourceType === 'manual' && (
           <Input 
             label="Descrição da Fonte *"
             value={sourceValue}
             onChange={e => setSourceValue(e.target.value)}
             placeholder="Ex: Cotação por telefone, WhatsApp, etc"
           />
         )}
       </div>
     )}
   </div>
   ```

5. **Validação**: Atualizar regra de completude
   ```tsx
   const completeness = useMemo(() => {
     const hasVendorOrSource = formData.vendor_profile_id || 
       (formData.source_type && formData.source_value);
     
     const rules = {
       base: !!(q.title && q.category && hasVendorOrSource && q.totalAmount && ...),
       // ... resto
     };
   }, [formData]);
   ```

6. **onSave**: Passar campos corretos
   ```tsx
   const handleSave = () => {
     const quoteData = {
       ...formData,
       vendor_profile_id: hasVendor ? formData.vendor_profile_id : null,
       source_type: !hasVendor ? sourceType : null,
       source_value: !hasVendor ? sourceValue : null,
       vendorId: undefined // Remover campo legado
     };
     onSave(quoteData);
   };
   ```

7. **QuickCreateVendorModal**: Adicionar modal
   ```tsx
   {isQuickCreateOpen && (
     <QuickCreateVendorModal
       onClose={() => setIsQuickCreateOpen(false)}
       onCreated={async (profileId) => {
         await supabaseDataProvider.linkVendorToTrip(tripId, profileId);
         await loadTripVendors();
         setFormData({...formData, vendor_profile_id: profileId});
         setIsQuickCreateOpen(false);
       }}
     />
   )}
   ```

### 7. Limpeza de Legado (PRIORIDADE 5) - PENDENTE

**Arquivos a atualizar:**

1. ⏳ Remover referências a `vendor_id` legado nos componentes UI
2. ⏳ Remover joins/uso de `td_vendors` legados
3. ⏳ Atualizar tipos e props para usar apenas `vendor_profile_id`
4. ⏳ Considerar deprecar tabela `td_vendors` após migração de dados

## Regras de Validação

1. **Quote/Expense SEM fornecedor**:
   - `vendor_profile_id` = null
   - `source_type` obrigatório
   - `source_value` obrigatório

2. **Quote/Expense COM fornecedor**:
   - `vendor_profile_id` obrigatório
   - `source_type` = null
   - `source_value` = null

3. **Não permitir salvar**:
   - Sem fornecedor E sem fonte
   - Com fornecedor E com fonte (escolher um ou outro)

## Fluxo de Uso

### Cenário 1: Quote com fornecedor vinculado
1. Criar quote → Selecionar fornecedor da lista
2. Preencher dados → Salvar
3. Quote salvo com `vendor_profile_id`

### Cenário 2: Quote sem fornecedor (fonte externa)
1. Criar quote → "Sem fornecedor"
2. Escolher tipo de fonte (Link/Texto/Manual)
3. Preencher fonte → Salvar
4. Quote salvo com `source_type` e `source_value`

### Cenário 3: Criar fornecedor durante quote
1. Criar quote → "Selecionar fornecedor"
2. Clicar "+ Criar novo fornecedor"
3. Preencher dados → Salvar
4. Fornecedor criado, vinculado à viagem e selecionado automaticamente
5. Continuar preenchendo quote → Salvar

### Cenário 4: Converter quote para expense
1. Quote fechada → Converter para expense
2. Expense herda `vendor_profile_id` ou `source_type`/`source_value`
3. Mantém rastreabilidade da fonte

## Próximos Passos

1. ✅ Banco de dados atualizado
2. ✅ Tipos TypeScript atualizados
3. ✅ QuoteWizard atualizado
4. ✅ supabaseDataProvider atualizado (saveQuote, saveExpense, closeQuoteToExpense)
5. ✅ ComparisonTool atualizado
6. ✅ QuoteList e ExpenseList atualizados
7. ⏳ ExpenseDetailView (apenas se implementar edição futura)
8. ⏳ Testar fluxos completos em produção
9. ⏳ Remover referências a `vendor_id` legado (limpeza opcional)
