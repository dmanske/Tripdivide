import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from './CommonUI';
import { ICONS } from '../constants';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import { formatDateVeryShort, formatDateShort } from '../lib/formatters';

interface TripWizardProps {
  onClose: () => void;
  onSave: (tripData: any) => Promise<void>;
  initialTrip?: any; // Para modo de edição
}

interface Segment {
  name: string;
  startDate: string;
  endDate: string;
}

const TripWizard: React.FC<TripWizardProps> = ({ onClose, onSave, initialTrip }) => {
  const isEditMode = !!initialTrip;
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    id: initialTrip?.id || undefined,
    name: initialTrip?.name || '',
    startDate: initialTrip?.start_date || initialTrip?.startDate || '',
    endDate: initialTrip?.end_date || initialTrip?.endDate || '',
    segments: initialTrip?.segments?.filter((s: any) => s.name !== 'Viagem Completa') || [] as Segment[],
    baseCurrency: initialTrip?.base_currency || initialTrip?.baseCurrency || 'BRL',
    defaultExchangeRate: initialTrip?.default_exchange_rate || initialTrip?.defaultExchangeRate || 1.0,
    defaultSplitRule: initialTrip?.default_split_rule || initialTrip?.defaultSplitRule || 'equal',
    consensusRule: (initialTrip?.consensus_rule || initialTrip?.consensusRule || '2/3') as '2/3' | '3/3',
    categories: initialTrip?.categories || ['Voo', 'Hospedagem', 'Aluguel de Carro', 'Restaurantes', 'Diversos'],
    selectedTravelerIds: [] as string[],
    selectedVendorIds: [] as string[],
    markVendorsAsFavorite: true
  });

  const [newSegment, setNewSegment] = useState<Segment>({
    name: '',
    startDate: '',
    endDate: ''
  });
  const [editingSegmentIndex, setEditingSegmentIndex] = useState<number | null>(null);
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

  const handleAddSegment = () => {
    if (newSegment.name.trim() && newSegment.startDate && newSegment.endDate) {
      if (editingSegmentIndex !== null) {
        // Editando segmento existente
        const updatedSegments = [...formData.segments];
        updatedSegments[editingSegmentIndex] = newSegment;
        setFormData({ ...formData, segments: updatedSegments });
        setEditingSegmentIndex(null);
      } else {
        // Adicionando novo segmento
        setFormData({ ...formData, segments: [...formData.segments, newSegment] });
      }
      setNewSegment({ name: '', startDate: '', endDate: '' });
    }
  };

  const handleEditSegment = (index: number) => {
    setNewSegment(formData.segments[index]);
    setEditingSegmentIndex(index);
  };

  const handleRemoveSegment = (index: number) => {
    setFormData({ ...formData, segments: formData.segments.filter((_, i) => i !== index) });
  };

  const handleCancelEdit = () => {
    setNewSegment({ name: '', startDate: '', endDate: '' });
    setEditingSegmentIndex(null);
  };

  // Verificar sobreposição de datas
  const checkOverlap = (newSeg: Segment, excludeIndex?: number): { hasOverlap: boolean; overlappingSegments: string[] } => {
    const overlapping: string[] = [];
    const newStart = new Date(newSeg.startDate).getTime();
    const newEnd = new Date(newSeg.endDate).getTime();

    formData.segments.forEach((seg, index) => {
      if (excludeIndex !== undefined && index === excludeIndex) return; // Ignorar o próprio segmento ao editar
      
      const segStart = new Date(seg.startDate).getTime();
      const segEnd = new Date(seg.endDate).getTime();

      // Verifica se há sobreposição
      if (
        (newStart >= segStart && newStart < segEnd) || // Novo começa durante existente
        (newEnd > segStart && newEnd <= segEnd) ||     // Novo termina durante existente
        (newStart <= segStart && newEnd >= segEnd)     // Novo engloba existente
      ) {
        overlapping.push(seg.name);
      }
    });

    return { hasOverlap: overlapping.length > 0, overlappingSegments: overlapping };
  };

  // Calcular estatísticas da viagem
  const getTripStats = () => {
    if (!formData.startDate || !formData.endDate) return null;

    const tripStart = new Date(formData.startDate + 'T00:00:00').getTime();
    const tripEnd = new Date(formData.endDate + 'T00:00:00').getTime();
    const totalDays = Math.ceil((tripEnd - tripStart) / (1000 * 60 * 60 * 24)) + 1;

    // Calcular dias cobertos (sem contar sobreposições)
    const coveredDays = new Set<string>();
    formData.segments.forEach(seg => {
      const start = new Date(seg.startDate + 'T00:00:00');
      const end = new Date(seg.endDate + 'T00:00:00');
      const current = new Date(start);
      
      while (current <= end) {
        coveredDays.add(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    });

    const segmentDays = formData.segments.reduce((sum, seg) => {
      const start = new Date(seg.startDate + 'T00:00:00').getTime();
      const end = new Date(seg.endDate + 'T00:00:00').getTime();
      return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }, 0);

    return {
      totalDays,
      coveredDays: coveredDays.size,
      segmentDays,
      uncoveredDays: totalDays - coveredDays.size,
      hasGaps: coveredDays.size < totalDays,
      hasOverlaps: segmentDays > coveredDays.size
    };
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
    if (step === 2) return formData.segments.length > 0;
    return true;
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            {isEditMode ? 'Editar Viagem' : 'Nova Viagem'}
          </h2>
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

        {/* Step 2: Destinos/Segmentos */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                {editingSegmentIndex !== null ? 'Editar Destino/Trecho' : 'Adicionar Destino/Trecho'}
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Defina os destinos da viagem com suas datas específicas. Útil para viagens com múltiplas cidades.
              </p>
              
              <div className="space-y-3 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nome do Destino</label>
                  <input
                    type="text"
                    value={newSegment.name}
                    onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSegment();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    placeholder="Ex: Miami, Orlando, Nova York"
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Data de Chegada</label>
                    <input
                      type="date"
                      value={newSegment.startDate}
                      onChange={(e) => setNewSegment({ ...newSegment, startDate: e.target.value })}
                      min={formData.startDate}
                      max={formData.endDate}
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Data de Saída</label>
                    <input
                      type="date"
                      value={newSegment.endDate}
                      onChange={(e) => setNewSegment({ ...newSegment, endDate: e.target.value })}
                      min={newSegment.startDate || formData.startDate}
                      max={formData.endDate}
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Aviso de sobreposição */}
                {newSegment.name && newSegment.startDate && newSegment.endDate && (() => {
                  const overlap = checkOverlap(newSegment, editingSegmentIndex ?? undefined);
                  if (overlap.hasOverlap) {
                    return (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-500 text-lg">⚠️</span>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-yellow-400">Sobreposição de Datas</p>
                            <p className="text-xs text-yellow-300 mt-1">
                              Este período sobrepõe com: <strong>{overlap.overlappingSegments.join(', ')}</strong>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Isso é normal se o grupo vai se dividir entre destinos diferentes no mesmo período.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleAddSegment} 
                    disabled={!newSegment.name.trim() || !newSegment.startDate || !newSegment.endDate}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingSegmentIndex !== null ? (
                      <>✓ Salvar Alterações</>
                    ) : (
                      <><ICONS.Plus className="w-4 h-4 mr-1" /> Adicionar</>
                    )}
                  </Button>
                  {editingSegmentIndex !== null && (
                    <Button onClick={handleCancelEdit} className="bg-gray-800 hover:bg-gray-700">
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {formData.segments.length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-400">Destinos Adicionados</label>
                
                {/* Timeline Visual */}
                {formData.startDate && formData.endDate && (
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                    <div className="text-xs font-bold text-gray-500 mb-2">TIMELINE DA VIAGEM</div>
                    <div className="relative h-12 bg-gray-950 rounded-lg overflow-hidden">
                      {/* Linha base */}
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-1 bg-gray-800"></div>
                      </div>
                      
                      {/* Segmentos na timeline */}
                      {formData.segments.map((seg, index) => {
                        const tripStart = new Date(formData.startDate).getTime();
                        const tripEnd = new Date(formData.endDate).getTime();
                        const tripDuration = tripEnd - tripStart;
                        
                        const segStart = new Date(seg.startDate).getTime();
                        const segEnd = new Date(seg.endDate).getTime();
                        
                        const leftPercent = ((segStart - tripStart) / tripDuration) * 100;
                        const widthPercent = ((segEnd - segStart) / tripDuration) * 100;
                        
                        const colors = [
                          'bg-indigo-600',
                          'bg-cyan-600',
                          'bg-purple-600',
                          'bg-pink-600',
                          'bg-green-600',
                          'bg-yellow-600'
                        ];
                        
                        return (
                          <div
                            key={index}
                            className={`absolute h-8 ${colors[index % colors.length]} rounded opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                            title={`${seg.name}: ${formatDateShort(seg.startDate)} - ${formatDateShort(seg.endDate)}`}
                          >
                            <div className="px-2 py-1 text-[10px] font-bold text-white truncate">
                              {seg.name}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Marcadores de data */}
                      <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-[9px] text-gray-600">
                        <span>{formatDateVeryShort(formData.startDate)}</span>
                        <span>{formatDateVeryShort(formData.endDate)}</span>
                      </div>
                    </div>
                    
                    {/* Estatísticas */}
                    {(() => {
                      const stats = getTripStats();
                      if (!stats) return null;
                      
                      return (
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-gray-950 rounded">
                            <div className="text-lg font-bold text-white">{stats.totalDays}</div>
                            <div className="text-[9px] text-gray-500 uppercase">Total</div>
                          </div>
                          <div className="p-2 bg-gray-950 rounded">
                            <div className="text-lg font-bold text-indigo-400">{stats.coveredDays}</div>
                            <div className="text-[9px] text-gray-500 uppercase">Cobertos</div>
                          </div>
                          <div className="p-2 bg-gray-950 rounded">
                            <div className={`text-lg font-bold ${stats.uncoveredDays > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                              {stats.uncoveredDays}
                            </div>
                            <div className="text-[9px] text-gray-500 uppercase">Livres</div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Avisos */}
                    {(() => {
                      const stats = getTripStats();
                      if (!stats) return null;
                      
                      return (
                        <div className="mt-2 space-y-1">
                          {stats.hasOverlaps && (
                            <div className="text-xs text-yellow-400 flex items-center gap-1">
                              <span>⚠️</span>
                              <span>Há sobreposição de datas (grupo se divide)</span>
                            </div>
                          )}
                          {stats.hasGaps && (
                            <div className="text-xs text-blue-400 flex items-center gap-1">
                              <span>ℹ️</span>
                              <span>{stats.uncoveredDays} dia(s) sem destino definido (descanso/deslocamento)</span>
                            </div>
                          )}
                          {!stats.hasGaps && !stats.hasOverlaps && (
                            <div className="text-xs text-green-400 flex items-center gap-1">
                              <span>✓</span>
                              <span>Toda a viagem está coberta sequencialmente</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {/* Lista de segmentos */}
                <div className="space-y-2">
                  {formData.segments.map((segment, index) => (
                    <div key={index} className="p-3 bg-indigo-600/10 border border-indigo-600/30 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-white text-lg">{segment.name}</div>
                          <div className="text-sm text-gray-400 mt-1">
                            📅 {formatDateVeryShort(segment.startDate)} - {formatDateShort(segment.endDate)}
                            <span className="ml-2 text-indigo-400">
                              ({Math.ceil((new Date(segment.endDate + 'T00:00:00').getTime() - new Date(segment.startDate + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1} dias)
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-3">
                          <button
                            onClick={() => handleEditSegment(index)}
                            className="text-indigo-400 hover:text-indigo-300 text-sm"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleRemoveSegment(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <ICONS.X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  💡 Dica: Você poderá definir quem vai em cada destino no próximo passo
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
                {saving ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Criar Viagem'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TripWizard;
