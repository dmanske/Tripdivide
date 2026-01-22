import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Badge, Modal } from './CommonUI';
import { ICONS } from '../constants';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import TravelerWizard from './TravelerWizard';
import { formatPhone } from '../lib/formatters';

interface TravelerProfileListProps {
  onNavigateToDetail: (profileId: string) => void;
}

const TravelerProfileList: React.FC<TravelerProfileListProps> = ({ onNavigateToDetail }) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await supabaseDataProvider.getTravelerProfiles();
      setProfiles(data);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabaseDataProvider.deleteTravelerProfile(id);
      setConfirmDelete(null);
      await loadProfiles();
    } catch (error) {
      console.error('Erro ao deletar perfil:', error);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Carregando perfis...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Perfis de Viajantes</h1>
          <p className="text-sm text-gray-500 mt-1">Cadastros globais reutilizáveis em qualquer viagem</p>
        </div>
        <Button onClick={() => setShowNewProfile(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <ICONS.Plus className="w-4 h-4 mr-2" />
          Novo Viajante
        </Button>
      </div>

      {/* Search */}
      <Card className="!p-4 bg-gray-900/40 border-gray-800">
        <Input 
          placeholder="Buscar por nome, apelido, email ou telefone..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
        />
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="!bg-indigo-600/20 !border-indigo-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{profiles.length}</div>
            <div className="text-sm text-gray-400 mt-1">Total</div>
          </div>
        </Card>
        <Card className="!bg-blue-600/20 !border-blue-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{profiles.filter(p => p.can_drive).length}</div>
            <div className="text-sm text-gray-400 mt-1">Motoristas</div>
          </div>
        </Card>
        <Card className="!bg-green-600/20 !border-green-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{profiles.filter(p => p.email || p.phone).length}</div>
            <div className="text-sm text-gray-400 mt-1">Com Contato</div>
          </div>
        </Card>
      </div>

      {/* List */}
      {filteredProfiles.length === 0 ? (
        <Card className="text-center py-12">
          <ICONS.Travelers className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum perfil cadastrado ainda</p>
          <Button onClick={() => setShowNewProfile(true)} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
            Criar primeiro perfil
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map(profile => (
            <Card 
              key={profile.id} 
              className="!p-4 hover:!border-indigo-600/50 transition-all cursor-pointer" 
              onClick={() => onNavigateToDetail(profile.id)}
            >
              <div className="space-y-3">
                <div>
                  <div className="font-bold text-white text-lg">{profile.full_name}</div>
                  {profile.nickname && (
                    <div className="text-xs text-gray-500">"{profile.nickname}"</div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1">
                  {profile.can_drive && (
                    <Badge color="blue" className="text-[9px]">🚗 DIRIGE</Badge>
                  )}
                  {profile.tags && profile.tags.length > 0 && profile.tags.map((tag: string) => (
                    <Badge key={tag} color="gray" className="text-[9px]">{tag}</Badge>
                  ))}
                </div>

                {/* Contato */}
                <div className="space-y-1 text-xs text-gray-400">
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <span>📞</span>
                      <span>{formatPhone(profile.phone)}</span>
                    </div>
                  )}
                  {profile.email && (
                    <div className="flex items-center gap-2">
                      <span>✉️</span>
                      <span className="truncate">{profile.email}</span>
                    </div>
                  )}
                  {!profile.phone && !profile.email && (
                    <div className="text-gray-600 italic">Sem contato</div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                  <Badge color="indigo">Ver Perfil →</Badge>
                  <Button 
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(profile.id); }} 
                    className="bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <Modal isOpen={true} onClose={() => setConfirmDelete(null)}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-400 mb-6">Tem certeza que deseja excluir este perfil? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setConfirmDelete(null)} className="bg-gray-800 hover:bg-gray-700">
                Cancelar
              </Button>
              <Button onClick={() => handleDelete(confirmDelete)} className="bg-red-600 hover:bg-red-700">
                Excluir
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de criação */}
      <Modal isOpen={showNewProfile} onClose={() => setShowNewProfile(false)} title="Novo Viajante" size="xl">
        <TravelerWizard
          onCancel={() => setShowNewProfile(false)}
          onDone={async (profileId) => {
            setShowNewProfile(false);
            await loadProfiles();
          }}
        />
      </Modal>
    </div>
  );
};

export default TravelerProfileList;
