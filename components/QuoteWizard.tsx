
import React, { useState, useEffect, useMemo } from 'react';
import { Trip, Quote, QuoteStatus, Currency, PaymentMethod } from '../types';
import { Card, Badge, Button, Input } from './CommonUI';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import { formatCurrency } from '../lib/formatters';
import QuickCreateVendorModal from './QuickCreateVendorModal';

interface QuoteWizardProps {
  trip: Trip;
  initialData?: Partial<Quote>;
  onSave: (quote: Quote) => void;
  onCancel: () => void;
}

const QuoteWizard: React.FC<QuoteWizardProps> = ({ trip, initialData, onSave, onCancel }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [tripVendors, setTripVendors] = useState<any[]>([]);
  const [hasVendor, setHasVendor] = useState(!!initialData?.vendor_profile_id);
  const [sourceType, setSourceType] = useState<'link' | 'texto' | 'manual'>(initialData?.source_type || 'link');
  const [sourceValue, setSourceValue] = useState(initialData?.source_value || '');
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Quote>>({
    tripId: trip.id,
    currency: Currency.BRL,
    exchangeRate: 1,
    status: QuoteStatus.DRAFT,
    tags: [],
    participantIds: ['ALL'],
    totalAmount: 0,
    amountBrl: 0,
    category: trip.categories[0],
    segmentId: trip.segments[0]?.id || null, // Usar primeiro segmento real ou null
    paymentTerms: { methods: [PaymentMethod.PIX], installments: 1, installmentValue: 0 },
    attachments: [],
    completeness: 0,
    ...initialData
  });

  useEffect(() => {
    loadTripVendors();
  }, []);

  const loadTripVendors = async () => {
    try {
      const vendors = await supabaseDataProvider.getTripVendors(trip.id);
      setTripVendors(vendors);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  // Cálculo de Completude
  const completeness = useMemo(() => {
    const q = formData;
    const hasVendorOrSource = q.vendor_profile_id || (q.source_type && q.source_value);
    
    const rules: Record<string, boolean> = {
      base: !!(q.title && q.category && hasVendorOrSource && q.totalAmount && q.validUntil && q.cancellationPolicy),
      hotel: q.category === 'Hospedagem' ? !!(q.hotelDetails?.checkin && q.hotelDetails?.checkout) : true,
      ticket: q.category === 'Ingressos/Atrações' ? !!(q.ticketDetails?.kind) : true,
      car: q.category === 'Aluguel de Carro' ? !!(q.carDetails?.pickupDateTime) : true,
    };
    
    const totalRules = Object.keys(rules).length;
    const passed = Object.values(rules).filter(Boolean).length;
    return Math.round((passed / totalRules) * 100);
  }, [formData]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, completeness }));
  }, [completeness]);

  // PATCH BAIXO: Higienização de câmbio (Garante Rate=1 para BRL e limpa Rate ao trocar)
  useEffect(() => {
    if (formData.currency === Currency.BRL && formData.exchangeRate !== 1) {
       setFormData(prev => ({ ...prev, exchangeRate: 1 }));
    }
  }, [formData.currency]);

  // Cálculos Automáticos de Valores
  useEffect(() => {
    const total = formData.totalAmount || 0;
    const rate = formData.currency === Currency.BRL ? 1 : (formData.exchangeRate || 1);
    const amountBrl = total * rate;
    const instValue = amountBrl / (formData.paymentTerms?.installments || 1);

    setFormData(prev => ({
      ...prev,
      amountBrl,
      paymentTerms: { ...prev.paymentTerms!, installmentValue: instValue }
    }));
  }, [formData.totalAmount, formData.currency, formData.exchangeRate, formData.paymentTerms?.installments]);

  const steps = [
    { id: 1, title: 'Básico' },
    { id: 2, title: 'Valores' },
    { id: 3, title: 'Pagamento' },
    { id: 4, title: 'Detalhes' },
    { id: 5, title: 'Participantes' },
    { id: 6, title: 'Regras' }
  ];

  const renderStep = () => {
    switch (activeStep) {
      case 1: return (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
          <Input label="Título do Orçamento *" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Voo Ida - LATAM Premium" />
          <div className="grid grid-cols-2 gap-4">
            <Input as="select" label="Categoria *" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              {trip.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </Input>
            <Input as="select" label="Segmento" value={formData.segmentId} onChange={e => setFormData({...formData, segmentId: e.target.value})}>
              <option value="seg-all">Geral (Toda Viagem)</option>
              {trip.segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Input>
          </div>

          {/* Seleção de Fornecedor ou Fonte */}
          <div className="space-y-3 p-4 bg-gray-950 rounded-xl border border-gray-800">
            <label className="block text-sm font-bold text-gray-400 mb-3">Fornecedor</label>
            
            <label className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
              <input 
                type="radio" 
                checked={hasVendor} 
                onChange={() => {
                  setHasVendor(true);
                  setFormData({...formData, source_type: undefined, source_value: undefined});
                }}
                className="w-4 h-4"
              />
              <div>
                <span className="text-sm font-bold text-white">Selecionar fornecedor vinculado</span>
                <p className="text-xs text-gray-500">Escolher da lista de fornecedores desta viagem</p>
              </div>
            </label>
            
            {hasVendor && (
              <div className="space-y-2 ml-7">
                <select 
                  value={formData.vendor_profile_id || ''} 
                  onChange={e => {
                    const tv = tripVendors.find(v => v.profile.id === e.target.value);
                    setFormData({
                      ...formData, 
                      vendor_profile_id: e.target.value,
                      provider: tv?.profile.name
                    });
                  }}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none"
                >
                  <option value="">Selecione um fornecedor...</option>
                  {tripVendors.map(tv => (
                    <option key={tv.id} value={tv.profile.id}>
                      {tv.profile.name}
                    </option>
                  ))}
                </select>
                
                <Button 
                  variant="outline" 
                  onClick={() => setIsQuickCreateOpen(true)}
                  className="w-full text-sm"
                >
                  + Criar novo fornecedor
                </Button>
              </div>
            )}
            
            <label className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
              <input 
                type="radio" 
                checked={!hasVendor} 
                onChange={() => {
                  setHasVendor(false);
                  setFormData({...formData, vendor_profile_id: undefined, provider: undefined});
                }}
                className="w-4 h-4"
              />
              <div>
                <span className="text-sm font-bold text-white">Sem fornecedor (informar fonte)</span>
                <p className="text-xs text-gray-500">Para cotações de sites, pesquisas, etc</p>
              </div>
            </label>
            
            {!hasVendor && (
              <div className="space-y-3 ml-7">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSourceType('link')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                      sourceType === 'link' 
                        ? 'bg-indigo-600 border-indigo-400 text-white' 
                        : 'bg-gray-900 border-gray-800 text-gray-500'
                    }`}
                  >
                    Link
                  </button>
                  <button 
                    onClick={() => setSourceType('texto')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                      sourceType === 'texto' 
                        ? 'bg-indigo-600 border-indigo-400 text-white' 
                        : 'bg-gray-900 border-gray-800 text-gray-500'
                    }`}
                  >
                    Texto
                  </button>
                  <button 
                    onClick={() => setSourceType('manual')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                      sourceType === 'manual' 
                        ? 'bg-indigo-600 border-indigo-400 text-white' 
                        : 'bg-gray-900 border-gray-800 text-gray-500'
                    }`}
                  >
                    Manual
                  </button>
                </div>
                
                {sourceType === 'link' && (
                  <Input 
                    label="URL da Fonte *" 
                    value={sourceValue}
                    onChange={e => {
                      setSourceValue(e.target.value);
                      setFormData({...formData, source_type: 'link', source_value: e.target.value});
                    }}
                    placeholder="https://exemplo.com/cotacao"
                  />
                )}
                
                {sourceType === 'texto' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Texto da Cotação *</label>
                    <textarea 
                      placeholder="Cole aqui o texto da cotação (email, mensagem, etc)..."
                      value={sourceValue}
                      onChange={e => {
                        setSourceValue(e.target.value);
                        setFormData({...formData, source_type: 'texto', source_value: e.target.value});
                      }}
                      rows={4}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none resize-none"
                    />
                  </div>
                )}
                
                {sourceType === 'manual' && (
                  <Input 
                    label="Descrição da Fonte *"
                    value={sourceValue}
                    onChange={e => {
                      setSourceValue(e.target.value);
                      setFormData({...formData, source_type: 'manual', source_value: e.target.value});
                    }}
                    placeholder="Ex: Cotação por telefone, WhatsApp, pessoalmente"
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 items-end">
            <Input label="Link do Orçamento (URL)" className="flex-1" value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} />
            {formData.linkUrl && <Button variant="secondary" onClick={() => window.open(formData.linkUrl, '_blank')}>Abrir</Button>}
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
          <div className="grid grid-cols-2 gap-4">
            <Input as="select" label="Moeda *" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as any})}>
              <option value={Currency.BRL}>BRL (Real)</option>
              <option value={Currency.USD}>USD (Dólar)</option>
            </Input>
            <Input label="Câmbio *" type="number" step="0.01" value={formData.exchangeRate} 
              disabled={formData.currency === Currency.BRL}
              onChange={e => setFormData({...formData, exchangeRate: Number(e.target.value)})} 
            />
          </div>
          <Input label="Valor Total (Moeda Original) *" type="number" step="0.01" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})} />
          <Input label="Taxas e Impostos Opcionais" type="number" step="0.01" value={formData.taxesFees} onChange={e => setFormData({...formData, taxesFees: Number(e.target.value)})} />
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Total em Reais</p>
            <p className="text-3xl font-black text-white">{formatCurrency(formData.amountBrl || 0)}</p>
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
           <label className="block text-sm font-medium text-gray-400">Métodos Aceitos</label>
           <div className="flex flex-wrap gap-2">
              {Object.values(PaymentMethod).map(m => (
                <button key={m} 
                  onClick={() => {
                    const methods = formData.paymentTerms?.methods || [];
                    const newMethods = methods.includes(m) ? methods.filter(x => x !== m) : [...methods, m];
                    setFormData({...formData, paymentTerms: { ...formData.paymentTerms!, methods: newMethods }});
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.paymentTerms?.methods.includes(m) ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-gray-950 border-gray-800 text-gray-500'}`}
                >
                  {m}
                </button>
              ))}
           </div>
           <div className="grid grid-cols-2 gap-4">
              <Input label="Parcelas (Max)" type="number" min="1" max="12" value={formData.paymentTerms?.installments} onChange={e => setFormData({...formData, paymentTerms: {...formData.paymentTerms!, installments: Number(e.target.value)}})} />
              <Input label="Valor da Parcela" value={formatCurrency(formData.paymentTerms?.installmentValue || 0)} disabled />
           </div>
           <Input label="Desconto à Vista (Valor)" type="number" value={formData.paymentTerms?.cashDiscount} onChange={e => setFormData({...formData, paymentTerms: {...formData.paymentTerms!, cashDiscount: Number(e.target.value)}})} />
        </div>
      );
      case 4: return (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
           {formData.category === 'Ingressos/Atrações' && (
             <div className="space-y-4">
                <Input as="select" label="Tipo" value={formData.ticketDetails?.kind} onChange={e => setFormData({...formData, ticketDetails: { ...formData.ticketDetails!, kind: e.target.value as any }})}>
                   <option value="Parque">Parque</option>
                   <option value="Show">Show</option>
                   <option value="Jogo">Jogo</option>
                </Input>
                <div className="grid grid-cols-2 gap-4 bg-gray-950 p-4 rounded-xl border border-gray-800">
                   <Input label="Qtd Adultos" type="number" value={formData.ticketDetails?.adultQty} onChange={e => setFormData({...formData, ticketDetails: {...formData.ticketDetails!, adultQty: Number(e.target.value)}})} />
                   <Input label="Preço Unit. Adulto" type="number" value={formData.ticketDetails?.adultPrice} onChange={e => setFormData({...formData, ticketDetails: {...formData.ticketDetails!, adultPrice: Number(e.target.value)}})} />
                </div>
                <Button variant="ghost" className="w-full text-[10px]" onClick={() => {
                  const td = formData.ticketDetails!;
                  const calcTotal = (td.adultQty * td.adultPrice) + (td.childQty * td.childPrice);
                  setFormData({...formData, totalAmount: calcTotal});
                }}>Calcular total pelo detalhamento</Button>
             </div>
           )}
           {formData.category === 'Hospedagem' && (
             <div className="grid grid-cols-2 gap-4">
                <Input label="Check-in" type="date" value={formData.hotelDetails?.checkin} onChange={e => setFormData({...formData, hotelDetails: {...formData.hotelDetails!, checkin: e.target.value}})} />
                <Input label="Check-out" type="date" value={formData.hotelDetails?.checkout} onChange={e => setFormData({...formData, hotelDetails: {...formData.hotelDetails!, checkout: e.target.value}})} />
                <Input label="Tipo Quarto" value={formData.hotelDetails?.roomType} onChange={e => setFormData({...formData, hotelDetails: {...formData.hotelDetails!, roomType: e.target.value}})} />
                <div className="flex items-center gap-2 mt-6">
                   <input type="checkbox" checked={formData.hotelDetails?.breakfastIncluded} onChange={e => setFormData({...formData, hotelDetails: {...formData.hotelDetails!, breakfastIncluded: e.target.checked}})} />
                   <span className="text-sm">Café da Manhã?</span>
                </div>
             </div>
           )}
           {formData.category === 'Aluguel de Carro' && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Retirada" type="datetime-local" value={formData.carDetails?.pickupDateTime} onChange={e => setFormData({...formData, carDetails: {...formData.carDetails!, pickupDateTime: e.target.value}})} />
                <Input label="Devolução" type="datetime-local" value={formData.carDetails?.dropoffDateTime} onChange={e => setFormData({...formData, carDetails: {...formData.carDetails!, dropoffDateTime: e.target.value}})} />
                <Input label="Classe do Carro" value={formData.carDetails?.carClass} onChange={e => setFormData({...formData, carDetails: {...formData.carDetails!, carClass: e.target.value}})} />
                <Input label="Franquia (Deductible)" type="number" value={formData.carDetails?.deductible} onChange={e => setFormData({...formData, carDetails: {...formData.carDetails!, deductible: Number(e.target.value)}})} />
              </div>
           )}
           {!['Hospedagem', 'Ingressos/Atrações', 'Aluguel de Carro'].includes(formData.category || '') && (
             <p className="text-gray-500 italic text-center py-10">Categoria genérica: use notas para detalhes adicionais.</p>
           )}
        </div>
      );
      case 5: return (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
           <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setFormData({...formData, participantIds: ['ALL']})} className={`p-4 rounded-xl border text-left ${formData.participantIds?.includes('ALL') ? 'bg-indigo-600 border-indigo-400' : 'bg-gray-950 border-gray-800 text-gray-500'}`}>
                <p className="font-bold">Todos</p>
                <p className="text-[10px]">Toda a viagem</p>
              </button>
              <button onClick={() => setFormData({...formData, participantIds: []})} className={`p-4 rounded-xl border text-left ${!formData.participantIds?.includes('ALL') ? 'bg-indigo-600 border-indigo-400' : 'bg-gray-950 border-gray-800 text-gray-500'}`}>
                <p className="font-bold">Selecionar</p>
                <p className="text-[10px]">Escolher casais</p>
              </button>
           </div>
           {!formData.participantIds?.includes('ALL') && (
             <div className="space-y-2 mt-4">
                {trip.couples.map(c => (
                  <label key={c.id} className="flex items-center justify-between p-3 bg-gray-950 rounded-lg border border-gray-800 cursor-pointer hover:border-gray-600">
                    <span className="text-sm font-medium">{c.name}</span>
                    <input type="checkbox" className="w-5 h-5 accent-indigo-500" checked={formData.participantIds?.includes(c.id)} 
                      onChange={e => {
                        const ids = formData.participantIds || [];
                        const next = e.target.checked ? [...ids, c.id] : ids.filter(x => x !== c.id);
                        setFormData({...formData, participantIds: next});
                      }} 
                    />
                  </label>
                ))}
             </div>
           )}
        </div>
      );
      case 6: return (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
           <div className="grid grid-cols-2 gap-4">
              <Input label="Validade *" type="date" value={formData.validUntil} onChange={e => setFormData({...formData, validUntil: e.target.value})} />
              <Input as="select" label="Política Cancelamento *" value={formData.cancellationPolicy} onChange={e => setFormData({...formData, cancellationPolicy: e.target.value as any})}>
                <option value="Reembolsável">Reembolsável Total</option>
                <option value="Parcial">Parcial</option>
                <option value="Não Reembolsável">Não Reembolsável</option>
              </Input>
           </div>
           <Input as="textarea" label="O que INCLUI" rows={2} value={formData.includes} onChange={e => setFormData({...formData, includes: e.target.value})} />
           <Input as="textarea" label="O que EXCLUI" rows={2} value={formData.excludes} onChange={e => setFormData({...formData, excludes: e.target.value})} />
           <Input as="textarea" label="Notas p/ Grupo" rows={2} value={formData.notesGroup} onChange={e => setFormData({...formData, notesGroup: e.target.value})} />
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
      {/* Wizard Column */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-10 overflow-x-auto pb-4">
          {steps.map(s => (
            <button key={s.id} onClick={() => setActiveStep(s.id)} 
              className={`flex flex-col items-center gap-2 group transition-all px-4 ${activeStep === s.id ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-70'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 ${activeStep === s.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-gray-900 border-gray-700'}`}>
                {s.id}
              </div>
              <span className={`text-[9px] uppercase font-black tracking-widest ${activeStep === s.id ? 'text-indigo-400' : 'text-gray-500'}`}>{s.title}</span>
            </button>
          ))}
        </div>

        <div className="flex-1">
          {renderStep()}
        </div>

        <div className="flex justify-between mt-10 pt-6 border-t border-gray-800">
          <Button variant="ghost" onClick={() => activeStep > 1 ? setActiveStep(activeStep - 1) : onCancel()}>
            {activeStep === 1 ? 'Cancelar' : 'Voltar'}
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onSave(formData as Quote)}>Salvar Rascunho</Button>
            {activeStep < 6 ? (
              <Button onClick={() => setActiveStep(activeStep + 1)}>Próximo Passo</Button>
            ) : (
              <Button variant="primary" onClick={() => onSave({ ...formData, status: QuoteStatus.SHORTLIST } as Quote)}>Finalizar e Shortlist</Button>
            )}
          </div>
        </div>
      </div>

      {/* Live Preview Column */}
      <div className="w-full lg:w-80 space-y-4 sticky top-4 h-fit">
        <Card title="Resumo ao Vivo" className="!bg-gray-950/50 border-gray-800">
          <div className="space-y-4">
             <div className="flex justify-between items-start">
                <Badge color="indigo">{formData.category}</Badge>
                <div className="text-right">
                   <p className="text-[10px] text-gray-600 font-bold uppercase">Completude</p>
                   <p className={`text-sm font-black ${formData.completeness === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>{formData.completeness}%</p>
                </div>
             </div>
             <div>
                <h3 className="text-lg font-bold text-white leading-tight">{formData.title || 'Sem título'}</h3>
                <p className="text-xs text-gray-500 font-medium">
                  {formData.provider || (formData.source_type ? `Fonte: ${formData.source_type}` : 'Sem fornecedor')}
                </p>
             </div>
             <div className="p-3 bg-gray-900 rounded-xl space-y-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Impacto Financeiro</p>
                <p className="text-2xl font-black text-white">{formatCurrency(formData.amountBrl || 0)}</p>
                <p className="text-[10px] text-gray-600">Por casal: {formatCurrency((formData.amountBrl || 0) / 3)}</p>
             </div>
             
             <div className="space-y-2 pt-4 border-t border-gray-800">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Checklist</p>
                <ul className="space-y-1">
                   <CheckItem label="Campos Básicos" checked={!!(formData.title && (formData.vendor_profile_id || (formData.source_type && formData.source_value)))} />
                   <CheckItem label="Financeiro" checked={!!formData.totalAmount} />
                   <CheckItem label="Regras & Validade" checked={!!(formData.validUntil && formData.cancellationPolicy)} />
                   <CheckItem label="Participantes" checked={formData.participantIds && formData.participantIds.length > 0} />
                </ul>
             </div>
          </div>
        </Card>
      </div>

      {/* Modal de criação rápida de fornecedor */}
      {isQuickCreateOpen && (
        <QuickCreateVendorModal
          onClose={() => setIsQuickCreateOpen(false)}
          onCreated={async (profileId) => {
            // Vincular à viagem
            await supabaseDataProvider.linkVendorToTrip(trip.id, profileId);
            // Recarregar lista
            await loadTripVendors();
            // Selecionar automaticamente
            const newVendors = await supabaseDataProvider.getVendorProfiles();
            const profile = newVendors.find(v => v.id === profileId);
            setFormData({
              ...formData, 
              vendor_profile_id: profileId,
              provider: profile?.name
            });
            setIsQuickCreateOpen(false);
          }}
        />
      )}
    </div>
  );
};

const CheckItem = ({ label, checked }: { label: string, checked: boolean }) => (
  <li className="flex items-center gap-2 text-[10px] font-bold">
    <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${checked ? 'bg-emerald-500 border-emerald-400' : 'border-gray-700'}`}>
      {checked && <span className="text-white text-[8px]">✓</span>}
    </div>
    <span className={checked ? 'text-gray-300' : 'text-gray-600'}>{label}</span>
  </li>
);

export default QuoteWizard;
