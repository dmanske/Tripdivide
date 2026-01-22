import React, { useState } from 'react';
import { Button, Input, Modal } from './CommonUI';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';

interface QuickCreateVendorModalProps {
  onClose: () => void;
  onCreated: (profileId: string) => void;
}

const QuickCreateVendorModal: React.FC<QuickCreateVendorModalProps> = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    categories: [] as string[],
    rating: 3,
    websiteUrl: '',
    instagramUrl: '',
    paymentTermsDefault: ''
  });
  const [saving, setSaving] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');

  const handleAddCategory = () => {
    if (categoryInput.trim() && !formData.categories.includes(categoryInput.trim())) {
      setFormData({
        ...formData,
        categories: [...formData.categories, categoryInput.trim()]
      });
      setCategoryInput('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter(c => c !== cat)
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    setSaving(true);
    try {
      const profile = await supabaseDataProvider.saveVendorProfile(formData);
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
          <h3 className="text-xl font-bold text-white">Criar Novo Fornecedor</h3>
          <p className="text-sm text-gray-500 mt-1">Perfil global reutilizável em todas as viagens</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Nome Comercial *</label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Nome do fornecedor"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Razão Social</label>
            <Input 
              value={formData.legalName} 
              onChange={e => setFormData({...formData, legalName: e.target.value})}
              placeholder="Razão social (opcional)"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Categorias</label>
            <div className="flex gap-2 mb-2">
              <Input 
                value={categoryInput} 
                onChange={e => setCategoryInput(e.target.value)}
                placeholder="Ex: Hotel, Restaurante..."
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <Button onClick={handleAddCategory} className="bg-gray-800 hover:bg-gray-700">
                +
              </Button>
            </div>
            {formData.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.categories.map(cat => (
                  <span key={cat} className="px-2 py-1 bg-indigo-600/20 text-indigo-400 text-xs rounded flex items-center gap-1">
                    {cat}
                    <button onClick={() => handleRemoveCategory(cat)} className="hover:text-indigo-300">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Avaliação</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onClick={() => setFormData({...formData, rating: star})}
                  className={`text-2xl ${formData.rating >= star ? 'text-amber-400' : 'text-gray-700'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Website</label>
              <Input 
                value={formData.websiteUrl} 
                onChange={e => setFormData({...formData, websiteUrl: e.target.value})}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Instagram</label>
              <Input 
                value={formData.instagramUrl} 
                onChange={e => setFormData({...formData, instagramUrl: e.target.value})}
                placeholder="@usuario"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Condições de Pagamento</label>
            <Input 
              value={formData.paymentTermsDefault} 
              onChange={e => setFormData({...formData, paymentTermsDefault: e.target.value})}
              placeholder="Ex: 50% entrada + 50% 30 dias"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
          <Button onClick={onClose} className="bg-gray-800 hover:bg-gray-700">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-indigo-600 hover:bg-indigo-700" 
            disabled={!formData.name.trim() || saving}
          >
            {saving ? 'Criando...' : 'Criar e Vincular'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuickCreateVendorModal;
