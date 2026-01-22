
import React, { useState } from 'react';
import { Trip, Quote, QuoteStatus, Currency, Vendor } from '../types';
import { Card, Badge, Button, Input, Modal } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';
import WhatsAppImportModal from './WhatsAppImportModal';
import { ParsedQuoteBlock } from '../lib/whatsapp/parseWhatsAppQuotes';

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    vendor: 'all'
  });

  const filteredQuotes = quotes.filter(q => {
    return (filters.category === 'all' || q.category === filters.category) &&
           (filters.status === 'all' || q.status === (filters.status as any));
  });

  const handleImportFinalize = async (blocks: ParsedQuoteBlock[]) => {
    for (const block of blocks) {
      await dataProvider.saveQuoteFromWhatsApp(trip.id, block);
    }
    setIsImportModalOpen(false);
    onRefresh();
    alert(`${blocks.length} orçamentos importados!`);
  };

  const toggleSelect = (e: React.MouseEvent | React.ChangeEvent, id: string) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      if (selectedIds.length >= 5) return alert('Máximo de 5 orçamentos para comparar.');
      setSelectedIds(prev => [...prev, id]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Orçamentos</h2>
          <p className="text-gray-500">Compare fornecedores e prepare a votação</p>
        </div>
        <div className="flex gap-2 relative">
           <Button variant={isCompareMode ? 'primary' : 'outline'} onClick={() => { setIsCompareMode(!isCompareMode); setSelectedIds([]); }}>
             {isCompareMode ? 'Sair Comparador' : 'Modo Comparar'}
           </Button>
           
           <div className="relative group">
              <Button variant="primary" onClick={() => setShowDropdown(!showDropdown)}>
                + Nova Opção ▾
              </Button>
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                   <button onClick={() => { setShowDropdown(false); onNavigateToWizard(); }} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-300 hover:bg-gray-800 hover:text-white border-b border-gray-800 transition-colors">
                      ✏️ Lançamento Manual
                   </button>
                   <button onClick={() => { setShowDropdown(false); setIsImportModalOpen(true); }} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                      💬 Importar do WhatsApp
                   </button>
                </div>
              )}
           </div>
        </div>
      </header>

      {/* Mesma seção de filtros anterior... */}
      <Card className="!p-4 bg-gray-900/40 border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Input as="select" label="Categoria" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
              <option value="all">Todas</option>
              {trip.categories.map(c => <option key={c} value={c}>{c}</option>)}
           </Input>
           <Input as="select" label="Status" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option value="all">Todos</option>
              {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
           </Input>
           <Input as="select" label="Fornecedor" value={filters.vendor} onChange={e => setFilters({...filters, vendor: e.target.value})}>
              <option value="all">Todos</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
           </Input>
           <div className="flex items-end">
              <Button variant="ghost" className="w-full text-xs" onClick={() => setFilters({category:'all', status:'all', vendor:'all'})}>Limpar</Button>
           </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {filteredQuotes.map(quote => {
          const isSelected = selectedIds.includes(quote.id);
          return (
            <Card 
              key={quote.id} 
              className={`group transition-all cursor-pointer flex flex-col border-2 ${isSelected ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-800 hover:border-gray-700'}`} 
              onClick={(e) => isCompareMode ? toggleSelect(e, quote.id) : onNavigateToQuote(quote.id)}
            >
              <div className="flex justify-between mb-4">
                 <div className="flex items-center gap-2">
                    {isCompareMode && (
                       <input 
                         type="checkbox" 
                         className="w-5 h-5 accent-indigo-500 rounded cursor-pointer" 
                         checked={isSelected}
                         onChange={(e) => toggleSelect(e, quote.id)}
                         onClick={(e) => e.stopPropagation()}
                       />
                    )}
                    <Badge color="indigo">{quote.category}</Badge>
                 </div>
                 <Badge color={quote.status === QuoteStatus.CHOSEN ? 'green' : 'gray'}>{quote.status}</Badge>
              </div>
              <h3 className="text-xl font-black text-white mb-1 leading-tight uppercase group-hover:text-indigo-400 transition-colors">{quote.title}</h3>
              <div className="flex items-center gap-2 mb-4">
                {quote.vendor_profile_id ? (
                  <p className="text-xs text-gray-600 font-bold">{quote.provider}</p>
                ) : (
                  <>
                    <Badge color="amber" className="text-[9px]">Sem fornecedor</Badge>
                    <p className="text-xs text-gray-500">
                      Fonte: {quote.source_type === 'link' ? '🔗' : quote.source_type === 'texto' ? '📄' : '✍️'} 
                      {quote.source_type}
                    </p>
                  </>
                )}
              </div>
              
              <div className="mt-auto bg-gray-950 p-4 rounded-xl border border-gray-800 mb-4 group-hover:bg-indigo-600/5 transition-colors">
                 <p className="text-2xl font-black text-indigo-400">R$ {quote.amountBrl.toLocaleString('pt-BR')}</p>
                 <p className="text-[10px] text-gray-700 uppercase font-black">Total Calculado</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Importar do WhatsApp">
         <WhatsAppImportModal 
            trip={trip} 
            onClose={() => setIsImportModalOpen(false)} 
            onImport={handleImportFinalize}
            onEditBlock={(block) => {
               setIsImportModalOpen(false);
               onNavigateToWizard(block.suggestedQuote);
            }}
         />
      </Modal>

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
    </div>
  );
};

export default QuoteList;
