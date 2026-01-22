import React, { useState } from 'react';
import { Modal, Button } from './CommonUI';
import { ICONS } from '../constants';

interface TripWizardProps {
  onClose: () => void;
  onSave: (tripData: any) => Promise<void>;
}

const TripWizard: React.FC<TripWizardProps> = ({ onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    destinations: [] as string[],
    baseCurrency: 'BRL',
    defaultExchangeRate: 1.0,
    defaultSplitRule: 'equal',
    consensusRule: '2/3' as '2/3' | '3/3',
    categories: ['Voo', 'Hospedagem', 'Aluguel de Carro', 'Restaurantes', 'Diversos']
  });

  const [newDestination, setNewDestination] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddDestination = () => {
    if (newDestination.trim()) {
      setFormData({ ...formData, destinations: [...formData.destinations, newDestination.trim()] });
      setNewDestination('');
    }
  };

  const handleRemoveDestination = (index: number) => {
    setFormData({ ...formData, destinations: formData.destinations.filter((_, i) => i !== index) });
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Erro ao salvar viagem:', error);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.name.trim() && formData.startDate && formData.endDate;
    if (step === 2) return formData.destinations.length > 0;
    return true;
  };

  return (
    <Modal onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Nova Viagem</h2>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`h-1 flex-1 rounded ${s <= step ? 'bg-indigo-600' : 'bg-gray-800'}`} />
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Passo {step} de 3: {step === 1 ? 'Informações Básicas' : step === 2 ? 'Destinos' : 'Configurações'}
          </p>
        </div>

        {/* Step 1: Informações Básicas */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Nome da Viagem</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Férias em Paris"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Data de Ida</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Data de Volta</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Destinos */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Adicionar Destino</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDestination();
                    }
                  }}
                  placeholder="Ex: Paris, Londres, Roma"
                  className="flex-1 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none"
                  autoFocus
                />
                <Button onClick={handleAddDestination} className="bg-indigo-600 hover:bg-indigo-700">
                  <ICONS.Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {formData.destinations.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-400">Destinos Adicionados</label>
                <div className="flex flex-wrap gap-2">
                  {formData.destinations.map((dest, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 border border-indigo-600/30 rounded-lg">
                      <span className="text-sm text-white">{dest}</span>
                      <button
                        onClick={() => handleRemoveDestination(index)}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        <ICONS.X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Configurações */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Moeda Base</label>
                <select
                  value={formData.baseCurrency}
                  onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none"
                >
                  <option value="BRL">BRL (Real)</option>
                  <option value="USD">USD (Dólar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Taxa de Câmbio Padrão</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.defaultExchangeRate}
                  onChange={(e) => setFormData({ ...formData, defaultExchangeRate: parseFloat(e.target.value) || 1.0 })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Regra Padrão de Divisão</label>
              <select
                value={formData.defaultSplitRule}
                onChange={(e) => setFormData({ ...formData, defaultSplitRule: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none"
              >
                <option value="equal">Dividir Igualmente</option>
                <option value="percent">Por Percentual</option>
                <option value="per_person">Por Pessoa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Regra de Consenso</label>
              <select
                value={formData.consensusRule}
                onChange={(e) => setFormData({ ...formData, consensusRule: e.target.value as '2/3' | '3/3' })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none"
              >
                <option value="2/3">2/3 dos votos</option>
                <option value="3/3">Unanimidade</option>
              </select>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-between mt-6 pt-6 border-t border-gray-800">
          <Button onClick={onClose} className="bg-gray-800 hover:bg-gray-700">
            Cancelar
          </Button>
          <div className="flex gap-3">
            {step > 1 && (
              <Button onClick={handleBack} className="bg-gray-800 hover:bg-gray-700">
                Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} disabled={!canProceed()} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving || !canProceed()} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Salvando...' : 'Criar Viagem'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TripWizard;
