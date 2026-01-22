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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    const newSelected = new Set(selectedIds);
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId);
    } else {
      newSelected.add(profileId);
    }
    setSelectedIds(newSelected);
  };

  const handleLink = async () => {
    if (selectedIds.size === 0) return;
    
    setLinking(true);
    try {
      // Vincular cada perfil selecionado
      for (const profileId of Array.from(selectedIds)) {
        await supabaseDataProvider.linkTravelerToTrip(trip.id, String(profileId), {
          coupleId: trip.couples[0]?.id, // Primeiro grupo por padrão
          goesToSegments: trip.segments.map(s => s.id),
          isPayer: true
        });
      }
      
      onLinked();
      onClose();
    } catch (error) {
      console.error('Erro ao vincular viajantes:', error);
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
            filteredProfiles.map(profile => (
              <div
                key={profile.id}
                onClick={() => handleToggleSelect(profile.id)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedIds.has(profile.id)
                    ? 'border-indigo-600 bg-indigo-600/10'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
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
                    {selectedIds.has(profile.id) && (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="text-sm text-gray-500">
            {selectedIds.size} {selectedIds.size === 1 ? 'perfil selecionado' : 'perfis selecionados'}
          </div>
          <div className="flex gap-3">
            <Button onClick={onClose} className="bg-gray-800 hover:bg-gray-700">
              Cancelar
            </Button>
            <Button 
              onClick={handleLink} 
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={selectedIds.size === 0 || linking}
            >
              {linking ? 'Vinculando...' : `Adicionar ${selectedIds.size > 0 ? `(${selectedIds.size})` : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LinkTravelersModal;
