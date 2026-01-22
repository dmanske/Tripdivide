
import React, { useState, useMemo, useEffect } from 'react';
import { Trip, Traveler, TravelerType } from '../types';
import { Badge, Button, Input, Modal } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import TravelerWizard from './TravelerWizard';
import TravelerImportModal from './TravelerImportModal';
import LinkTravelersModal from './LinkTravelersModal';
import EditTripTravelerModal from './EditTripTravelerModal';
import QuickCreateTravelerModal from './QuickCreateTravelerModal';

interface TravelerListProps {
  trip: Trip;
  onRefresh: () => void;
  onNavigateToDetail: (travelerId: string) => void;
}

const TravelerList: React.FC<TravelerListProps> = ({ trip, onRefresh, onNavigateToDetail }) => {
  const [tripTravelers, setTripTravelers] = useState<any[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [editingTripTraveler, setEditingTripTraveler] = useState<any>(null);
  const [editingTraveler, setEditingTraveler] = useState<Partial<Traveler> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCouple, setFilterCouple] = useState('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTripTravelers();
  }, [trip.id]);

  const loadTripTravelers = async () => {
    try {
      const data = await supabaseDataProvider.getTripTravelers(trip.id);
      setTripTravelers(data);
    } catch (error) {
      console.error('Erro ao carregar viajantes:', error);
    }
  };

  const handleUnlink = async (tripTravelerId: string) => {
    try {
      await supabaseDataProvider.unlinkTravelerFromTrip(tripTravelerId);
      setEditingTripTraveler(null);
      await loadTripTravelers();
      onRefresh();
      setSuccessMessage('Viajante desvinculado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao desvincular viajante:', error);
    }
  };

  const handleQuickCreate = async (profileId: string) => {
    try {
      // Vincular o perfil recém-criado
      await supabaseDataProvider.linkTravelerToTrip(trip.id, profileId, {
        coupleId: trip.couples[0]?.id,
        goesToSegments: trip.segments.map(s => s.id),
        isPayer: true
      });
      
      setIsQuickCreateOpen(false);
      await loadTripTravelers();
      onRefresh();
      setSuccessMessage('Perfil criado e vinculado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao vincular novo perfil:', error);
    }
  };

  const filteredTravelers = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return tripTravelers.filter((tt: any) => {
      const profile = tt.profile;
      if (!profile) return false;
      
      const fullName = profile.full_name || '';
      const nickname = profile.nickname || '';
      const phone = profile.phone || '';
      const couple = trip.couples.find((c: any) => c.id === tt.couple_id);
      const coupleName = couple?.name || '';
      
      const matchesSearch = fullName.toLowerCase().includes(searchLower) || 
                            phone.includes(searchTerm) || 
                            nickname.toLowerCase().includes(searchLower) ||
                            coupleName.toLowerCase().includes(searchLower);
      const matchesType = filterType === 'all' || profile.type === filterType;
      const matchesCouple = filterCouple === 'all' || tt.couple_id === filterCouple;
      return matchesSearch && matchesType && matchesCouple;
    });
  }, [tripTravelers, searchTerm, filterType, filterCouple, trip.couples]);

  // Agrupar viajantes por casal
  const groupedTravelers = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    filteredTravelers.forEach((tt: any) => {
      const coupleId = tt.couple_id || 'sem-grupo';
      if (!groups[coupleId]) {
        groups[coupleId] = [];
      }
      groups[coupleId].push(tt);
    });

    // Ordenar dentro de cada grupo: adultos primeiro, depois crianças
    Object.keys(groups).forEach((coupleId: string) => {
      groups[coupleId].sort((a: any, b: any) => {
        const aType = a.profile?.type || '';
        const bType = b.profile?.type || '';
        if (aType === 'Adulto' && bType !== 'Adulto') return -1;
        if (aType !== 'Adulto' && bType === 'Adulto') return 1;
        return (a.profile?.full_name || '').localeCompare(b.profile?.full_name || '');
      });
    });

    return groups;
  }, [filteredTravelers]);

  return (
    <div className="flex flex-col h-full gap-8 animate-in fade-in duration-500">
      {/* Mensagem de sucesso */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg animate-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-bold">✓ {successMessage}</p>
        </div>
      )}
      
      {/* LISTA DE VIAJANTES */}
      <div className="flex-1 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Viajantes</h2>
            <p className="text-gray-500">Gestão de participantes e documentos</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => setIsLinkModalOpen(true)}>+ Adicionar da minha lista</Button>
             <Button variant="primary" onClick={() => setIsQuickCreateOpen(true)}>+ Criar Novo</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900/40 p-4 rounded-2xl border border-gray-800">
           <div className="md:col-span-1">
              <Input placeholder="Buscar por nome, fone, grupo..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} />
           </div>
           <Input as="select" value={filterType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)}>
              <option value="all">Todos os tipos</option>
              {Object.values(TravelerType).map((t: string) => <option key={t} value={t}>{t}</option>)}
           </Input>
           <Input as="select" value={filterCouple} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCouple(e.target.value)}>
              <option value="all">Todos os grupos</option>
              {trip.couples.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
           </Input>
           <div className="flex items-center gap-2 justify-center">
              <Badge color="indigo">{tripTravelers.length} Total</Badge>
              <Badge color="gray">{tripTravelers.filter((tt: any) => tt.profile?.type === TravelerType.ADULT).length} ADU</Badge>
           </div>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedTravelers).map(([coupleId, groupTravelers]: [string, any[]]) => {
            const couple = trip.couples.find((c: any) => c.id === coupleId);
            const coupleName = couple?.name || 'Sem Grupo';
            
            return (
              <div key={coupleId} className="bg-gray-900/40 rounded-2xl border border-gray-800 overflow-hidden">
                {/* Header do grupo */}
                <div className="px-6 py-3 bg-gray-900/60 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-wide">{coupleName}</h3>
                    <Badge color="gray">{groupTravelers.length} {groupTravelers.length === 1 ? 'viajante' : 'viajantes'}</Badge>
                  </div>
                </div>

                {/* Tabela do grupo */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-[10px] font-black uppercase text-gray-500 border-b border-gray-800">
                      <tr>
                        <th className="p-4">Nome / Tipo</th>
                        <th className="p-4">Segmentos</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {groupTravelers.map((tt: any) => {
                        const profile = tt.profile;
                        if (!profile) return null;
                        
                        const displayName = profile.full_name || 'Sem Nome';

                        return (
                          <tr key={tt.id} onClick={() => setEditingTripTraveler(tt)} className="hover:bg-gray-900/40 transition-colors cursor-pointer">
                            <td className="p-4">
                               <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${profile.type === TravelerType.ADULT ? 'bg-indigo-600/20 text-indigo-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                                     {displayName.charAt(0)}
                                  </div>
                                  <div>
                                     <p className="font-bold text-gray-200">{displayName}</p>
                                     <p className="text-[10px] text-gray-500 uppercase">{profile.type} {profile.nickname ? `• ${profile.nickname}` : ''}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="p-4">
                               <div className="flex flex-wrap gap-1">
                                  {(tt.goes_to_segments || []).map((sid: string) => {
                                    const seg = trip.segments.find((s: any) => s.id === sid);
                                    return <span key={sid} className="text-[9px] px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded uppercase font-bold">{seg?.name}</span>
                                  })}
                               </div>
                            </td>
                            <td className="p-4">
                               <Badge color={tt.is_payer ? 'green' : 'gray'}>{tt.is_payer ? 'Pagante' : 'Não pagante'}</Badge>
                            </td>
                            <td className="p-4 text-center">
                               <div className="flex justify-center gap-2">
                                  <Button 
                                    onClick={(e) => { e.stopPropagation(); setEditingTripTraveler(tt); }} 
                                    className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs"
                                  >
                                    Configurar
                                  </Button>
                               </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          
          {Object.keys(groupedTravelers).length === 0 && (
             <div className="py-20 text-center">
               <div className="max-w-md mx-auto space-y-6">
                 <div className="text-6xl mb-4">👥</div>
                 <div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                     Nenhum viajante vinculado
                   </h3>
                   <p className="text-gray-500 mb-6">
                     Perfis de viajantes são globais e reutilizáveis. Vincule perfis existentes ou crie novos.
                   </p>
                 </div>
                 <div className="flex flex-col sm:flex-row gap-3 justify-center">
                   <Button onClick={() => setIsLinkModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                     📋 Adicionar da minha lista
                   </Button>
                   <Button onClick={() => setIsQuickCreateOpen(true)} className="bg-green-600 hover:bg-green-700">
                     ✨ Criar novo agora
                   </Button>
                 </div>
               </div>
             </div>
          )}
        </div>
      </div>

      {/* Modal de vinculação */}
      {isLinkModalOpen && (
        <LinkTravelersModal
          trip={trip}
          onClose={() => setIsLinkModalOpen(false)}
          onLinked={async () => {
            await loadTripTravelers();
            onRefresh();
            setSuccessMessage('Viajantes vinculados com sucesso!');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}

      {/* Modal de edição do vínculo */}
      {editingTripTraveler && (
        <EditTripTravelerModal
          trip={trip}
          tripTraveler={editingTripTraveler}
          onClose={() => setEditingTripTraveler(null)}
          onSaved={async () => {
            await loadTripTravelers();
            onRefresh();
            setSuccessMessage('Configurações salvas com sucesso!');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
          onUnlink={() => handleUnlink(editingTripTraveler.id)}
        />
      )}

      {/* Modal de criação rápida */}
      {isQuickCreateOpen && (
        <QuickCreateTravelerModal
          onClose={() => setIsQuickCreateOpen(false)}
          onCreated={handleQuickCreate}
        />
      )}
    </div>
  );
};

export default TravelerList;
