# Sistema de Fornecedores e Importação WhatsApp

## 📊 Visão Geral

Sistema completo para gerenciar fornecedores e importar orçamentos diretamente de conversas do WhatsApp.

## 🏗️ Arquitetura

### Tabelas do Banco de Dados

**`td_vendor_profiles`** - Perfis globais reutilizáveis
- `id`, `user_id`, `name`, `legal_name`
- `categories[]` - Array de categorias de serviço
- `contacts` - JSONB com array de contatos (nome, cargo, telefone, email, WhatsApp)
- `whatsapp_numbers[]` - **NOVO** - Array de números WhatsApp para auto-match
- `rating` - Avaliação (0-5)
- `tags[]`, `risk_flags[]`
- `website_url`, `instagram_url`
- `payment_terms_default`, `cancellation_policy_notes`

**`td_trip_vendors`** - Vínculos específicos por viagem
- `trip_id`, `vendor_profile_id`
- `rating` - Override do rating global
- `preferred` - Fornecedor favorito da viagem
- `status` - Ativo/Arquivado
- `notes` - Notas específicas desta viagem

**`td_quotes`** - Orçamentos
- Campos padrão: `trip_id`, `title`, `category`, `currency`, `total_amount`, etc
- **Fornecedor (opcional):**
  - `vendor_profile_id` - Referência ao perfil global
- **Fonte alternativa (quando não há fornecedor):**
  - `source_type` - 'link', 'texto', 'manual'
  - `source_value` - URL, texto colado, ou descrição

## 🚀 Funcionalidades Implementadas

### 1. **Importação de Orçamentos do WhatsApp**

**Componente:** `WhatsAppQuoteImportModal`

**Fluxo:**
1. Usuário clica em "📱 Importar do WhatsApp" na lista de orçamentos
2. Cola o texto da conversa inteira do WhatsApp
3. Sistema analisa automaticamente:
   - Número do fornecedor
   - Múltiplos orçamentos na mesma conversa
   - Preços (à vista, cartão, parcelado)
   - Categorias (detecta automaticamente: carro, hotel, ingresso, etc)
   - Formas de pagamento
   - Desconto à vista
4. Mostra preview com todos os orçamentos detectados
5. Permite selecionar quais importar
6. **Auto-match de fornecedor:** Se reconhecer o número, vincula automaticamente
7. Cria todos os orçamentos de uma vez

**Exemplo de uso:**
```
Cole isso:
[09:11] +1 (407) 936-4569: TOYOTA SIENNA...
a vista com desconto R$6.876,00
Cartão de crédito R$7.190,00
parcelado em 10X sem juros R$719,04

[09:11] +1 (407) 936-4569: SeaWorld Orlando...
a vista com desconto R$780,00
Cartão de crédito R$818,00

Sistema detecta:
✓ 2 orçamentos
✓ Fornecedor: +1 (407) 936-4569
✓ Preços à vista e cartão
✓ Parcelas e descontos
```

### 2. **Importação de Orçamentos por Link (NOVO!)**

**Componente:** `LinkQuoteImportModal`

**Fluxo:**
1. Usuário clica em "🔗 Importar de Site/Link" na lista de orçamentos
2. Cola o link do site (Booking, Airbnb, Decolar, etc)
3. Sistema detecta automaticamente:
   - **Fornecedor** pelo domínio (Booking.com, Airbnb, etc)
   - **Categoria** pelo tipo de site
   - Mostra preview com ícone e informações
4. Usuário completa:
   - Título do orçamento
   - Valor (campo obrigatório)
   - Notas adicionais
5. Sistema salva com link original anexado

**Sites Suportados:**

**Hospedagem:**
- 🏨 Booking.com
- 🏠 Airbnb
- 🏨 Hotels.com
- 🏨 Expedia

**Voos:**
- ✈️ Decolar / Despegar
- ✈️ MaxMilhas
- ✈️ Skyscanner
- ✈️ Kayak

**Aluguel de Carro:**
- 🚗 RentCars
- 🚗 RentalCars
- 🚗 Localiza

**Ingressos/Atrações:**
- 🎫 GetYourGuide
- 🎫 Viator
- 🎫 Ticketmaster

**Exemplo de uso:**
```
1. Cole: https://www.booking.com/hotel/us/hilton-orlando.html
2. Sistema detecta:
   ✓ Fornecedor: Booking.com 🏨
   ✓ Categoria: Hospedagem
   ✓ Confiança: Alta
3. Complete:
   - Título: "Hotel Hilton Orlando - 5 noites"
   - Valor: R$ 3.500,00
   - Notas: "Quarto duplo com café"
4. Importar!
```

### 2. **Parser Melhorado**

**Arquivo:** `lib/whatsapp/parseWhatsAppQuotes.ts`

**Melhorias:**
- Detecta múltiplos orçamentos na mesma conversa
- Extrai preços específicos:
  - `cashPrice` - Preço à vista
  - `creditPrice` - Preço no cartão
  - `pixPrice` - Preço via PIX
  - `cashDiscount` - Desconto calculado
- Categorização inteligente:
  - Aluguel de Carro: detecta "sienna", "pacifica", "pickup", "dropoff"
  - Ingressos: detecta "disney", "seaworld", "universal", "kennedy"
  - Hospedagem: detecta "hotel", "check-in", "quarto"
  - Voo: detecta "flight", "passagem", "aéreo"
- Detecta métodos de pagamento automaticamente
- Calcula parcelas e valores

### 3. **Auto-Match de Fornecedores**

**Como funciona:**
1. Quando você importa orçamentos, o sistema extrai o número do WhatsApp
2. Busca em `td_vendor_profiles.whatsapp_numbers[]`
3. Se encontrar, vincula automaticamente ao fornecedor
4. Mostra badge verde "✓ Fornecedor Reconhecido"

**Para adicionar número ao fornecedor:**
```sql
UPDATE td_vendor_profiles 
SET whatsapp_numbers = ARRAY['14079364569']
WHERE name = 'Nome do Fornecedor';
```

### 4. **Interface Melhorada**

**QuoteList:**
- Botão "📱 Importar do WhatsApp" no dropdown "+ Nova Opção"
- Mensagens de sucesso inline (sem `alert()`)
- Preview visual dos orçamentos antes de importar

**Badges de Confiança:**
- 🟢 Alta - Todos os campos detectados
- 🟡 Média - Alguns campos faltando
- 🔴 Baixa - Preço não detectado

## 📝 Fluxo Completo de Orçamentos

### Opção 1: Lançamento Manual
1. Clique em "+ Nova Opção" → "✏️ Lançamento Manual"
2. Preencha wizard com 6 passos
3. Escolha fornecedor OU informe fonte alternativa

### Opção 2: Importação WhatsApp (NOVO!)
1. Clique em "+ Nova Opção" → "📱 Importar do WhatsApp"
2. Cole texto da conversa
3. Revise orçamentos detectados
4. Selecione quais importar
5. Sistema cria todos automaticamente

### Opção 3: Importação por Link (NOVO!)
1. Clique em "+ Nova Opção" → "🔗 Importar de Site/Link"
2. Cole link do Booking/Airbnb/Decolar/etc
3. Sistema detecta fornecedor e categoria
4. Complete título e valor
5. Importar!

## 🎯 Benefícios

### Antes (Manual):
- Recebe 4 orçamentos por WhatsApp
- Precisa abrir wizard 4 vezes
- Copiar/colar cada campo manualmente
- ~5 minutos por orçamento = 20 minutos total

### Agora (Automático):
**WhatsApp:**
- Recebe 4 orçamentos por WhatsApp
- Cola texto uma vez
- Sistema detecta tudo automaticamente
- Revisa e importa = ~2 minutos total

**Link de Site:**
- Encontra hotel no Booking
- Copia link
- Cola no sistema
- Completa valor = ~1 minuto

**Economia: 90% do tempo!** ⚡

## 🔧 Configuração

### Adicionar Números WhatsApp aos Fornecedores

```sql
-- Exemplo: Adicionar número ao fornecedor de Orlando
UPDATE td_vendor_profiles 
SET whatsapp_numbers = ARRAY['14079364569', '14079364570']
WHERE name = 'Orlando VIP Services';

-- Ver fornecedores com WhatsApp
SELECT name, whatsapp_numbers 
FROM td_vendor_profiles 
WHERE whatsapp_numbers IS NOT NULL 
  AND array_length(whatsapp_numbers, 1) > 0;
```

### Formato dos Números
- Sem símbolos: `14079364569`
- Formato internacional sem +
- Apenas dígitos

## 🐛 Troubleshooting

### Orçamento não foi detectado
- Verifique se tem preço no formato `R$ 1.234,56`
- Certifique-se que a mensagem tem conteúdo suficiente (>10 caracteres)
- Palavras-chave ajudam na categorização

### Fornecedor não foi reconhecido
- Adicione o número em `whatsapp_numbers[]` do perfil
- Use formato sem símbolos: `14079364569`
- Número deve estar exatamente como aparece no WhatsApp

### Categoria errada
- Sistema usa heurísticas baseadas em palavras-chave
- Você pode editar manualmente após importar
- Sugestão: adicione palavras-chave específicas no texto

## 📊 Estatísticas

**Categorias detectadas automaticamente:**
- ✈️ Voo
- 🏨 Hospedagem  
- 🚗 Aluguel de Carro
- 🎢 Ingressos/Atrações
- 🍽️ Restaurantes
- 📦 Diversos (fallback)

**Formas de pagamento detectadas:**
- 💰 PIX
- 💳 Cartão de Crédito
- 💵 Dinheiro
- 🏦 Transferência

## 🚀 Próximos Passos (Futuro)

1. **Histórico de Conversas**
   - Salvar mensagens trocadas com fornecedores
   - Timeline de negociação

2. **Templates de Mensagem**
   - Gerar pedidos de orçamento automaticamente
   - Botão "Enviar por WhatsApp"

3. **Análise de Preços**
   - Comparar preços históricos
   - Alertas de preço alto

4. **Rating Automático**
   - Sugerir rating baseado em histórico
   - Alertas de fornecedores problemáticos

## 📚 Arquivos Modificados

- ✅ `lib/whatsapp/parseWhatsAppQuotes.ts` - Parser melhorado
- ✅ `components/WhatsAppQuoteImportModal.tsx` - Modal importação WhatsApp
- ✅ `components/LinkQuoteImportModal.tsx` - Modal importação por Link (NOVO!)
- ✅ `components/QuoteList.tsx` - Integração dos botões
- ✅ `td_vendor_profiles` - Campo `whatsapp_numbers[]` adicionado

## 🎉 Conclusão

Sistema completo de importação de orçamentos implementado com **3 formas diferentes**:

1. **📱 WhatsApp** - Para orçamentos recebidos por mensagem
2. **🔗 Link** - Para sites como Booking, Airbnb, Decolar
3. **✏️ Manual** - Para casos específicos ou personalizados

Agora você pode importar orçamentos em segundos, independente da fonte!
