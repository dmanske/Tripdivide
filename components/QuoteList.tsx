
import React, { useState } from 'react';
import { Trip, Quote, QuoteStatus, Currency, Vendor } from '../types';
import { Card, Badge, Button, Input, Modal } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import { formatCurrency } from '../lib/formatters';
import WhatsAppImportModal from './WhatsAppImportModal';
import WhatsAppQuoteImportModal from './WhatsAppQuoteImportModal';
import LinkQuoteImportModal from './LinkQuoteImportModal';
import { ParsedQuoteBlock } from '../lib/whatsapp/parseWhatsAppQuotes';
import { getQuoteSummary } from '../lib/whatsapp/universalQuoteParser';

interface QuoteListProps {
  trip: Trip;
  vendors: Vendor[];
  quotes: Quote[];
  onRefresh: () => void;
  onNavigateToQuote: (id: string) => void;
  onNavigateToWizard: (initialData?: Partial<Quote>) => void;
  onNavigateToCompare: (ids: string[]) => void;
}

const QuoteList: React.FC<QuoteListProps> = ({ trip, vendors, quotes, onRefresh, onNavigateToQuote, onNavigateToWizard, onNavigateToCompare }) => {
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isWhatsAppQuoteImportOpen, setIsWhatsAppQuoteImportOpen] = useState(false);
  const [isLinkImportOpen, setIsLinkImportOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    vendor: 'all'
  });

  // Função para limpar texto de emojis e quebras de linha
  const cleanText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
      .replace(/[\n\r]+/g, ' ') // Remove quebras de linha
      .replace(/\s+/g, ' ') // Remove espaços múltiplos
      .trim();
  };

  const filteredQuotes = quotes.filter(q => {
    const categoryMatch = filters.category === 'all' || q.category === filters.category;
    const statusMatch = filters.status === 'all' || q.status === (filters.status as any);
    const vendorMatch = filters.vendor === 'all' || q.vendor_profile_id === filters.vendor || q.provider === filters.vendor;
    
    return categoryMatch && statusMatch && vendorMatch;
  });

  const handleImportFinalize = async (blocks: ParsedQuoteBlock[]) => {
    for (const block of blocks) {
      await dataProvider.saveQuoteFromWhatsApp(trip.id, block);
    }
    setIsImportModalOpen(false);
    onRefresh();
    setSuccessMessage(`${blocks.length} orçamentos importados com sucesso!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const toggleSelect = (e: React.MouseEvent | React.ChangeEvent, id: string) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      if (selectedIds.length >= 5) {
        setSuccessMessage('⚠️ Máximo de 5 orçamentos para comparar');
        setTimeout(() => setSuccessMessage(null), 3000);
        return;
      }
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabaseDataProvider.deleteQuote(id);
      setConfirmDelete(null);
      onRefresh();
      setSuccessMessage('Orçamento excluído com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao deletar orçamento:', error);
      setSuccessMessage('❌ Erro ao excluir orçamento');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Mensagem de sucesso */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg animate-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-bold">{successMessage}</p>
        </div>
      )}
      
      {/* Header com gradiente premium */}
      <div className="relative rounded-2xl bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-600/30 p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                💰
              </div>
              <div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Orçamentos</h2>
                <p className="text-sm text-indigo-300 mt-1">Compare fornecedores e prepare a votação</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => { setIsCompareMode(!isCompareMode); setSelectedIds([]); }}
              className={isCompareMode ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold border-2 border-indigo-400/50' : 'bg-gray-900/50 hover:bg-gray-900/70 text-white font-bold border-2 border-gray-700 backdrop-blur-sm'}
            >
              {isCompareMode ? '✓ Sair Comparador' : '⚖️ Modo Comparar'}
            </Button>
           
            <div className="relative">
              <Button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-xl border-2 border-indigo-400/50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nova Opção ▾
              </Button>
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                   <button onClick={() => { setShowDropdown(false); onNavigateToWizard(); }} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-300 hover:bg-gray-800 hover:text-white border-b border-gray-800 transition-colors flex items-center gap-3">
                      <span className="text-xl">✏️</span>
                      <div>
                        <div>Lançamento Manual</div>
                        <div className="text-xs text-gray-600 font-normal">Criar do zero</div>
                      </div>
                   </button>
                   <button onClick={() => { setShowDropdown(false); setIsWhatsAppQuoteImportOpen(true); }} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-300 hover:bg-gray-800 hover:text-white border-b border-gray-800 transition-colors flex items-center gap-3">
                      <span className="text-xl">📱</span>
                      <div>
                        <div>Importar do WhatsApp</div>
                        <div className="text-xs text-gray-600 font-normal">Cole conversas</div>
                      </div>
                   </button>
                   <button onClick={() => { setShowDropdown(false); setIsLinkImportOpen(true); }} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-3">
                      <span className="text-xl">🔗</span>
                      <div>
                        <div>Importar de Site/Link</div>
                        <div className="text-xs text-gray-600 font-normal">URL de hotel, etc</div>
                      </div>
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="!p-6 !bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 !border-indigo-600/30 hover:!border-indigo-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">{quotes.length}</div>
              <div className="text-xs text-indigo-400 mt-2 uppercase font-bold tracking-wider">Total</div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-indigo-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              💰
            </div>
          </div>
        </Card>

        <Card className="!p-6 !bg-gradient-to-br from-green-600/20 to-green-600/5 !border-green-600/30 hover:!border-green-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">
                {quotes.filter(q => q.status === QuoteStatus.CHOSEN).length}
              </div>
              <div className="text-xs text-green-400 mt-2 uppercase font-bold tracking-wider">Escolhidos</div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-green-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              ✓
            </div>
          </div>
        </Card>

        <Card className="!p-6 !bg-gradient-to-br from-amber-600/20 to-amber-600/5 !border-amber-600/30 hover:!border-amber-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">
                {quotes.filter(q => q.status === QuoteStatus.ANALYSIS).length}
              </div>
              <div className="text-xs text-amber-400 mt-2 uppercase font-bold tracking-wider">Em Análise</div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-amber-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              🔍
            </div>
          </div>
        </Card>

        <Card className="!p-6 !bg-gradient-to-br from-purple-600/20 to-purple-600/5 !border-purple-600/30 hover:!border-purple-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">
                R$ {formatCurrency(quotes.reduce((sum, q) => sum + (q.amountBrl || 0), 0))}
              </div>
              <div className="text-xs text-purple-400 mt-2 uppercase font-bold tracking-wider">Valor Total</div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-purple-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              💵
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros premium */}
      <Card className="!p-6 bg-gradient-to-r from-gray-900/60 to-gray-900/40 border-gray-800 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <select 
             value={filters.category} 
             onChange={e => setFilters({...filters, category: e.target.value})}
             className="px-4 py-3 bg-gray-950/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
           >
              <option value="all">📂 Todas as categorias</option>
              {trip.categories.map(c => <option key={c} value={c}>{c}</option>)}
           </select>
           <select 
             value={filters.status} 
             onChange={e => setFilters({...filters, status: e.target.value})}
             className="px-4 py-3 bg-gray-950/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
           >
              <option value="all">🏷️ Todos os status</option>
              {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
           </select>
           <select 
             value={filters.vendor} 
             onChange={e => setFilters({...filters, vendor: e.target.value})}
             className="px-4 py-3 bg-gray-950/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
           >
              <option value="all">🏢 Todos os fornecedores</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
           </select>
           <Button 
             onClick={() => setFilters({category:'all', status:'all', vendor:'all'})}
             className="bg-gray-800 hover:bg-gray-700 text-white font-bold"
           >
             Limpar Filtros
           </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {filteredQuotes.map(quote => {
          const isSelected = selectedIds.includes(quote.id);
          const totalPeople = trip.couples.reduce((sum, c) => sum + c.members.length, 0);
          const perPerson = quote.amountBrl / totalPeople;
          const segment = trip.segments.find(s => s.id === quote.segmentId);
          const hasVariations = quotes.some(q => q.originalId === quote.id || (quote.originalId && q.originalId === quote.originalId && q.id !== quote.id));
          
          return (
            <Card 
              key={quote.id} 
              className={`!p-0 group transition-all overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/20 ${isSelected ? '!border-indigo-500 bg-indigo-500/5' : '!border-gray-800 hover:!border-indigo-500'}`}
            >
              {/* Gradiente de fundo sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

              <div className="relative">
                {/* Header com badges */}
                <div className="p-4 pb-0 flex justify-between items-start">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isCompareMode && (
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-indigo-500 rounded cursor-pointer" 
                        checked={isSelected}
                        onChange={(e) => toggleSelect(e, quote.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <Badge color="indigo" className="text-[9px]">{quote.category}</Badge>
                    {hasVariations && <Badge color="purple" className="text-[9px]">🔀 Variações</Badge>}
                    {quote.completeness && quote.completeness < 100 && (
                      <Badge color={quote.completeness >= 70 ? 'amber' : 'red'} className="text-[9px]">
                        {quote.completeness}%
                      </Badge>
                    )}
                  </div>
                  
                  {/* Mostrar grupos participantes ou status */}
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {quote.participantIds && quote.participantIds.length > 0 && !quote.participantIds.includes('ALL') ? (
                      // Mostrar nomes dos grupos
                      quote.participantIds.map(coupleId => {
                        const couple = trip.couples.find(c => c.id === coupleId);
                        return couple ? (
                          <Badge key={coupleId} color="purple" className="text-[9px]">
                            {couple.name}
                          </Badge>
                        ) : null;
                      })
                    ) : (
                      // Mostrar status se não houver grupos específicos
                      <Badge color={quote.status === QuoteStatus.CHOSEN ? 'green' : quote.status === QuoteStatus.SHORTLIST ? 'amber' : 'gray'} className="text-[9px]">
                        {quote.status}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Área clicável principal */}
                <div 
                  onClick={() => isCompareMode ? toggleSelect(null as any, quote.id) : onNavigateToQuote(quote.id)}
                  className="cursor-pointer p-4 space-y-4"
                >
                  {/* Título */}
                  <h3 className="text-lg font-black text-white leading-tight group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {cleanText(quote.title)}
                  </h3>

                  {/* Fornecedor e Segmento */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">🏢</span>
                      {quote.vendor_profile_id ? (
                        <p className="text-xs text-gray-400 font-bold truncate">{quote.provider}</p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge color="amber" className="text-[9px]">Sem fornecedor</Badge>
                          <span className="text-xs text-gray-600">
                            {quote.source_type === 'link' ? '🔗' : quote.source_type === 'texto' ? '📄' : '✍️'}
                          </span>
                        </div>
                      )}
                    </div>
                    {segment && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">📍</span>
                        <p className="text-xs text-gray-500 truncate">{segment.name}</p>
                      </div>
                    )}
                  </div>

                  {/* Valores - Destaque */}
                  <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 p-4 rounded-xl border border-indigo-600/20 group-hover:border-indigo-500/40 transition-all">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Total</p>
                        <p className="text-2xl font-black text-white">{formatCurrency(quote.amountBrl)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Por Pessoa</p>
                        <p className="text-lg font-bold text-indigo-400">{formatCurrency(perPerson)}</p>
                      </div>
                    </div>
                    
                    {/* Moeda original se diferente de BRL */}
                    {quote.currency !== Currency.BRL && (
                      <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          {quote.currency} {formatCurrency(quote.totalAmount)}
                        </span>
                        <span className="text-xs text-gray-600">
                          Câmbio: {formatCurrency(quote.exchangeRate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Informações extras */}
                  <div className="flex items-center justify-between text-xs">
                    {/* Micro-resumo estruturado se tiver details_json */}
                    {quote.details_json && (
                      <div className="flex items-center gap-1 text-indigo-400 font-bold">
                        <span>📊</span>
                        <span>{getQuoteSummary(quote.category as any, quote.details_json)}</span>
                      </div>
                    )}
                    {quote.validUntil && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <span>⏰</span>
                        <span>Válido até {new Date(quote.validUntil).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                      </div>
                    )}
                    {quote.participantIds && quote.participantIds.length > 0 && !quote.participantIds.includes('ALL') && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <span>👥</span>
                        <span>{quote.participantIds.length} {quote.participantIds.length === 1 ? 'grupo' : 'grupos'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer com ações */}
                <div className="p-4 pt-0 border-t border-gray-800/50 mt-4">
                  <div className="flex gap-2">
                    <Button 
                      onClick={(e) => { e.stopPropagation(); onNavigateToQuote(quote.id); }} 
                      className="flex-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 !py-2 !text-xs font-bold border border-indigo-600/30"
                    >
                      Ver Detalhes →
                    </Button>
                    <Button 
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(quote.id); }} 
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-400 !py-2 !px-3 !text-xs font-bold border border-red-600/30"
                      title="Excluir orçamento"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <Modal isOpen={true} onClose={() => setConfirmDelete(null)}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center text-xl">
                ⚠️
              </div>
              <h3 className="text-lg font-bold text-white">Confirmar Exclusão</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Tem certeza que deseja <span className="font-bold text-red-400">excluir permanentemente</span> este orçamento? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setConfirmDelete(null)} className="bg-gray-800 hover:bg-gray-700 !py-2 !text-sm">
                Cancelar
              </Button>
              <Button onClick={() => handleDelete(confirmDelete)} className="bg-red-600 hover:bg-red-700 !py-2 !text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Sim, Excluir
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Floating bar para comparação... */}
      {isCompareMode && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
           <div className="bg-gray-900 border-2 border-indigo-500 rounded-2xl shadow-2xl p-4 flex items-center gap-6 backdrop-blur-md">
              <div className="flex flex-col">
                 <p className="text-white font-black text-sm uppercase">{selectedIds.length} Selecionadas</p>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Limite de 5 itens</p>
              </div>
              <div className="h-10 w-px bg-gray-800" />
              <div className="flex gap-2">
                 <Button variant="ghost" onClick={() => setSelectedIds([])}>Limpar</Button>
                 <Button 
                   variant="primary" 
                   disabled={selectedIds.length < 2} 
                   onClick={() => onNavigateToCompare(selectedIds)}
                 >
                   Comparar Agora ➔
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* Modal de importação WhatsApp (novo) */}
      {isWhatsAppQuoteImportOpen && (
        <WhatsAppQuoteImportModal
          trip={trip}
          onClose={() => setIsWhatsAppQuoteImportOpen(false)}
          onImported={() => {
            setIsWhatsAppQuoteImportOpen(false);
            onRefresh();
            setSuccessMessage('✓ Orçamentos importados com sucesso!');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}

      {/* Modal de importação por Link (novo) */}
      {isLinkImportOpen && (
        <LinkQuoteImportModal
          trip={trip}
          onClose={() => setIsLinkImportOpen(false)}
          onImported={() => {
            setIsLinkImportOpen(false);
            onRefresh();
            setSuccessMessage('✓ Orçamento importado com sucesso!');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}
    </div>
  );
};

export default QuoteList;
