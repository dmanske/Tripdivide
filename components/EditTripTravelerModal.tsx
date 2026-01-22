import React, { useState } from 'react';
import { Button, Input, Badge, Modal } from './CommonUI';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import { Trip } from '../types';

interface EditTripTravelerModalProps {
  trip: Trip;
  tripTraveler: any; // td_trip_travelers com profile
  onClose: () => void;
  onSaved: () => void;
  onUnlink: () => void;
}

const EditTripTravelerModal: React.FC<EditTripTravelerModalProps> = ({ 
  trip, 
  tripTraveler, 
  onClose, 
  onSaved,
  onUnlink 
}) => {
  const profile = tripTraveler.profile;
  const [formData, setFormData] = useState({
    coupleId: tripTraveler.couple_id || trip.couples[0]?.id,
    goesToSegments: tripTraveler.goes_to_segments || [],
    isPayer: tripTraveler.is_payer !== undefined ? tripTraveler.is_payer : true,
    canDriveThisTrip: tripTraveler.can_drive_this_trip || false,
    customNotes: tripTraveler.custom_notes || ''
  });
  const [saving, setSaving] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabaseDataProvider.updateTripTraveler(tripTraveler.id, formData);
      onSaved();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSegment = (segmentId: string) => {
    const newSegments = formData.goesToSegments.includes(segmentId)
      ? formData.goesToSegments.filter((s: string) => s !== segmentId)
      : [...formData.goesToSegments, segmentId];
    setFormData({ ...formData, goesToSegments: newSegments });
  };

  if (showUnlinkConfirm) {
    return (
      <Modal isOpen={true} onClose={() => setShowUnlinkConfirm(false)}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">Confirmar Desvinculação</h3>
          <p className="text-gray-400 mb-6">
            Tem certeza que deseja desvincular <strong>{profile?.full_name}</strong> desta viagem? 
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
            Ajuste como <strong>{profile?.full_name}</strong> participa de <strong>{trip.name}</strong>
          </p>
        </div>

        {/* Perfil Info */}
        <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              profile?.type === 'Adulto' ? 'bg-indigo-600/20 text-indigo-400' : 'bg-yellow-600/20 text-yellow-400'
            }`}>
              {profile?.full_name?.charAt(0) || '?'}
            </div>
            <div>
              <div className="font-bold text-white">{profile?.full_name}</div>
              <div className="text-sm text-gray-500">
                {profile?.type}
                {profile?.nickname && ` • ${profile?.nickname}`}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Grupo */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Grupo</label>
            <Input 
              as="select"
              value={formData.coupleId} 
              onChange={e => setFormData({...formData, coupleId: e.target.value})}
            >
              {trip.couples.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Input>
          </div>

          {/* Segmentos */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Participa dos Segmentos</label>
            <div className="space-y-2">
              {trip.segments.map(segment => (
                <div key={segment.id} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={formData.goesToSegments.includes(segment.id)}
                    onChange={() => handleToggleSegment(segment.id)}
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-gray-300">{segment.name}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Pagante */}
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={formData.isPayer}
              onChange={e => setFormData({...formData, isPayer: e.target.checked})}
              className="w-4 h-4"
            />
            <label className="text-sm font-bold text-gray-300">É pagante (divide despesas)</label>
          </div>

          {/* Pode dirigir nesta viagem */}
          {profile?.type === 'Adulto' && (
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={formData.canDriveThisTrip}
                onChange={e => setFormData({...formData, canDriveThisTrip: e.target.checked})}
                className="w-4 h-4"
              />
              <label className="text-sm font-bold text-gray-300">Pode dirigir nesta viagem</label>
            </div>
          )}

          {/* Notas específicas desta viagem */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Notas desta Viagem</label>
            <textarea 
              value={formData.customNotes} 
              onChange={e => setFormData({...formData, customNotes: e.target.value})}
              placeholder="Observações específicas para esta viagem..."
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

export default EditTripTravelerModal;
