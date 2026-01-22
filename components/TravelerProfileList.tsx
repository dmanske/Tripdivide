import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Badge, Modal } from './CommonUI';
import { ICONS } from '../constants';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';

interface TravelerProfileListProps {
  onNavigate: (tab: string) => void;
}

const TravelerProfileList: React.FC<TravelerProfileListProps> = ({ onNavigate }) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    type: 'Adulto',
    phone: '',
    email: '',
    birthDate: '',
    canDrive: false,
    tags: [] as string[],
    notes: ''
  });

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

  const handleSave = async () => {
    try {
      await supabaseDataProvider.saveTravelerProfile({
        id: editingProfile?.id,
        ...formData
      });
      
      setShowNewProfile(false);
      setEditingProfile(null);
      setFormData({
        fullName: '',
        nickname: '',
        type: 'Adulto',
        phone: '',
        email: '',
        birthDate: '',
        canDrive: false,
        tags: [],
        notes: ''
      });
      
      await loadProfiles();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    }
  };

  const handleEdit = (profile: any) => {
    setEditingProfile(profile);
    setFormData({
      fullName: profile.full_name,
      nickname: profile.nickname || '',
      type: profile.type,
      phone: profile.phone || '',
      email: profile.email || '',
      birthDate: profile.birth_date || '',
      canDrive: profile.can_drive || false,
      tags: profile.tags || [],
      notes: profile.notes || ''
    });
    setShowNewProfile(true);
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
    p.phone?.includes(searchTerm)
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
          Novo Perfil
        </Button>
      </div>

      {/* Search */}
      <Card className="!p-4 bg-gray-900/40 border-gray-800">
        <Input 
          placeholder="Buscar por nome, apelido ou telefone..." 
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
        <Card className="!bg-cyan-600/20 !border-cyan-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{profiles.filter(p => p.type === 'Adulto').length}</div>
            <div className="text-sm text-gray-400 mt-1">Adultos</div>
          </div>
        </Card>
        <Card className="!bg-yellow-600/20 !border-yellow-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{profiles.filter(p => p.type !== 'Adulto').length}</div>
            <div className="text-sm text-gray-400 mt-1">Crianças</div>
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
        <div className="grid gap-3">
          {filteredProfiles.map(profile => (
            <Card 
              key={profile.id} 
              className="!p-4 hover:!border-indigo-600/50 transition-all cursor-pointer" 
              onClick={() => onNavigate(`profile-${profile.id}`)}
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
                  <Badge color="gray">{profile.type}</Badge>
                  <Button 
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(profile.id); }} 
                    className="bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs"
                  >
                    Arquivar
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
            <h3 className="text-xl font-bold text-white mb-4">Confirmar Arquivamento</h3>
            <p className="text-gray-400 mb-6">Tem certeza que deseja arquivar este perfil? Ele não será mais exibido na lista.</p>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setConfirmDelete(null)} className="bg-gray-800 hover:bg-gray-700">
                Cancelar
              </Button>
              <Button onClick={() => handleDelete(confirmDelete)} className="bg-red-600 hover:bg-red-700">
                Arquivar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de criação/edição */}
      <Modal isOpen={showNewProfile} onClose={() => { setShowNewProfile(false); setEditingProfile(null); }}>
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-white">{editingProfile ? 'Editar Perfil' : 'Novo Perfil'}</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Nome Completo *</label>
              <Input 
                value={formData.fullName} 
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                placeholder="Nome completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Apelido</label>
                <Input 
                  value={formData.nickname} 
                  onChange={e => setFormData({...formData, nickname: e.target.value})}
                  placeholder="Apelido"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Tipo *</label>
                <Input 
                  as="select"
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="Adulto">Adulto</option>
                  <option value="Criança">Criança</option>
                  <option value="Bebê">Bebê</option>
                </Input>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Telefone</label>
                <Input 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="+55 11 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Data de Nascimento</label>
                <Input 
                  type="date"
                  value={formData.birthDate} 
                  onChange={e => setFormData({...formData, birthDate: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Email</label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={formData.canDrive} 
                onChange={e => setFormData({...formData, canDrive: e.target.checked})}
                className="w-4 h-4"
              />
              <label className="text-sm font-bold text-gray-400">Pode dirigir</label>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Notas</label>
              <textarea 
                value={formData.notes} 
                onChange={e => setFormData({...formData, notes: e.target.value})}
                placeholder="Observações gerais..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
            <Button onClick={() => { setShowNewProfile(false); setEditingProfile(null); }} className="bg-gray-800 hover:bg-gray-700">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700" disabled={!formData.fullName.trim()}>
              {editingProfile ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TravelerProfileList;
