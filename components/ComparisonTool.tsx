
import React, { useState } from 'react';
import { Trip, Quote, QuoteStatus } from '../types';
import { Card, Button, Badge, Modal } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';
import { formatCurrency } from '../lib/formatters';

interface ComparisonToolProps {
  trip: Trip;
  quotes: Quote[];
  onRefresh: () => void;
}

const ComparisonTool: React.FC<ComparisonToolProps> = ({ trip, quotes, onRefresh }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmQuote, setConfirmQuote] = useState<Quote | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const selectedQuotes = quotes.filter(q => selectedIds.includes(q.id));
  const availableQuotes = quotes.filter(q => q.status !== QuoteStatus.REJECTED && q.status !== QuoteStatus.CHOSEN);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      if (selectedIds.length >= 4) {
        setSuccessMessage('Máximo de 4 itens para comparar');
        setTimeout(() => setSuccessMessage(null), 3000);
        return;
      }
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleVote = async (quoteId: string, coupleId: string, decision: 'APPROVE' | 'REJECT') => {
    const q = quotes.find(item => item.id === quoteId);
    if (!q) return;

    const existingVotes = [...q.votes];
    const voteIdx = existingVotes.findIndex(v => v.coupleId === coupleId);
    
    // Se clicar no mesmo que já está selecionado, retira o voto (opcional, aqui estamos trocando)
    if (voteIdx >= 0 && existingVotes[voteIdx].decision === decision) {
       // Opcional: remover voto se clicar de novo. Por simplicidade, mantemos a troca.
    }
    
    if (voteIdx >= 0) existingVotes[voteIdx].decision = decision;
    else existingVotes.push({ coupleId, decision });

    await dataProvider.saveQuote({ ...q, votes: existingVotes });
    onRefresh();
  };

  const handleConsensusRuleChange = async (rule: '2/3' | '3/3') => {
    await dataProvider.saveTrip({ ...trip, consensusRule: rule });
    onRefresh();
  };

  const handleFinalize = async (quote: Quote) => {
    setConfirmQuote(quote);
  };

  const confirmFinalize = async () => {
    if (!confirmQuote) return;
    
    await dataProvider.saveQuote({ ...confirmQuote, status: QuoteStatus.CHOSEN });
    
    const expense = {
      id: '',
      tripId: trip.id,
      segmentId: confirmQuote.segmentId,
      sourceQuoteId: confirmQuote.id,
      title: `${confirmQuote.category}: ${confirmQuote.provider}`,
      category: confirmQuote.category,
      currency: confirmQuote.currency,
      amount: confirmQuote.totalAmount,
      exchangeRate: confirmQuote.exchangeRate,
      amountBrl: confirmQuote.amountBrl,
      dueDate: confirmQuote.validUntil,
      status: 'confirmed' as any,
      // Copiar vendor_profile_id e source da quote
      vendor_profile_id: confirmQuote.vendor_profile_id || null,
      source_type: confirmQuote.source_type || null,
      source_value: confirmQuote.source_value || null
    };
    await dataProvider.saveExpense(expense as any);
    
    setConfirmQuote(null);
    setSuccessMessage('Orçamento fechado e despesa criada!');
    setTimeout(() => setSuccessMessage(null), 3000);
    onRefresh();
  };

  const requiredVotes = trip.consensusRule === '2/3' ? 2 : 3;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {successMessage && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-top">
          {successMessage}
        </div>
      )}
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Votação & Decisão</h2>
          <p className="text-gray-400">Vote para decidir os melhores orçamentos com base na regra de consenso</p>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 p-1 rounded-xl flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-black uppercase px-2">Regra:</span>
          <button 
            onClick={() => handleConsensusRuleChange('2/3')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${trip.consensusRule === '2/3' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            2/3 (Maioria)
          </button>
          <button 
            onClick={() => handleConsensusRuleChange('3/3')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${trip.consensusRule === '3/3' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            3/3 (Unanimidade)
          </button>
        </div>
      </header>

      {/* Área de Seleção */}
      <section className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Selecione para Comparar e Votar</h3>
        <div className="flex flex-wrap gap-2">
           {availableQuotes.map(q => (
             <button 
                key={q.id}
                onClick={() => toggleSelection(q.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  selectedIds.includes(q.id) 
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                  : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-600'
                }`}
             >
               {q.provider} ({formatCurrency(q.amountBrl)})
             </button>
           ))}
           {availableQuotes.length === 0 && <p className="text-gray-600 italic text-sm">Nenhum orçamento disponível para votação.</p>}
        </div>
      </section>

      {/* Grid de Comparação e Votação */}
      {selectedQuotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
           {selectedQuotes.map(q => {
             const approvals = q.votes.filter(v => v.decision === 'APPROVE').length;
             const rejections = q.votes.filter(v => v.decision === 'REJECT').length;
             const hasConsensus = approvals >= requiredVotes;

             return (
               <Card key={q.id} className={`p-0 border-gray-800 flex flex-col h-full hover:border-indigo-500/50 transition-colors ${hasConsensus ? 'ring-2 ring-indigo-600 ring-offset-2 ring-offset-gray-950' : ''}`}>
                  <div className="p-4 border-b border-gray-800 bg-gray-950 flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-gray-100 uppercase tracking-tight truncate max-w-[120px]">{q.provider}</h4>
                      <p className="text-[10px] text-indigo-400 font-bold">{q.category}</p>
                    </div>
                    {hasConsensus && <Badge color="green">Eleito!</Badge>}
                  </div>
                  
                  <div className="p-4 space-y-4 flex-1">
                    <div className="space-y-1">
                       <p className="text-[10px] text-gray-500 font-bold">VALOR TOTAL BRL</p>
                       <p className="text-xl font-black text-indigo-400">{formatCurrency(q.amountBrl)}</p>
                       <p className="text-xs text-gray-600">Por casal: {formatCurrency(q.amountBrl / 3)}</p>
                    </div>

                    <div className="space-y-1">
                       <div className="flex justify-between items-center">
                          <p className="text-[10px] text-gray-500 font-bold uppercase">Consenso ({approvals}/{requiredVotes})</p>
                          <span className="text-[10px] text-red-400 font-bold">Vetos: {rejections}</span>
                       </div>
                       <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-950 border border-gray-800">
                          {[1, 2, 3].map(i => (
                            <div key={i} className={`flex-1 transition-colors ${approvals >= i ? 'bg-indigo-500' : 'bg-transparent'} ${i > requiredVotes ? 'opacity-20' : ''}`} />
                          ))}
                       </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-gray-800">
                       <p className="text-[10px] text-gray-500 font-bold uppercase mb-3">Votação dos Casais</p>
                       {trip.couples.map(c => {
                         const vote = q.votes.find(v => v.coupleId === c.id);
                         return (
                           <div key={c.id} className="flex flex-col gap-1 bg-gray-950 p-2 rounded-lg border border-gray-800">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-300">{c.name}</span>
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => handleVote(q.id, c.id, 'APPROVE')}
                                    className={`px-2 py-1 rounded text-[10px] font-black transition-all border ${vote?.decision === 'APPROVE' ? 'bg-green-600 border-green-400 text-white' : 'bg-gray-900 border-gray-800 text-gray-600 hover:text-green-500'}`}
                                  >
                                    APROVAR
                                  </button>
                                  <button 
                                    onClick={() => handleVote(q.id, c.id, 'REJECT')}
                                    className={`px-2 py-1 rounded text-[10px] font-black transition-all border ${vote?.decision === 'REJECT' ? 'bg-red-600 border-red-400 text-white' : 'bg-gray-900 border-gray-800 text-gray-600 hover:text-red-500'}`}
                                  >
                                    REJEITAR
                                  </button>
                                </div>
                              </div>
                           </div>
                         );
                       })}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-800/30 border-t border-gray-800 space-y-4">
                     {hasConsensus ? (
                       <Button 
                         variant="primary" 
                         className="w-full text-xs py-2 shadow-indigo-600/40"
                         onClick={() => handleFinalize(q)}
                       >
                         Fechar Orçamento 🏆
                       </Button>
                     ) : (
                       <p className="text-[10px] text-gray-500 italic text-center">Aguardando consenso para fechar...</p>
                     )}
                  </div>
               </Card>
             );
           })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900 border border-dashed border-gray-800 rounded-2xl text-gray-500">
           <svg className="w-16 h-16 opacity-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
           <p className="font-bold">Nenhum orçamento selecionado para votação</p>
           <p className="text-sm">Clique nos orçamentos acima para trazê-los para a mesa de votação</p>
        </div>
      )}

      {/* Modal de Confirmação */}
      <Modal isOpen={!!confirmQuote} onClose={() => setConfirmQuote(null)} title="Fechar Orçamento">
        <div className="space-y-4">
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
            <p className="text-lg font-bold text-white mb-2">🏆 CONSENSO ATINGIDO!</p>
            <p className="text-gray-300">
              Deseja fechar este orçamento com <span className="font-bold text-indigo-400">{confirmQuote?.provider}</span>?
            </p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-400">Isso irá:</p>
            <ul className="text-sm text-gray-300 space-y-1 ml-4">
              <li>• Marcar o orçamento como "Fechado"</li>
              <li>• Criar automaticamente uma despesa na lista oficial</li>
              <li>• Permitir registrar pagamentos e divisão</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <Button variant="ghost" onClick={() => setConfirmQuote(null)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="primary" onClick={confirmFinalize} className="flex-1">
              Confirmar e Fechar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ComparisonTool;
