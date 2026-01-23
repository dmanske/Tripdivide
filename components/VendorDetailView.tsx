
import React, { useState, useEffect } from 'react';
import { Trip, Vendor, Quote, QuoteStatus, VendorQuoteRequest } from '../types';
import { Card, Badge, Button, Modal, Input } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';
import { formatSupabaseDateTime, formatCurrency } from '../lib/formatters';

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
    segmentId: trip.segments[0]?.id || null, // Usar primeiro segmento real ou null
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [vendor.id]);

  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
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

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendWhatsApp = async () => {
    const contact = vendor.contacts.find(c => c.phone) || vendor.contacts[0];
    if (!contact?.phone) {
      setErrorMessage('Nenhum telefone cadastrado para este fornecedor.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    const message = getTemplate();
    await dataProvider.saveVendorRequest({
      id: '', tripId: trip.id, vendor_profile_id: vendor.id, category: requestData.category, segmentId: requestData.segmentId, message, createdAt: ''
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
           <div className="space-y-6 animate-in fade-in duration-300">
              {/* Card Principal */}
              <Card className="!bg-gradient-to-br from-indigo-600/10 to-indigo-600/5 !border-indigo-600/30">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Razão Social</p>
                    <p className="text-lg font-bold text-white">{vendor.legalName || 'Não informada'}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase">Avaliação</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-xl ${vendor.rating >= s ? 'text-amber-400' : 'text-gray-800'}`}>★</span>
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-400">({vendor.rating}/5)</span>
                  </div>

                  {vendor.preferred && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-600/30 rounded-xl">
                      <span className="text-2xl">⭐</span>
                      <span className="text-sm font-bold text-indigo-400">Fornecedor Preferido</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Links e Redes Sociais */}
              <Card>
                <h3 className="text-sm font-black text-gray-400 uppercase mb-4">Links e Redes Sociais</h3>
                <div className="space-y-3">
                  {vendor.websiteUrl && (
                    <a 
                      href={vendor.websiteUrl.startsWith('http') ? vendor.websiteUrl : `https://${vendor.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-indigo-600/50 rounded-xl transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/30">
                        🌐
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-500 uppercase">Website</p>
                        <p className="text-sm text-white truncate group-hover:text-indigo-400 transition-colors">{vendor.websiteUrl}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}

                  {vendor.instagramUrl && (
                    <a 
                      href={vendor.instagramUrl.startsWith('@') ? `https://instagram.com/${vendor.instagramUrl.slice(1)}` : `https://instagram.com/${vendor.instagramUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-pink-600/50 rounded-xl transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center text-pink-400 group-hover:from-purple-600/30 group-hover:to-pink-600/30">
                        📸
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-500 uppercase">Instagram</p>
                        <p className="text-sm text-white truncate group-hover:text-pink-400 transition-colors">{vendor.instagramUrl.startsWith('@') ? vendor.instagramUrl : `@${vendor.instagramUrl}`}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-600 group-hover:text-pink-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}

                  {!vendor.websiteUrl && !vendor.instagramUrl && (
                    <div className="text-center py-8 text-gray-600 italic text-sm">
                      Nenhum link cadastrado
                    </div>
                  )}
                </div>
              </Card>

              {/* Tags */}
              {vendor.tags && vendor.tags.length > 0 && (
                <Card>
                  <h3 className="text-sm font-black text-gray-400 uppercase mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {vendor.tags.map(tag => (
                      <span key={tag} className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs font-bold text-gray-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              {/* Flags de Risco */}
              {vendor.riskFlags && vendor.riskFlags.length > 0 && (
                <Card className="!bg-red-600/10 !border-red-600/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">⚠️</span>
                    <h3 className="text-sm font-black text-red-400 uppercase">Alertas de Risco</h3>
                  </div>
                  <div className="space-y-2">
                    {vendor.riskFlags.map(flag => (
                      <div key={flag} className="flex items-center gap-2 text-sm text-red-400">
                        <span>•</span>
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
           </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-sm font-black text-gray-400 uppercase">Equipe de Atendimento</h3>
            {vendor.contacts && vendor.contacts.length > 0 ? (
              <div className="grid gap-4">
                {vendor.contacts.map(contact => (
                  <Card key={contact.id} className="!p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-white">{contact.name}</h4>
                        <p className="text-sm text-gray-500">{contact.role}</p>
                      </div>
                      {contact.isPrimary && (
                        <Badge color="indigo">Principal</Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* WhatsApp/Telefone */}
                      {contact.phone && (
                        <a 
                          href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-green-600/10 hover:bg-green-600/20 border border-green-600/30 hover:border-green-600/50 rounded-xl transition-all group"
                        >
                          <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center text-green-400 group-hover:bg-green-600/30">
                            💬
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-gray-500 uppercase">WhatsApp</p>
                            <p className="text-sm text-white group-hover:text-green-400 transition-colors">{contact.phone}</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-600 group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}

                      {/* Email */}
                      {contact.email && (
                        <a 
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-3 p-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 hover:border-blue-600/50 rounded-xl transition-all group"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/30">
                            ✉️
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-500 uppercase">Email</p>
                            <p className="text-sm text-white truncate group-hover:text-blue-400 transition-colors">{contact.email}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              navigator.clipboard.writeText(contact.email);
                              // Mostrar feedback visual
                              const btn = e.currentTarget;
                              const originalHTML = btn.innerHTML;
                              btn.innerHTML = '<svg class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
                              setTimeout(() => btn.innerHTML = originalHTML, 1500);
                            }}
                            className="p-1 hover:bg-blue-600/20 rounded transition-colors"
                          >
                            <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </a>
                      )}

                      {/* Método Preferido */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Método preferido:</span>
                        <Badge color="gray" className="text-[9px]">{contact.preferredMethod}</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600 italic">
                Nenhum contato cadastrado
              </div>
            )}
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Condições de Pagamento */}
            <Card>
              <h3 className="text-sm font-black text-gray-400 uppercase mb-4">Condições de Pagamento</h3>
              {vendor.paymentTermsDefault ? (
                <div className="space-y-3">
                  <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                    <p className="text-white">{vendor.paymentTermsDefault}</p>
                  </div>
                  
                  {vendor.paymentTermsDefault && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(vendor.paymentTermsDefault);
                        // Feedback visual
                        const btn = document.activeElement as HTMLButtonElement;
                        const originalText = btn.textContent;
                        btn.textContent = '✓ Copiado!';
                        btn.classList.add('!text-green-400');
                        setTimeout(() => {
                          btn.textContent = originalText;
                          btn.classList.remove('!text-green-400');
                        }, 1500);
                      }}
                      className="text-xs text-gray-500 hover:text-indigo-400 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copiar condições
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 italic">Não informado</p>
              )}
            </Card>

            {/* Política de Cancelamento */}
            <Card>
              <h3 className="text-sm font-black text-gray-400 uppercase mb-4">Política de Cancelamento</h3>
              {vendor.cancellationPolicyNotes ? (
                <div className="space-y-3">
                  <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                    <p className="text-white whitespace-pre-wrap">{vendor.cancellationPolicyNotes}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(vendor.cancellationPolicyNotes);
                      const btn = document.activeElement as HTMLButtonElement;
                      const originalText = btn.textContent;
                      btn.textContent = '✓ Copiado!';
                      btn.classList.add('!text-green-400');
                      setTimeout(() => {
                        btn.textContent = originalText;
                        btn.classList.remove('!text-green-400');
                      }, 1500);
                    }}
                    className="text-xs text-gray-500 hover:text-indigo-400 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar política
                  </button>
                </div>
              ) : (
                <p className="text-gray-600 italic">Não informado</p>
              )}
            </Card>

            {/* SLA de Resposta */}
            {vendor.slaNotes && (
              <Card>
                <h3 className="text-sm font-black text-gray-400 uppercase mb-4">SLA de Resposta</h3>
                <div className="p-4 bg-indigo-600/10 border border-indigo-600/30 rounded-xl">
                  <p className="text-white">{vendor.slaNotes}</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Histórico de Mensagens Enviadas</h3>
             {requests.map(r => (
               <Card key={r.id} className="!p-4 !bg-gray-900/50">
                  <div className="flex justify-between items-center mb-2">
                     <Badge color="indigo">{r.category}</Badge>
                     <span className="text-[10px] text-gray-500 font-bold">{formatSupabaseDateTime(r.createdAt)}</span>
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
                   <p className="text-sm font-bold text-indigo-400">{formatCurrency(q.amountBrl)}</p>
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
