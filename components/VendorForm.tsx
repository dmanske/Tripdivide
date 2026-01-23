
import React, { useState } from 'react';
import { Trip, Vendor, VendorContact, PaymentMethod } from '../types';
import { Button, Input, Card, Badge } from './CommonUI';
import PhoneInput from './PhoneInput';

interface VendorFormProps {
  trip: Trip;
  initialData?: Partial<Vendor>;
  onSave: (vendor: Vendor) => void;
  onCancel: () => void;
}

const VendorForm: React.FC<VendorFormProps> = ({ trip, initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Vendor>>({
    tripId: trip.id,
    status: 'Ativo',
    categories: [],
    rating: 3,
    preferred: false,
    tags: [],
    riskFlags: [],
    contacts: [],
    attachments: [],
    ...initialData
  });

  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'terms'>('info');

  const updateContact = (contact: VendorContact) => {
    const list = formData.contacts || [];
    const idx = list.findIndex(c => c.id === contact.id);
    const newList = [...list];
    if (idx >= 0) newList[idx] = contact;
    else newList.push({ ...contact, id: Math.random().toString(36).substr(2, 9) });
    setFormData({ ...formData, contacts: newList });
  };

  const removeContact = (id: string) => {
    setFormData({ ...formData, contacts: (formData.contacts || []).filter(c => c.id !== id) });
  };

  const isValid = formData.name && formData.name.trim().length > 0;

  const RISK_OPTIONS = ["Taxas ocultas", "Reembolso difícil", "Atraso na resposta", "Preço instável", "Comunicação difícil"];

  return (
    <div className="flex flex-col h-full bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-right-10 duration-500">
      <header className="p-6 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">
            {initialData?.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h3>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Viagem: {trip.name}</p>
        </div>
        <Badge color={formData.preferred ? 'indigo' : 'gray'}>
          {formData.preferred ? '⭐ Favorito' : 'Fornecedor Comum'}
        </Badge>
      </header>

      <div className="flex border-b border-gray-800 bg-gray-900/50">
        {(['info', 'contacts', 'terms'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab === 'info' ? 'Identificação' : tab === 'contacts' ? 'Contatos' : 'Políticas'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {activeTab === 'info' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nome do Fornecedor *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Hilton Orlando" />
              <Input label="Razão Social / Legal" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} placeholder="Nome completo da empresa" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">Categorias de Serviço</label>
              <div className="flex flex-wrap gap-2">
                {trip.categories.map(cat => (
                  <button key={cat} onClick={() => {
                    const current = formData.categories || [];
                    const next = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
                    setFormData({...formData, categories: next});
                  }} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all border ${formData.categories?.includes(cat) ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-600'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-400">Rating (Confiabilidade)</label>
                  <div className="flex gap-2 p-2 bg-gray-950 border border-gray-800 rounded-lg">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} onClick={() => setFormData({...formData, rating: star})} className={`text-xl transition-all ${formData.rating! >= star ? 'text-amber-400' : 'text-gray-800'}`}>★</button>
                    ))}
                  </div>
               </div>
               <div className="flex items-end h-full">
                  <label className="flex items-center gap-3 p-3 bg-gray-950 border border-gray-800 rounded-xl cursor-pointer w-full">
                    <input type="checkbox" className="w-5 h-5 accent-indigo-500" checked={formData.preferred} onChange={e => setFormData({...formData, preferred: e.target.checked})} />
                    <span className="text-sm font-bold text-gray-300">Marcar como Favorito</span>
                  </label>
               </div>
            </div>

            <div className="space-y-4">
              <Input label="Website" value={formData.websiteUrl} onChange={e => setFormData({...formData, websiteUrl: e.target.value})} placeholder="https://..." />
              <Input label="Instagram" value={formData.instagramUrl} onChange={e => setFormData({...formData, instagramUrl: e.target.value})} placeholder="@perfil" />
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-gray-500 uppercase">Equipe de Atendimento</p>
                <Button variant="outline" className="text-[10px] py-1" onClick={() => updateContact({ 
                  id: '', 
                  name: '', 
                  role: 'Comercial', 
                  phone: '',
                  email: '',
                  preferredMethod: 'WhatsApp', 
                  isPrimary: (formData.contacts || []).length === 0 
                })}>
                  + Novo Contato
                </Button>
             </div>

             <div className="space-y-3">
               {(formData.contacts || []).map(contact => (
                 <div key={contact.id} className="p-4 bg-gray-900 border border-gray-800 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start">
                       <div className="flex-1 space-y-4">
                          {/* Nome e Cargo */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-400 mb-1">Nome *</label>
                              <input
                                type="text"
                                value={contact.name}
                                onChange={e => updateContact({...contact, name: e.target.value})}
                                placeholder="Ex: João Silva"
                                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-400 mb-1">Cargo/Setor *</label>
                              <input
                                type="text"
                                value={contact.role}
                                onChange={e => updateContact({...contact, role: e.target.value})}
                                placeholder="Ex: Comercial, Vendas"
                                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                              />
                            </div>
                          </div>

                          {/* WhatsApp e Email */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-400 mb-1">
                                <span className="flex items-center gap-1">
                                  💬 WhatsApp/Telefone
                                  {contact.preferredMethod === 'WhatsApp' && <Badge color="green" className="text-[8px]">Preferido</Badge>}
                                </span>
                              </label>
                              <PhoneInput 
                                value={contact.phone || ''} 
                                onChange={phone => updateContact({...contact, phone})} 
                                placeholder="(00) 00000-0000"
                                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-400 mb-1">
                                <span className="flex items-center gap-1">
                                  ✉️ Email
                                  {contact.preferredMethod === 'Email' && <Badge color="blue" className="text-[8px]">Preferido</Badge>}
                                </span>
                              </label>
                              <input
                                type="email"
                                value={contact.email || ''}
                                onChange={e => updateContact({...contact, email: e.target.value})}
                                placeholder="contato@empresa.com"
                                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                              />
                            </div>
                          </div>

                          {/* Opções */}
                          <div className="flex items-center gap-4 pt-2 border-t border-gray-800">
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-500 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={contact.isPrimary} 
                                onChange={e => {
                                  // Se marcar como principal, desmarcar outros
                                  if (e.target.checked) {
                                    const updatedContacts = (formData.contacts || []).map(c => ({
                                      ...c,
                                      isPrimary: c.id === contact.id
                                    }));
                                    setFormData({...formData, contacts: updatedContacts});
                                  } else {
                                    updateContact({...contact, isPrimary: false});
                                  }
                                }}
                                className="accent-indigo-500" 
                              />
                              ⭐ Contato Principal
                            </label>
                            <div className="flex gap-2">
                              <span className="text-xs text-gray-600">Método preferido:</span>
                              {['WhatsApp', 'Email', 'Telefone'].map(m => (
                                <button 
                                  key={m} 
                                  type="button"
                                  onClick={() => updateContact({...contact, preferredMethod: m as any})} 
                                  className={`px-2 py-1 rounded text-[9px] font-black uppercase border transition-all ${contact.preferredMethod === m ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-gray-950 border-gray-800 text-gray-600 hover:border-gray-700'}`}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </div>
                       </div>
                       <button 
                         type="button"
                         onClick={() => removeContact(contact.id)} 
                         className="ml-4 text-red-500/50 hover:text-red-500 p-2 transition-colors"
                       >
                         ✕
                       </button>
                    </div>
                 </div>
               ))}
               {(formData.contacts || []).length === 0 && (
                 <div className="text-center py-10 bg-gray-900/50 border border-gray-800 rounded-xl">
                   <p className="text-gray-600 italic text-sm mb-3">Nenhum contato cadastrado.</p>
                   <Button 
                     variant="outline" 
                     className="text-xs"
                     onClick={() => updateContact({ 
                       id: '', 
                       name: '', 
                       role: 'Comercial', 
                       phone: '',
                       email: '',
                       preferredMethod: 'WhatsApp', 
                       isPrimary: true 
                     })}
                   >
                     + Adicionar Primeiro Contato
                   </Button>
                 </div>
               )}
             </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <section className="space-y-4">
                <p className="text-[10px] font-black text-gray-500 uppercase">Flags de Risco / Alertas</p>
                <div className="flex flex-wrap gap-2">
                   {RISK_OPTIONS.map(flag => (
                     <button key={flag} onClick={() => {
                        const current = formData.riskFlags || [];
                        const next = current.includes(flag) ? current.filter(f => f !== flag) : [...current, flag];
                        setFormData({...formData, riskFlags: next});
                     }} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${formData.riskFlags?.includes(flag) ? 'bg-red-600/10 border-red-500/40 text-red-400' : 'bg-gray-950 border-gray-800 text-gray-600 hover:border-gray-700'}`}>
                        {flag}
                     </button>
                   ))}
                </div>
             </section>

             <section className="space-y-4">
                <p className="text-[10px] font-black text-gray-500 uppercase">Termos de Pagamento Padrão</p>
                <div className="grid grid-cols-2 gap-4">
                   <Input label="Max Parcelamento" type="number" min="1" value={formData.paymentTermsDefault?.installmentsMax} onChange={e => setFormData({...formData, paymentTermsDefault: { ...formData.paymentTermsDefault!, installmentsMax: Number(e.target.value) }})} />
                   <Input label="% Desconto à Vista" type="number" min="0" value={formData.paymentTermsDefault?.cashDiscountPercent} onChange={e => setFormData({...formData, paymentTermsDefault: { ...formData.paymentTermsDefault!, cashDiscountPercent: Number(e.target.value), cashDiscountPossible: Number(e.target.value) > 0 }})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase">Métodos aceitos</label>
                   <div className="flex flex-wrap gap-2">
                      {Object.values(PaymentMethod).map(m => (
                        <button key={m} onClick={() => {
                          const methods = formData.paymentTermsDefault?.methods || [];
                          const next = methods.includes(m) ? methods.filter(x => x !== m) : [...methods, m];
                          setFormData({...formData, paymentTermsDefault: { ...formData.paymentTermsDefault!, methods: next }});
                        }} className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${formData.paymentTermsDefault?.methods.includes(m) ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-gray-950 border-gray-800 text-gray-600'}`}>
                          {m}
                        </button>
                      ))}
                   </div>
                </div>
             </section>

             <section className="space-y-4">
                <Input as="textarea" label="Notas de Cancelamento" rows={2} value={formData.cancellationPolicyNotes} onChange={e => setFormData({...formData, cancellationPolicyNotes: e.target.value})} placeholder="Ex: Reembolsável até 48h antes..." />
                <Input label="SLA de Resposta" value={formData.slaNotes} onChange={e => setFormData({...formData, slaNotes: e.target.value})} placeholder="Ex: Responde em 2h" />
             </section>
          </div>
        )}
      </div>

      <footer className="p-6 bg-gray-900 border-t border-gray-800 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" onClick={() => onSave(formData as Vendor)} disabled={!isValid}>Salvar Fornecedor</Button>
      </footer>
    </div>
  );
};

export default VendorForm;
