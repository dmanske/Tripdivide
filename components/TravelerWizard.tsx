import React, { useState, useEffect } from 'react';
import { Trip, Traveler, TravelerType, DocType, Couple } from '../types';
import { Button, Input, Badge, Card } from './CommonUI';
import PhoneInput from './PhoneInput';
import { dateToInput } from '../lib/formatters';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import DocumentDrawer from './DocumentDrawer';

// Funções de formatação de documentos
const formatDocNumber = (value: string, docType: string): string => {
  // Remove tudo que não é letra ou número
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '');
  
  switch (docType) {
    case 'CPF':
      // 000.000.000-00
      return cleaned
        .slice(0, 11)
        .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        .replace(/(\d{3})(\d{3})(\d{3})(\d{1})$/, '$1.$2.$3-$4')
        .replace(/(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3')
        .replace(/(\d{3})(\d{2})$/, '$1.$2');
    
    case 'RG':
      // 00.000.000-0
      return cleaned
        .slice(0, 9)
        .replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4')
        .replace(/(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3')
        .replace(/(\d{2})(\d{3})$/, '$1.$2');
    
    case 'CNH':
      // 00000000000 (11 dígitos sem formatação)
      return cleaned.slice(0, 11);
    
    case 'Passaporte':
      // AA000000 (2 letras + 6 números)
      return cleaned.slice(0, 8).toUpperCase();
    
    default:
      return value;
  }
};

const unformatDocNumber = (value: string): string => {
  return value.replace(/[^A-Za-z0-9]/g, '');
};

interface TravelerWizardProps {
  tripId?: string; // Opcional - se fornecido, cria vínculo com viagem
  trip?: Trip; // Opcional - necessário apenas se tripId fornecido
  existingProfileId?: string; // Para edição de perfil existente
  onDone?: (profileId: string) => void; // Retorna o profileId criado/editado
  onCancel: () => void;
}

const TravelerWizard: React.FC<TravelerWizardProps> = ({ tripId, trip, existingProfileId, onDone, onCancel }) => {
  const [step, setStep] = useState(1);
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [editingDocIndex, setEditingDocIndex] = useState<number>(-1);
  const [showDocNumber, setShowDocNumber] = useState(true); // Mostrar por padrão
  const [tagInput, setTagInput] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [profileId, setProfileId] = useState<string | undefined>(existingProfileId);
  const [tripTravelerId, setTripTravelerId] = useState<string | undefined>();
  
  // Dados do perfil global (Step 1)
  const [profileData, setProfileData] = useState<any>({
    fullName: '',
    nickname: '',
    phone: '',
    email: '',
    birthDate: '',
    type: TravelerType.ADULT, // Tipo agora faz parte do perfil
    canDrive: false,
    tags: [],
    notes: ''
  });
  
  // Dados específicos da viagem (Step 2)
  const [tripData, setTripData] = useState<any>({
    type: TravelerType.ADULT,
    coupleId: trip?.couples?.[0]?.id || '',
    goesToSegments: trip?.segments
      ?.filter(s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id))
      .map(s => s.id) || [],
    isPayer: true,
    countInSplit: true
  });
  
  // Controle se deve vincular à viagem (quando tripId existe)
  const [shouldLinkToTrip, setShouldLinkToTrip] = useState(true);

  // Carregar perfil e documentos se estiver editando
  useEffect(() => {
    const loadProfile = async () => {
      if (existingProfileId) {
        setLoadingDocs(true);
        try {
          const profile = await supabaseDataProvider.getTravelerProfileById(existingProfileId);
          if (profile) {
            setProfileData({
              fullName: profile.full_name || '',
              nickname: profile.nickname || '',
              phone: profile.phone || '',
              email: profile.email || '',
              birthDate: profile.birth_date || '',
              type: profile.type || TravelerType.ADULT, // Carregar tipo do perfil
              canDrive: profile.can_drive || false,
              tags: profile.tags || [],
              notes: profile.notes || ''
            });
            
            const docs = await supabaseDataProvider.getTravelerProfileDocuments(existingProfileId);
            setDocuments(docs);
            
            if (tripId) {
              const tripTravelers = await supabaseDataProvider.getTripTravelers(tripId);
              const link = tripTravelers.find((tt: any) => tt.traveler_profile_id === existingProfileId);
              if (link) {
                setTripTravelerId(link.id);
                setTripData({
                  type: link.type || TravelerType.ADULT,
                  coupleId: link.couple_id || trip?.couples[0]?.id || '',
                  goesToSegments: link.goes_to_segments || [],
                  isPayer: link.is_payer !== undefined ? link.is_payer : true,
                  countInSplit: link.count_in_split !== undefined ? link.count_in_split : true
                });
              }
            }
          }
        } catch (error) {
          console.error('Erro ao carregar perfil:', error);
        } finally {
          setLoadingDocs(false);
        }
      }
    };
    
    loadProfile();
  }, [existingProfileId, tripId]);

  // Ajustar defaults baseado no tipo
  useEffect(() => {
    if (profileData.type === TravelerType.INFANT || profileData.type === "Pet") {
      setTripData((prev: any) => ({ ...prev, isPayer: false, countInSplit: false }));
      setProfileData((prev: any) => ({ ...prev, canDrive: false }));
    } else if (profileData.type === TravelerType.ADULT) {
      setTripData((prev: any) => ({ ...prev, isPayer: true, countInSplit: true }));
    }
  }, [profileData.type]);

  // Steps dinâmicos: se não tem trip, pula o step 2
  const steps = tripId 
    ? [
        { id: 1, title: 'Básico' },
        { id: 2, title: 'Participação' },
        { id: 3, title: 'Documentos' }
      ]
    : [
        { id: 1, title: 'Básico' },
        { id: 3, title: 'Documentos' }
      ];

  const handleNext = async () => {
    // Step 1 -> Step 2 (or 3 if no trip): Salvar perfil global
    if (step === 1) {
      try {
        const saved = await supabaseDataProvider.saveTravelerProfile({
          id: profileId,
          full_name: profileData.fullName,
          nickname: profileData.nickname,
          phone: profileData.phone,
          email: profileData.email,
          birth_date: profileData.birthDate,
          type: profileData.type, // Salvar tipo no perfil
          can_drive: profileData.canDrive,
          tags: profileData.tags,
          notes: profileData.notes
        });
        if (saved?.id) setProfileId(saved.id);
        
        // Se não tem trip OU não quer vincular, pula direto para step 3 (documentos)
        if (!tripId || !shouldLinkToTrip) {
          setStep(3);
          return;
        }
        
        // Se tem trip E quer vincular, vai para step 2
        setStep(2);
        return;
      } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        return;
      }
    }
    
    // Step 2 -> Step 3: Salvar vínculo se tripId existe E shouldLinkToTrip é true
    if (step === 2 && tripId && profileId && shouldLinkToTrip) {
      try {
        if (tripTravelerId) {
          await supabaseDataProvider.updateTripTraveler(tripTravelerId, {
            type: tripData.type,
            coupleId: tripData.coupleId,
            goesToSegments: tripData.goesToSegments,
            isPayer: tripData.isPayer,
            countInSplit: tripData.countInSplit
          });
        } else {
          const link = await supabaseDataProvider.linkTravelerToTrip({
            tripId,
            travelerProfileId: profileId,
            type: tripData.type,
            coupleId: tripData.coupleId,
            goesToSegments: tripData.goesToSegments,
            isPayer: tripData.isPayer,
            countInSplit: tripData.countInSplit
          });
          if (link?.id) setTripTravelerId(link.id);
        }
        
        // Avança para step 3
        setStep(3);
        return;
      } catch (error) {
        console.error('Erro ao vincular:', error);
        return;
      }
    }
    
    // Fallback: avança normalmente
    setStep(s => Math.min(s + 1, 3));
  };
  
  const handleBack = () => {
    // Se está no step 3 e não tem trip OU não quer vincular, volta direto para step 1
    if (step === 3 && (!tripId || !shouldLinkToTrip)) {
      setStep(1);
    } else {
      setStep(s => Math.max(s - 1, 1));
    }
  };

  // Validação do Step 1
  const isStep1Valid = () => {
    if (!profileData.fullName || !profileData.fullName.trim()) return false;
    if ((profileData.type === TravelerType.CHILD || profileData.type === TravelerType.INFANT) && !profileData.birthDate) return false;
    return true;
  };

  const maskDocNumber = (docNumber: string) => {
    if (!docNumber || docNumber.length <= 4) return docNumber;
    const last4 = docNumber.slice(-4);
    return `••••${last4}`;
  };

  const addTag = () => {
    if (tagInput.trim() && !profileData.tags?.includes(tagInput.trim())) {
      setProfileData({
        ...profileData,
        tags: [...(profileData.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setProfileData({
      ...profileData,
      tags: profileData.tags?.filter(t => t !== tag)
    });
  };

  // Helper para definir categoria do documento baseado no tipo
  const getDocCategory = (docType: string): string => {
    if (docType === 'Visto' || docType === 'ESTA') return 'entry';
    return 'identity';
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center relative pb-8">
        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-800 -z-10"></div>
        {steps.map((s, index) => (
          <div key={s.id} className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${step === s.id ? 'bg-indigo-600 border-indigo-400 text-white' : step > s.id ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-gray-900 border-gray-700 text-gray-500'}`}>
              {step > s.id ? '✓' : index + 1}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{s.title}</span>
          </div>
        ))}
      </div>

      <div className="min-h-[300px]">
        {/* STEP 1: BÁSICO */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
             <Input 
               label="Nome Completo *" 
               value={profileData.fullName} 
               onChange={e => setProfileData({...profileData, fullName: e.target.value})} 
               placeholder="Como o grupo conhece" 
             />
             <Input 
               label="Apelido" 
               value={profileData.nickname} 
               onChange={e => setProfileData({...profileData, nickname: e.target.value})} 
               placeholder="Opcional" 
             />
             <Input as="select" label="Tipo *" value={profileData.type} onChange={e => setProfileData({...profileData, type: e.target.value as any})}>
                {Object.values(TravelerType).map(t => <option key={t} value={t}>{t}</option>)}
             </Input>
             {trip && (
               <div>
                 <label className="block text-sm font-medium text-gray-400 mb-2">Casal / Grupo *</label>
                 {!showNewGroupInput ? (
                   <div className="flex gap-2">
                     <select 
                       value={tripData.coupleId} 
                       onChange={e => setTripData({...tripData, coupleId: e.target.value})}
                       className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                     >
                       {trip?.couples?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                     <Button 
                       variant="outline" 
                       className="text-xs whitespace-nowrap"
                       onClick={(e) => {
                         e.preventDefault();
                         setShowNewGroupInput(true);
                         setNewGroupName('');
                       }}
                     >
                       + Grupo
                     </Button>
                   </div>
                 ) : (
                   <div className="space-y-2">
                     <div className="flex gap-2">
                       <input
                         type="text"
                         value={newGroupName}
                         onChange={e => setNewGroupName(e.target.value)}
                         placeholder="Nome do novo grupo"
                         className="flex-1 px-4 py-2.5 bg-gray-950 border border-indigo-500 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-400 transition-colors"
                         autoFocus
                         onKeyDown={async (e) => {
                           if (e.key === 'Enter' && newGroupName.trim()) {
                             e.preventDefault();
                             if (!trip?.id) return;
                             const newCouple = await supabaseDataProvider.saveCouple(trip.id, { name: newGroupName.trim() });
                             if (newCouple) {
                               trip.couples.push({ id: newCouple.id, name: newCouple.name, members: [] });
                               setTripData({...tripData, coupleId: newCouple.id});
                               setShowNewGroupInput(false);
                               setNewGroupName('');
                             }
                           } else if (e.key === 'Escape') {
                             setShowNewGroupInput(false);
                             setNewGroupName('');
                           }
                         }}
                       />
                       <Button 
                         variant="primary" 
                         className="text-xs whitespace-nowrap"
                         disabled={!newGroupName.trim()}
                         onClick={async (e) => {
                           e.preventDefault();
                           if (newGroupName.trim()) {
                             if (!trip?.id) return;
                             const newCouple = await supabaseDataProvider.saveCouple(trip.id, { name: newGroupName.trim() });
                             if (newCouple) {
                               trip.couples.push({ id: newCouple.id, name: newCouple.name, members: [] });
                               setTripData({...tripData, coupleId: newCouple.id});
                               setShowNewGroupInput(false);
                               setNewGroupName('');
                             }
                           }
                         }}
                       >
                         Criar
                       </Button>
                       <Button 
                         variant="ghost" 
                         className="text-xs"
                         onClick={(e) => {
                           e.preventDefault();
                         setShowNewGroupInput(false);
                         setNewGroupName('');
                       }}
                     >
                       ✕
                     </Button>
                   </div>
                   <p className="text-[10px] text-gray-600">Enter para criar, Esc para cancelar</p>
                 </div>
               )}
             </div>
             )}
             
             {/* Data de Nascimento - obrigatória para Criança/Bebê */}
             {profileData.type !== "Pet" && (
               <Input 
                 label={`Data de Nascimento ${(profileData.type === TravelerType.CHILD || profileData.type === TravelerType.INFANT) ? '*' : ''}`}
                 type="date" 
                 value={dateToInput(profileData.birthDate)} 
                 onChange={e => setProfileData({...profileData, birthDate: e.target.value})} 
               />
             )}
             
             <div>
               <label className="block text-sm font-medium text-gray-400 mb-2">WhatsApp (Fone)</label>
               <PhoneInput 
                 value={profileData.phone || ''} 
                 onChange={phone => setProfileData({...profileData, phone})} 
                 placeholder="(00) 00000-0000"
                 className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
               />
             </div>
             <Input 
               label="Email" 
               className="col-span-1 md:col-span-2" 
               value={profileData.email} 
               onChange={e => setProfileData({...profileData, email: e.target.value})} 
               placeholder="Recomendado para comunicação"
             />
          </div>
        )}

        {/* STEP 2: PARTICIPAÇÃO */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
             {/* Opção de vincular à viagem */}
             {tripId && (
               <div className="p-4 bg-indigo-600/10 border border-indigo-500/30 rounded-xl">
                 <label className="flex items-start gap-3 cursor-pointer">
                   <input 
                     type="checkbox" 
                     className="w-5 h-5 mt-0.5 accent-indigo-500" 
                     checked={shouldLinkToTrip} 
                     onChange={e => setShouldLinkToTrip(e.target.checked)} 
                   />
                   <div>
                     <p className="text-sm font-bold text-white">Vincular a esta viagem agora</p>
                     <p className="text-xs text-gray-400 mt-1">
                       Se desmarcar, o perfil será criado mas não vinculado. Você pode vincular depois pela opção "Adicionar da Lista".
                     </p>
                   </div>
                 </label>
               </div>
             )}

             {/* Campos de participação - só aparecem se shouldLinkToTrip */}
             {shouldLinkToTrip && (
               <>
                 <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-400">Segmentos da Viagem</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setTripData({...tripData, goesToSegments: trip?.segments?.map(s => s.id) || []})}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase"
                        >
                          Marcar todos
                        </button>
                        <span className="text-gray-700">•</span>
                        <button 
                          onClick={() => setTripData({...tripData, goesToSegments: []})}
                          className="text-[10px] text-gray-500 hover:text-gray-400 font-bold uppercase"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       {trip?.segments?.map(s => (
                         <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${tripData.goesToSegments?.includes(s.id) ? 'bg-indigo-600/10 border-indigo-500/40 text-white' : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700'}`}>
                            <input type="checkbox" className="w-4 h-4 accent-indigo-500" checked={tripData.goesToSegments?.includes(s.id)} onChange={e => {
                              const ids = tripData.goesToSegments || [];
                              const next = e.target.checked ? [...ids, s.id] : ids.filter(x => x !== s.id);
                              setTripData({...tripData, goesToSegments: next});
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
                       <input 
                         type="checkbox" 
                         className="w-6 h-6 accent-emerald-500" 
                         checked={tripData.isPayer} 
                         onChange={e => setTripData({...tripData, isPayer: e.target.checked})} 
                         disabled={profileData.type === TravelerType.INFANT || profileData.type === "Pet"}
                       />
                    </div>
                    
                    {profileData.type === TravelerType.ADULT && (
                      <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-between">
                         <div>
                            <p className="text-sm font-bold">Pode Dirigir?</p>
                            <p className="text-[10px] text-gray-600 uppercase">CNH Habilitada</p>
                         </div>
                         <input type="checkbox" className="w-6 h-6 accent-indigo-500" checked={profileData.canDrive} onChange={e => setProfileData({...profileData, canDrive: e.target.checked})} />
                      </div>
                    )}
                 </div>
               </>
             )}
             
             {/* Tags e observações - sempre aparecem */}
             <div>
               <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
               <div className="flex flex-wrap gap-2 mb-2">
                 {profileData.tags?.map(tag => (
                   <Badge key={tag} color="indigo" className="flex items-center gap-1">
                     {tag}
                     <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-400">✕</button>
                   </Badge>
                 ))}
               </div>
               <div className="flex gap-2">
                 <input
                   type="text"
                   value={tagInput}
                   onChange={e => setTagInput(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                   placeholder="Ex: Vegetariano, Alergia, Prefere janela"
                   className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                 />
                 <Button variant="outline" onClick={addTag} disabled={!tagInput.trim()}>+ Add</Button>
               </div>
             </div>
             
             {/* Observações livres */}
             <Input 
               as="textarea" 
               label="Observações Livres" 
               rows={2} 
               value={profileData.notes} 
               onChange={e => setProfileData({...profileData, notes: e.target.value})} 
               placeholder="Detalhes adicionais, restrições, preferências..."
             />
          </div>
        )}

        {/* STEP 3: DOCUMENTOS */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <Card className="!bg-indigo-600/5 !border-indigo-500/20">
                <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">🔒 Documentação (Opcional)</p>
                <p className="text-xs text-gray-500">Adicione documentos para controle. Números são protegidos e não aparecem completos na listagem.</p>
             </Card>
             
             {/* Lista de documentos */}
             <div className="space-y-2">
                {documents.map((doc, idx) => (
                  <div key={idx} className="p-3 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{doc.docType} - {maskDocNumber(doc.docNumber)}</p>
                      <p className="text-[10px] text-gray-500">
                        {doc.issuingCountry && `${doc.issuingCountry} • `}
                        {doc.docExpiry && `Vence: ${doc.docExpiry}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingDoc(doc);
                          setEditingDocIndex(idx);
                          setShowDocNumber(true); // Mostrar por padrão ao editar
                        }} 
                        className="text-indigo-400 hover:text-indigo-300 text-xs"
                      >
                        ✏️
                      </button>
                      <button onClick={() => setDocuments(documents.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 text-xs">🗑️</button>
                    </div>
                  </div>
                ))}
             </div>

             {/* Formulário de novo documento */}
             {editingDoc !== null ? (
               <Card className="!bg-gray-900/50">
                 <p className="text-xs font-bold text-gray-400 mb-3">{editingDocIndex >= 0 ? 'Editar Documento' : 'Novo Documento'}</p>
                 <div className="space-y-4">
                   {/* Tipo de Documento */}
                   <Input 
                     as="select" 
                     label="Tipo *" 
                     value={editingDoc.docType || 'Passaporte'} 
                     onChange={e => setEditingDoc({
                       ...editingDoc, 
                       docType: e.target.value,
                       docCategory: getDocCategory(e.target.value)
                     })}
                   >
                     <option value="Passaporte">🛂 Passaporte</option>
                     <option value="RG">🪪 RG</option>
                     <option value="CPF">📄 CPF</option>
                     <option value="CNH">🚗 CNH</option>
                     <option value="Visto">🌍 Visto</option>
                     <option value="ESTA">✈️ ESTA/ETA</option>
                     <option value="Outro">📋 Outro</option>
                   </Input>

                   {/* PASSAPORTE */}
                   {editingDoc.docType === 'Passaporte' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <Input 
                         label="País Emissor *" 
                         value={editingDoc.issuingCountry || ''} 
                         onChange={e => setEditingDoc({...editingDoc, issuingCountry: e.target.value || ''})}
                         placeholder="Ex: Brasil"
                       />
                       <div>
                         <label className="block text-sm font-medium text-gray-400 mb-2">Número *</label>
                         <div className="flex gap-2">
                           <input
                             type={showDocNumber ? 'text' : 'password'}
                             value={showDocNumber ? formatDocNumber(editingDoc.docNumber || '', editingDoc.docType) : editingDoc.docNumber || ''}
                             onChange={e => {
                               const unformatted = unformatDocNumber(e.target.value);
                               setEditingDoc({...editingDoc, docNumber: unformatted || ''});
                             }}
                             placeholder="Ex: AB123456"
                             className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                           />
                           <button
                             onClick={() => setShowDocNumber(!showDocNumber)}
                             className="px-3 text-gray-500 hover:text-gray-300"
                           >
                             {showDocNumber ? '👁️' : '🙈'}
                           </button>
                         </div>
                       </div>
                       <Input 
                         label="Data de Emissão" 
                         type="date" 
                         value={dateToInput(editingDoc.issueDate) || ''} 
                         onChange={e => setEditingDoc({...editingDoc, issueDate: e.target.value || ''})}
                       />
                       <Input 
                         label="Vencimento *" 
                         type="date" 
                         value={dateToInput(editingDoc.docExpiry) || ''} 
                         onChange={e => setEditingDoc({...editingDoc, docExpiry: e.target.value || ''})}
                       />
                       <Input 
                         label="Local de Emissão" 
                         value={editingDoc.issuerPlace || ''} 
                         onChange={e => setEditingDoc({...editingDoc, issuerPlace: e.target.value || ''})}
                         placeholder="Ex: São Paulo"
                       />
                       <Input 
                         label="Observações" 
                         value={editingDoc.notes || ''} 
                         onChange={e => setEditingDoc({...editingDoc, notes: e.target.value || ''})}
                         placeholder="Detalhes adicionais"
                       />
                     </div>
                   )}

                   {/* RG */}
                   {editingDoc.docType === 'RG' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <Input 
                         label="Estado Emissor *" 
                         value={editingDoc.issuerState || ''} 
                         onChange={e => setEditingDoc({...editingDoc, issuerState: e.target.value})}
                         placeholder="Ex: SP"
                       />
                       <div>
                         <label className="block text-sm font-medium text-gray-400 mb-2">Número *</label>
                         <div className="flex gap-2">
                           <input
                             type={showDocNumber ? 'text' : 'password'}
                             value={showDocNumber ? formatDocNumber(editingDoc.docNumber || '', editingDoc.docType) : editingDoc.docNumber || ''}
                             onChange={e => {
                               const unformatted = unformatDocNumber(e.target.value);
                               setEditingDoc({...editingDoc, docNumber: unformatted});
                             }}
                             placeholder="Ex: 00.000.000-0"
                             className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                           />
                           <button
                             onClick={() => setShowDocNumber(!showDocNumber)}
                             className="px-3 text-gray-500 hover:text-gray-300"
                           >
                             {showDocNumber ? '👁️' : '🙈'}
                           </button>
                         </div>
                       </div>
                       <Input 
                         label="Órgão Emissor" 
                         value={editingDoc.issuerAgency || ''} 
                         onChange={e => setEditingDoc({...editingDoc, issuerAgency: e.target.value})}
                         placeholder="Ex: SSP"
                       />
                       <Input 
                         label="Data de Emissão" 
                         type="date" 
                         value={dateToInput(editingDoc.issueDate) || ''} 
                         onChange={e => setEditingDoc({...editingDoc, issueDate: e.target.value || ''})}
                       />
                       <Input 
                         label="Vencimento (opcional)" 
                         type="date" 
                         value={dateToInput(editingDoc.docExpiry) || ''} 
                         onChange={e => setEditingDoc({...editingDoc, docExpiry: e.target.value || ''})}
                       />
                       <Input 
                         label="Observações" 
                         value={editingDoc.notes || ''} 
                         onChange={e => setEditingDoc({...editingDoc, notes: e.target.value})}
                         placeholder="Detalhes adicionais"
                       />
                     </div>
                   )}

                   {/* CPF */}
                   {editingDoc.docType === 'CPF' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <div>
                         <label className="block text-sm font-medium text-gray-400 mb-2">Número *</label>
                         <div className="flex gap-2">
                           <input
                             type={showDocNumber ? 'text' : 'password'}
                             value={showDocNumber ? formatDocNumber(editingDoc.docNumber || '', editingDoc.docType) : editingDoc.docNumber || ''}
                             onChange={e => {
                               const unformatted = unformatDocNumber(e.target.value);
                               setEditingDoc({...editingDoc, docNumber: unformatted});
                             }}
                             placeholder="Ex: 000.000.000-00"
                             className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                           />
                           <button
                             onClick={() => setShowDocNumber(!showDocNumber)}
                             className="px-3 text-gray-500 hover:text-gray-300"
                           >
                             {showDocNumber ? '👁️' : '🙈'}
                           </button>
                         </div>
                       </div>
                       <Input 
                         label="Observações" 
                         className="md:col-span-2"
                         value={editingDoc.notes || ''} 
                         onChange={e => setEditingDoc({...editingDoc, notes: e.target.value})}
                         placeholder="Detalhes adicionais"
                       />
                     </div>
                   )}

                   {/* CNH */}
                   {editingDoc.docType === 'CNH' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <div>
                         <label className="block text-sm font-medium text-gray-400 mb-2">Número de Registro *</label>
                         <div className="flex gap-2">
                           <input
                             type={showDocNumber ? 'text' : 'password'}
                             value={showDocNumber ? formatDocNumber(editingDoc.docNumber || '', editingDoc.docType) : editingDoc.docNumber || ''}
                             onChange={e => {
                               const unformatted = unformatDocNumber(e.target.value);
                               setEditingDoc({...editingDoc, docNumber: unformatted});
                             }}
                             placeholder="Ex: 12345678900"
                             className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                           />
                           <button
                             onClick={() => setShowDocNumber(!showDocNumber)}
                             className="px-3 text-gray-500 hover:text-gray-300"
                           >
                             {showDocNumber ? '👁️' : '🙈'}
                           </button>
                         </div>
                       </div>
                       <Input 
                         as="select"
                         label="Categoria" 
                         value={editingDoc.licenseCategory || ''} 
                         onChange={e => setEditingDoc({...editingDoc, licenseCategory: e.target.value})}
                       >
                         <option value="">Selecione</option>
                         <option value="A">A - Moto</option>
                         <option value="B">B - Carro</option>
                         <option value="AB">AB - Moto e Carro</option>
                         <option value="C">C - Caminhão</option>
                         <option value="D">D - Ônibus</option>
                         <option value="E">E - Carreta</option>
                       </Input>
                       <Input 
                         label="UF Emissora" 
                         value={editingDoc.issuerState || ''} 
                         onChange={e => setEditingDoc({...editingDoc, issuerState: e.target.value})}
                         placeholder="Ex: SP"
                       />
                       <Input 
                         label="Data de Emissão" 
                         type="date" 
                         value={dateToInput(editingDoc.issueDate) || ''} 
                         onChange={e => setEditingDoc({...editingDoc, issueDate: e.target.value || ''})}
                       />
                       <Input 
                         label="Vencimento *" 
                         type="date" 
                         value={dateToInput(editingDoc.docExpiry) || ''} 
                         onChange={e => setEditingDoc({...editingDoc, docExpiry: e.target.value || ''})}
                       />
                       <Input 
                         label="Observações" 
                         value={editingDoc.notes || ''} 
                         onChange={e => setEditingDoc({...editingDoc, notes: e.target.value})}
                         placeholder="Detalhes adicionais"
                       />
                     </div>
                   )}

                   {/* VISTO */}
                   {editingDoc.docType === 'Visto' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <Input 
                         label="País/Região *" 
                         value={editingDoc.regionOrCountry || ''} 
                         onChange={e => setEditingDoc({...editingDoc, regionOrCountry: e.target.value})}
                         placeholder="Ex: EUA, Schengen"
                       />
                       <Input 
                         label="Categoria" 
                         value={editingDoc.visaCategory || ''} 
                         onChange={e => setEditingDoc({...editingDoc, visaCategory: e.target.value})}
                         placeholder="Ex: B1/B2, Turismo"
                       />
                       <Input 
                         as="select"
                         label="Tipo de Entrada" 
                         value={editingDoc.entryType || ''} 
                         onChange={e => setEditingDoc({...editingDoc, entryType: e.target.value})}
                       >
                         <option value="">Selecione</option>
                         <option value="single">Entrada Única</option>
                         <option value="multiple">Múltiplas Entradas</option>
                       </Input>
                       <Input 
                         label="Duração (dias)" 
                         type="number"
                         value={editingDoc.stayDurationDays || ''} 
                         onChange={e => setEditingDoc({...editingDoc, stayDurationDays: parseInt(e.target.value) || null})}
                         placeholder="Ex: 90"
                       />
                       <div>
                         <label className="block text-sm font-medium text-gray-400 mb-2">Número/ID (opcional)</label>
                         <div className="flex gap-2">
                           <input
                             type={showDocNumber ? 'text' : 'password'}
                             value={editingDoc.docNumber || ''}
                             onChange={e => setEditingDoc({...editingDoc, docNumber: e.target.value})}
                             placeholder="Ex: 123456789"
                             className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                           />
                           <button
                             onClick={() => setShowDocNumber(!showDocNumber)}
                             className="px-3 text-gray-500 hover:text-gray-300"
                           >
                             {showDocNumber ? '👁️' : '🙈'}
                           </button>
                         </div>
                       </div>
                       <Input 
                         label="Vencimento *" 
                         type="date" 
                         value={dateToInput(editingDoc.docExpiry) || ''} 
                         onChange={e => setEditingDoc({...editingDoc, docExpiry: e.target.value || ''})}
                       />
                       <Input 
                         label="Observações" 
                         className="md:col-span-2"
                         value={editingDoc.notes || ''} 
                         onChange={e => setEditingDoc({...editingDoc, notes: e.target.value})}
                         placeholder="Ex: Válido para turismo"
                       />
                     </div>
                   )}

                   {/* ESTA/ETA */}
                   {editingDoc.docType === 'ESTA' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <Input 
                         label="País/Região *" 
                         value={editingDoc.regionOrCountry || ''} 
                         onChange={e => setEditingDoc({...editingDoc, regionOrCountry: e.target.value})}
                         placeholder="Ex: EUA, Canadá"
                       />
                       <div>
                         <label className="block text-sm font-medium text-gray-400 mb-2">Número/ID (opcional)</label>
                         <div className="flex gap-2">
                           <input
                             type={showDocNumber ? 'text' : 'password'}
                             value={editingDoc.docNumber || ''}
                             onChange={e => setEditingDoc({...editingDoc, docNumber: e.target.value})}
                             placeholder="Ex: 123456789"
                             className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                           />
                           <button
                             onClick={() => setShowDocNumber(!showDocNumber)}
                             className="px-3 text-gray-500 hover:text-gray-300"
                           >
                             {showDocNumber ? '👁️' : '🙈'}
                           </button>
                         </div>
                       </div>
                       <Input 
                         label="Vencimento *" 
                         type="date" 
                         value={dateToInput(editingDoc.docExpiry) || ''} 
                         onChange={e => setEditingDoc({...editingDoc, docExpiry: e.target.value || ''})}
                       />
                       <Input 
                         label="Observações" 
                         value={editingDoc.notes || ''} 
                         onChange={e => setEditingDoc({...editingDoc, notes: e.target.value})}
                         placeholder="Detalhes adicionais"
                       />
                     </div>
                   )}

                   {/* OUTRO */}
                   {editingDoc.docType === 'Outro' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <Input 
                         label="Nome do Documento *" 
                         value={editingDoc.customLabel || ''} 
                         onChange={e => setEditingDoc({...editingDoc, customLabel: e.target.value})}
                         placeholder="Ex: Carteira do Plano"
                       />
                       <div>
                         <label className="block text-sm font-medium text-gray-400 mb-2">Número/ID (opcional)</label>
                         <div className="flex gap-2">
                           <input
                             type={showDocNumber ? 'text' : 'password'}
                             value={editingDoc.docNumber || ''}
                             onChange={e => setEditingDoc({...editingDoc, docNumber: e.target.value})}
                             placeholder="Ex: 123456"
                             className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                           />
                           <button
                             onClick={() => setShowDocNumber(!showDocNumber)}
                             className="px-3 text-gray-500 hover:text-gray-300"
                           >
                             {showDocNumber ? '👁️' : '🙈'}
                           </button>
                         </div>
                       </div>
                       <Input 
                         label="País/Estado Emissor" 
                         value={editingDoc.issuingCountry || editingDoc.issuerState || ''} 
                         onChange={e => setEditingDoc({...editingDoc, issuingCountry: e.target.value})}
                         placeholder="Ex: Brasil"
                       />
                       <Input 
                         label="Vencimento (opcional)" 
                         type="date" 
                         value={dateToInput(editingDoc.docExpiry) || ''} 
                         onChange={e => setEditingDoc({...editingDoc, docExpiry: e.target.value || ''})}
                       />
                       <Input 
                         label="Observações" 
                         className="md:col-span-2"
                         value={editingDoc.notes || ''} 
                         onChange={e => setEditingDoc({...editingDoc, notes: e.target.value})}
                         placeholder="Detalhes adicionais"
                       />
                     </div>
                   )}
                 </div>

                 <div className="flex gap-2 mt-4">
                   <Button 
                     variant="primary" 
                     className="flex-1"
                     disabled={
                       !editingDoc.docType || 
                       (editingDoc.docType === 'Passaporte' && (!editingDoc.issuingCountry || !editingDoc.docNumber || !editingDoc.docExpiry)) ||
                       (editingDoc.docType === 'RG' && (!editingDoc.issuerState || !editingDoc.docNumber)) ||
                       (editingDoc.docType === 'CPF' && !editingDoc.docNumber) ||
                       (editingDoc.docType === 'CNH' && (!editingDoc.docNumber || !editingDoc.docExpiry)) ||
                       (editingDoc.docType === 'Visto' && (!editingDoc.regionOrCountry || !editingDoc.docExpiry)) ||
                       (editingDoc.docType === 'ESTA' && (!editingDoc.regionOrCountry || !editingDoc.docExpiry)) ||
                       (editingDoc.docType === 'Outro' && !editingDoc.customLabel)
                     }
                     onClick={() => {
                       if (editingDocIndex >= 0) {
                         // Editar existente
                         const newDocs = [...documents];
                         newDocs[editingDocIndex] = editingDoc;
                         setDocuments(newDocs);
                       } else {
                         // Adicionar novo
                         setDocuments([...documents, editingDoc]);
                       }
                       setEditingDoc(null);
                       setEditingDocIndex(-1);
                       setShowDocNumber(false);
                     }}
                   >
                     {editingDocIndex >= 0 ? 'Atualizar' : 'Adicionar'}
                   </Button>
                   <Button 
                     variant="ghost" 
                     onClick={() => {
                       setEditingDoc(null);
                       setEditingDocIndex(-1);
                       setShowDocNumber(true);
                     }}
                   >
                     Cancelar
                   </Button>
                 </div>
               </Card>
             ) : (
               <Button 
                 variant="outline" 
                 className="w-full" 
                 onClick={() => {
                   setEditingDoc({
                     docType: 'Passaporte',
                     docCategory: 'identity',
                     docNumber: '',
                     issuingCountry: '',
                     docExpiry: '',
                     notes: ''
                   });
                   setEditingDocIndex(-1);
                   setShowDocNumber(true); // Mostrar por padrão ao adicionar
                 }}
               >
                 + Adicionar Documento
               </Button>
             )}
             
             <Card className="!bg-amber-600/5 !border-amber-500/20">
                <p className="text-[10px] text-amber-500 font-bold uppercase mb-1">🔒 Dados Protegidos</p>
                <p className="text-xs text-gray-500">Números de documentos são criptografados e só aparecem mascarados (••••1234) nas listagens.</p>
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
             <Button onClick={handleNext} disabled={step === 1 && !isStep1Valid()}>Próximo</Button>
           ) : (
             <Button 
               variant="primary" 
               onClick={async () => {
                 // Salvar documentos pendentes no perfil
                 if (profileId) {
                   for (const doc of documents) {
                     if (!doc.id) {
                       try {
                         await supabaseDataProvider.saveTravelerProfileDocument({
                           travelerProfileId: profileId,
                           docType: doc.docType,
                           docCategory: doc.docCategory,
                           docNumber: doc.docNumber,
                           issuingCountry: doc.issuingCountry,
                           issuerState: doc.issuerState,
                           issuerAgency: doc.issuerAgency,
                           issuerPlace: doc.issuerPlace,
                           regionOrCountry: doc.regionOrCountry,
                           issueDate: doc.issueDate,
                           docExpiry: doc.docExpiry,
                           visaCategory: doc.visaCategory,
                           entryType: doc.entryType,
                           stayDurationDays: doc.stayDurationDays,
                           licenseCategory: doc.licenseCategory,
                           customLabel: doc.customLabel,
                           isPrimary: doc.isPrimary,
                           notes: doc.notes
                         });
                       } catch (error) {
                         console.error('Erro ao salvar documento:', error);
                       }
                     }
                   }
                 }
                 
                 // Chamar onDone com o profileId
                 if (onDone && profileId) {
                   onDone(profileId);
                 }
               }} 
               disabled={!isStep1Valid() || !profileId}
             >
               {existingProfileId ? 'Salvar Alterações' : 'Concluir'}
             </Button>
           )}
        </div>
      </div>
    </div>
  );
};

export default TravelerWizard;
