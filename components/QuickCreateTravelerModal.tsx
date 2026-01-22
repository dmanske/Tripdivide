import React, { useState } from 'react';
import { Button, Input, Modal } from './CommonUI';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';

interface QuickCreateTravelerModalProps {
  onClose: () => void;
  onCreated: (profileId: string) => void;
}

const QuickCreateTravelerModal: React.FC<QuickCreateTravelerModalProps> = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    type: 'Adulto',
    phone: '',
    email: '',
    birthDate: '',
    canDrive: false
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.fullName.trim()) return;
    
    setSaving(true);
    try {
      const profile = await supabaseDataProvider.saveTravelerProfile(formData);
      onCreated(profile.id);
    } catch (error) {
      console.error('Erro ao criar perfil:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white">Criar Novo Viajante</h3>
          <p className="text-sm text-gray-500 mt-1">Perfil global reutilizável em todas as viagens</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Nome Completo *</label>
            <Input 
              value={formData.fullName} 
              onChange={e => setFormData({...formData, fullName: e.target.value})}
              placeholder="Nome completo"
              autoFocus
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

          {formData.type === 'Adulto' && (
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={formData.canDrive} 
                onChange={e => setFormData({...formData, canDrive: e.target.checked})}
                className="w-4 h-4"
              />
              <label className="text-sm font-bold text-gray-400">Pode dirigir</label>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
          <Button onClick={onClose} className="bg-gray-800 hover:bg-gray-700">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-indigo-600 hover:bg-indigo-700" 
            disabled={!formData.fullName.trim() || saving}
          >
            {saving ? 'Criando...' : 'Criar e Vincular'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuickCreateTravelerModal;
