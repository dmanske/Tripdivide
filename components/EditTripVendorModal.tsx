import React, { useState } from 'react';
import { Button, Input, Modal } from './CommonUI';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import { Trip } from '../types';

interface EditTripVendorModalProps {
  trip: Trip;
  tripVendor: any; // td_trip_vendors com profile
  onClose: () => void;
  onSaved: () => void;
  onUnlink: () => void;
}

const EditTripVendorModal: React.FC<EditTripVendorModalProps> = ({ 
  trip, 
  tripVendor, 
  onClose, 
  onSaved,
  onUnlink 
}) => {
  const profile = tripVendor.profile;
  const [formData, setFormData] = useState({
    preferred: tripVendor.preferred || false,
    customRating: tripVendor.custom_rating || null,
    customNotes: tripVendor.custom_notes || ''
  });
  const [saving, setSaving] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabaseDataProvider.updateTripVendor(tripVendor.id, formData);
      onSaved();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setSaving(false);
    }
  };

  if (showUnlinkConfirm) {
    return (
      <Modal isOpen={true} onClose={() => setShowUnlinkConfirm(false)}>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center text-xl">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-white">Confirmar Desvinculação</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Tem certeza que deseja desvincular <strong>{profile?.name}</strong> desta viagem? 
            O perfil global será mantido.
          </p>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setShowUnlinkConfirm(false)} className="bg-gray-800 hover:bg-gray-700 !py-2 !text-sm">
              Cancelar
            </Button>
            <Button onClick={() => { setShowUnlinkConfirm(false); onUnlink(); }} className="bg-red-600 hover:bg-red-700 !py-2 !text-sm">
              Desvincular
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="p-4 space-y-3 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center text-xl">
            ⚙️
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Configurações da Viagem</h3>
            <p className="text-xs text-gray-500">
              <strong>{profile?.name}</strong> em <strong>{trip.name}</strong>
            </p>
          </div>
        </div>

        {/* Perfil Info - Compacto */}
        <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-sm">{profile?.name}</div>
              {profile?.legal_name && (
                <div className="text-xs text-gray-500">{profile.legal_name}</div>
              )}
            </div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={`text-sm ${profile?.rating >= s ? 'text-amber-400' : 'text-gray-800'}`}>★</span>
              ))}
            </div>
          </div>
        </div>

        {/* Form - Compacto */}
        <div className="space-y-3">
          {/* Favorito */}
          <div className="flex items-center gap-2 py-2 px-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <input 
              type="checkbox" 
              checked={formData.preferred}
              onChange={e => setFormData({...formData, preferred: e.target.checked})}
              className="w-4 h-4 accent-amber-500"
            />
            <label className="text-xs font-bold text-gray-300">⭐ Marcar como favorito</label>
          </div>

          {/* Rating customizado - Inline */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">
              Avaliação Específica
            </label>
            <p className="text-[10px] text-gray-600 mb-2">
              Padrão: {profile?.rating} estrelas (global)
            </p>
            <div className="flex items-center gap-2 py-2 px-3 bg-gray-900/50 rounded-lg border border-gray-800">
              <button
                onClick={() => setFormData({...formData, customRating: null})}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                  formData.customRating === null 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                }`}
              >
                Global
              </button>
              <span className="text-gray-700">|</span>
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onClick={() => setFormData({...formData, customRating: star})}
                  className={`text-xl ${
                    formData.customRating !== null && formData.customRating >= star 
                      ? 'text-amber-400' 
                      : 'text-gray-700'
                  } hover:scale-110 transition-transform`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Notas específicas desta viagem */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Notas desta Viagem</label>
            <textarea 
              value={formData.customNotes} 
              onChange={e => setFormData({...formData, customNotes: e.target.value})}
              placeholder="Observações específicas (ex: contato local, condições especiais)..."
              className="w-full bg-gray-900/50 border border-gray-800 rounded-lg p-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <Button 
            onClick={() => setShowUnlinkConfirm(true)} 
            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 !py-2 !text-sm border border-red-600/30"
          >
            Desvincular
          </Button>
          <div className="flex gap-2">
            <Button onClick={onClose} className="bg-gray-800 hover:bg-gray-700 !py-2 !text-sm">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 !py-2 !text-sm" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditTripVendorModal;
