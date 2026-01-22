
import React, { useState, useMemo } from 'react';
import { Trip, Quote, QuoteStatus, Currency, PaymentMethod } from '../types';
import { Card, Badge, Button } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';

interface ComparisonPageProps {
  trip: Trip;
  quotes: Quote[];
  onBack: () => void;
  onRefresh: () => void;
  onNavigateToQuote: (id: string) => void;
}

const ComparisonPage: React.FC<ComparisonPageProps> = ({ trip, quotes, onBack, onRefresh, onNavigateToQuote }) => {
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);

  const sortedQuotes = useMemo(() => [...quotes].sort((a,b) => a.amountBrl - b.amountBrl), [quotes]);

  const travelersCount = trip.couples.reduce((sum, c) => sum + c.members.length, 0);

  // Helper para verificar se um campo é diferente entre as cotações
  const isDifferent = (accessor: (q: Quote) => any) => {
    if (quotes.length < 2) return false;
    const first = accessor(quotes[0]);
    return !quotes.every(q => accessor(q) === first);
  };

  const rows = [
    { label: 'Fornecedor', accessor: (q: Quote) => q.provider },
    { label: 'Status', accessor: (q: Quote) => q.status },
    { label: 'Total Original', accessor: (q: Quote) => `${q.currency} ${q.totalAmount.toLocaleString('pt-BR')}` },
    { label: 'Total BRL', accessor: (q: Quote) => `R$ ${q.amountBrl.toLocaleString('pt-BR')}`, critical: true },
    { label: 'Custo por Pessoa', accessor: (q: Quote) => `R$ ${(q.amountBrl / travelersCount).toFixed(2)}` },
    { label: 'Câmbio Aplicado', accessor: (q: Quote) => q.currency === Currency.BRL ? '-' : `R$ ${q.exchangeRate}` },
    { label: 'Vencimento', accessor: (q: Quote) => new Date(q.validUntil).toLocaleDateString('pt-BR') },
    { label: 'Cancelamento', accessor: (q: Quote) => q.cancellationPolicy },
    { label: 'Parcelas', accessor: (q: Quote) => `${q.paymentTerms.installments}x` },
    { label: 'Desconto à Vista', accessor: (q: Quote) => q.paymentTerms.cashDiscount ? `R$ ${q.paymentTerms.cashDiscount}` : 'Nenhum' },
    { label: 'Completude', accessor: (q: Quote) => `${q.completeness}%` },
  ];

  const handleShortlist = async (id: string) => {
    const q = quotes.find(item => item.id === id);
    if (q) {
      await dataProvider.saveQuote({ ...q, status: QuoteStatus.SHORTLIST });
      onRefresh();
    }
  };

  const handleSaveComp = async () => {
    await dataProvider.saveComparison({
      id: '',
      tripId: trip.id,
      quoteIds: quotes.map(q => q.id),
      createdAt: ''
    });
    alert('Comparação salva no histórico!');
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white group">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span className="text-xs font-black uppercase tracking-widest">Voltar para a Lista</span>
        </button>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => setShowOnlyDiffs(!showOnlyDiffs)}>
             {showOnlyDiffs ? 'Mostrar Tudo' : 'Apenas Diferenças'}
           </Button>
           <Button variant="primary" onClick={handleSaveComp}>Salvar Comparação</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
         <table className="w-full border-collapse text-left min-w-[800px]">
            <thead>
               <tr className="bg-gray-950">
                  <th className="p-6 border-b border-gray-800 sticky left-0 bg-gray-950 z-10 w-48">
                    <p className="text-[10px] font-black text-gray-600 uppercase">Atributo</p>
                  </th>
                  {sortedQuotes.map(q => (
                    <th key={q.id} className="p-6 border-b border-gray-800 min-w-[250px]">
                       <div className="space-y-2">
                          <div className="flex justify-between items-start">
                             <Badge color="indigo">{q.category}</Badge>
                             <button onClick={() => onNavigateToQuote(q.id)} className="text-[10px] text-indigo-400 font-bold hover:underline">Detalhes ➔</button>
                          </div>
                          <h4 className="text-sm font-black text-white uppercase truncate">{q.title}</h4>
                       </div>
                    </th>
                  ))}
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
               {rows.map((row, idx) => {
                  const diff = isDifferent(row.accessor);
                  if (showOnlyDiffs && !diff) return null;

                  return (
                    <tr key={idx} className={`group hover:bg-gray-800/20 transition-colors ${diff ? 'bg-indigo-500/5' : ''}`}>
                       <td className="p-4 border-r border-gray-800 font-bold text-xs text-gray-500 uppercase tracking-tighter sticky left-0 bg-gray-900 group-hover:bg-gray-800 transition-colors z-10">
                          <div className="flex items-center gap-2">
                            {row.label}
                            {diff && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="Diferença detectada" />}
                          </div>
                       </td>
                       {sortedQuotes.map(q => (
                         <td key={q.id} className={`p-4 text-sm ${row.critical ? 'font-black text-white' : 'text-gray-400'}`}>
                            {row.accessor(q)}
                         </td>
                       ))}
                    </tr>
                  );
               })}

               {/* Seção Extra para Hotel */}
               {quotes.every(q => q.category === 'Hospedagem') && (
                 <>
                    <tr className="bg-gray-950/50"><td colSpan={quotes.length + 1} className="p-2 text-[8px] font-black text-gray-700 uppercase tracking-widest text-center">Especificações de Hotel</td></tr>
                    <tr className="hover:bg-gray-800/20">
                       <td className="p-4 border-r border-gray-800 font-bold text-xs text-gray-500 uppercase sticky left-0 bg-gray-900">Café da Manhã</td>
                       {sortedQuotes.map(q => (
                         <td key={q.id} className="p-4 text-sm text-gray-400">
                            {q.hotelDetails?.breakfastIncluded ? <Badge color="green">Incluso</Badge> : <Badge color="red">Não incluso</Badge>}
                         </td>
                       ))}
                    </tr>
                    <tr className="hover:bg-gray-800/20">
                       <td className="p-4 border-r border-gray-800 font-bold text-xs text-gray-500 uppercase sticky left-0 bg-gray-900">Tipo de Quarto</td>
                       {sortedQuotes.map(q => (
                         <td key={q.id} className="p-4 text-sm text-gray-400">{q.hotelDetails?.roomType || '-'}</td>
                       ))}
                    </tr>
                 </>
               )}

               {/* Ações Rápidas em Lote */}
               <tr>
                  <td className="p-4 border-r border-gray-800 font-bold text-xs text-gray-500 uppercase sticky left-0 bg-gray-900 z-10">Decisão</td>
                  {sortedQuotes.map(q => (
                    <td key={q.id} className="p-4">
                       {q.status !== QuoteStatus.CHOSEN && (
                         <div className="space-y-2">
                            <Button variant="outline" className="w-full text-[10px] py-1" onClick={() => handleShortlist(q.id)}>Votar / Shortlist</Button>
                            <Button variant="ghost" className="w-full text-[10px] py-1 text-red-400">Descartar</Button>
                         </div>
                       )}
                       {q.status === QuoteStatus.CHOSEN && <Badge color="green">Vencedora 🏆</Badge>}
                    </td>
                  ))}
               </tr>
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default ComparisonPage;
