
import React, { useState, useEffect } from 'react';
import { Trip, Vendor, Quote, QuoteStatus, VendorQuoteRequest } from '../types';
import { Card, Badge, Button, Modal, Input } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';

interface VendorDetailViewProps {
  trip: Trip;
  vendor: Vendor;
  onEdit: () => void;
  onBack: () => void;
  onRefresh: () => void;
  onNavigateToQuote: (quoteId: string) => void;
  onCreateQuote: () => void;
}

const VendorDetailView: React.FC<VendorDetailViewProps> = ({ trip, vendor, onEdit, onBack, onRefresh, onNavigateToQuote, onCreateQuote }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'terms' | 'quotes' | 'requests'>('info');
  const [vendorQuotes, setVendorQuotes] = useState<Quote[]>([]);
  const [requests, setRequests] = useState<VendorQuoteRequest[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestData, setRequestData] = useState({
    category: vendor.categories[0] || 'Geral',
    segmentId: 'seg-all',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [vendor.id]);

  const loadData = async () => {
    const [allQ, allR] = await Promise.all([
      dataProvider.getQuotes(trip.id),
      dataProvider.getVendorRequests(vendor.id)
    ]);
    setVendorQuotes(allQ.filter(q => q.vendorId === vendor.id));
    setRequests(allR);
  };

  const getTemplate = () => {
    const segment = trip.segments.find(s => s.id === requestData.segmentId)?.name || 'Toda a viagem';
    const travelersCount = trip.couples.reduce((sum, c) => sum + c.members.length, 0);
    
    let base = `Olá ${vendor.name},\nGostaria de solicitar um orçamento para ${trip.name}.\n\n`;
    base += `*Contexto:* ${segment}\n`;
    base += `*Pessoas:* ${travelersCount} viajantes totais.\n\n`;

    if (requestData.category === 'Hospedagem') {
      base += `*Pedido de Hotel:*\n- Check-in/out: Consultar datas do segmento\n- Ocupação: Quartos para ${travelersCount} pessoas\n- Requisitos: Café incluso, Política de cancelamento flexível.\n`;
    } else if (requestData.category === 'Ingressos/Atrações') {
      base += `*Pedido de Ingressos:*\n- Tipo: Consultar disponibilidade\n- Adultos/Crianças: ${travelersCount} totais\n`;
    } else {
      base += `*Pedido Geral:*\n${requestData.notes || '- Solicito valores e condições conforme disponibilidade.'}\n`;
    }

    base += `\nAguardo retorno com valores e formas de pagamento.\nObrigado!`;
    return base;
  };

  const handleSendWhatsApp = async () => {
    const contact = vendor.contacts.find(c => c.phone) || vendor.contacts[0];
    if (!contact?.phone) return alert('Nenhum telefone cadastrado para este fornecedor.');
    
    const message = getTemplate();
    await dataProvider.saveVendorRequest({
      id: '', tripId: trip.id, vendorId: vendor.id, category: requestData.category, segmentId: requestData.segmentId, message, createdAt: ''
    });
    
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${contact.phone.replace(/\D/g,'')}?text=${encoded}`, '_blank');
    setIsRequestModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span className="text-xs font-black uppercase tracking-widest">Lista de Fornecedores</span>
        </button>
        <div className="flex flex-wrap gap-2">
           <Button variant="outline" onClick={() => setIsRequestModalOpen(true)}>💬 Pedir Orçamento</Button>
           <Button variant="outline" onClick={onEdit}>Editar</Button>
           <Button variant="primary" onClick={onCreateQuote}>+ Novo Orçamento</Button>
        </div>
      </div>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-800">
         <div className="space-y-2">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{vendor.name}</h1>
            <div className="flex flex-wrap gap-1 mt-2">
               {vendor.categories.map(c => <Badge key={c} color="indigo">{c}</Badge>)}
            </div>
         </div>
      </header>

      <div className="flex border-b border-gray-800 overflow-x-auto">
        {(['info', 'contacts', 'terms', 'quotes', 'requests'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab === 'info' ? 'Resumo' : tab === 'contacts' ? 'Contatos' : tab === 'terms' ? 'Condições' : tab === 'quotes' ? 'Orçamentos' : 'Pedidos Enviados'}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'info' && (
           <Card title="Dados Gerais">
              <p className="text-sm text-gray-400">{vendor.legalName || 'Razão Social não informada'}</p>
              <div className="mt-4 flex gap-4">
                 {vendor.websiteUrl && <Button variant="ghost" onClick={() => window.open(vendor.websiteUrl, '_blank')}>Website</Button>}
                 {vendor.instagramUrl && <Button variant="ghost" onClick={() => window.open(`https://instagram.com/${vendor.instagramUrl}`, '_blank')}>Instagram</Button>}
              </div>
           </Card>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Histórico de Mensagens Enviadas</h3>
             {requests.map(r => (
               <Card key={r.id} className="!p-4 !bg-gray-900/50">
                  <div className="flex justify-between items-center mb-2">
                     <Badge color="indigo">{r.category}</Badge>
                     <span className="text-[10px] text-gray-500 font-bold">{new Date(r.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <pre className="text-[10px] font-mono bg-black/50 p-4 rounded text-gray-400 whitespace-pre-wrap">{r.message}</pre>
                  <div className="mt-4 flex justify-end">
                     <Button variant="ghost" className="text-[10px]" onClick={() => { navigator.clipboard.writeText(r.message); alert('Copiado!'); }}>Copiar Novamente</Button>
                  </div>
               </Card>
             ))}
             {requests.length === 0 && <p className="text-center py-20 text-gray-600 italic">Nenhum pedido enviado ainda.</p>}
          </div>
        )}

        {activeTab === 'quotes' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
              {vendorQuotes.map(q => (
                <Card key={q.id} onClick={() => onNavigateToQuote(q.id)} className="cursor-pointer hover:border-indigo-500 transition-all border-2">
                   <h4 className="font-black text-white uppercase">{q.title}</h4>
                   <p className="text-sm font-bold text-indigo-400">R$ {q.amountBrl.toLocaleString('pt-BR')}</p>
                </Card>
              ))}
           </div>
        )}
      </div>

      {/* Modal Pedir Orçamento */}
      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Gerador de Pedido de Orçamento">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
               <Input as="select" label="Categoria do Orçamento" value={requestData.category} onChange={e => setRequestData({...requestData, category: e.target.value})}>
                  {trip.categories.map(c => <option key={c} value={c}>{c}</option>)}
               </Input>
               <Input as="select" label="Segmento de Referência" value={requestData.segmentId} onChange={e => setRequestData({...requestData, segmentId: e.target.value})}>
                  <option value="seg-all">Geral (Toda Viagem)</option>
                  {trip.segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </Input>
               <Input as="textarea" label="Notas Adicionais" rows={3} value={requestData.notes} onChange={e => setRequestData({...requestData, notes: e.target.value})} placeholder="Ex: Preferência por andar alto, carro SUV..." />
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-black text-gray-500 uppercase">Preview da Mensagem</p>
               <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 min-h-[250px] flex flex-col">
                  <pre className="text-[10px] font-mono text-gray-300 whitespace-pre-wrap flex-1">{getTemplate()}</pre>
                  <div className="pt-4 flex gap-2">
                     <Button variant="ghost" className="flex-1 text-[10px]" onClick={() => { navigator.clipboard.writeText(getTemplate()); alert('Copiado!'); }}>Copiar Texto</Button>
                     <Button variant="primary" className="flex-1 text-[10px] bg-emerald-600 hover:bg-emerald-700" onClick={handleSendWhatsApp}>Abrir WhatsApp ➔</Button>
                  </div>
               </div>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default VendorDetailView;
