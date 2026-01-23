# Parser Multi-Categoria - Documentação

## Visão Geral

Sistema de extração inteligente que transforma texto livre em dados estruturados por categoria, com confidence scoring e warnings.

## Filosofia

- **Texto livre entra** → Parser tenta estruturar
- **Se não conseguir** → Salva como source_type/source_value + notes
- **Nunca trava o usuário** → Sempre salva algo útil
- **Confidence + Warnings** → Transparência sobre qualidade dos dados

## Categorias Suportadas

1. ✈️ **Voo** - flight_details
2. 🏨 **Hospedagem** - lodging_details  
3. 🚗 **Aluguel de Carro** - car_rental_details (já implementado)
4. 🎢 **Parques Temáticos** - park_details
5. 🍽️ **Restaurantes** - restaurant_details
6. 🛍️ **Compras** - shopping_details
7. 🏥 **Seguro Viagem** - insurance_details
8. 📦 **Diversos** - misc_details

## Banco de Dados

```sql
-- Colunas adicionadas
ALTER TABLE td_quotes ADD COLUMN details_json jsonb;
ALTER TABLE td_expenses ADD COLUMN details_json jsonb;

-- Índices GIN para busca
CREATE INDEX idx_quotes_details_json ON td_quotes USING gin(details_json);
CREATE INDEX idx_expenses_details_json ON td_expenses USING gin(details_json);
```

## Contrato do Parser

```typescript
parseQuoteText(rawText: string, category?: Category) => ParsedQuoteResult

interface ParsedQuoteResult {
  normalized_title: string | null;
  detected_category: Category | null;
  amount: number | null;
  currency: 'USD' | 'BRL' | string | null;
  people: { adults?: number, children?: number, total?: number } | null;
  dates: { start?: string, end?: string } | null;
  locations: { ... } | null;
  details_json: object | null;  // Schema específico por categoria
  confidence: number;            // 0..1
  warnings: string[];
}
```

## Schemas por Categoria

### 1. Voo (FlightDetails)

```typescript
{
  airline: string | null,
  origin: string | null,
  destination: string | null,
  depart_datetime: string | null,     // ISO datetime
  return_datetime: string | null,
  cabin_class: "economy"|"business"|...,
  passengers: { adults, children, infants, total },
  baggage: { carry_on, checked },
  stops: number | null,
  is_direct: boolean | null,
  flight_numbers: string[],
  price_per_person: number | null,
  total_price: number | null,
  currency: string | null,
  booking_link: string | null
}
```

**Exemplo de texto:**
```
Voo Miami → Orlando
LATAM - Classe Econômica
Ida: 15/03/2026 às 14:30
Volta: 22/03/2026 às 18:45
2 adultos + 1 criança
Bagagem: 1 mala de 23kg por pessoa
Voo direto
R$ 2.450,00 por pessoa
Total: R$ 7.350,00
```

**Heurísticas:**
- airline: keywords (LATAM, GOL, Azul, American, United)
- origin/destination: "X → Y", "X - Y", "Origem: X Destino: Y"
- datas/hora: "Ida:" "Volta:" + hh:mm
- baggage: "23kg", "mala", "carry on"
- direct/stops: "direto", "sem escalas", "1 escala"

**Warnings:**
- Preço sem datas
- Datas sem origem/destino

---

### 2. Hospedagem (LodgingDetails)

```typescript
{
  provider: "airbnb"|"booking"|"hotel"|"casa"|"outro",
  property_name: string | null,
  checkin_date: string | null,
  checkout_date: string | null,
  nights: number | null,
  city_area: string | null,
  rooms: number | null,
  room_type: string | null,
  guests: { adults, children, total },
  meal_plan: "none"|"breakfast"|"half_board"|"full_board"|"all_inclusive",
  cancellation_policy: string | null,
  price_per_night: number | null,
  total_price: number | null,
  currency: string | null
}
```

**Exemplo:**
```
Hotel Rosen Inn International
Check-in: 06/11/2026
Check-out: 21/11/2026
15 noites
2 quartos Standard Queen
Café da manhã incluído
Cancelamento grátis até 05/11
R$ 450,00 por noite
Total: R$ 13.500,00
```

---

### 3. Parques Temáticos (ParkDetails)

```typescript
{
  brand: "disney"|"universal"|"seaworld"|"legoland"|"outro",
  park_name: string | null,
  visit_dates: string[],
  ticket_type: string | null,
  days: number | null,
  adults: number | null,
  children: number | null,
  add_ons: { express, genie, photo_pass, meal_plan },
  price_per_person: number | null,
  total_price: number | null
}
```

**Exemplo:**
```
Disney Magic Kingdom
Data: 10/11/2026
Ingresso 1 dia - 1 parque
2 adultos: U$ 159,00 cada
1 criança (3-9 anos): U$ 154,00
Total: U$ 472,00
```

---

### 4. Restaurantes (RestaurantDetails)

```typescript
{
  restaurant_name: string | null,
  reservation_datetime: string | null,
  party_size: number | null,
  experience: string | null,
  includes_drinks: boolean | null,
  price_per_person: number | null,
  total_price: number | null
}
```

---

### 5. Seguro Viagem (InsuranceDetails)

```typescript
{
  insurer: string | null,
  coverage_amount: number | null,
  period_start: string | null,
  period_end: string | null,
  people_total: number | null,
  includes: string[],
  price_per_person_day: number | null,
  total_price: number | null
}
```

---

## Confidence Score (0..1)

Pontuação baseada em campos encontrados:

- +0.2 se detectar datas coerentes
- +0.2 se detectar valor + moeda
- +0.2 se detectar origem/destino OU checkin/out OU pickup/dropoff
- +0.2 se detectar quantidade pessoas
- +0.2 se detectar keyword forte da categoria

Cap em 1.0

## Integração no App

### 1. Import do WhatsApp
```typescript
const result = parseQuoteText(rawText, selectedCategory);
// Preencher preview
// Salvar details_json junto com quote
```

### 2. QuoteList - Micro-resumo
- Voo: "MIA→ORL • 06/11 • 2A+1C"
- Hospedagem: "15 noites • 2 quartos • café"
- Parques: "MK • 1 dia • 2A+1C"

### 3. CloseQuoteToExpense
Copiar details_json automaticamente

## Testes

Criar fixtures em `/tests/parser-fixtures/`:
- `voo-formal.txt`
- `voo-informal.txt`
- `hospedagem-airbnb.txt`
- etc.

Validar:
- Campos mínimos extraídos
- Confidence > threshold
- Warnings apropriados

## Status Implementação

- [x] Migração banco (details_json)
- [ ] Parser universal (dispatcher + extractors)
- [ ] Integração WhatsApp import
- [ ] Micro-resumos no QuoteList
- [ ] Copy forward no closeQuoteToExpense
- [ ] Testes com fixtures
