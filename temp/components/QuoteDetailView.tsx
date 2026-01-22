
import React, { useState, useEffect } from 'react';
import { Trip, Quote, QuoteStatus, Currency, Vendor, PaymentMethod, QuoteVersion } from '../types';
import { Card, Badge, Button, Modal, Input } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';
import { formatSupabaseDateTime, dateToInput } from '../lib/formatters';

interface QuoteDetailViewProps {
  trip: Trip;
  quote: Quote;
  vendor?: Vendor;
  onEdit: () => void;
  onBack: () => void;
  onRefresh: () => void;
  onNavigateToExpense: () => void;
  onNavigateToQuote: (id: string) => void;
}

const QuoteDetailView: React.FC<QuoteDetailViewProps> = ({ trip, quote, vendor, onEdit, onBack, onRefresh, onNavigateToExpense, onNavigateToQuote }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'audit' | 'variations' | 'payment'>('summary');
  const [versions, setVersions] = useState<QuoteVersion[]>([]);
  const [variations, setVariations] = useState<Quote[]>([]);
  const [isUpdatePriceOpen, setIsUpdatePriceOpen] = useState(false);
  const [isVariationOpen, setIsVariationOpen] = useState(false);
  const [parentQuote, setParentQuote] = useState<Quote | null>(null);

  useEffect(() => {
    loadAuditData();
  }, [quote.id]);

  const loadAuditData = async () => {
    const [vList, qList] = await Promise.all([
      dataProvider.getQuoteVersions(quote.id),
      dataProvider.getQuotes(trip.id)
    ]);
    setVersions(vList);
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
    loadAuditData();
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
    if (quote.totalAmount !== parentQuote.totalAmount) diffs.push(`Preço: ${quote.totalAmount} vs ${parentQuote.totalAmount}`);
    if (quote.linkUrl !== parentQuote.linkUrl) diffs.push(`Link/Opção diferente`);
    return diffs;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
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
                 <p className="text-xs text-gray-400">Esta é uma opção alternativa de <span className="text-white font-bold cursor-pointer hover:underline" onClick={() => onNavigateToQuote(quote.originalId!)}>{parentQuote?.title}</span></p>
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
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{quote.title}</h1>
            <p className="text-lg text-gray-500 font-medium">{quote.provider}</p>
         </div>
         <div className="flex gap-4">
            <div className="text-right">
               <p className="text-[10px] font-black text-gray-600 uppercase">Total BRL</p>
               <p className="text-3xl font-black text-indigo-400">R$ {quote.amountBrl.toLocaleString('pt-BR')}</p>
            </div>
         </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 overflow-x-auto">
        {(['summary', 'details', 'audit', 'variations', 'payment'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab === 'summary' ? 'Resumo' : tab === 'details' ? 'Dados Técnicos' : tab === 'audit' ? 'Auditoria' : tab === 'variations' ? 'Opções' : 'Pagamento'}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
             <div className="lg:col-span-2 space-y-6">
                <Card title="Escopo e Notas">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                         <p className="text-[10px] font-black text-emerald-500 uppercase">✓ Inclusões</p>
                         <p className="text-sm text-gray-400">{quote.includes || 'N/D'}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-red-500 uppercase">✕ Exclusões</p>
                         <p className="text-sm text-gray-400">{quote.excludes || 'N/D'}</p>
                      </div>
                   </div>
                </Card>
             </div>
             <div className="space-y-6">
                <Card title="Última Atualização">
                   <p className="text-xs text-gray-400">Pelo usuário: <span className="text-white font-bold">{quote.createdBy}</span></p>
                   <p className="text-xs text-gray-400">Em: {formatSupabaseDateTime(quote.updatedAt)}</p>
                </Card>
             </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Linha do Tempo de Alterações</h3>
             <div className="space-y-4">
                {versions.map(v => (
                  <Card key={v.id} className="!p-4 bg-gray-900/50">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">V</div>
                           <div>
                              <p className="text-sm font-black text-white">{formatSupabaseDateTime(v.createdAt)}</p>
                              <p className="text-[10px] text-gray-600 uppercase">Alterado por {v.createdBy}</p>
                           </div>
                        </div>
                        <Button variant="ghost" className="text-[10px] py-1" onClick={async () => {
                          if (confirm('Deseja restaurar esta versão?')) {
                             await dataProvider.restoreQuoteVersion(v.id);
                             onRefresh();
                             loadAuditData();
                          }
                        }}>Restaurar Versão</Button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {v.changes.map((c, i) => (
                          <div key={i} className="text-xs p-2 bg-gray-950 rounded border border-gray-800">
                             <p className="font-bold text-gray-500 uppercase text-[9px] mb-1">{c.label}</p>
                             <div className="flex items-center gap-2">
                                <span className="text-red-500 line-through">{c.old}</span>
                                <span className="text-gray-600">→</span>
                                <span className="text-emerald-500 font-bold">{c.new}</span>
                             </div>
                          </div>
                        ))}
                     </div>
                  </Card>
                ))}
                {versions.length === 0 && <p className="text-center py-20 text-gray-600 italic">Nenhuma alteração registrada ainda.</p>}
             </div>
          </div>
        )}

        {activeTab === 'variations' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Outras Opções Vinculadas</h3>
                <Button variant="primary" onClick={() => setIsVariationOpen(true)}>+ Criar Variação</Button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {variations.map(v => (
                   <Card key={v.id} onClick={() => onNavigateToQuote(v.id)} className="cursor-pointer hover:border-indigo-500 transition-all border-2">
                      <div className="flex justify-between">
                         <Badge color="indigo">{v.variationLabel || 'Variação'}</Badge>
                         <p className="text-lg font-black text-white">R$ {v.amountBrl.toLocaleString('pt-BR')}</p>
                      </div>
                      <h4 className="font-bold text-gray-400 mt-2">{v.title}</h4>
                   </Card>
                ))}
                {variations.length === 0 && <p className="col-span-full text-center py-20 text-gray-600 italic">Sem outras variações.</p>}
             </div>
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
               <Button variant="primary" type="submit">Atualizar e Versionar</Button>
            </div>
         </form>
      </Modal>

      {/* Modal Criar Variação */}
      <Modal isOpen={isVariationOpen} onClose={() => setIsVariationOpen(false)} title="Criar Nova Variação">
         <form onSubmit={handleCreateVariation} className="space-y-4">
            <Input label="Nome da Variação" name="label" placeholder="Ex: Com Seguro Total, Incluindo Café..." required />
            <p className="text-xs text-gray-500">Iremos copiar todos os dados do orçamento atual para uma nova variação vinculada.</p>
            <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
               <Button variant="ghost" type="button" onClick={() => setIsVariationOpen(false)}>Cancelar</Button>
               <Button variant="primary" type="submit">Gerar Variação</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
};

export default QuoteDetailView;
