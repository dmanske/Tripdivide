# 🔍 Guia de Comparação de Orçamentos

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [3 Cenários de Comparação](#3-cenários-de-comparação)
3. [Como Usar](#como-usar)
4. [Recursos Avançados](#recursos-avançados)
5. [Dicas Práticas](#dicas-práticas)

---

## 🎯 Visão Geral

O sistema de comparação foi projetado para lidar com **3 tipos diferentes** de comparação:

1. **Mesmo produto, mesmo fornecedor** → Comparação direta de preços
2. **Mesmo serviço, configurações diferentes** → Normalização por dia/pessoa
3. **Produtos completamente diferentes** → Comparação subjetiva com notas

---

## 📊 3 Cenários de Comparação

### Cenário 1: Mesmo Produto (Fácil)

**Exemplo: Ingressos Disney 4 dias Park Hopper**

```
┌─────────────────────────────────────────────────┐
│ COMPARAÇÃO DIRETA                               │
├─────────────────────────────────────────────────┤
│ João:   R$ 2.500 (4 dias hopper)               │
│ Maria:  R$ 2.300 (4 dias hopper) ✅ MELHOR     │
│ Pedro:  R$ 2.450 (4 dias hopper)               │
└─────────────────────────────────────────────────┘

✅ Decisão: Maria tem o melhor preço
```

**Como comparar:**
1. Selecione os 3 orçamentos na lista
2. Clique "Comparar Agora"
3. Ordene por "Preço Total"
4. O mais barato aparece primeiro

---

### Cenário 2: Mesmo Serviço, Configurações Diferentes

**Exemplo: Ingressos Disney com opções variadas**

```
┌─────────────────────────────────────────────────┐
│ COMPARAÇÃO COM NORMALIZAÇÃO                     │
├─────────────────────────────────────────────────┤
│ João:  R$ 2.500 (4 dias hopper + water parks)  │
│        → R$ 625/dia                             │
│                                                 │
│ Maria: R$ 2.000 (4 dias hopper SEM water)      │
│        → R$ 500/dia ✅ MELHOR POR DIA          │
│                                                 │
│ Pedro: R$ 2.300 (3 dias hopper + 1 water)      │
│        → R$ 575/dia                             │
└─────────────────────────────────────────────────┘

⚠️ Decisão: Depende do que você quer!
- Quer water parks? → João (mais completo)
- Quer economizar? → Maria (melhor custo/dia)
```

**Como comparar:**
1. Selecione os orçamentos
2. Ordene por "Por Dia"
3. Veja a coluna "Custo por Dia"
4. Use "Notas de Comparação" para anotar diferenças:
   ```
   João: Inclui water parks (Blizzard Beach + Typhoon Lagoon)
   Maria: Só parques principais, sem water parks
   Pedro: 1 dia de water park incluído
   ```

---

### Cenário 3: Produtos Completamente Diferentes

**Exemplo: Casas para alugar**

```
┌─────────────────────────────────────────────────┐
│ COMPARAÇÃO SUBJETIVA                            │
├─────────────────────────────────────────────────┤
│ Casa A: R$ 15.000                               │
│ ├─ 5 quartos, piscina                          │
│ ├─ 10 min Disney                                │
│ └─ R$ 1.500/dia | R$ 1.500/quarto              │
│                                                 │
│ Casa B: R$ 12.000 ✅ MAIS BARATA               │
│ ├─ 4 quartos, sem piscina                      │
│ ├─ 30 min Disney                                │
│ └─ R$ 1.200/dia | R$ 3.000/quarto              │
│                                                 │
│ Casa C: R$ 18.000                               │
│ ├─ 6 quartos, piscina aquecida + jacuzzi       │
│ ├─ 5 min Disney                                 │
│ └─ R$ 1.800/dia | R$ 3.000/quarto              │
└─────────────────────────────────────────────────┘

🤔 Decisão: Depende das prioridades!
- Melhor preço total? → Casa B
- Melhor custo/quarto? → Casa A
- Mais luxo? → Casa C
- Mais perto? → Casa C
```

**Como comparar:**
1. Selecione as casas
2. Use múltiplas ordenações:
   - "Preço Total" → Casa mais barata
   - "Por Pessoa" → Melhor custo individual
   - "Por Dia" → Melhor diária
3. **Use as Notas de Comparação** para anotar:
   ```
   Casa A:
   ✅ Melhor custo por quarto
   ✅ Piscina incluída
   ✅ Perto da Disney
   ❌ Só 5 quartos (apertado para 3 casais)
   
   Casa B:
   ✅ Mais barata no total
   ❌ Sem piscina
   ❌ Longe (30 min)
   ❌ Só 4 quartos
   
   Casa C:
   ✅ Mais espaçosa (6 quartos)
   ✅ Piscina aquecida + jacuzzi
   ✅ Muito perto (5 min)
   ❌ Mais cara
   ```
4. Vote com os casais usando o sistema de votação

---

## 🚀 Como Usar

### Passo 1: Selecionar Orçamentos

```
Lista de Orçamentos
├─ Ativar "Modo Comparar"
├─ Clicar nos orçamentos (máx 5)
└─ Clicar "Comparar Agora"
```

### Passo 2: Escolher Ordenação

```
┌─────────────────────────────────────┐
│ Ordenar por:                        │
├─────────────────────────────────────┤
│ • Preço Total    → Menor valor BRL  │
│ • Por Pessoa     → Divide por 6     │
│ • Por Dia        → Normaliza diária │
└─────────────────────────────────────┘
```

**Quando usar cada ordenação:**

| Ordenação | Quando Usar | Exemplo |
|-----------|-------------|---------|
| **Preço Total** | Produtos idênticos | 3 orçamentos do mesmo ingresso |
| **Por Pessoa** | Custos compartilhados | Hospedagem, transporte |
| **Por Dia** | Serviços com duração variável | Aluguel de carro, hotel |

### Passo 3: Analisar Diferenças

```
Tabela de Comparação
├─ Linhas com 🔵 = Valores diferentes
├─ Botão "Apenas Diferenças" = Oculta linhas iguais
└─ Seções específicas por categoria
```

**Seções automáticas:**

- **Hospedagem**: Quartos, café, localização, comodidades
- **Ingressos**: Parque, dias, park hopper
- **Aluguel de Carro**: Modelo, dias, preço/dia

### Passo 4: Adicionar Notas

```
Notas de Comparação (editável)
├─ Campo de texto para cada orçamento
├─ Anote prós e contras
├─ Destaque diferenças importantes
└─ Salva automaticamente
```

### Passo 5: Votar e Decidir

```
Votação dos Casais
├─ Cada casal vota APROVAR ou REJEITAR
├─ Regra de consenso: 2/3 ou 3/3
└─ Consenso atingido = Pode fechar
```

---

## 💡 Recursos Avançados

### 1. Cards de Resumo Rápido

```
┌─────────────────┬─────────────────┬─────────────────┐
│ 💰 Melhor Preço │ 📊 Diferença    │ 🔍 Comparando   │
│ R$ 12.000       │ R$ 6.000        │ 3 opções        │
└─────────────────┴─────────────────┴─────────────────┘
```

### 2. Filtro "Apenas Diferenças"

- Oculta linhas onde todos os valores são iguais
- Foca no que realmente importa
- Útil para comparações com muitos orçamentos

### 3. Normalização Automática

O sistema detecta automaticamente:
- **Dias**: "4 dias", "10 noites", "1 semana"
- **Pessoas**: Divide pelo número de viajantes
- **Quartos**: Extrai do título ou notas

### 4. Detecção de Categoria

Seções específicas aparecem automaticamente:

```
Hospedagem → Quartos, café, localização
Ingressos → Parque, dias, hopper
Carro → Modelo, dias, preço/dia
```

---

## 🎯 Dicas Práticas

### Para Ingressos de Parques

✅ **Sempre compare por dia**
```
Ingresso 4 dias: R$ 2.000 → R$ 500/dia
Ingresso 3 dias: R$ 1.800 → R$ 600/dia
→ 4 dias é melhor negócio!
```

✅ **Anote o que está incluído**
```
Notas:
- Park Hopper? Sim/Não
- Water Parks? Sim/Não
- Memory Maker? Sim/Não
```

### Para Hospedagem (Casas)

✅ **Compare por múltiplas métricas**
```
Casa A: R$ 15.000 total
├─ R$ 1.500/dia (10 dias)
├─ R$ 2.500/pessoa (6 pessoas)
└─ R$ 3.000/quarto (5 quartos)
```

✅ **Liste comodidades importantes**
```
Notas:
✅ Piscina aquecida
✅ Churrasqueira
✅ Perto Disney (10 min)
❌ Sem jacuzzi
❌ Sem game room
```

### Para Aluguel de Carro

✅ **Sempre calcule por dia**
```
10 dias: R$ 3.500 → R$ 350/dia
7 dias: R$ 2.800 → R$ 400/dia
→ 10 dias é melhor custo/dia!
```

✅ **Anote modelo e capacidade**
```
Notas:
- Toyota Sienna (8 passageiros)
- Porta-malas grande
- GPS incluído
- Seguro completo
```

### Para Produtos Diferentes

✅ **Use notas extensivamente**
```
Casa A:
✅ Prós: Perto, piscina, 5 quartos
❌ Contras: Mais cara, sem jacuzzi

Casa B:
✅ Prós: Mais barata
❌ Contras: Longe, sem piscina, 4 quartos
```

✅ **Crie critérios de decisão**
```
Prioridades:
1. Proximidade Disney (peso 40%)
2. Número de quartos (peso 30%)
3. Preço (peso 20%)
4. Comodidades (peso 10%)
```

---

## 📝 Exemplos Práticos

### Exemplo 1: Comparando Ingressos Disney

**Situação**: 3 fornecedores, mesmo produto (4 dias Park Hopper)

```
1. Selecionar os 3 orçamentos
2. Ordenar por "Preço Total"
3. Verificar se todos incluem o mesmo:
   - 4 dias? ✅
   - Park Hopper? ✅
   - Water Parks? Verificar nas notas
4. Escolher o mais barato
5. Votar e fechar
```

### Exemplo 2: Comparando Casas Diferentes

**Situação**: 3 casas com tamanhos e localizações diferentes

```
1. Selecionar as 3 casas
2. Ordenar por "Por Pessoa" primeiro
3. Depois ordenar por "Por Dia"
4. Adicionar notas em cada uma:
   
   Casa A (R$ 15.000):
   - 5 quartos (1 casal por quarto + 1 extra)
   - Piscina privada
   - 10 min Disney
   - Churrasqueira
   
   Casa B (R$ 12.000):
   - 4 quartos (apertado para 3 casais)
   - Sem piscina
   - 30 min Disney
   - Mais barata
   
   Casa C (R$ 18.000):
   - 6 quartos (sobra 1 quarto)
   - Piscina aquecida + jacuzzi
   - 5 min Disney
   - Game room
   
5. Discutir prioridades com os casais
6. Votar considerando:
   - Conforto vs Economia
   - Proximidade vs Preço
   - Comodidades vs Custo
```

### Exemplo 3: Comparando Carros com Durações Diferentes

**Situação**: Mesmo modelo, durações diferentes

```
1. Selecionar os orçamentos
2. Ordenar por "Por Dia"
3. Comparar:
   
   10 dias: R$ 3.500 → R$ 350/dia ✅ MELHOR
   7 dias:  R$ 2.800 → R$ 400/dia
   5 dias:  R$ 2.200 → R$ 440/dia
   
4. Decisão: Vale a pena alugar por 10 dias
   mesmo que a viagem seja 7 dias!
```

---

## 🏆 Resumo

### Comparação Direta (Produtos Iguais)
- Ordene por "Preço Total"
- Escolha o mais barato
- Rápido e objetivo

### Comparação Normalizada (Configurações Diferentes)
- Ordene por "Por Dia" ou "Por Pessoa"
- Use notas para destacar diferenças
- Considere o que está incluído

### Comparação Subjetiva (Produtos Diferentes)
- Use múltiplas ordenações
- Notas extensivas são essenciais
- Defina critérios de decisão
- Vote com os casais

---

## 💬 Perguntas Frequentes

**P: Posso comparar orçamentos de categorias diferentes?**
R: Não recomendado. Compare apenas orçamentos da mesma categoria (ex: só casas, só ingressos).

**P: Quantos orçamentos posso comparar ao mesmo tempo?**
R: Máximo de 5 para manter a tabela legível.

**P: As notas de comparação são salvas?**
R: Sim, ficam salvas localmente durante a sessão. Use "Salvar Comparação" para histórico permanente.

**P: Como funciona a ordenação "Por Dia"?**
R: O sistema tenta extrair o número de dias do título ou notas (ex: "4 dias", "10 noites"). Se não encontrar, usa 1 dia.

**P: E se os orçamentos tiverem moedas diferentes?**
R: Todos são convertidos para BRL usando a taxa de câmbio cadastrada. A comparação é sempre em BRL.

---

**Dica Final**: Para comparações complexas (casas, pacotes), dedique tempo às notas. Elas são essenciais para uma decisão informada! 📝✨
