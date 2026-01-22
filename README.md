
# TripDivide - Gestor Financeiro de Viagem

## 🚀 Simulação Demo (Seed)
O app agora inicia com uma simulação completa baseada no arquivo `/lib/demoSeed.ts`. Esta demonstração cobre uma viagem fictícia para os EUA (Orlando & Miami) com 3 casais participantes.

### O que o Seed cobre:
- **Participantes**: 3 casais (cp-1, cp-2, cp-3), incluindo uma criança para testar o peso no racha.
- **Fornecedores**: Hotel, Carro, Ingressos e Seguro já pré-cadastrados.
- **Orçamentos**: 10+ cotações com diferentes status, incluindo variações VIP.
- **Fluxo de Votação**: Uma cotação de hotel já foi aprovada por consenso unânime.
- **Fluxo Financeiro**:
  - Despesas geradas automaticamente.
  - Pagamentos cruzados: O casal 1 pagou a conta de todos para demonstrar o cálculo de reembolsos.
  - Racha misto: Alguns itens divididos por casal, outros por pessoa.

### Como Resetar a Demo (Modo Dev)
Para voltar ao estado original da simulação:
1. Localize o botão **"Resetar Demo"** no rodapé da barra lateral (Sidebar).
2. O sistema irá reinicializar os dados em memória e recarregar a página.

### Extensibilidade
Para alterar os dados iniciais, basta modificar o objeto retornado por `createDemoData()` em `/lib/demoSeed.ts`. Os relacionamentos são mantidos através de IDs fixos definidos no seed.
