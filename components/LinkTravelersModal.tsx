import React, { useState, useEffect } from 'react';
import { Button, Input, Badge, Modal } from './CommonUI';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import { Trip } from '../types';
import QuickCreateTravelerModal from './QuickCreateTravelerModal';

interface LinkTravelersModalProps {
  trip: Trip;
  onClose: () => void;
  onLinked: () => void;
}

const LinkTravelersModal: React.FC<LinkTravelersModalProps> = ({ trip, onClose, onLinked }) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [selectedProfiles, setSelectedProfiles] = useState<Map<string, { coupleId: string }>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [trip.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allProfiles, tripTravelers] = await Promise.all([
        supabaseDataProvider.getTravelerProfiles(),
        supabaseDataProvider.getTripTravelers(trip.id)
      ]);
      
      setProfiles(allProfiles);
      setLinkedIds(new Set(tripTravelers.map((tt: any) => tt.traveler_profile_id)));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (profileId: string) => {
    const newSelected = new Map(selectedProfiles);
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId);
    } else {
      // Adiciona com o primeiro grupo por padrão (ou 'solo' se não houver grupos)
      const defaultCoupleId = trip.couples && trip.couples.length > 0 ? trip.couples[0].id : 'solo';
      newSelected.set(profileId, { coupleId: defaultCoupleId });
    }
    setSelectedProfiles(newSelected);
  };

  const handleChangeCoupleForProfile = (profileId: string, coupleId: string) => {
    const newSelected = new Map(selectedProfiles);
    if (newSelected.has(profileId)) {
      newSelected.set(profileId, { coupleId });
      setSelectedProfiles(newSelected);
    }
  };

  const handleLink = async () => {
    if (selectedProfiles.size === 0) return;
    
    // Validar se todos têm grupo selecionado (exceto 'solo')
    for (const [profileId, config] of Array.from(selectedProfiles.entries())) {
      if (!config.coupleId || config.coupleId.trim() === '') {
        setErrorMessage('Por favor, selecione um grupo para todos os viajantes.');
        return;
      }
    }
    
    setLinking(true);
    setErrorMessage(null);
    try {
      // Filtrar apenas segmentos com UUID válido (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      const validSegments = trip.segments
        .filter(s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id))
        .map(s => s.id);
      
      // Vincular cada perfil selecionado com seu grupo específico
      for (const [profileId, config] of Array.from(selectedProfiles.entries())) {
        await supabaseDataProvider.linkTravelerToTrip({
          tripId: trip.id,
          travelerProfileId: profileId,
          coupleId: config.coupleId === 'solo' ? null : config.coupleId, // 'solo' vira null
          goesToSegments: validSegments,
          isPayer: true,
          countInSplit: true
        });
      }
      
      onLinked();
      onClose();
    } catch (error) {
      console.error('Erro ao vincular viajantes:', error);
      setErrorMessage('Erro ao vincular viajantes. Tente novamente.');
    } finally {
      setLinking(false);
    }
  };

  const handleCreateAndLink = async (profileId: string) => {
    try {
      // Vincular o perfil recém-criado
      await supabaseDataProvider.linkTravelerToTrip(trip.id, profileId, {
        coupleId: trip.couples[0]?.id,
        goesToSegments: trip.segments.map(s => s.id),
        isPayer: true
      });
      
      setShowCreateModal(false);
      onLinked();
      onClose();
    } catch (error) {
      console.error('Erro ao vincular novo perfil:', error);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.phone?.includes(searchTerm);
    const notLinked = !linkedIds.has(p.id);
    return matchesSearch && notLinked;
  });

  if (loading) {
    return (
      <Modal isOpen={true} onClose={onClose}>
        <div className="p-6 text-center text-gray-500">Carregando perfis...</div>
      </Modal>
    );
  }

  if (showCreateModal) {
    return <QuickCreateTravelerModal onClose={() => setShowCreateModal(false)} onCreated={handleCreateAndLink} />;
  }

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Adicionar Viajantes</h3>
            <p className="text-sm text-gray-500 mt-1">Selecione perfis da sua lista para vincular a esta viagem</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700 text-sm">
            + Criar Novo
          </Button>
        </div>

        {/* Mensagem de erro */}
        {errorMessage && (
          <div className="p-3 bg-red-600/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* Search */}
        <Input 
          placeholder="Buscar por nome, apelido ou telefone..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
        />

        {/* Lista de perfis */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {linkedIds.size === profiles.length ? (
                <p>Todos os perfis já estão vinculados a esta viagem</p>
              ) : (
                <p>Nenhum perfil encontrado</p>
              )}
            </div>
          ) : (
            filteredProfiles.map(profile => {
              const isSelected = selectedProfiles.has(profile.id);
              const selectedConfig = selectedProfiles.get(profile.id);
              
              return (
                <div
                  key={profile.id}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600/10'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                  }`}
                >
                  <div 
                    onClick={() => handleToggleSelect(profile.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        profile.type === 'Adulto' ? 'bg-indigo-600/20 text-indigo-400' : 'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        {profile.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-bold text-white">{profile.full_name}</div>
                        <div className="text-sm text-gray-500">
                          {profile.type}
                          {profile.nickname && ` • ${profile.nickname}`}
                          {profile.phone && ` • ${profile.phone}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.can_drive && <Badge color="green">Dirige</Badge>}
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Seletor de grupo - só aparece se estiver selecionado */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-gray-800" onClick={(e) => e.stopPropagation()}>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Grupo / Família:</label>
                      <select
                        value={selectedConfig?.coupleId || 'solo'}
                        onChange={(e) => handleChangeCoupleForProfile(profile.id, e.target.value)}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                      >
                        <option value="solo">🚶 Solo (sem grupo)</option>
                        {trip.couples.map(couple => (
                          <option key={couple.id} value={couple.id}>{couple.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-600 mt-1">
                        Não tem o grupo? Crie grupos/casais na aba "Configurações" da viagem.
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="text-sm text-gray-500">
            {selectedProfiles.size} {selectedProfiles.size === 1 ? 'perfil selecionado' : 'perfis selecionados'}
          </div>
          <div className="flex gap-3">
            <Button onClick={onClose} className="bg-gray-800 hover:bg-gray-700">
              Cancelar
            </Button>
            <Button 
              onClick={handleLink} 
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={selectedProfiles.size === 0 || linking}
            >
              {linking ? 'Vinculando...' : `Adicionar ${selectedProfiles.size > 0 ? `(${selectedProfiles.size})` : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LinkTravelersModal;
