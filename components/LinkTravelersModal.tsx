import React, { useState, useEffect } from 'react';
import { Button, Input, Badge, Modal } from './CommonUI';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import { formatDateVeryShort } from '../lib/formatters';
import { Trip } from '../types';
import QuickCreateTravelerModal from './QuickCreateTravelerModal';

interface LinkTravelersModalProps {
  trip: Trip;
  onClose: () => void;
  onLinked: () => void;
}

const LinkTravelersModal: React.FC<LinkTravelersModalProps> = ({ trip, onClose, onLinked }) => {
  const [step, setStep] = useState<'groups' | 'travelers'>(trip.couples && trip.couples.length > 0 ? 'travelers' : 'groups');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [selectedProfiles, setSelectedProfiles] = useState<Map<string, { coupleId: string; segments: string[] }>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Gerenciamento de grupos
  const [groups, setGroups] = useState<any[]>(trip.couples || []);
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);

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
      
      // Atualizar grupos da viagem
      const tripData = await supabaseDataProvider.getTripById(trip.id);
      if (tripData.couples) {
        setGroups(tripData.couples);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    setSavingGroup(true);
    try {
      const newGroup = await supabaseDataProvider.saveCouple(trip.id, {
        name: newGroupName.trim()
      });
      
      setGroups([...groups, newGroup]);
      setNewGroupName('');
      setShowNewGroupInput(false);
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      setErrorMessage('Erro ao criar grupo. Tente novamente.');
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await supabaseDataProvider.deleteCouple(groupId);
      setGroups(groups.filter(g => g.id !== groupId));
      
      // Remover grupo dos viajantes selecionados
      const updatedSelected = new Map(selectedProfiles);
      updatedSelected.forEach((config, profileId) => {
        if (config.coupleId === groupId) {
          updatedSelected.set(profileId, { ...config, coupleId: 'solo' });
        }
      });
      setSelectedProfiles(updatedSelected);
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
      setErrorMessage('Erro ao deletar grupo. Tente novamente.');
    }
  };

  const handleToggleSelect = (profileId: string) => {
    const newSelected = new Map(selectedProfiles);
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId);
    } else {
      // Adiciona com o primeiro grupo por padrão (ou 'solo' se não houver grupos)
      const defaultCoupleId = groups.length > 0 ? groups[0].id : 'solo';
      // Por padrão, seleciona todos os segmentos
      const allSegmentIds = trip.segments.map(s => s.id);
      newSelected.set(profileId, { 
        coupleId: defaultCoupleId,
        segments: allSegmentIds
      });
    }
    setSelectedProfiles(newSelected);
  };

  const handleChangeCoupleForProfile = (profileId: string, coupleId: string) => {
    const newSelected = new Map(selectedProfiles);
    if (newSelected.has(profileId)) {
      const current = newSelected.get(profileId)!;
      newSelected.set(profileId, { ...current, coupleId });
      setSelectedProfiles(newSelected);
    }
  };

  const handleToggleSegmentForProfile = (profileId: string, segmentId: string) => {
    const newSelected = new Map(selectedProfiles);
    if (newSelected.has(profileId)) {
      const current = newSelected.get(profileId)!;
      const segments = current.segments.includes(segmentId)
        ? current.segments.filter(s => s !== segmentId)
        : [...current.segments, segmentId];
      newSelected.set(profileId, { ...current, segments });
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
      if (config.segments.length === 0) {
        setErrorMessage('Cada viajante deve participar de pelo menos um destino.');
        return;
      }
    }
    
    setLinking(true);
    setErrorMessage(null);
    try {
      // Vincular cada perfil selecionado com seu grupo e segmentos específicos
      for (const [profileId, config] of Array.from(selectedProfiles.entries())) {
        // Filtrar apenas segmentos com UUID válido
        const validSegments = config.segments.filter(s => 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
        );
        
        await supabaseDataProvider.linkTravelerToTrip({
          tripId: trip.id,
          travelerProfileId: profileId,
          coupleId: config.coupleId === 'solo' ? null : config.coupleId,
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
        {/* Header com navegação de passos */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Adicionar Viajantes</h3>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'groups' ? 'Passo 1: Defina os grupos/famílias' : 'Passo 2: Selecione os viajantes'}
            </p>
          </div>
          <div className="flex gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'groups' ? 'bg-indigo-600 text-white' : 'bg-green-600 text-white'
            }`}>
              1
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'travelers' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-500'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Mensagem de erro */}
        {errorMessage && (
          <div className="p-3 bg-red-600/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* PASSO 1: Gerenciar Grupos */}
        {step === 'groups' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 <strong>Grupos/Famílias</strong> são usados para organizar a divisão de despesas. 
                Crie grupos para famílias, casais ou deixe viajantes como "Solo".
              </p>
            </div>

            {/* Input para criar novo grupo */}
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <label className="block text-sm font-bold text-gray-400 mb-3">Criar Novo Grupo</label>
              {!showNewGroupInput ? (
                <Button 
                  onClick={() => setShowNewGroupInput(true)} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  + Adicionar Grupo/Família
                </Button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="Ex: Família Silva, Casal Santos"
                    autoFocus
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newGroupName.trim()) {
                        await handleCreateGroup();
                      } else if (e.key === 'Escape') {
                        setShowNewGroupInput(false);
                        setNewGroupName('');
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none"
                  />
                  <Button 
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim() || savingGroup}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {savingGroup ? '...' : '✓'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowNewGroupInput(false);
                      setNewGroupName('');
                    }}
                    className="bg-gray-800 hover:bg-gray-700"
                  >
                    ✕
                  </Button>
                </div>
              )}
            </div>

            {/* Lista de grupos criados */}
            {groups.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-400">Grupos Criados</label>
                <div className="space-y-2">
                  {groups.map(group => (
                    <div key={group.id} className="flex items-center justify-between p-3 bg-indigo-600/10 border border-indigo-600/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold">
                          👨‍👩‍👧‍👦
                        </div>
                        <span className="font-bold text-white">{group.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groups.length === 0 && !showNewGroupInput && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Nenhum grupo criado ainda.</p>
                <p className="text-xs mt-1">Crie grupos para organizar famílias/casais ou pule para adicionar viajantes solo.</p>
              </div>
            )}

            {/* Botões de navegação */}
            <div className="flex gap-3 pt-4 border-t border-gray-800">
              <Button onClick={onClose} className="bg-gray-800 hover:bg-gray-700">
                Cancelar
              </Button>
              <Button 
                onClick={() => setStep('travelers')} 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                Próximo: Adicionar Viajantes →
              </Button>
            </div>
          </div>
        )}

        {/* PASSO 2: Selecionar Viajantes */}
        {step === 'travelers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Button 
                  onClick={() => setStep('groups')} 
                  className="text-sm bg-gray-800 hover:bg-gray-700"
                >
                  ← Voltar para Grupos
                </Button>
              </div>
              <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700 text-sm">
                + Criar Novo Perfil
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
                      
                      {/* Configurações do viajante selecionado */}
                      {isSelected && selectedConfig && (
                        <div className="mt-3 pt-3 border-t border-gray-800 space-y-3" onClick={(e) => e.stopPropagation()}>
                          {/* Seletor de grupo */}
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">Grupo / Família:</label>
                            <select
                              value={selectedConfig.coupleId}
                              onChange={(e) => handleChangeCoupleForProfile(profile.id, e.target.value)}
                              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                            >
                              <option value="solo">🚶 Solo (sem grupo)</option>
                              {groups.map(group => (
                                <option key={group.id} value={group.id}>👨‍👩‍👧‍👦 {group.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Seletor de segmentos */}
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">Participa de quais destinos?</label>
                            <div className="space-y-1">
                              {trip.segments.map(segment => (
                                <label key={segment.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-800 rounded">
                                  <input
                                    type="checkbox"
                                    checked={selectedConfig.segments.includes(segment.id)}
                                    onChange={() => handleToggleSegmentForProfile(profile.id, segment.id)}
                                    className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-gray-950"
                                  />
                                  <span className="text-sm text-gray-300">{segment.name}</span>
                                  {segment.startDate && segment.endDate && (
                                    <span className="text-xs text-gray-500">
                                      ({formatDateVeryShort(segment.startDate)} - {formatDateVeryShort(segment.endDate)})
                                    </span>
                                  )}
                                </label>
                              ))}
                            </div>
                            {selectedConfig.segments.length === 0 && (
                              <p className="text-xs text-red-400 mt-1">⚠️ Selecione pelo menos um destino</p>
                            )}
                          </div>
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
        )}
      </div>
    </Modal>
  );
};

export default LinkTravelersModal;
