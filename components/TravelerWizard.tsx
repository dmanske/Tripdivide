
import React, { useState } from 'react';
import { Trip, Traveler, TravelerType, DocType, Couple } from '../types';
// Add Card to the imports from CommonUI
import { Button, Input, Badge, Card } from './CommonUI';

interface TravelerWizardProps {
  trip: Trip;
  initialData?: Partial<Traveler>;
  onSave: (traveler: Traveler) => void;
  onCancel: () => void;
}

const TravelerWizard: React.FC<TravelerWizardProps> = ({ trip, initialData, onSave, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Traveler>>({
    tripId: trip.id,
    type: TravelerType.ADULT,
    coupleId: trip.couples[0]?.id || '',
    goesToSegments: trip.segments.map(s => s.id),
    isPayer: true,
    canDrive: false,
    tags: [],
    docType: DocType.NONE,
    status: 'Ativo',
    attachments: [],
    ...initialData
  });

  const steps = [
    { id: 1, title: 'Básico' },
    { id: 2, title: 'Participação' },
    { id: 3, title: 'Documentos' }
  ];

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const isValid = formData.fullName && formData.fullName.trim().length > 0;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center relative pb-8">
        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-800 -z-10"></div>
        {steps.map(s => (
          <div key={s.id} className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${step === s.id ? 'bg-indigo-600 border-indigo-400 text-white' : step > s.id ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-gray-900 border-gray-700 text-gray-500'}`}>
              {step > s.id ? '✓' : s.id}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{s.title}</span>
          </div>
        ))}
      </div>

      <div className="min-h-[300px]">
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
             <Input label="Nome Completo *" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Nome como no passaporte" />
             <Input label="Apelido" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} placeholder="Como o grupo te chama" />
             <Input as="select" label="Tipo *" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                {Object.values(TravelerType).map(t => <option key={t} value={t}>{t}</option>)}
             </Input>
             <Input as="select" label="Casal / Grupo *" value={formData.coupleId} onChange={e => setFormData({...formData, coupleId: e.target.value})}>
                {trip.couples.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </Input>
             <Input label="Data de Nascimento" type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
             <Input label="WhatsApp (Fone)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+55..." />
             <Input label="Email" className="col-span-1 md:col-span-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Segmentos da Viagem</label>
                <div className="grid grid-cols-2 gap-2">
                   {trip.segments.map(s => (
                     <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${formData.goesToSegments?.includes(s.id) ? 'bg-indigo-600/10 border-indigo-500/40 text-white' : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700'}`}>
                        <input type="checkbox" className="w-4 h-4 accent-indigo-500" checked={formData.goesToSegments?.includes(s.id)} onChange={e => {
                          const ids = formData.goesToSegments || [];
                          const next = e.target.checked ? [...ids, s.id] : ids.filter(x => x !== s.id);
                          setFormData({...formData, goesToSegments: next});
                        }} />
                        <span className="text-sm font-bold">{s.name}</span>
                     </label>
                   ))}
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-between">
                   <div>
                      <p className="text-sm font-bold">Viajante Pagante?</p>
                      <p className="text-[10px] text-gray-600 uppercase">Considerar no racha de custos</p>
                   </div>
                   <input type="checkbox" className="w-6 h-6 accent-emerald-500" checked={formData.isPayer} onChange={e => setFormData({...formData, isPayer: e.target.checked})} />
                </div>
                <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-between">
                   <div>
                      <p className="text-sm font-bold">Pode Dirigir?</p>
                      <p className="text-[10px] text-gray-600 uppercase">CNH Habilitada</p>
                   </div>
                   <input type="checkbox" className="w-6 h-6 accent-indigo-500" checked={formData.canDrive} onChange={e => setFormData({...formData, canDrive: e.target.checked})} />
                </div>
             </div>
             <Input as="textarea" label="Tags / Observações de Logística" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Restrições alimentares, prioridades, etc." />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input as="select" label="Tipo Documento" value={formData.docType} onChange={e => setFormData({...formData, docType: e.target.value as any})}>
                   {Object.values(DocType).map(d => <option key={d} value={d}>{d}</option>)}
                </Input>
                <Input label="Número do Doc" value={formData.docNumber} onChange={e => setFormData({...formData, docNumber: e.target.value})} disabled={formData.docType === DocType.NONE} />
                <Input label="Vencimento" type="date" value={formData.docExpiry} onChange={e => setFormData({...formData, docExpiry: e.target.value})} disabled={formData.docType === DocType.NONE} />
             </div>
             
             <div className="p-10 border-2 border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-gray-600 italic">
                <svg className="w-8 h-8 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <p className="text-xs">Upload de anexos em breve</p>
             </div>
             
             {/* Card component is imported and used here */}
             <Card className="!bg-amber-600/5 !border-amber-500/20">
                <p className="text-[10px] text-amber-500 font-bold uppercase mb-1">Aviso de Segurança</p>
                <p className="text-xs text-gray-500">Documentos são opcionais e usados apenas para controle de expiração e emissão de vouchers pelo organizador.</p>
             </Card>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-6 border-t border-gray-800">
        <Button variant="ghost" onClick={step === 1 ? onCancel : handleBack}>
          {step === 1 ? 'Cancelar' : 'Voltar'}
        </Button>
        <div className="flex gap-2">
           {step < 3 ? (
             <Button onClick={handleNext} disabled={step === 1 && !isValid}>Próximo</Button>
           ) : (
             <Button variant="primary" onClick={() => onSave(formData as Traveler)} disabled={!isValid}>Salvar Viajante</Button>
           )}
        </div>
      </div>
    </div>
  );
};

export default TravelerWizard;
