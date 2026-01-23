# 🎯 PROPOSTA FINAL - Divisão de Valores com Seleção Individual

## 💡 PROBLEMA IDENTIFICADO

**Cenário Real:**
```
Viagem tem 3 casais:
├─ Casal 1: Daniel + Ana + filho (3 pessoas)
├─ Casal 2: João + Maria (2 pessoas)  
└─ Casal 3: Pedro + Julia + 2 filhos (4 pessoas)
Total: 9 pessoas

Orçamento: Ingresso Disney (só adultos)
├─ Casal 1: Daniel + Ana vão (filho não vai) = 2 pessoas
├─ Casal 2: João + Maria vão = 2 pessoas
└─ Casal 3: Só Pedro vai (Julia e filhos não) = 1 pessoa
Total usando: 5 pessoas (não 9!)
```

**Problema atual:**
- ❌ Sistema só sabe se o CASAL inteiro participa ou não
- ❌ Não sabe QUAIS PESSOAS do casal vão usar
- ❌ Divisão fica errada

---

## ✨ SOLUÇÃO PROPOSTA

### Opção A: Divisão Manual por Pessoa (RECOMENDADA)

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ 💰 Divisão de Valores                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 📊 Resumo                                        │   │
│ │ Total: R$ 2.500,00                              │   │
│ │ 5 de 9 pessoas vão usar                         │   │
│ │ R$ 500,00 por pessoa                            │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│                                                         │
│ 👥 Divisão Detalhada                                   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Casal 1 (Daniel & Ana)                          │   │
│ │                                                  │   │
│ │ ✓ Daniel                         R$ 500,00      │   │
│ │ ✓ Ana                            R$ 500,00      │   │
│ │ ✗ Filho (não vai usar)           -              │   │
│ │                                                  │   │
│ │ Subtotal Casal 1: R$ 1.000,00 (2 pessoas)      │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Casal 2 (João & Maria)                          │   │
│ │                                                  │   │
│ │ ✓ João                           R$ 500,00      │   │
│ │ ✓ Maria                          R$ 500,00      │   │
│ │                                                  │   │
│ │ Subtotal Casal 2: R$ 1.000,00 (2 pessoas)      │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Casal 3 (Pedro & Julia)                         │   │
│ │                                                  │   │
│ │ ✓ Pedro                          R$ 500,00      │   │
│ │ ✗ Julia (não vai usar)           -              │   │
│ │ ✗ Filho 1 (não vai usar)         -              │   │
│ │ ✗ Filho 2 (não vai usar)         -              │   │
│ │                                                  │   │
│ │ Subtotal Casal 3: R$ 500,00 (1 pessoa)         │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│                                                         │
│ 💵 TOTAL: R$ 2.500,00 (5 pessoas)                      │
└─────────────────────────────────────────────────────────┘
```

**Vantagens:**
- ✅ Mostra EXATAMENTE quem vai usar
- ✅ Cálculo preciso por pessoa
- ✅ Transparente para todos
- ✅ Útil para ingressos, passeios, etc

---

### Opção B: Divisão Simplificada com Contador

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ 💰 Divisão de Valores                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Casal 1 (Daniel & Ana)                          │   │
│ │                                                  │   │
│ │ 👥 2 de 3 pessoas vão usar                      │   │
│ │ 💰 R$ 1.000,00                                  │   │
│ │ 👤 R$ 500,00 por pessoa                         │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Casal 2 (João & Maria)                          │   │
│ │                                                  │   │
│ │ 👥 2 de 2 pessoas vão usar (todos)              │   │
│ │ 💰 R$ 1.000,00                                  │   │
│ │ 👤 R$ 500,00 por pessoa                         │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Casal 3 (Pedro & Julia)                         │   │
│ │                                                  │   │
│ │ 👥 1 de 4 pessoas vão usar                      │   │
│ │ 💰 R$ 500,00                                    │   │
│ │ 👤 R$ 500,00 por pessoa                         │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│                                                         │
│ 💵 TOTAL: R$ 2.500,00 (5 de 9 pessoas)                 │
└─────────────────────────────────────────────────────────┘
```

**Vantagens:**
- ✅ Mais compacto
- ✅ Mostra quantas pessoas do casal vão
- ❌ Não mostra QUEM especificamente

---

### Opção C: Divisão com Modo de Edição

**Visual (modo visualização):**
```
┌─────────────────────────────────────────────────────────┐
│ 💰 Divisão de Valores              [✏️ Editar Divisão] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Casal 1: 2 pessoas → R$ 1.000,00                │   │
│ │ Casal 2: 2 pessoas → R$ 1.000,00                │   │
│ │ Casal 3: 1 pessoa  → R$ 500,00                  │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Total: R$ 2.500,00 (5 pessoas)                         │
└─────────────────────────────────────────────────────────┘
```

**Visual (modo edição):**
```
┌─────────────────────────────────────────────────────────┐
│ 💰 Editar Divisão de Valores       [💾 Salvar] [✕ Cancelar]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Casal 1 (Daniel & Ana)                                 │
│ ┌─────────────────────────────────────────────────┐   │
│ │ [✓] Daniel                                       │   │
│ │ [✓] Ana                                          │   │
│ │ [ ] Filho                                        │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Casal 2 (João & Maria)                                 │
│ ┌─────────────────────────────────────────────────┐   │
│ │ [✓] João                                         │   │
│ │ [✓] Maria                                        │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Casal 3 (Pedro & Julia)                                │
│ ┌─────────────────────────────────────────────────┐   │
│ │ [✓] Pedro                                        │   │
│ │ [ ] Julia                                        │   │
│ │ [ ] Filho 1                                      │   │
│ │ [ ] Filho 2                                      │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ 💡 Selecionadas: 5 pessoas                             │
│ 💵 Valor por pessoa: R$ 500,00                         │
│ 💰 Total: R$ 2.500,00                                  │
└─────────────────────────────────────────────────────────┘
```

**Vantagens:**
- ✅ Permite editar quem participa
- ✅ Interface limpa quando não está editando
- ✅ Flexível
- ❌ Mais complexo de implementar

---

## 🎯 RECOMENDAÇÃO FINAL

### **Opção A + Opção C Combinadas**

**Funcionamento:**

1. **Por padrão:** Assume que TODOS do casal participam
2. **Botão "Ajustar Participantes":** Abre modal para selecionar quem vai
3. **Após ajuste:** Mostra lista detalhada (Opção A)

**Código de Implementação:**

```tsx
// Estado para controlar participantes individuais
const [customParticipants, setCustomParticipants] = useState<{
  [coupleId: string]: string[] // IDs dos membros que participam
}>({});

// Calcular participantes
const getParticipantsForCouple = (coupleId: string) => {
  // Se tem customização, usa ela
  if (customParticipants[coupleId]) {
    return customParticipants[coupleId];
  }
  
  // Se o casal participa, todos os membros participam
  if (quote.participantIds?.includes('ALL') || quote.participantIds?.includes(coupleId)) {
    const couple = trip.couples.find(c => c.id === coupleId);
    return couple?.members.map(m => m.id) || [];
  }
  
  // Casal não participa
  return [];
};

// Renderização
<Card title="💰 Divisão de Valores">
  {/* Header com resumo */}
  <div className="bg-indigo-600/10 p-4 rounded-xl mb-4">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-xs text-gray-500">Participantes</p>
        <p className="text-lg font-bold text-white">
          {totalParticipating} de {totalPeople} pessoas
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">Total</p>
        <p className="text-2xl font-black text-indigo-400">
          {formatCurrency(quote.amountBrl)}
        </p>
      </div>
    </div>
    
    {/* Botão para ajustar */}
    <Button 
      variant="outline" 
      className="w-full mt-3 text-xs"
      onClick={() => setIsAdjustingParticipants(true)}
    >
      ✏️ Ajustar Quem Vai Usar
    </Button>
  </div>

  {/* Divisão por casal */}
  <div className="space-y-3">
    <p className="text-[10px] font-black text-gray-500 uppercase">
      Divisão Detalhada
    </p>
    
    {trip.couples.map(couple => {
      const participatingMembers = getParticipantsForCouple(couple.id);
      const isParticipating = participatingMembers.length > 0;
      const coupleValue = isParticipating 
        ? (quote.amountBrl / totalParticipating) * participatingMembers.length
        : 0;
      const valuePerPerson = coupleValue / participatingMembers.length;

      return (
        <div 
          key={couple.id}
          className={`p-4 rounded-xl border-2 ${
            isParticipating 
              ? 'bg-indigo-600/5 border-indigo-600/30' 
              : 'bg-gray-900/50 border-gray-800 opacity-50'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-bold text-white">{couple.name}</p>
              <p className="text-xs text-gray-500">
                {participatingMembers.length} de {couple.members.length} pessoas
              </p>
            </div>
            {isParticipating && (
              <div className="text-right">
                <p className="text-lg font-black text-indigo-400">
                  {formatCurrency(coupleValue)}
                </p>
                <p className="text-xs text-gray-600">
                  {formatCurrency(valuePerPerson)}/pessoa
                </p>
              </div>
            )}
          </div>
          
          {/* Lista de membros */}
          <div className="space-y-1 pl-2 border-l-2 border-gray-800">
            {couple.members.map(member => {
              const isUsing = participatingMembers.includes(member.id);
              return (
                <div 
                  key={member.id}
                  className={`flex items-center justify-between text-sm ${
                    isUsing ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{isUsing ? '✓' : '✗'}</span>
                    <span>{member.name}</span>
                  </div>
                  {isUsing && (
                    <span className="text-xs text-indigo-400">
                      {formatCurrency(valuePerPerson)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    })}
  </div>

  {/* Footer com totais */}
  <div className="mt-4 pt-4 border-t border-gray-800 bg-gray-950 p-4 rounded-xl">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-xs text-gray-500">Valor por pessoa</p>
        <p className="text-xl font-bold text-white">
          {formatCurrency(quote.amountBrl / totalParticipating)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">Total geral</p>
        <p className="text-2xl font-black text-indigo-400">
          {formatCurrency(quote.amountBrl)}
        </p>
      </div>
    </div>
  </div>
</Card>

{/* Modal para ajustar participantes */}
<Modal 
  isOpen={isAdjustingParticipants} 
  onClose={() => setIsAdjustingParticipants(false)}
  title="Ajustar Participantes"
>
  <div className="space-y-4">
    <div className="bg-amber-600/10 border border-amber-500/20 p-4 rounded-xl">
      <p className="text-xs text-gray-400">
        💡 Marque apenas as pessoas que vão usar este serviço. 
        Por exemplo: se é ingresso só para adultos, desmarque as crianças.
      </p>
    </div>
    
    {trip.couples.map(couple => (
      <div key={couple.id} className="space-y-2">
        <p className="font-bold text-white">{couple.name}</p>
        <div className="space-y-2 pl-4">
          {couple.members.map(member => (
            <label 
              key={member.id}
              className="flex items-center gap-3 p-2 hover:bg-gray-800 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={customParticipants[couple.id]?.includes(member.id)}
                onChange={(e) => {
                  // Lógica para adicionar/remover membro
                }}
                className="w-5 h-5 accent-indigo-500"
              />
              <span className="text-sm text-white">{member.name}</span>
            </label>
          ))}
        </div>
      </div>
    ))}
    
    <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
      <Button variant="ghost" onClick={() => setIsAdjustingParticipants(false)}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={handleSaveParticipants}>
        Salvar
      </Button>
    </div>
  </div>
</Modal>
```

---

## ✅ RESULTADO FINAL

**Cenário 1: Todos participam (padrão)**
```
Casal 1: 3 pessoas → R$ 1.500,00
Casal 2: 2 pessoas → R$ 1.000,00
Casal 3: 4 pessoas → R$ 2.000,00
```

**Cenário 2: Ajustado (após clicar "Ajustar Quem Vai Usar")**
```
Casal 1 (Daniel & Ana)
  ✓ Daniel      R$ 500,00
  ✓ Ana         R$ 500,00
  ✗ Filho       -
Subtotal: R$ 1.000,00

Casal 2 (João & Maria)
  ✓ João        R$ 500,00
  ✓ Maria       R$ 500,00
Subtotal: R$ 1.000,00

Casal 3 (Pedro & Julia)
  ✓ Pedro       R$ 500,00
  ✗ Julia       -
  ✗ Filho 1     -
  ✗ Filho 2     -
Subtotal: R$ 500,00

TOTAL: R$ 2.500,00 (5 pessoas)
```

---

## 🎯 ESSA SOLUÇÃO RESOLVE?

- ✅ Mostra quem do casal vai usar
- ✅ Cálculo preciso por pessoa
- ✅ Flexível (pode ajustar)
- ✅ Visual limpo
- ✅ Funciona para qualquer cenário (ingresso, carro, hotel, etc)

**Posso implementar essa solução?**
