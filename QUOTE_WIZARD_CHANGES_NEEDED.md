# Mudanças Necessárias no QuoteWizard

## Resumo
O QuoteWizard precisa ser atualizado para usar `vendor_profile_id` (perfis globais) ao invés de `vendor_id` legado, e permitir quotes sem fornecedor com fonte obrigatória.

## Mudanças Específicas

### 1. Props Interface (linha 6-11)
```tsx
// ANTES:
interface QuoteWizardProps {
  trip: Trip;
  vendors: Vendor[];  // ❌ REMOVER
  initialData?: Partial<Quote>;
  onSave: (quote: Quote) => void;
  onCancel: () => void;
}

// DEPOIS:
interface QuoteWizardProps {
  trip: Trip;
  initialData?: Partial<Quote>;
  onSave: (quote: Quote) => void;
  onCancel: () => void;
}
```

### 2. Imports (linha 1-3)
```tsx
// ADICIONAR:
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import QuickCreateVendorModal from './QuickCreateVendorModal';
```

### 3. Estado do Componente (após linha 13)
```tsx
// ADICIONAR novos estados:
const [tripVendors, setTripVendors] = useState<any[]>([]);
const [hasVendor, setHasVendor] = useState(!!initialData?.vendor_profile_id);
const [sourceType, setSourceType] = useState<'link' | 'texto' | 'manual'>(initialData?.source_type || 'link');
const [sourceValue, setSourceValue] = useState(initialData?.source_value || '');
const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
```

### 4. useEffect para carregar fornecedores (após estados)
```tsx
// ADICIONAR:
useEffect(() => {
  loadTripVendors();
}, []);

const loadTripVendors = async () => {
  try {
    const vendors = await supabaseDataProvider.getTripVendors(trip.id);
    setTripVendors(vendors);
  } catch (error) {
    console.error('Erro ao carregar fornecedores:', error);
  }
};
```

### 5. Atualizar Cálculo de Completude (linha 38-48)
```tsx
// SUBSTITUIR a regra 'base':
const completeness = useMemo(() => {
  const q = formData;
  const hasVendorOrSource = q.vendor_profile_id || (q.source_type && q.source_value);
  
  const rules: Record<string, boolean> = {
    base: !!(q.title && q.category && hasVendorOrSource && q.totalAmount && q.validUntil && q.cancellationPolicy),
    hotel: q.category === 'Hospedagem' ? !!(q.hotelDetails?.checkin && q.hotelDetails?.checkout) : true,
    ticket: q.category === 'Ingressos/Atrações' ? !!(q.ticketDetails?.kind) : true,
    car: q.category === 'Aluguel de Carro' ? !!(q.carDetails?.pickupDateTime) : true,
  };
  
  const totalRules = Object.keys(rules).length;
  const passed = Object.values(rules).filter(Boolean).length;
  return Math.round((passed / totalRules) * 100);
}, [formData]);
```

### 6. Substituir Step 1 - Fornecedor (linha 90-105)
```tsx
// SUBSTITUIR TODO O BLOCO do Step 1 por:
case 1: return (
  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
    <Input 
      label="Título do Orçamento *" 
      value={formData.title} 
      onChange={e => setFormData({...formData, title: e.target.value})} 
      placeholder="Ex: Voo Ida - LATAM Premium" 
    />
    
    <div className="grid grid-cols-2 gap-4">
      <Input as="select" label="Categoria *" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
        {trip.categories.map(c => <option key={c} value={c}>{c}</option>)}
      </Input>
      <Input as="select" label="Segmento" value={formData.segmentId} onChange={e => setFormData({...formData, segmentId: e.target.value})}>
        <option value="seg-all">Geral (Toda Viagem)</option>
        {trip.segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Input>
    </div>

    {/* NOVO: Seleção de Fornecedor ou Fonte */}
    <div className="space-y-3 p-4 bg-gray-950 rounded-xl border border-gray-800">
      <label className="block text-sm font-bold text-gray-400 mb-3">Fornecedor</label>
      
      <label className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
        <input 
          type="radio" 
          checked={hasVendor} 
          onChange={() => {
            setHasVendor(true);
            setFormData({...formData, source_type: undefined, source_value: undefined});
          }}
          className="w-4 h-4"
        />
        <div>
          <span className="text-sm font-bold text-white">Selecionar fornecedor vinculado</span>
          <p className="text-xs text-gray-500">Escolher da lista de fornecedores desta viagem</p>
        </div>
      </label>
      
      {hasVendor && (
        <div className="space-y-2 ml-7">
          <select 
            value={formData.vendor_profile_id || ''} 
            onChange={e => {
              const tv = tripVendors.find(v => v.profile.id === e.target.value);
              setFormData({
                ...formData, 
                vendor_profile_id: e.target.value,
                provider: tv?.profile.name
              });
            }}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none"
          >
            <option value="">Selecione um fornecedor...</option>
            {tripVendors.map(tv => (
              <option key={tv.id} value={tv.profile.id}>
                {tv.profile.name}
              </option>
            ))}
          </select>
          
          <Button 
            variant="outline" 
            onClick={() => setIsQuickCreateOpen(true)}
            className="w-full text-sm"
          >
            + Criar novo fornecedor
          </Button>
        </div>
      )}
      
      <label className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
        <input 
          type="radio" 
          checked={!hasVendor} 
          onChange={() => {
            setHasVendor(false);
            setFormData({...formData, vendor_profile_id: undefined, provider: undefined});
          }}
          className="w-4 h-4"
        />
        <div>
          <span className="text-sm font-bold text-white">Sem fornecedor (informar fonte)</span>
          <p className="text-xs text-gray-500">Para cotações de sites, pesquisas, etc</p>
        </div>
      </label>
      
      {!hasVendor && (
        <div className="space-y-3 ml-7">
          <div className="flex gap-2">
            <button 
              onClick={() => setSourceType('link')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                sourceType === 'link' 
                  ? 'bg-indigo-600 border-indigo-400 text-white' 
                  : 'bg-gray-900 border-gray-800 text-gray-500'
              }`}
            >
              Link
            </button>
            <button 
              onClick={() => setSourceType('texto')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                sourceType === 'texto' 
                  ? 'bg-indigo-600 border-indigo-400 text-white' 
                  : 'bg-gray-900 border-gray-800 text-gray-500'
              }`}
            >
              Texto
            </button>
            <button 
              onClick={() => setSourceType('manual')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                sourceType === 'manual' 
                  ? 'bg-indigo-600 border-indigo-400 text-white' 
                  : 'bg-gray-900 border-gray-800 text-gray-500'
              }`}
            >
              Manual
            </button>
          </div>
          
          {sourceType === 'link' && (
            <Input 
              label="URL da Fonte *" 
              value={sourceValue}
              onChange={e => {
                setSourceValue(e.target.value);
                setFormData({...formData, source_type: 'link', source_value: e.target.value});
              }}
              placeholder="https://exemplo.com/cotacao"
            />
          )}
          
          {sourceType === 'texto' && (
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Texto da Cotação *</label>
              <textarea 
                placeholder="Cole aqui o texto da cotação (email, mensagem, etc)..."
                value={sourceValue}
                onChange={e => {
                  setSourceValue(e.target.value);
                  setFormData({...formData, source_type: 'texto', source_value: e.target.value});
                }}
                rows={4}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none resize-none"
              />
            </div>
          )}
          
          {sourceType === 'manual' && (
            <Input 
              label="Descrição da Fonte *"
              value={sourceValue}
              onChange={e => {
                setSourceValue(e.target.value);
                setFormData({...formData, source_type: 'manual', source_value: e.target.value});
              }}
              placeholder="Ex: Cotação por telefone, WhatsApp, pessoalmente"
            />
          )}
        </div>
      )}
    </div>

    <div className="flex gap-2 items-end">
      <Input 
        label="Link do Orçamento (URL)" 
        className="flex-1" 
        value={formData.linkUrl} 
        onChange={e => setFormData({...formData, linkUrl: e.target.value})} 
      />
      {formData.linkUrl && (
        <Button variant="secondary" onClick={() => window.open(formData.linkUrl, '_blank')}>
          Abrir
        </Button>
      )}
    </div>
  </div>
);
```

### 7. Adicionar Modal no Final do Componente (antes do último </div>)
```tsx
// ADICIONAR antes do fechamento do componente:
{isQuickCreateOpen && (
  <QuickCreateVendorModal
    onClose={() => setIsQuickCreateOpen(false)}
    onCreated={async (profileId) => {
      // Vincular à viagem
      await supabaseDataProvider.linkVendorToTrip(trip.id, profileId);
      // Recarregar lista
      await loadTripVendors();
      // Selecionar automaticamente
      const newVendor = await supabaseDataProvider.getVendorProfiles();
      const profile = newVendor.find(v => v.id === profileId);
      setFormData({
        ...formData, 
        vendor_profile_id: profileId,
        provider: profile?.name
      });
      setIsQuickCreateOpen(false);
    }}
  />
)}
```

### 8. Atualizar Preview (linha 310-315)
```tsx
// SUBSTITUIR:
<p className="text-xs text-gray-500 font-medium">{formData.provider || 'Sem fornecedor'}</p>

// POR:
<p className="text-xs text-gray-500 font-medium">
  {formData.provider || (formData.source_type ? `Fonte: ${formData.source_type}` : 'Sem fornecedor')}
</p>
```

### 9. Atualizar CheckItem de Campos Básicos (linha 323)
```tsx
// SUBSTITUIR:
<CheckItem label="Campos Básicos" checked={!!(formData.title && formData.vendorId)} />

// POR:
<CheckItem label="Campos Básicos" checked={!!(formData.title && (formData.vendor_profile_id || (formData.source_type && formData.source_value)))} />
```

## Resumo das Mudanças

1. ✅ Remover prop `vendors: Vendor[]`
2. ✅ Adicionar imports necessários
3. ✅ Adicionar estados para fornecedores, fonte e modal
4. ✅ Carregar fornecedores vinculados via `getTripVendors()`
5. ✅ Atualizar cálculo de completude
6. ✅ Reescrever Step 1 com opção fornecedor/fonte
7. ✅ Adicionar QuickCreateVendorModal
8. ✅ Atualizar preview para mostrar fonte
9. ✅ Atualizar checklist

## Validação

- Não permitir salvar sem fornecedor E sem fonte
- Não permitir salvar com fornecedor E com fonte (escolher um)
- Fonte obrigatória quando não há fornecedor
