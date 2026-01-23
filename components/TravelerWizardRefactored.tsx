@ -0,0 +1,630 @@
{existingProfileId ? 'Salvar Alterações' : 'Concluir'}
             </Button>
           )}
        </div>
      </div>
    </div>
  );
};

export default TravelerWizard;
-6 border-t border-gray-800">
        <Button variant="ghost" onClick={step === 1 ? onCancel : handleBack}>
          {step === 1 ? 'Cancelar' : 'Voltar'}
        </Button>
        <div className="flex gap-2">
           {step < 3 ? (
             <Button onClick={handleNext} disabled={step === 1 && !isStep1Valid()}>Próximo</Button>
           ) : (
             <Button 
               variant="primary" 
               onClick={handleFinish} 
               disabled={!profileId}
             >
               ento
                 </Button>
               </>
             )}
             
             <Card className="!bg-amber-600/5 !border-amber-500/20">
                <p className="text-[10px] text-amber-500 font-bold uppercase mb-1">🔒 Dados Protegidos</p>
                <p className="text-xs text-gray-500">Números de documentos são criptografados e só aparecem mascarados (••••1234) nas listagens.</p>
             </Card>
          </div>
        )}
      </div>

      <div className="flex justify-between ptDeleteDocument(doc.id);
                            }
                          }} className="text-red-400 hover:text-red-300 text-xs">🗑️</button>
                        </div>
                      </div>
                    ))}
                 </div>

                 <Button 
                   variant="outline" 
                   className="w-full" 
                   onClick={() => alert('Adicionar documento via DocumentDrawer - implementar')}
                 >
                   + Adicionar Docum{doc.expiry_date}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => alert('Edição de documentos via DocumentDrawer')} className="text-indigo-400 hover:text-indigo-300 text-xs">
                            ✏️
                          </button>
                          <button onClick={async () => {
                            if (doc.id && profileId) {
                              await handle             <div key={idx} className="p-3 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{doc.doc_type} - {maskDocNumber(doc.doc_number_last4 || '')}</p>
                          <p className="text-[10px] text-gray-500">
                            {doc.issuer_country && `${doc.issuer_country} • `}
                            {doc.expiry_date && `Vence: $ional)</p>
                <p className="text-xs text-gray-500">Adicione documentos para controle. Números são protegidos e não aparecem completos na listagem.</p>
             </Card>
             
             {loadingDocs ? (
               <p className="text-center text-gray-500 animate-pulse">Carregando documentos...</p>
             ) : (
               <>
                 {/* Lista de documentos */}
                 <div className="space-y-2">
                    {documents.map((doc, idx) => (
                      onChange={e => setProfileData({...profileData, notes: e.target.value})} 
               placeholder="Detalhes adicionais, restrições, preferências..."
             />
          </div>
        )}

        {/* STEP 3: DOCUMENTOS */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <Card className="!bg-indigo-600/5 !border-indigo-500/20">
                <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">🔒 Documentação (Opcder border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
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
  ed-400">✕</button>
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
                   className="flex-1 px-4 py-2.5 bg-gray-950 bor    </Card>
             )}
             
             {/* Tags estruturadas */}
             <div>
               <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
               <div className="flex flex-wrap gap-2 mb-2">
                 {profileData.tags?.map((tag: string) => (
                   <Badge key={tag} color="indigo" className="flex items-center gap-1">
                     {tag}
                     <button onClick={() => removeTag(tag)} className="ml-1 hover:text-reData, canDrive: e.target.checked})} />
                      </div>
                    )}
                 </div>
               </>
             ) : (
               <Card className="!bg-gray-900/50">
                 <p className="text-sm text-gray-400 mb-2">Configuração da viagem (opcional)</p>
                 <p className="text-xs text-gray-600">Este perfil está sendo criado no modo geral. Para vincular a uma viagem específica, abra o perfil a partir da lista de viajantes de uma viagem.</p>
                            <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-between">
                         <div>
                            <p className="text-sm font-bold">Pode Dirigir?</p>
                            <p className="text-[10px] text-gray-600 uppercase">CNH Habilitada</p>
                         </div>
                         <input type="checkbox" className="w-6 h-6 accent-indigo-500" checked={profileData.canDrive} onChange={e => setProfileData({...profil         <input 
                         type="checkbox" 
                         className="w-6 h-6 accent-emerald-500" 
                         checked={tripData.isPayer} 
                         onChange={e => setTripData({...tripData, isPayer: e.target.checked})} 
                         disabled={tripData.type === TravelerType.BABY || tripData.type === 'Pet'}
                       />
                    </div>
                    
                    {tripData.type === TravelerType.ADULT && (
           </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-between">
                       <div>
                          <p className="text-sm font-bold">Viajante Pagante?</p>
                          <p className="text-[10px] text-gray-600 uppercase">Considerar no racha de custos</p>
                       </div>
              tripData.goesToSegments?.includes(s.id)} onChange={e => {
                              const ids = tripData.goesToSegments || [];
                              const next = e.target.checked ? [...ids, s.id] : ids.filter((x: string) => x !== s.id);
                              setTripData({...tripData, goesToSegments: next});
                            }} />
                            <span className="text-sm font-bold">{s.name}</span>
                         </label>
                       ))}
                 </div>
                    <div className="grid grid-cols-2 gap-2">
                       {trip.segments.map(s => (
                         <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${tripData.goesToSegments?.includes(s.id) ? 'bg-indigo-600/10 border-indigo-500/40 text-white' : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700'}`}>
                            <input type="checkbox" className="w-4 h-4 accent-indigo-500" checked={       >
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
                    <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-400">Segmentos da Viagem</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setTripData({...tripData, goesToSegments: trip.segments.map(s => s.id)})}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase"
                 l="Email" 
               className="col-span-1 md:col-span-2" 
               value={profileData.email} 
               onChange={e => setProfileData({...profileData, email: e.target.value})} 
               placeholder="Recomendado para comunicação"
             />
          </div>
        )}

        {/* STEP 2: PARTICIPAÇÃO (Trip-Specific Data) */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
             {tripId && trip ? (
               <>
               text-gray-400 mb-2">WhatsApp (Fone)</label>
               <PhoneInput 
                 value={profileData.phone || ''} 
                 onChange={phone => setProfileData({...profileData, phone})} 
                 placeholder="(00) 00000-0000"
                 className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
               />
             </div>
             <Input 
               labe            )}
             
             {/* Data de Nascimento */}
             <Input 
               label={`Data de Nascimento ${(tripData.type === TravelerType.CHILD || tripData.type === TravelerType.BABY) ? '*' : ''}`}
               type="date" 
               value={dateToInput(profileData.birthDate)} 
               onChange={e => setProfileData({...profileData, birthDate: e.target.value})} 
             />
             
             <div>
               <label className="block text-sm font-medium={(e) => {
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
               </>
 ace-nowrap"
                           disabled={!newGroupName.trim()}
                           onClick={async (e) => {
                             e.preventDefault();
                             await handleCreateCouple();
                           }}
                         >
                           Criar
                         </Button>
                         <Button 
                           variant="ghost" 
                           className="text-xs"
                           onClickm()) {
                               e.preventDefault();
                               await handleCreateCouple();
                             } else if (e.key === 'Escape') {
                               setShowNewGroupInput(false);
                               setNewGroupName('');
                             }
                           }}
                         />
                         <Button 
                           variant="primary" 
                           className="text-xs whitespue={newGroupName}
                           onChange={e => setNewGroupName(e.target.value)}
                           placeholder="Nome do novo grupo"
                           className="flex-1 px-4 py-2.5 bg-gray-950 border border-indigo-500 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-400 transition-colors"
                           autoFocus
                           onKeyDown={async (e) => {
                             if (e.key === 'Enter' && newGroupName.tri               e.preventDefault();
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
                           valssName="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                       >
                         {trip.couples.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                       <Button 
                         variant="outline" 
                         className="text-xs whitespace-nowrap"
                         onClick={(e) => {
            velerType).map(t => <option key={t} value={t}>{t}</option>)}
                 </Input>
                 <div>
                   <label className="block text-sm font-medium text-gray-400 mb-2">Casal / Grupo *</label>
                   {!showNewGroupInput ? (
                     <div className="flex gap-2">
                       <select 
                         value={tripData.coupleId} 
                         onChange={e => setTripData({...tripData, coupleId: e.target.value})}
                         clalido" 
               value={profileData.nickname} 
               onChange={e => setProfileData({...profileData, nickname: e.target.value})} 
               placeholder="Opcional" 
             />
             
             {/* Tipo - só aparece se estiver em modo viagem */}
             {tripId && trip && (
               <>
                 <Input as="select" label="Tipo *" value={tripData.type} onChange={e => setTripData({...tripData, type: e.target.value as any})}>
                    {Object.values(Traiv className="min-h-[300px]">
        {/* STEP 1: BÁSICO (Global Profile Data) */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
             <Input 
               label="Nome Completo *" 
               value={profileData.fullName} 
               onChange={e => setProfileData({...profileData, fullName: e.target.value})} 
               placeholder="Como o grupo conhece" 
             />
             <Input 
               label="Ape    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${step === s.id ? 'bg-indigo-600 border-indigo-400 text-white' : step > s.id ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-gray-900 border-gray-700 text-gray-500'}`}>
              {step > s.id ? '✓' : s.id}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{s.title}</span>
          </div>
        ))}
      </div>

      <dewGroupName('');
      }
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      alert('Erro ao criar grupo. Tente novamente.');
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center relative pb-8">
        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-800 -z-10"></div>
        {steps.map(s => (
          <div key={s.id} className="flex flex-col items-center gap-2">
             return;
    }
    
    if (onDone) {
      onDone(profileId);
    }
  };

  const handleCreateCouple = async () => {
    if (!tripId || !newGroupName.trim()) return;
    
    try {
      const newCouple = await supabaseDataProvider.saveCouple(tripId, { name: newGroupName.trim() });
      if (newCouple && trip) {
        trip.couples.push({ id: newCouple.id, name: newCouple.name, members: [] });
        setTripData({ ...tripData, coupleId: newCouple.id });
        setShowNewGroupInput(false);
        setN) return;
    
    try {
      await supabaseDataProvider.deleteTravelerProfileDocument(profileId, docId);
      // Reload documents
      const docs = await supabaseDataProvider.getTravelerProfileDocuments(profileId);
      setDocuments(docs);
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      alert('Erro ao excluir documento. Tente novamente.');
    }
  };

  const handleFinish = async () => {
    if (!profileId) {
      alert('Erro: perfil não foi salvo corretamente.');
 meiro antes de adicionar documentos.');
      return;
    }
    
    try {
      await supabaseDataProvider.saveTravelerProfileDocument(profileId, doc);
      // Reload documents
      const docs = await supabaseDataProvider.getTravelerProfileDocuments(profileId);
      setDocuments(docs);
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      alert('Erro ao salvar documento. Tente novamente.');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!profileId  tags: [...(profileData.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setProfileData({
      ...profileData,
      tags: profileData.tags?.filter((t: string) => t !== tag)
    });
  };

  const getDocCategory = (docType: string): string => {
    if (docType === 'Visto' || docType === 'ESTA') return 'entry';
    return 'identity';
  };

  const handleSaveDocument = async (doc: any) => {
    if (!profileId) {
      alert('Salve o perfil prifullName.trim()) return false;
    if ((tripData.type === TravelerType.CHILD || tripData.type === TravelerType.BABY) && !profileData.birthDate) return false;
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
      catch (error) {
        console.error('Erro ao vincular viajante à viagem:', error);
        alert('Erro ao vincular viajante. Tente novamente.');
        return;
      }
    }
    
    setStep(s => Math.min(s + 1, 3));
  };
  
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  // Validação do Step 1
  const isStep1Valid = () => {
    if (!profileData.fullName || !profileData.    }       }
           }
    count_in_split: tripData.countInSplit
          });
        } else {
          // Create new link
          const link = await supabaseDataProvider.linkTravelerToTrip(tripId, profileId, {
            type: tripData.type,
            couple_id: tripData.coupleId,
            goes_to_segments: tripData.goesToSegments,
            is_payer: tripData.isPayer,
            count_in_split: tripData.countInSplit
          });
          if (link && link.id) {
            setTripTravelerId(link.id);
 ink if tripId exists
    if (step === 2 && tripId && profileId) {
      try {
        if (tripTravelerId) {
          // Update existing link
          await supabaseDataProvider.updateTripTraveler(tripTravelerId, {
            type: tripData.type,
            couple_id: tripData.coupleId,
            goes_to_segments: tripData.goesToSegments,
            is_payer: tripData.isPayer,
          profileData.tags,
          notes: profileData.notes
        });
        
        if (savedProfile && savedProfile.id) {
          setProfileId(savedProfile.id);
        }
      } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        alert('Erro ao salvar perfil. Tente novamente.');
        return;
      }
    }
    
    // Step 2 -> Step 3: Save trip l title: 'Documentos' }
  ];

  const handleNext = async () => {
    // Step 1 -> Step 2: Save profile to get profileId
    if (step === 1) {
      try {
        const savedProfile = await supabaseDataProvider.saveTravelerProfile({
          id: profileId,
          full_name: profileData.fullName,
          nickname: profileData.nickname,
          phone: profileData.phone,
          email: profileData.email,
          birth_date: profileData.birthDate,
          can_drive: profileData.canDrive,
          tags: Effect(() => {
    if (tripData.type === TravelerType.BABY || tripData.type === 'Pet') {
      setTripData((prev: any) => ({ ...prev, isPayer: false, countInSplit: false }));
      setProfileData((prev: any) => ({ ...prev, canDrive: false }));
    } else if (tripData.type === TravelerType.ADULT) {
      setTripData((prev: any) => ({ ...prev, isPayer: true, countInSplit: true }));
    }
  }, [tripData.type]);

  const steps = [
    { id: 1, title: 'Básico' },
    { id: 2, title: 'Participação' },
    { id: 3,gments || [],
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
  use-specific link data
            if (tripId) {
              const tripTravelers = await supabaseDataProvider.getTripTravelers(tripId);
              const link = tripTravelers.find(tt => tt.traveler_profile_id === existingProfileId);
              if (link) {
                setTripTravelerId(link.id);
                setTripData({
                  type: link.type || TravelerType.ADULT,
                  coupleId: link.couple_id || trip?.couples[0]?.id || '',
                  goesToSegments: link.goes_to_se || '',
              phone: profile.phone || '',
              email: profile.email || '',
              birthDate: profile.birth_date || '',
              canDrive: profile.can_drive || false,
              tags: profile.tags || [],
              notes: profile.notes || ''
            });
            
            // Load documents
            const docs = await supabaseDataProvider.getTravelerProfileDocuments(existingProfileId);
            setDocuments(docs);
            
            // If tripId exists, load trip12}$/i.test(s.id))
      .map(s => s.id) || [],
    isPayer: true,
    countInSplit: true
  });

  // Load existing profile data if editing
  useEffect(() => {
    const loadProfile = async () => {
      if (existingProfileId) {
        setLoadingDocs(true);
        try {
          const profile = await supabaseDataProvider.getTravelerProfileById(existingProfileId);
          if (profile) {
            setProfileData({
              fullName: profile.full_name || '',
              nickname: profile.nickname 1: Global profile data
  const [profileData, setProfileData] = useState<any>({
    fullName: '',
    nickname: '',
    phone: '',
    email: '',
    birthDate: '',
    canDrive: false,
    tags: [],
    notes: ''
  });
  
  // Step 2: Trip-specific data (only if tripId exists)
  const [tripData, setTripData] = useState<any>({
    type: TravelerType.ADULT,
    coupleId: trip?.couples[0]?.id || '',
    goesToSegments: trip?.segments
      .filter(s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{ents, setDocuments] = useState<any[]>([]);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [editingDocIndex, setEditingDocIndex] = useState<number>(-1);
  const [showDocNumber, setShowDocNumber] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [profileId, setProfileId] = useState<string | undefined>(existingProfileId);
  const [tripTravelerId, setTripTravelerId] = useState<string | undefined>();
  
  // Steplink
  trip?: Trip; // Optional - needed only if tripId is provided
  existingProfileId?: string; // For editing existing profile
  onDone?: (profileId: string) => void; // Returns the profile ID
  onCancel: () => void;
}

const TravelerWizard: React.FC<TravelerWizardProps> = ({ tripId, trip, existingProfileId, onDone, onCancel }) => {
  const [step, setStep] = useState(1);
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [documeaned.slice(0, 11);
    case 'Passaporte':
      return cleaned.slice(0, 8).toUpperCase();
    default:
      return value;
  }
};

const unformatDocNumber = (value: string): string => {
  return value.replace(/[^A-Za-z0-9]/g, '');
};

interface TravelerWizardProps {
  tripId?: string; // Optional - if provided, creates trip urn cleaned
        .slice(0, 11)
        .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        .replace(/(\d{3})(\d{3})(\d{3})(\d{1})$/, '$1.$2.$3-$4')
        .replace(/(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3')
        .replace(/(\d{3})(\d{2})$/, '$1.$2');
    case 'RG':
      return cleaned
        .slice(0, 9)
        .replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4')
        .replace(/(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3')
        .replace(/(\d{2})(\d{3})$/, '$1.$2');
    case 'CNH':
      return clut, Badge, Card } from './CommonUI';
import PhoneInput from './PhoneInput';
import { dateToInput } from '../lib/formatters';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import DocumentDrawer from './DocumentDrawer';

// Copied from reference: temp/components/TravelerWizard.tsx
// Funções de formatação de documentos
const formatDocNumber = (value: string, docType: string): string => {
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '');
  
  switch (docType) {
    case 'CPF':
      retimport React, { useState, useEffect } from 'react';
import { Trip, TravelerType } from '../types';
import { Button, Inp