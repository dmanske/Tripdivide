
/**
 * Utilitário central de Finanças do TripDivide
 * Trabalha com centavos (inteiros) para evitar erros de ponto flutuante.
 */
export const Money = {
  toCents: (value: number): number => Math.round(value * 100),
  fromCents: (cents: number): number => cents / 100,
  
  format: (value: number): string => 
    (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),

  // Garante que um valor tenha no máximo 2 casas decimais antes de processar
  sanitize: (value: number): number => Math.round(value * 100) / 100,

  /**
   * Divide um valor em N partes, ajustando o resto no último item
   */
  splitEqual: (totalAmount: number, parts: number): number[] => {
    const totalCents = Money.toCents(totalAmount);
    const partCents = Math.floor(totalCents / parts);
    const results = new Array(parts).fill(partCents);
    
    // O resto é adicionado ao último elemento
    const remainder = totalCents - (partCents * parts);
    results[parts - 1] += remainder;
    
    return results.map(Money.fromCents);
  },

  /**
   * Divide um valor baseado em pesos (ex: quantidade de pessoas)
   */
  splitByWeight: (totalAmount: number, weights: number[]): number[] => {
    const totalCents = Money.toCents(totalAmount);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    let consumedCents = 0;
    const results = weights.map((w, i) => {
      if (i === weights.length - 1) {
        return totalCents - consumedCents;
      }
      const shareCents = Math.floor((totalCents * w) / totalWeight);
      consumedCents += shareCents;
      return shareCents;
    });

    return results.map(Money.fromCents);
  }
};
