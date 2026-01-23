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
      <div className="p-4 space-y-3 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center text-xl">
            🏢
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Criar Novo Fornecedor</h3>
            <p className="text-xs text-gray-500">Perfil global reutilizável</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Nome Comercial *</label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Nome"
                autoFocus
                className="!py-2 !text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Razão Social</label>
              <Input 
                value={formData.legalName} 
                onChange={e => setFormData({...formData, legalName: e.target.value})}
                placeholder="Opcional"
                className="!py-2 !text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Categorias</label>
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
                className="!py-2 !text-sm"
              />
              <Button onClick={handleAddCategory} className="bg-gray-800 hover:bg-gray-700 !py-2 !px-3 !text-sm">
                +
              </Button>
            </div>
            {formData.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formData.categories.map(cat => (
                  <span key={cat} className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 text-[10px] rounded flex items-center gap-1 font-bold">
                    {cat}
                    <button onClick={() => handleRemoveCategory(cat)} className="hover:text-indigo-300 text-xs">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 py-2 px-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <span className="text-xs font-bold text-gray-500">Avaliação:</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onClick={() => setFormData({...formData, rating: star})}
                  className={`text-xl ${formData.rating >= star ? 'text-amber-400' : 'text-gray-700'} hover:scale-110 transition-transform`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">🌐 Website</label>
              <Input 
                value={formData.websiteUrl} 
                onChange={e => setFormData({...formData, websiteUrl: e.target.value})}
                placeholder="https://..."
                className="!py-2 !text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">📸 Instagram</label>
              <Input 
                value={formData.instagramUrl} 
                onChange={e => setFormData({...formData, instagramUrl: e.target.value})}
                placeholder="@usuario"
                className="!py-2 !text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Condições de Pagamento</label>
            <Input 
              value={formData.paymentTermsDefault} 
              onChange={e => setFormData({...formData, paymentTermsDefault: e.target.value})}
              placeholder="Ex: 50% + 50% 30d"
              className="!py-2 !text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-3 border-t border-gray-800">
          <Button onClick={onClose} className="bg-gray-800 hover:bg-gray-700 !py-2 !text-sm">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-indigo-600 hover:bg-indigo-700 !py-2 !text-sm" 
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
