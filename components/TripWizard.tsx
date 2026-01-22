import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from './CommonUI';
import { ICONS } from '../constants';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';

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
    categories: ['Voo', 'Hospedagem', 'Aluguel de Carro', 'Restaurantes', 'Diversos'],
    selectedTravelerIds: [] as string[],
    selectedVendorIds: [] as string[],
    markVendorsAsFavorite: true
  });

  const [newDestination, setNewDestination] = useState('');
  const [saving, setSaving] = useState(false);
  const [travelerProfiles, setTravelerProfiles] = useState<any[]>([]);
  const [vendorProfiles, setVendorProfiles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');

  useEffect(() => {
    if (step === 4) {
      loadTravelerProfiles();
    } else if (step === 5) {
      loadVendorProfiles();
    }
  }, [step]);

  const loadTravelerProfiles = async () => {
    try {
      const profiles = await supabaseDataProvider.getTravelerProfiles();
      setTravelerProfiles(profiles);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    }
  };

  const loadVendorProfiles = async () => {
    try {
      const profiles = await supabaseDataProvider.getVendorProfiles();
      setVendorProfiles(profiles);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

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
    if (step < 5) setStep(step + 1);
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
    <Modal isOpen={true} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Nova Viagem</h2>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`h-1 flex-1 rounded ${s <= step ? 'bg-indigo-600' : 'bg-gray-800'}`} />
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Passo {step} de 5: {step === 1 ? 'Informações Básicas' : step === 2 ? 'Destinos' : step === 3 ? 'Configurações' : step === 4 ? 'Viajantes' : 'Fornecedores'}
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

        {/* Step 4: Viajantes */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Quem vai nessa viagem?</label>
              <p className="text-xs text-gray-500 mb-3">Selecione os viajantes que participarão desta viagem. Você pode pular e adicionar depois.</p>
              <Input
                placeholder="Buscar viajante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {travelerProfiles
                .filter(p => {
                  const s = searchTerm.toLowerCase();
                  return (p.full_name || '').toLowerCase().includes(s) || 
                         (p.email && p.email.toLowerCase().includes(s)) ||
                         (p.phone && p.phone.includes(s));
                })
                .map(profile => {
                  const isSelected = formData.selectedTravelerIds.includes(profile.id);
                  return (
                    <div
                      key={profile.id}
                      onClick={() => {
                        if (isSelected) {
                          setFormData({
                            ...formData,
                            selectedTravelerIds: formData.selectedTravelerIds.filter(id => id !== profile.id)
                          });
                        } else {
                          setFormData({
                            ...formData,
                            selectedTravelerIds: [...formData.selectedTravelerIds, profile.id]
                          });
                        }
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-600'
                          : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{profile.full_name || profile.name}</p>
                          <p className="text-xs text-gray-500">
                            {profile.email || profile.phone || 'Sem contato'}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                            <ICONS.Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {formData.selectedTravelerIds.length > 0 && (
              <div className="pt-3 border-t border-gray-800">
                <p className="text-sm text-gray-400">
                  {formData.selectedTravelerIds.length} viajante(s) selecionado(s)
                </p>
              </div>
            )}

            {travelerProfiles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Nenhum perfil de viajante cadastrado ainda.</p>
                <p className="text-xs mt-1">Você pode adicionar viajantes depois de criar a viagem.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Fornecedores (Opcional) */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Fornecedores desta viagem (opcional)</label>
              <p className="text-xs text-gray-500 mb-3">Selecione fornecedores que você já conhece e quer usar nesta viagem. Você pode pular e adicionar depois.</p>
              <Input
                placeholder="Buscar fornecedor..."
                value={vendorSearchTerm}
                onChange={(e) => setVendorSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {vendorProfiles
                .filter(p => {
                  const s = vendorSearchTerm.toLowerCase();
                  return (p.name || '').toLowerCase().includes(s) || 
                         (p.categories && p.categories.some((c: string) => c.toLowerCase().includes(s)));
                })
                .map(profile => {
                  const isSelected = formData.selectedVendorIds.includes(profile.id);
                  return (
                    <div
                      key={profile.id}
                      onClick={() => {
                        if (isSelected) {
                          setFormData({
                            ...formData,
                            selectedVendorIds: formData.selectedVendorIds.filter(id => id !== profile.id)
                          });
                        } else {
                          setFormData({
                            ...formData,
                            selectedVendorIds: [...formData.selectedVendorIds, profile.id]
                          });
                        }
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-600'
                          : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{profile.name || 'Sem nome'}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(profile.categories || []).slice(0, 3).map((cat: string) => (
                              <span key={cat} className="text-[9px] font-black uppercase text-indigo-400">{cat}</span>
                            ))}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                            <ICONS.Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {formData.selectedVendorIds.length > 0 && (
              <div className="pt-3 border-t border-gray-800 space-y-3">
                <p className="text-sm text-gray-400">
                  {formData.selectedVendorIds.length} fornecedor(es) selecionado(s)
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.markVendorsAsFavorite}
                    onChange={(e) => setFormData({ ...formData, markVendorsAsFavorite: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-gray-950"
                  />
                  <span className="text-sm text-gray-300">Marcar como favoritos desta viagem</span>
                </label>
              </div>
            )}

            {vendorProfiles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Nenhum fornecedor cadastrado ainda.</p>
                <p className="text-xs mt-1">Você pode adicionar fornecedores depois de criar a viagem.</p>
              </div>
            )}
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
            {step < 5 ? (
              <Button onClick={handleNext} disabled={!canProceed()} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
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
