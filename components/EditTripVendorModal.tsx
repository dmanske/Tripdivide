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
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">Confirmar Desvinculação</h3>
          <p className="text-gray-400 mb-6">
            Tem certeza que deseja desvincular <strong>{profile?.name}</strong> desta viagem? 
            O perfil global será mantido.
          </p>
          <div className="flex gap-3 justify-end">
            <Button onClick={() => setShowUnlinkConfirm(false)} className="bg-gray-800 hover:bg-gray-700">
              Cancelar
            </Button>
            <Button onClick={() => { setShowUnlinkConfirm(false); onUnlink(); }} className="bg-red-600 hover:bg-red-700">
              Desvincular
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold text-white">Configurações desta Viagem</h3>
          <p className="text-sm text-gray-500 mt-1">
            Ajuste como <strong>{profile?.name}</strong> aparece em <strong>{trip.name}</strong>
          </p>
        </div>

        {/* Perfil Info */}
        <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
          <div>
            <div className="font-bold text-white text-lg">{profile?.name}</div>
            {profile?.legal_name && (
              <div className="text-sm text-gray-500">{profile.legal_name}</div>
            )}
            <div className="flex gap-1 mt-2">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={`text-sm ${profile?.rating >= s ? 'text-amber-400' : 'text-gray-800'}`}>★</span>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Favorito */}
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={formData.preferred}
              onChange={e => setFormData({...formData, preferred: e.target.checked})}
              className="w-4 h-4"
            />
            <label className="text-sm font-bold text-gray-300">⭐ Marcar como favorito nesta viagem</label>
          </div>

          {/* Rating customizado */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">
              Avaliação Específica (opcional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Deixe em branco para usar a avaliação global ({profile?.rating} estrelas)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFormData({...formData, customRating: null})}
                className={`px-3 py-1 rounded text-xs font-bold ${
                  formData.customRating === null 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                Usar Global
              </button>
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onClick={() => setFormData({...formData, customRating: star})}
                  className={`text-2xl ${
                    formData.customRating !== null && formData.customRating >= star 
                      ? 'text-amber-400' 
                      : 'text-gray-700'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Notas específicas desta viagem */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Notas desta Viagem</label>
            <textarea 
              value={formData.customNotes} 
              onChange={e => setFormData({...formData, customNotes: e.target.value})}
              placeholder="Observações específicas para esta viagem (ex: contato local, condições especiais)..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <Button 
            onClick={() => setShowUnlinkConfirm(true)} 
            className="bg-red-600/20 hover:bg-red-600/30 text-red-400"
          >
            Desvincular
          </Button>
          <div className="flex gap-3">
            <Button onClick={onClose} className="bg-gray-800 hover:bg-gray-700">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditTripVendorModal;
