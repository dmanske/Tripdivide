import React, { useState, useEffect } from 'react';
import { Trip, Quote, QuoteStatus, Currency } from '../types';
import { Card, Badge, Button, Modal, Input } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';
import { formatSupabaseDateTime, dateToInput, formatCurrency } from '../lib/formatters';

interface QuoteDetailViewProps {
  trip: Trip;
  quote: Quote;
  onEdit: () => void;
  onBack: () => void;
  onRefresh: () => void;
  onNavigateToExpense: () => void;
  onNavigateToQuote: (id: string) => void;
}

const QuoteDetailView: React.FC<QuoteDetailViewProps> = ({ 
  trip, quote, onEdit, onBack, onRefresh, onNavigateToExpense, onNavigateToQuote 
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'variations' | 'payment'>('summary');
  const [variations, setVariations] = useState<Quote[]>([]);
  const [isUpdatePriceOpen, setIsUpdatePriceOpen] = useState(false);
  const [isVariationOpen, setIsVariationOpen] = useState(false);
  const [parentQuote, setParentQuote] = useState<Quote | null>(null);
  const [isAdjustingParticipants, setIsAdjustingParticipants] = useState(false);
  const [customParticipants, setCustomParticipants] = useState<{[coupleId: string]: string[]}>({});
  const [splitMode, setSplitMode] = useState<'per_person' | 'by_couple'>('by_couple');

  // Função para limpar texto de emojis e quebras de linha
  const cleanText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\n\r]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  useEffect(() => {
    loadVariations();
    initializeCustomParticipants();
  }, [quote.id]);

  // Inicializar participantes customizados baseado no quote
  const initializeCustomParticipants = () => {
    const initial: {[coupleId: string]: string[]} = {};
    
    // Se não tem participantIds ou é ALL, todos participam (não precisa customização)
    if (!quote.participantIds || quote.participantIds.length === 0 || quote.participantIds.includes('ALL')) {
      setCustomParticipants({});
      return;
    }
    
    // Se tem IDs específicos de casais, inicializa com todos os membros desses casais
    trip.couples.forEach(couple => {
      if (quote.participantIds?.includes(couple.id)) {
        initial[couple.id] = couple.members.map(m => m.id);
      }
    });
    
    setCustomParticipants(initial);
  };

  const loadVariations = async () => {
    const qList = await dataProvider.getQuotes(trip.id);
    setVariations(qList.filter(q => q.originalId === (quote.originalId || quote.id) && q.id !== quote.id));
    
    if (quote.originalId) {
      setParentQuote(qList.find(q => q.id === quote.originalId) || null);
    } else {
      setParentQuote(null);
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const updated = {
      ...quote,
      totalAmount: Number(data.get('totalAmount')),
      exchangeRate: Number(data.get('exchangeRate')),
      validUntil: data.get('validUntil') as string,
      amountBrl: Number(data.get('totalAmount')) * Number(data.get('exchangeRate'))
    };
    await dataProvider.saveQuote(updated);
    setIsUpdatePriceOpen(false);
    onRefresh();
    loadVariations();
  };

  const handleCreateVariation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const label = new FormData(e.currentTarget).get('label') as string;
    const v = await dataProvider.createQuoteVariation(quote.id, label);
    if (v) {
      setIsVariationOpen(false);
      onNavigateToQuote(v.id);
    }
  };

  const getDiffWithParent = () => {
    if (!parentQuote) return [];
    const diffs: string[] = [];
    if (quote.totalAmount !== parentQuote.totalAmount) {
      const diff = quote.amountBrl - parentQuote.amountBrl;
      diffs.push(`${diff > 0 ? '+' : ''}${formatCurrency(diff)}`);
    }
    if (quote.linkUrl !== parentQuote.linkUrl) diffs.push('Link diferente');
    return diffs;
  };

  // Calcular participantes
  const totalPeople = trip.couples.reduce((sum, c) => sum + c.members.length, 0);
  
  // Função para obter participantes de um casal
  const getParticipantsForCouple = (coupleId: string): string[] => {
    // Se tem customização, usa ela
    if (customParticipants[coupleId]) {
      return customParticipants[coupleId];
    }
    
    // Se o casal participa, todos os membros participam por padrão
    if (quote.participantIds?.includes('ALL') || quote.participantIds?.includes(coupleId)) {
      const couple = trip.couples.find(c => c.id === coupleId);
      return couple?.members.map(m => m.id) || [];
    }
    
    // Casal não participa
    return [];
  };

  // Calcular total de participantes considerando customizações
  const totalParticipating = trip.couples.reduce((sum, couple) => {
    return sum + getParticipantsForCouple(couple.id).length;
  }, 0);

  const participantCount = totalParticipating || totalPeople;

  const segment = trip.segments.find(s => s.id === quote.segmentId);

  // Handler para salvar participantes customizados
  const handleSaveParticipants = () => {
    setIsAdjustingParticipants(false);
    // TODO: Salvar no backend se necessário
    // await dataProvider.updateQuoteParticipants(quote.id, customParticipants);
  };

  // Handler para abrir modal de ajuste
  const handleOpenAdjustModal = () => {
    // Inicializar customParticipants com todos os participantes atuais
    const initial: {[coupleId: string]: string[]} = {};
    trip.couples.forEach(couple => {
      const participants = getParticipantsForCouple(couple.id);
      if (participants.length > 0) {
        initial[couple.id] = participants;
      } else {
        // Se não participa, inicializa vazio mas permite edição
        initial[couple.id] = [];
      }
    });
    setCustomParticipants(initial);
    setIsAdjustingParticipants(true);
  };

  // Função para obter participantes no modal (usa customParticipants)
  const getModalParticipants = (coupleId: string): string[] => {
    return customParticipants[coupleId] || [];
  };

  // Handler para toggle de membro
  const toggleMember = (coupleId: string, memberId: string) => {
    setCustomParticipants(prev => {
      const couple = trip.couples.find(c => c.id === coupleId);
      if (!couple) return prev;
      
      // Pega a lista atual ou inicializa vazia
      const current = prev[coupleId] || [];
      
      // Toggle do membro
      const newList = current.includes(memberId)
        ? current.filter(id => id !== memberId)
        : [...current, memberId];
      
      return {
        ...prev,
        [coupleId]: newList
      };
    });
  };

  // Handler para toggle de casal inteiro
  const toggleCouple = (coupleId: string) => {
    const couple = trip.couples.find(c => c.id === coupleId);
    if (!couple) return;
    
    const currentMembers = customParticipants[coupleId] || couple.members.map(m => m.id);
    const allSelected = currentMembers.length === couple.members.length;
    
    setCustomParticipants(prev => ({
      ...prev,
      [coupleId]: allSelected ? [] : couple.members.map(m => m.id)
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">Lista de Orçamentos</span>
        </button>
        <div className="flex flex-wrap gap-2">
           <Button variant="outline" onClick={() => setIsUpdatePriceOpen(true)}>Atualizar Valor</Button>
           <Button variant="outline" onClick={() => setIsVariationOpen(true)}>Criar Variação</Button>
           <Button variant="outline" onClick={onEdit}>Editar Completo</Button>
           {quote.status !== QuoteStatus.CHOSEN && (
             <Button variant="primary" onClick={onNavigateToExpense}>Oficializar 🏆</Button>
           )}
        </div>
      </div>

      {quote.originalId && (
        <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl flex items-center justify-between">
           <div className="flex items-center gap-3">
              <span className="text-xl">🔀</span>
              <div>
                 <p className="text-[10px] text-indigo-400 font-black uppercase">Variação: {quote.variationLabel}</p>
                 <p className="text-xs text-gray-400">
                   Esta é uma opção alternativa de{' '}
                   <span className="text-white font-bold cursor-pointer hover:underline" onClick={() => onNavigateToQuote(quote.originalId!)}>
                     {parentQuote?.title}
                   </span>
                 </p>
              </div>
           </div>
           <div className="flex gap-2">
              {getDiffWithParent().map(d => <Badge key={d} color="indigo">{d}</Badge>)}
           </div>
        </div>
      )}

      {/* Main Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-800">
         <div className="space-y-2">
            <div className="flex gap-2">
               <Badge color="indigo">{quote.category}</Badge>
               <Badge color={quote.status === QuoteStatus.CHOSEN ? 'green' : 'gray'}>{quote.status}</Badge>
               {quote.completeness && (
                 <Badge color={quote.completeness === 100 ? 'green' : quote.completeness >= 70 ? 'yellow' : 'red'}>
                   {quote.completeness}% completo
                 </Badge>
               )}
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{cleanText(quote.title)}</h1>
            <p className="text-lg text-gray-500 font-medium">{quote.provider}</p>
         </div>
         <div className="flex gap-4">
            <div className="text-right">
               <p className="text-[10px] font-black text-gray-600 uppercase">Total BRL</p>
               <p className="text-3xl font-black text-indigo-400">{formatCurrency(quote.amountBrl)}</p>
               <p className="text-xs text-gray-500 mt-1">Por pessoa: {formatCurrency(quote.amountBrl / participantCount)}</p>
            </div>
         </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 overflow-x-auto">
        {(['summary', 'details', 'payment', 'variations'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'summary' ? 'Resumo' : tab === 'details' ? 'Dados Técnicos' : tab === 'payment' ? 'Pagamento' : 'Opções'}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {/* ABA RESUMO */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             {/* Grid principal: 2 colunas */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna esquerda: Valores e Divisão (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                   {/* Valores */}
                   <Card title="💵 Valores">
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <p className="text-[10px] font-black text-gray-500 uppercase">Moeda Original</p>
                         <p className="text-2xl font-black text-white">{quote.currency} {formatCurrency(quote.totalAmount)}</p>
                       </div>
                       <div>
                         <p className="text-[10px] font-black text-gray-500 uppercase">Valor em BRL</p>
                         <p className="text-3xl font-black text-indigo-400">{formatCurrency(quote.amountBrl)}</p>
                         {quote.currency !== 'BRL' && (
                           <p className="text-xs text-gray-600 mt-1">Taxa: {formatCurrency(quote.exchangeRate)}</p>
                         )}
                       </div>
                       {quote.validUntil && (
                         <div className="col-span-2 pt-4 border-t border-gray-800">
                           <p className="text-[10px] font-black text-gray-500 uppercase">Válido até</p>
                           <p className="text-sm text-gray-400">{new Date(quote.validUntil).toLocaleDateString('pt-BR')}</p>
                         </div>
                       )}
                     </div>
                   </Card>

                   {/* Divisão de Valores */}
                   <Card title="💰 Divisão de Valores">
                     {/* Seletor de modo */}
                     <div className="flex gap-2 mb-4">
                       <button
                         onClick={() => setSplitMode('by_couple')}
                         className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                           splitMode === 'by_couple'
                             ? 'bg-indigo-600 border-indigo-400 text-white'
                             : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700'
                         }`}
                       >
                         👥 Por Casal
                       </button>
                       <button
                         onClick={() => setSplitMode('per_person')}
                         className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                           splitMode === 'per_person'
                             ? 'bg-indigo-600 border-indigo-400 text-white'
                             : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700'
                         }`}
                       >
                         👤 Por Pessoa
                       </button>
                     </div>

                     {/* Resumo compacto */}
                     <div className="bg-indigo-600/10 p-4 rounded-xl mb-4">
                       <div className="flex justify-between items-center">
                         <div>
                           <p className="text-xs text-gray-500">
                             {splitMode === 'by_couple' ? 'Valor por casal' : 'Valor por pessoa'}
                           </p>
                           <p className="text-2xl font-black text-white">
                             {splitMode === 'by_couple'
                               ? formatCurrency(quote.amountBrl / trip.couples.filter(c => getParticipantsForCouple(c.id).length > 0).length)
                               : formatCurrency(quote.amountBrl / totalParticipating)
                             }
                           </p>
                         </div>
                         <Button 
                           variant="outline" 
                           className="text-xs"
                           onClick={handleOpenAdjustModal}
                         >
                           ✏️ Ajustar
                         </Button>
                       </div>
                     </div>

                     {/* Lista compacta de casais */}
                     <div className="space-y-2">
                       {trip.couples.map(couple => {
                         const participatingMembers = getParticipantsForCouple(couple.id);
                         const isParticipating = participatingMembers.length > 0;
                         
                         // Não mostrar casais que não participam
                         if (!isParticipating) return null;
                         
                         let coupleValue = 0;
                         if (splitMode === 'by_couple') {
                           const participatingCouples = trip.couples.filter(c => getParticipantsForCouple(c.id).length > 0).length;
                           coupleValue = quote.amountBrl / participatingCouples;
                         } else {
                           coupleValue = (quote.amountBrl / totalParticipating) * participatingMembers.length;
                         }

                         return (
                           <div 
                             key={couple.id}
                             className="p-3 rounded-lg border bg-indigo-600/5 border-indigo-600/30"
                           >
                             <div className="flex items-center justify-between mb-2">
                               <div>
                                 <p className="font-bold text-white text-sm">{couple.name}</p>
                                 <p className="text-xs text-gray-500">
                                   {participatingMembers.length} {participatingMembers.length === 1 ? 'pessoa' : 'pessoas'}
                                 </p>
                               </div>
                               <p className="text-lg font-black text-indigo-400">
                                 {formatCurrency(coupleValue)}
                               </p>
                             </div>
                             
                             {/* Nomes apenas das pessoas que participam */}
                             {participatingMembers.length > 0 && (
                               <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-800">
                                 {couple.members
                                   .filter(member => participatingMembers.includes(member.id))
                                   .map(member => (
                                     <span 
                                       key={member.id}
                                       className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                     >
                                       ✓ {member.name}
                                     </span>
                                   ))
                                 }
                               </div>
                             )}
                           </div>
                         );
                       })}
                     </div>
                   </Card>
                </div>

                {/* Coluna direita: Escopo e Observações (1/3) */}
                <div className="space-y-6">
                   {/* Escopo */}
                   {(quote.includes || quote.excludes) && (
                     <Card title="📋 Escopo">
                        {quote.includes && (
                          <div className="mb-4">
                             <p className="text-[10px] font-black text-emerald-500 uppercase mb-2">✓ Incluído</p>
                             <p className="text-sm text-gray-400 whitespace-pre-wrap">{quote.includes}</p>
                          </div>
                        )}
                        {quote.excludes && (
                          <div className={quote.includes ? 'pt-4 border-t border-gray-800' : ''}>
                             <p className="text-[10px] font-black text-red-500 uppercase mb-2">✕ Excluído</p>
                             <p className="text-sm text-gray-400 whitespace-pre-wrap">{quote.excludes}</p>
                          </div>
                        )}
                     </Card>
                   )}

                   {/* Observações */}
                   {(quote.notesGroup || quote.notesInternal) && (
                     <Card title="📝 Observações">
                        {quote.notesGroup && (
                          <div className="mb-4">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Notas do Grupo</p>
                            <p className="text-sm text-gray-400 whitespace-pre-wrap">{quote.notesGroup}</p>
                          </div>
                        )}
                        {quote.notesInternal && (
                          <div className={quote.notesGroup ? 'pt-4 border-t border-gray-800' : ''}>
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-2">🔒 Notas Internas</p>
                            <p className="text-sm text-gray-400 whitespace-pre-wrap">{quote.notesInternal}</p>
                          </div>
                        )}
                     </Card>
                   )}

                   {/* Última Atualização */}
                   <Card title="🕐 Atualização">
                      <p className="text-xs text-gray-400">Criado: {formatSupabaseDateTime(quote.createdAt)}</p>
                      <p className="text-xs text-gray-400">Atualizado: {formatSupabaseDateTime(quote.updatedAt)}</p>
                   </Card>
                </div>
             </div>
          </div>
        )}

        {/* ABA DADOS TÉCNICOS */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            {/* A. Informações do Orçamento */}
            <Card title="Informações do Orçamento">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase">Categoria</p>
                  <p className="text-sm text-white">{quote.category}</p>
                </div>
                {segment && (
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase">Segmento</p>
                    <p className="text-sm text-white">{segment.name}</p>
                    {segment.startDate && segment.endDate && (
                      <p className="text-xs text-gray-600">
                        {new Date(segment.startDate).toLocaleDateString('pt-BR')} - {new Date(segment.endDate).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase">Criado em</p>
                  <p className="text-sm text-white">{formatSupabaseDateTime(quote.createdAt)}</p>
                </div>
                {quote.completeness !== undefined && (
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase">Completude</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            quote.completeness === 100 ? 'bg-emerald-500' : 
                            quote.completeness >= 70 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${quote.completeness}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-white">{quote.completeness}%</span>
                    </div>
                  </div>
                )}
                {quote.validUntil && (
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase">Validade</p>
                    <p className="text-sm text-white">{new Date(quote.validUntil).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* B. Fornecedor */}
            <Card title="Fornecedor">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase">Nome</p>
                  <p className="text-sm text-white">{quote.provider}</p>
                </div>
                {quote.vendor_profile_id ? (
                  <Badge color="green">Fornecedor vinculado</Badge>
                ) : (
                  <div>
                    <Badge color="amber">Sem fornecedor</Badge>
                    {quote.source_type && (
                      <div className="mt-2">
                        <p className="text-[10px] font-black text-gray-500 uppercase">Fonte</p>
                        <p className="text-xs text-gray-400">
                          {quote.source_type === 'link' ? '🔗 Link' : 
                           quote.source_type === 'texto' ? '📄 Texto' : '✍️ Manual'}
                        </p>
                        {quote.source_value && quote.source_type === 'link' && (
                          <a href={quote.source_value} target="_blank" rel="noopener noreferrer" 
                             className="text-xs text-indigo-400 hover:text-indigo-300 underline break-all">
                            {quote.source_value}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {quote.linkUrl && (
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase">Link do Orçamento</p>
                    <a href={quote.linkUrl} target="_blank" rel="noopener noreferrer" 
                       className="text-sm text-indigo-400 hover:text-indigo-300 underline break-all">
                      {quote.linkUrl}
                    </a>
                  </div>
                )}
                {quote.tags && quote.tags.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {quote.tags.map(tag => (
                        <Badge key={tag} color="gray">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* C. Detalhes Financeiros */}
            <Card title="Detalhes Financeiros">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase">Moeda Original</p>
                  <p className="text-xl font-bold text-white">{quote.currency} {formatCurrency(quote.totalAmount)}</p>
                </div>
                {quote.currency !== Currency.BRL && (
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase">Câmbio Aplicado</p>
                    <p className="text-sm text-white">{formatCurrency(quote.exchangeRate)}</p>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-800">
                  <p className="text-[10px] font-black text-gray-500 uppercase">Total em BRL</p>
                  <p className="text-2xl font-black text-indigo-400">{formatCurrency(quote.amountBrl)}</p>
                </div>
                {quote.taxesFees && (
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase">Taxas e Impostos</p>
                    <p className="text-sm text-gray-400">{quote.taxesFees}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* D. Política de Cancelamento */}
            <Card title="Política de Cancelamento">
              <p className="text-sm text-gray-400 whitespace-pre-wrap">{quote.cancellationPolicy || 'Não informada'}</p>
            </Card>

            {/* Detalhes específicos por categoria */}
            {quote.hotelDetails && (
              <Card title="Detalhes do Hotel" className="lg:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quote.hotelDetails.checkin && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Check-in</p>
                      <p className="text-sm text-white">{new Date(quote.hotelDetails.checkin).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                  {quote.hotelDetails.checkout && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Check-out</p>
                      <p className="text-sm text-white">{new Date(quote.hotelDetails.checkout).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                  {quote.hotelDetails.roomType && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Tipo de Quarto</p>
                      <p className="text-sm text-white">{quote.hotelDetails.roomType}</p>
                    </div>
                  )}
                  {quote.hotelDetails.bedrooms && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Quartos</p>
                      <p className="text-sm text-white">{quote.hotelDetails.bedrooms}</p>
                    </div>
                  )}
                  {quote.hotelDetails.breakfastIncluded !== undefined && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Café da Manhã</p>
                      <Badge color={quote.hotelDetails.breakfastIncluded ? 'green' : 'red'}>
                        {quote.hotelDetails.breakfastIncluded ? 'Incluso' : 'Não incluso'}
                      </Badge>
                    </div>
                  )}
                  {quote.hotelDetails.location && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Localização</p>
                      <p className="text-sm text-white">{quote.hotelDetails.location}</p>
                    </div>
                  )}
                  {quote.hotelDetails.amenities && (
                    <div className="col-span-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Comodidades</p>
                      <div className="flex flex-wrap gap-1">
                        {quote.hotelDetails.amenities.split(',').map((a, i) => (
                          <Badge key={i} color="gray" className="text-[9px]">{a.trim()}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {quote.carDetails && (
              <Card title="Detalhes do Carro" className="lg:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quote.carDetails.pickupDateTime && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Retirada</p>
                      <p className="text-sm text-white">{new Date(quote.carDetails.pickupDateTime).toLocaleString('pt-BR')}</p>
                    </div>
                  )}
                  {quote.carDetails.dropoffDateTime && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Devolução</p>
                      <p className="text-sm text-white">{new Date(quote.carDetails.dropoffDateTime).toLocaleString('pt-BR')}</p>
                    </div>
                  )}
                  {quote.carDetails.carClass && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Classe</p>
                      <p className="text-sm text-white">{quote.carDetails.carClass}</p>
                    </div>
                  )}
                  {quote.carDetails.deductible !== undefined && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Franquia</p>
                      <p className="text-sm text-white">{formatCurrency(quote.carDetails.deductible)}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {quote.ticketDetails && (
              <Card title="Detalhes dos Ingressos" className="lg:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quote.ticketDetails.kind && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Tipo</p>
                      <p className="text-sm text-white">{quote.ticketDetails.kind}</p>
                    </div>
                  )}
                  {quote.ticketDetails.adultQty !== undefined && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Adultos</p>
                      <p className="text-sm text-white">{quote.ticketDetails.adultQty} × {formatCurrency(quote.ticketDetails.adultPrice || 0)}</p>
                    </div>
                  )}
                  {quote.ticketDetails.childQty !== undefined && quote.ticketDetails.childQty > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Crianças</p>
                      <p className="text-sm text-white">{quote.ticketDetails.childQty} × {formatCurrency(quote.ticketDetails.childPrice || 0)}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ABA PAGAMENTO */}
        {activeTab === 'payment' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <Card title="Condições de Pagamento">
              <div className="space-y-4">
                {quote.paymentTerms?.methods && quote.paymentTerms.methods.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Métodos Aceitos</p>
                    <div className="flex flex-wrap gap-2">
                      {quote.paymentTerms.methods.map((method: string) => (
                        <Badge key={method} color="indigo">{method}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {quote.paymentTerms?.installments && (
                  <div className="pt-4 border-t border-gray-800">
                    <p className="text-[10px] font-black text-gray-500 uppercase">Parcelamento</p>
                    <p className="text-2xl font-black text-white">{quote.paymentTerms.installments}x</p>
                    {quote.paymentTerms.installmentValue && (
                      <p className="text-sm text-gray-400">de {formatCurrency(quote.paymentTerms.installmentValue)}</p>
                    )}
                  </div>
                )}
                {quote.paymentTerms?.cashDiscount && (
                  <div className="pt-4 border-t border-gray-800">
                    <p className="text-[10px] font-black text-gray-500 uppercase">Desconto à Vista</p>
                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(quote.paymentTerms.cashDiscount)}</p>
                    <p className="text-xs text-gray-600">
                      Total à vista: {formatCurrency(quote.amountBrl - quote.paymentTerms.cashDiscount)}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {quote.taxesFees && (
              <Card title="Taxas e Impostos">
                <p className="text-sm text-gray-400 whitespace-pre-wrap">{quote.taxesFees}</p>
              </Card>
            )}

            <Card title="Resumo Financeiro" className="lg:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-950 rounded-xl">
                  <p className="text-[10px] font-black text-gray-500 uppercase">Valor Base</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(quote.totalAmount * quote.exchangeRate)}</p>
                </div>
                {quote.taxesFees && (
                  <div className="p-4 bg-gray-950 rounded-xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase">Taxas</p>
                    <p className="text-xl font-bold text-amber-400">+ Consultar</p>
                  </div>
                )}
                {quote.paymentTerms?.cashDiscount && (
                  <div className="p-4 bg-gray-950 rounded-xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase">Desconto</p>
                    <p className="text-xl font-bold text-emerald-400">- {formatCurrency(quote.paymentTerms.cashDiscount)}</p>
                  </div>
                )}
                <div className="p-4 bg-indigo-600/20 rounded-xl border border-indigo-600/30">
                  <p className="text-[10px] font-black text-indigo-400 uppercase">Total Final</p>
                  <p className="text-2xl font-black text-white">{formatCurrency(quote.amountBrl)}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ABA VARIAÇÕES/OPÇÕES */}
        {activeTab === 'variations' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             {/* Explicação */}
             <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">💡</div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">O que são Variações?</h4>
                    <p className="text-sm text-gray-400">
                      Variações são opções alternativas do mesmo orçamento. Por exemplo: "Com seguro" vs "Sem seguro", 
                      ou "Quarto Standard" vs "Quarto Deluxe". Use variações para comparar diferentes configurações 
                      do mesmo fornecedor sem perder o histórico.
                    </p>
                  </div>
                </div>
             </div>

             <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                  Outras Opções Vinculadas ({variations.length})
                </h3>
                <Button variant="primary" onClick={() => setIsVariationOpen(true)}>+ Criar Variação</Button>
             </div>

             {variations.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {variations.map(v => {
                    const priceDiff = v.amountBrl - quote.amountBrl;
                    const isMoreExpensive = priceDiff > 0;
                    
                    return (
                      <Card 
                        key={v.id} 
                        onClick={() => onNavigateToQuote(v.id)} 
                        className="cursor-pointer hover:border-indigo-500 transition-all border-2 !p-0 overflow-hidden group"
                      >
                        <div className="p-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <Badge color="indigo" className="text-[9px]">{v.variationLabel || 'Variação'}</Badge>
                            <Badge color={v.status === QuoteStatus.CHOSEN ? 'green' : 'gray'} className="text-[9px]">
                              {v.status}
                            </Badge>
                          </div>
                          
                          <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {cleanText(v.title)}
                          </h4>
                          
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-2xl font-black text-indigo-400">{formatCurrency(v.amountBrl)}</p>
                              <p className="text-xs text-gray-600">Por pessoa: {formatCurrency(v.amountBrl / participantCount)}</p>
                            </div>
                            
                            {priceDiff !== 0 && (
                              <div className={`text-right ${isMoreExpensive ? 'text-red-400' : 'text-emerald-400'}`}>
                                <p className="text-sm font-bold">
                                  {isMoreExpensive ? '+' : ''}{formatCurrency(priceDiff)}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {isMoreExpensive ? 'mais caro' : 'mais barato'}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Diferenças visuais */}
                          <div className="pt-4 border-t border-gray-800">
                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Diferenças:</p>
                            <div className="space-y-1">
                              {priceDiff !== 0 && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className={isMoreExpensive ? 'text-red-400' : 'text-emerald-400'}>
                                    {isMoreExpensive ? '💰' : '💵'}
                                  </span>
                                  <span className="text-gray-400">
                                    {formatCurrency(Math.abs(priceDiff))} {isMoreExpensive ? 'mais caro' : 'de economia'}
                                  </span>
                                </div>
                              )}
                              {v.linkUrl !== quote.linkUrl && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-indigo-400">🔗</span>
                                  <span className="text-gray-400">Link/opção diferente</span>
                                </div>
                              )}
                              {v.validUntil !== quote.validUntil && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-amber-400">📅</span>
                                  <span className="text-gray-400">Validade diferente</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
               </div>
             ) : (
               <div className="text-center py-20 bg-gray-900/50 rounded-xl border border-gray-800 border-dashed">
                 <div className="text-5xl mb-4 opacity-20">🔀</div>
                 <p className="text-gray-600 italic mb-4">Nenhuma variação criada ainda.</p>
                 <Button variant="primary" onClick={() => setIsVariationOpen(true)}>
                   Criar Primeira Variação
                 </Button>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Modal Reprecificação */}
      <Modal isOpen={isUpdatePriceOpen} onClose={() => setIsUpdatePriceOpen(false)} title="Atualizar Valores Rápido">
         <form onSubmit={handleUpdatePrice} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <Input label="Valor Original" name="totalAmount" type="number" step="0.01" defaultValue={quote.totalAmount} />
               <Input label="Câmbio" name="exchangeRate" type="number" step="0.01" defaultValue={quote.exchangeRate} />
            </div>
            <Input label="Nova Validade" name="validUntil" type="date" defaultValue={dateToInput(quote.validUntil)} />
            <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
               <Button variant="ghost" type="button" onClick={() => setIsUpdatePriceOpen(false)}>Cancelar</Button>
               <Button variant="primary" type="submit">Atualizar</Button>
            </div>
         </form>
      </Modal>

      {/* Modal Criar Variação */}
      <Modal isOpen={isVariationOpen} onClose={() => setIsVariationOpen(false)} title="Criar Nova Variação">
         <form onSubmit={handleCreateVariation} className="space-y-4">
            <Input 
              label="Nome da Variação" 
              name="label" 
              placeholder="Ex: Com Seguro Total, Incluindo Café, Quarto Deluxe..." 
              required 
            />
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl">
              <p className="text-xs text-gray-400">
                💡 Iremos copiar todos os dados do orçamento atual para uma nova variação vinculada. 
                Você poderá editar os detalhes depois.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
               <Button variant="ghost" type="button" onClick={() => setIsVariationOpen(false)}>Cancelar</Button>
               <Button variant="primary" type="submit">Gerar Variação</Button>
            </div>
         </form>
      </Modal>

      {/* Modal Ajustar Participantes */}
      <Modal 
        isOpen={isAdjustingParticipants} 
        onClose={() => setIsAdjustingParticipants(false)}
        title="Ajustar Quem Vai Usar"
        size="lg"
      >
        <div className="space-y-6">
          {/* Explicação */}
          <div className="bg-amber-600/10 border border-amber-500/20 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-sm text-gray-400">
                  Marque apenas as pessoas que vão usar este serviço. Por exemplo: se é ingresso só para adultos, 
                  desmarque as crianças. Se é aluguel de carro e só uma pessoa vai dirigir, marque apenas ela.
                </p>
              </div>
            </div>
          </div>

          {/* Resumo rápido */}
          <div className="bg-indigo-600/10 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pessoas selecionadas</p>
              <p className="text-2xl font-black text-white">
                {trip.couples.reduce((sum, couple) => {
                  const participants = getModalParticipants(couple.id);
                  return sum + participants.length;
                }, 0)} de {totalPeople}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Valor por pessoa</p>
              <p className="text-xl font-bold text-indigo-400">
                {formatCurrency(quote.amountBrl / Math.max(1, trip.couples.reduce((sum, couple) => {
                  return sum + getModalParticipants(couple.id).length;
                }, 0)))}
              </p>
            </div>
          </div>

          {/* Lista de casais e membros */}
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {trip.couples.map(couple => {
              const participatingMembers = getModalParticipants(couple.id);
              const allSelected = participatingMembers.length === couple.members.length;
              const someSelected = participatingMembers.length > 0 && !allSelected;

              return (
                <div key={couple.id} className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                  {/* Header do casal com checkbox para selecionar todos */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800">
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => toggleCouple(couple.id)}
                          className="w-5 h-5 accent-indigo-500 cursor-pointer"
                        />
                        {someSelected && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-2.5 h-0.5 bg-indigo-500"></div>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white">{couple.name}</p>
                        <p className="text-xs text-gray-500">
                          {participatingMembers.length} de {couple.members.length} {couple.members.length === 1 ? 'pessoa' : 'pessoas'}
                        </p>
                      </div>
                    </label>
                    {participatingMembers.length > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-400">
                          {formatCurrency((quote.amountBrl / Math.max(1, trip.couples.reduce((sum, c) => {
                            return sum + getModalParticipants(c.id).length;
                          }, 0))) * participatingMembers.length)}
                        </p>
                        <p className="text-xs text-gray-600">subtotal</p>
                      </div>
                    )}
                  </div>

                  {/* Lista de membros */}
                  <div className="space-y-2 pl-8">
                    {couple.members.map(member => {
                      const isUsing = participatingMembers.includes(member.id);
                      const valuePerPerson = quote.amountBrl / Math.max(1, trip.couples.reduce((sum, c) => {
                        return sum + getModalParticipants(c.id).length;
                      }, 0));

                      return (
                        <label 
                          key={member.id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                            isUsing 
                              ? 'bg-indigo-600/10 hover:bg-indigo-600/20' 
                              : 'hover:bg-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isUsing}
                              onChange={() => toggleMember(couple.id, member.id)}
                              className="w-4 h-4 accent-indigo-500 cursor-pointer"
                            />
                            <div>
                              <span className={`text-sm ${isUsing ? 'text-white font-medium' : 'text-gray-500'}`}>
                                {member.name}
                              </span>
                              {member.isChild && (
                                <Badge color="gray" className="ml-2 text-[9px]">Criança</Badge>
                              )}
                            </div>
                          </div>
                          {isUsing && (
                            <span className="text-xs text-indigo-400 font-bold">
                              {formatCurrency(valuePerPerson)}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer com ações */}
          <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Total do orçamento</p>
              <p className="text-2xl font-black text-white">{formatCurrency(quote.amountBrl)}</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsAdjustingParticipants(false);
                  initializeCustomParticipants(); // Restaura estado original
                }}
              >
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSaveParticipants}>
                Salvar Ajustes
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuoteDetailView;
