
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
  const [sortBy, setSortBy] = useState<'price' | 'pricePerPerson' | 'pricePerDay'>('price');
  const [comparisonNotes, setComparisonNotes] = useState<Record<string, string>>({});
  const [showNormalizedView, setShowNormalizedView] = useState(false);

  const sortedQuotes = useMemo(() => {
    const sorted = [...quotes];
    if (sortBy === 'price') return sorted.sort((a,b) => a.amountBrl - b.amountBrl);
    if (sortBy === 'pricePerPerson') {
      const travelersCount = trip.couples.reduce((sum, c) => sum + c.members.length, 0);
      return sorted.sort((a,b) => (a.amountBrl / travelersCount) - (b.amountBrl / travelersCount));
    }
    // pricePerDay - tentar extrair dias das notas ou usar 1
    return sorted.sort((a,b) => {
      const daysA = extractDays(a) || 1;
      const daysB = extractDays(b) || 1;
      return (a.amountBrl / daysA) - (b.amountBrl / daysB);
    });
  }, [quotes, sortBy, trip]);

  const travelersCount = trip.couples.reduce((sum, c) => sum + c.members.length, 0);

  // Extrair número de dias das notas (heurística)
  const extractDays = (quote: Quote): number | null => {
    const text = `${quote.title} ${quote.notesInternal || ''}`.toLowerCase();
    const match = text.match(/(\d+)\s*(dia|day|noite|night)/i);
    return match ? parseInt(match[1]) : null;
  };

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
    { 
      label: 'Custo por Dia', 
      accessor: (q: Quote) => {
        const days = extractDays(q);
        return days ? `R$ ${(q.amountBrl / days).toFixed(2)} (${days} dias)` : 'N/A';
      }
    },
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
    // Usar mensagem inline ao invés de alert
    const message = document.createElement('div');
    message.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-in slide-in-from-top-2 duration-300';
    message.textContent = '✓ Comparação salva no histórico!';
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white group">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span className="text-xs font-black uppercase tracking-widest">Voltar para a Lista</span>
        </button>
        <div className="flex flex-wrap gap-2">
           {/* Ordenação */}
           <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl p-1">
             <span className="text-[10px] text-gray-500 font-black uppercase px-2">Ordenar:</span>
             <button 
               onClick={() => setSortBy('price')}
               className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${sortBy === 'price' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Preço Total
             </button>
             <button 
               onClick={() => setSortBy('pricePerPerson')}
               className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${sortBy === 'pricePerPerson' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Por Pessoa
             </button>
             <button 
               onClick={() => setSortBy('pricePerDay')}
               className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${sortBy === 'pricePerDay' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Por Dia
             </button>
           </div>
           
           <Button variant="outline" onClick={() => setShowOnlyDiffs(!showOnlyDiffs)}>
             {showOnlyDiffs ? 'Mostrar Tudo' : 'Apenas Diferenças'}
           </Button>
           <Button variant="primary" onClick={handleSaveComp}>Salvar Comparação</Button>
        </div>
      </div>

      {/* Cards de resumo rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="!bg-gradient-to-br from-emerald-600/10 to-emerald-600/5 !border-emerald-600/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase">Melhor Preço</p>
              <p className="text-2xl font-black text-white mt-1">
                R$ {Math.min(...sortedQuotes.map(q => q.amountBrl)).toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </Card>
        
        <Card className="!bg-gradient-to-br from-amber-600/10 to-amber-600/5 !border-amber-600/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-amber-400 uppercase">Diferença Máx</p>
              <p className="text-2xl font-black text-white mt-1">
                R$ {(Math.max(...sortedQuotes.map(q => q.amountBrl)) - Math.min(...sortedQuotes.map(q => q.amountBrl))).toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </Card>
        
        <Card className="!bg-gradient-to-br from-indigo-600/10 to-indigo-600/5 !border-indigo-600/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase">Comparando</p>
              <p className="text-2xl font-black text-white mt-1">
                {sortedQuotes.length} opções
              </p>
            </div>
            <div className="text-3xl">🔍</div>
          </div>
        </Card>
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

               {/* Notas de Comparação */}
               <tr className="bg-gray-950/50">
                  <td colSpan={quotes.length + 1} className="p-2 text-[8px] font-black text-gray-700 uppercase tracking-widest text-center">
                    Notas de Comparação (Editável)
                  </td>
               </tr>
               <tr>
                  <td className="p-4 border-r border-gray-800 font-bold text-xs text-gray-500 uppercase sticky left-0 bg-gray-900 z-10">
                    Observações
                  </td>
                  {sortedQuotes.map(q => (
                    <td key={q.id} className="p-4">
                      <textarea
                        value={comparisonNotes[q.id] || ''}
                        onChange={e => setComparisonNotes({...comparisonNotes, [q.id]: e.target.value})}
                        placeholder="Adicione observações sobre este orçamento..."
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                      />
                    </td>
                  ))}
               </tr>

               {/* Seção Extra para Hotel */}
               {quotes.every(q => q.category === 'Hospedagem') && (
                 <>
                    <tr className="bg-gray-950/50"><td colSpan={quotes.length + 1} className="p-2 text-[8px] font-black text-gray-700 uppercase tracking-widest text-center">Especificações de Hospedagem</td></tr>
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
                    <tr className="hover:bg-gray-800/20">
                       <td className="p-4 border-r border-gray-800 font-bold text-xs text-gray-500 uppercase sticky left-0 bg-gray-900">Quartos</td>
                       {sortedQuotes.map(q => (
                         <td key={q.id} className="p-4 text-sm text-gray-400">{q.hotelDetails?.bedrooms || '-'}</td>
                       ))}
                    </tr>
                    <tr className="hover:bg-gray-800/20">
                       <td className="p-4 border-r border-gray-800 font-bold text-xs text-gray-500 uppercase sticky left-0 bg-gray-900">Localização</td>
                       {sortedQuotes.map(q => (
                         <td key={q.id} className="p-4 text-sm text-gray-400">{q.hotelDetails?.location || '-'}</td>
                       ))}
                    </tr>
                    <tr className="hover:bg-gray-800/20">
                       <td className="p-4 border-r border-gray-800 font-bold text-xs text-gray-500 uppercase sticky left-0 bg-gray-900">Comodidades</td>
                       {sortedQuotes.map(q => (
                         <td key={q.id} className="p-4 text-sm text-gray-400">
                           {q.hotelDetails?.amenities ? (
                             <div className="flex flex-wrap gap-1">
                               {q.hotelDetails.amenities.split(',').map((a, i) => (
                                 <Badge key={i} color="gray" className="text-[9px]">{a.trim()}</Badge>
                               ))}
                             </div>
                           ) : '-'}
                         </td>
                       ))}
                    </tr>
                 </>
               )}

               {/* Seção Extra para Ingressos */}
               {quotes.every(q => q.category === 'Ingressos/Atrações') && (
                 <>
                    <tr className="bg-gray-950/50"><td colSpan={quotes.length + 1} className="p-2 text-[8px] font-black text-gray-700 uppercase tracking-widest text-center">Especificações de Ingressos</td></tr>
                    <tr className="hover:bg-gray-800/20">
                       <td className="p-4 border-r border-gray-800 font-bold text-xs text-gray-500 uppercase sticky left-0 bg-gray-900">Parque/Atração</td>
                       {sortedQuotes.map(q => (
                         <td key={q.id} className="p-4 text-sm text-gray-400">
                           {q.title.includes('Disney') ? '🏰 Disney' : 
                            q.title.includes('Universal') ? '🎬 Universal' :
                            q.title.includes('SeaWorld') ? '🐋 SeaWorld' :
                            q.title.includes('Legoland') ? '🧱 Legoland' : '-'}
                         </td>
                       ))}
                    </tr>
                    <tr className="hover:bg-gray-800/20">
                       <td className="p-4 border-r border-gray-800 font-bold text-xs text-gray-500 uppercase sticky left-0 bg-gray-900">Dias de Ingresso</td>
                       {sortedQuotes.map(q => {
                         const days = extractDays(q);
                         return (
                           <td key={q.id} className="p-4 text-sm text-gray-400">
                             {days ? `${days} dias` : '-'}
                           </td>
                         );
                       })}
                    </tr>
                    <tr className="hover:bg-gray-800/20">
                       <td className="p-4 border-r border-gray-800 font-bold text-xs text-gray-500 uppercase sticky left-0 bg-gray-900">Park Hopper?</td>
                       {sortedQuotes.map(q => (
                         <td key={q.id} className="p-4 text-sm text-gray-400">
                           {q.title.toLowerCase().includes('hopper') ? 
                             <Badge color="green">Sim</Badge> : 
                             <Badge color="gray">Não</Badge>}
                         </td>
                       ))}
                    </tr>
                 </>
               )}

               {/* Seção Extra para Aluguel de Carro */}
               {quotes.every(q => q.category === 'Aluguel de Carro') && (
                 <>
                    <tr className="bg-gray-950/50"><td colSpan={quotes.length + 1} className="p-2 text-[8px] font-black text-gray-700 uppercase tracking-widest text-center">Especificações de Veículo</td></tr>
                    <tr className="hover:bg-gray-800/20">
                       <td className="p-4 border-r border-gray-800 font-bold text-xs text-gray-500 uppercase sticky left-0 bg-gray-900">Modelo</td>
                       {sortedQuotes.map(q => (
                         <td key={q.id} className="p-4 text-sm text-gray-400">
                           {q.title.match(/(Toyota|Honda|Chevrolet|Ford|Dodge|Chrysler|Nissan)\s+\w+/i)?.[0] || '-'}
                         </td>
                       ))}
                    </tr>
                    <tr className="hover:bg-gray-800/20">
                       <td className="p-4 border-r border-gray-800 font-bold text-xs text-gray-500 uppercase sticky left-0 bg-gray-900">Dias de Locação</td>
                       {sortedQuotes.map(q => {
                         const days = extractDays(q);
                         return (
                           <td key={q.id} className="p-4 text-sm text-gray-400">
                             {days ? `${days} dias` : '-'}
                           </td>
                         );
                       })}
                    </tr>
                    <tr className="hover:bg-gray-800/20">
                       <td className="p-4 border-r border-gray-800 font-bold text-xs text-gray-500 uppercase sticky left-0 bg-gray-900">Preço por Dia</td>
                       {sortedQuotes.map(q => {
                         const days = extractDays(q);
                         return (
                           <td key={q.id} className="p-4 text-sm font-bold text-indigo-400">
                             {days ? `R$ ${(q.amountBrl / days).toFixed(2)}` : '-'}
                           </td>
                         );
                       })}
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
