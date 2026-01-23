# 🏗️ Arquitetura: Fornecedores e Orçamentos

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Fornecedores: Global vs Viagem](#fornecedores-global-vs-viagem)
3. [Orçamentos: Com ou Sem Fornecedor](#orçamentos-com-ou-sem-fornecedor)
4. [Fluxos Práticos](#fluxos-práticos)
5. [Quando Usar Cada Opção](#quando-usar-cada-opção)

---

## 🎯 Visão Geral

### Conceito Principal

**Fornecedores** = Perfis globais reutilizáveis (como viajantes)
**Orçamentos** = Sempre da viagem, podem ou não ter fornecedor

```
┌──────────────────────────────────────────────────────────┐
│                    VOCÊ (Usuário)                        │
└──────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        ↓                                     ↓
┌───────────────────┐              ┌───────────────────┐
│ PERFIS GLOBAIS    │              │    VIAGENS        │
│ (Reutilizáveis)   │              │  (Específicas)    │
├───────────────────┤              ├───────────────────┤
│ • Viajantes       │              │ • Orçamentos      │
│ • Fornecedores    │              │ • Despesas        │
└───────────────────┘              │ • Pagamentos      │
        │                          └───────────────────┘
        │                                     ↑
        └─────────── Vincula ─────────────────┘
```

---

## 🏢 Fornecedores: Global vs Viagem

### 1️⃣ Perfil Global (`td_vendor_profiles`)

**O que é:**
- Cadastro único do fornecedor
- Reutilizável em múltiplas viagens
- Contém dados permanentes

**Dados armazenados:**
```
┌─────────────────────────────────────┐
│ PERFIL GLOBAL DO FORNECEDOR         │
├─────────────────────────────────────┤
│ • Nome: "Orlando VIP Services"      │
│ • Razão Social: "OVS LLC"           │
│ • Categorias: [Carro, Ingressos]    │
│ • Rating Global: 4.5 ⭐             │
│ • Contatos:                         │
│   - João (Comercial)                │
│   - WhatsApp: +1 407 936-4569       │
│   - Email: joao@ovs.com             │
│ • WhatsApp Numbers: [14079364569]   │
│ • Website, Instagram, etc           │
│ • Políticas padrão                  │
└─────────────────────────────────────┘
```

**Onde cadastrar:**
- Menu "Fornecedores" (fora da viagem)
- Ou criar durante a viagem e fica global

### 2️⃣ Vínculo por Viagem (`td_trip_vendors`)

**O que é:**
- Liga um perfil global a uma viagem específica
- Permite configurações específicas desta viagem

**Dados armazenados:**
```
┌─────────────────────────────────────┐
│ VÍNCULO: Fornecedor X Viagem        │
├─────────────────────────────────────┤
│ • Perfil: Orlando VIP Services      │
│ • Viagem: Orlando Nov 2026          │
│ • Rating nesta viagem: 5 ⭐         │
│ • Preferido? Sim ⭐                 │
│ • Notas: "Melhor preço, ótimo"      │
│ • Status: Ativo                     │
└─────────────────────────────────────┘
```

**Como vincular:**
1. Na aba "Fornecedores" da viagem
2. Clique "+ Adicionar da minha lista"
3. Selecione fornecedores já cadastrados
4. Ou clique "+ Criar Novo" (cria global + vincula)

---

## 💰 Orçamentos: Com ou Sem Fornecedor

### Regra Principal

**Orçamentos são SEMPRE da viagem** (não são globais)

Mas podem ter 2 origens diferentes:

### Opção A: COM Fornecedor Cadastrado

```
ORÇAMENTO
├─ trip_id: "viagem-orlando"
├─ title: "Aluguel Toyota Sienna"
├─ vendor_profile_id: "orlando-vip-services" ✅
├─ source_type: null
├─ source_value: null
└─ provider: "Orlando VIP Services"
```

**Vantagens:**
- ✅ Histórico completo do fornecedor
- ✅ Contatos salvos
- ✅ Rating e reputação
- ✅ Reutilizável em outras viagens

**Quando usar:**
- Fornecedor conhecido/confiável
- Vai usar novamente
- Quer acompanhar histórico

### Opção B: SEM Fornecedor (Fonte Alternativa)

```
ORÇAMENTO
├─ trip_id: "viagem-orlando"
├─ title: "Hotel Hilton - Booking.com"
├─ vendor_profile_id: null ❌
├─ source_type: "link" ✅
├─ source_value: "https://booking.com/..." ✅
└─ provider: "Booking.com"
```

**Tipos de fonte:**
1. **`link`** - URL de site (Booking, Airbnb, etc)
2. **`texto`** - Texto colado (WhatsApp sem cadastrar fornecedor)
3. **`manual`** - Descrição livre

**Vantagens:**
- ⚡ Mais rápido (não precisa cadastrar)
- 🔗 Link fica salvo
- 📝 Flexível

**Quando usar:**
- Orçamento único/pontual
- Site conhecido (Booking, Airbnb)
- Não vai usar fornecedor novamente
- Quer agilidade

---

## 🔄 Fluxos Práticos

### Fluxo 1: Fornecedor Recorrente (WhatsApp)

```
1. Recebe orçamentos por WhatsApp de fornecedor conhecido
   ↓
2. Importa via "📱 Importar do WhatsApp"
   ↓
3. Sistema reconhece número → Vincula ao fornecedor ✅
   ↓
4. Orçamentos criados COM vendor_profile_id
   ↓
5. Histórico fica salvo no perfil do fornecedor
```

**Exemplo:**
```
WhatsApp: +1 407 936-4569
Sistema encontra: "Orlando VIP Services"
Badge verde: "✓ Fornecedor Reconhecido"
→ Orçamentos vinculados automaticamente
```

### Fluxo 2: Site de Viagem (Booking, Airbnb)

```
1. Pesquisa hotel no Booking.com
   ↓
2. Copia link
   ↓
3. Importa via "🔗 Importar de Site/Link"
   ↓
4. Sistema detecta: Booking.com
   ↓
5. Orçamento criado SEM vendor_profile_id
   ↓
6. Usa source_type='link' + link salvo
```

**Exemplo:**
```
Link: https://booking.com/hotel/hilton-orlando
Sistema detecta: Booking.com 🏨
→ Orçamento com link, sem cadastrar fornecedor
```

### Fluxo 3: Fornecedor Novo (Primeira Vez)

```
1. Recebe orçamento de fornecedor desconhecido
   ↓
2. Opção A: Criar fornecedor primeiro
   - Menu "Fornecedores" → "+ Criar Novo"
   - Preenche dados completos
   - Vincula à viagem
   - Cria orçamento COM vendor_profile_id
   
   Opção B: Importar direto sem cadastrar
   - Importa via WhatsApp/Link
   - Sistema cria SEM vendor_profile_id
   - Usa source_type + source_value
   - Mais rápido, menos histórico
```

---

## 🤔 Quando Usar Cada Opção

### Use FORNECEDOR CADASTRADO quando:

✅ **Fornecedor recorrente**
- Vai usar em múltiplas viagens
- Exemplo: Agência de viagens, guia local

✅ **Quer histórico completo**
- Acompanhar todos os orçamentos deste fornecedor
- Ver rating e evolução

✅ **Múltiplos contatos**
- Fornecedor tem vários vendedores
- Quer salvar todos os contatos

✅ **Gestão de reputação**
- Quer dar rating
- Marcar como preferido
- Adicionar flags de risco

**Exemplo:**
```
Fornecedor: "Orlando VIP Services"
- Usado em 3 viagens
- 12 orçamentos históricos
- Rating: 4.8 ⭐
- Preferido: Sim
- Contatos: 3 vendedores
```

### Use FONTE ALTERNATIVA quando:

✅ **Orçamento pontual**
- Vai usar uma vez só
- Exemplo: Hotel específico no Booking

✅ **Site conhecido**
- Booking, Airbnb, Decolar
- Não precisa cadastrar como fornecedor

✅ **Agilidade**
- Quer importar rápido
- Não precisa de histórico

✅ **Pesquisa/Comparação**
- Múltiplas opções de sites diferentes
- Fase de pesquisa

**Exemplo:**
```
Orçamento: "Hotel Hilton Orlando"
- Fonte: Booking.com (link)
- Uso único
- Não precisa cadastrar Booking como fornecedor
```

---

## 📊 Comparação Visual

### Cenário 1: Agência de Viagens

```
┌─────────────────────────────────────┐
│ PERFIL GLOBAL                       │
│ "Agência XYZ Turismo"               │
│ - Rating: 4.5 ⭐                    │
│ - 3 contatos                        │
│ - WhatsApp cadastrado               │
└─────────────────────────────────────┘
              ↓ vincula
┌─────────────────────────────────────┐
│ VIAGEM: Orlando 2026                │
│ ├─ Orçamento: Voo LATAM             │
│ ├─ Orçamento: Transfer              │
│ └─ Orçamento: Seguro                │
└─────────────────────────────────────┘
              ↓ vincula
┌─────────────────────────────────────┐
│ VIAGEM: Europa 2027                 │
│ ├─ Orçamento: Voo TAP               │
│ └─ Orçamento: Seguro                │
└─────────────────────────────────────┘

✅ Histórico completo
✅ Rating consolidado
✅ Contatos salvos
```

### Cenário 2: Pesquisa de Hotéis

```
┌─────────────────────────────────────┐
│ VIAGEM: Orlando 2026                │
│                                     │
│ Orçamento 1: Hilton                 │
│ ├─ Fonte: Booking.com (link)        │
│ └─ Sem fornecedor cadastrado        │
│                                     │
│ Orçamento 2: Marriott               │
│ ├─ Fonte: Hotels.com (link)         │
│ └─ Sem fornecedor cadastrado        │
│                                     │
│ Orçamento 3: Airbnb Casa            │
│ ├─ Fonte: Airbnb (link)             │
│ └─ Sem fornecedor cadastrado        │
└─────────────────────────────────────┘

✅ Rápido para comparar
✅ Links salvos
✅ Não polui lista de fornecedores
```

---

## 🎯 Recomendações

### Para Fornecedores Recorrentes:

1. **Cadastre como perfil global**
   - Menu "Fornecedores" → "+ Criar Novo"
   - Preencha dados completos
   - Adicione números WhatsApp

2. **Vincule à viagem**
   - Aba "Fornecedores" da viagem
   - "+ Adicionar da minha lista"

3. **Importe orçamentos**
   - Sistema reconhece automaticamente
   - Badge verde aparece

### Para Sites/Orçamentos Pontuais:

1. **Não cadastre como fornecedor**
   - Use importação por link
   - Ou WhatsApp sem cadastrar

2. **Aproveite a agilidade**
   - Importa em 1 minuto
   - Link fica salvo

3. **Se usar muito, considere cadastrar**
   - Exemplo: Sempre usa Booking
   - Pode criar perfil "Booking.com"

---

## ❓ FAQ

**P: Posso ter orçamento sem fornecedor?**
R: Sim! Use `source_type` + `source_value` para isso.

**P: Se importar do WhatsApp sem cadastrar, perde informações?**
R: Não! O texto fica salvo em `source_value`. Pode cadastrar depois.

**P: Booking.com deve ser cadastrado como fornecedor?**
R: Não necessariamente. Use `source_type='link'` para agilidade.

**P: Como o sistema reconhece fornecedor no WhatsApp?**
R: Pelo número em `whatsapp_numbers[]` do perfil global.

**P: Posso converter orçamento sem fornecedor para com fornecedor?**
R: Sim! Edite o orçamento e selecione um fornecedor.

**P: Fornecedor global aparece em todas as viagens?**
R: Não! Só aparece nas viagens onde foi vinculado.

**P: Posso ter mesmo fornecedor em múltiplas viagens?**
R: Sim! Um perfil global, múltiplos vínculos.

---

## 🎉 Resumo

### Fornecedores
- **Perfis Globais** = Reutilizáveis, histórico completo
- **Vínculos por Viagem** = Configurações específicas

### Orçamentos
- **Sempre da viagem** (não são globais)
- **COM fornecedor** = Histórico, rating, contatos
- **SEM fornecedor** = Rápido, link salvo, flexível

### Escolha
- **Recorrente?** → Cadastre fornecedor
- **Pontual?** → Use fonte alternativa
- **Dúvida?** → Comece sem cadastrar, converta depois se necessário

**Flexibilidade é a chave!** 🔑
