import React, { useState, useEffect } from 'react';
import { SplitMode, ParticipationMode, TripTraveler, Couple } from '../../types';
import { supabaseDataProvider } from '../../lib/supabaseDataProvider';
import { Button, Modal } from '../CommonUI';
import { ManualTravelerPicker } from '../expense/ManualTravelerPicker';
import { ManualCouplePicker } from '../expense/ManualCouplePicker';
import { CustomSplitEditor } from '../expense/CustomSplitEditor';

interface Props {
  tripId: string;
  expenseId: string;
  expenseTotal: number;
  currentSplitMode?: SplitMode | null;
  currentParticipationMode: ParticipationMode;
  onUpdated?: () => void;
}

export const ExpenseSplitRulesPanel: React.FC<Props> = ({
  tripId,
  expenseId,
  expenseTotal,
  currentSplitMode,
  currentParticipationMode,
  onUpdated
}) => {
  const [splitMode, setSplitMode] = useState<SplitMode>(currentSplitMode || SplitMode.BY_COUPLE);
  const [participationMode, setParticipationMode] = useState<ParticipationMode>(currentParticipationMode || ParticipationMode.INHERIT);
  const [tripTravelers, setTripTravelers] = useState<TripTraveler[]>([]);
  const [couples, setCouples] = useState<Couple[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManualPicker, setShowManualPicker] = useState(false);
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTravelerIds, setSelectedTravelerIds] = useState<string[]>([]);
  const [selectedCoupleIds, setSelectedCoupleIds] = useState<string[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [tripId]);

  const loadData = async () => {
    try {
      const [travelers, tripCouples] = await Promise.all([
        supabaseDataProvider.getTripTravelers(tripId),
        supabaseDataProvider.getCouples(tripId)
      ]);
      setTripTravelers(travelers);
      setCouples(tripCouples);
      
      // Calcular warnings
      calculateWarnings(travelers, splitMode);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const calculateWarnings = (travelers: TripTraveler[], mode: SplitMode) => {
    const newWarnings: string[] = [];
    
    if (mode === SplitMode.BY_COUPLE) {
      const withoutCouple = travelers.filter(t => !t.coupleId);
      if (withoutCouple.length > 0) {
        newWarnings.push(`${withoutCouple.length} viajante(s) sem grupo não entram no racha por casal`);
      }
    }
    
    setWarnings(newWarnings);
  };

  const handleRecalculate = async () => {
    setError('');
    
    // Validações
    if (participationMode === ParticipationMode.MANUAL) {
      if (splitMode === SplitMode.PER_PERSON && selectedTravelerIds.length === 0) {
        setError('Selecione pelo menos um viajante');
        return;
      }
      if (splitMode === SplitMode.BY_COUPLE && selectedCoupleIds.length === 0) {
        setError('Selecione pelo menos um casal');
        return;
      }
    }

    // Se custom e já tem splits, pedir confirmação
    if (splitMode === SplitMode.CUSTOM && summary?.count > 0) {
      setShowConfirmModal(true);
      return;
    }

    await executeRecalculate();
  };

  const executeRecalculate = async () => {
    setLoading(true);
    try {
      const result = await supabaseDataProvider.recalculateExpenseSplits(expenseId, {
        splitMode,
        participationMode,
        manualSelectedTripTravelerIds: selectedTravelerIds,
        manualSelectedCoupleIds: selectedCoupleIds
      });

      setSummary(result.summary);
      
      // Toast de sucesso
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50';
      toast.textContent = 'Split atualizado com sucesso!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

      if (onUpdated) onUpdated();
      setShowConfirmModal(false);
    } catch (error: any) {
      setError(error.message || 'Erro ao recalcular split');
    } finally {
      setLoading(false);
    }
  };

  const getSummaryText = () => {
    if (!summary) return 'Nenhum split calculado ainda';
    
    if (summary.mode === SplitMode.CUSTOM) {
      return 'Divisão: Customizada';
    }
    
    const modeText = summary.mode === SplitMode.BY_COUPLE ? 'Por casal' : 'Por pessoa';
    const count = summary.count || 0;
    const unitText = summary.mode === SplitMode.BY_COUPLE ? 
      `${count} casal${count !== 1 ? 'is' : ''}` : 
      `${count} pessoa${count !== 1 ? 's' : ''}`;
    
    return `Divisão: ${modeText} • ${unitText}`;
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-white mb-4">Regras de Divisão</h3>

      {/* Resumo atual */}
      <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-700">
        <div className="text-sm text-gray-200">{getSummaryText()}</div>
        {participationMode === ParticipationMode.INHERIT && (
          <div className="text-xs text-gray-400 mt-1">Participação: herdada da viagem</div>
        )}
        {warnings.length > 0 && (
          <div className="mt-2">
            {warnings.map((w, i) => (
              <div key={i} className="inline-block bg-yellow-500/10 text-yellow-400 text-xs px-2 py-1 rounded mr-2">
                ⚠️ {w}
              </div>
            ))}
          </div>
        )}
        {error && (
          <div className="mt-2 bg-red-500/10 text-red-400 text-xs px-2 py-1 rounded">
            ❌ {error}
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="space-y-4">
        {/* Como dividir */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Como dividir</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={splitMode === SplitMode.BY_COUPLE}
                onChange={() => {
                  setSplitMode(SplitMode.BY_COUPLE);
                  calculateWarnings(tripTravelers, SplitMode.BY_COUPLE);
                }}
                className="text-blue-500"
              />
              <span className="text-sm text-gray-200">Por casal</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={splitMode === SplitMode.PER_PERSON}
                onChange={() => {
                  setSplitMode(SplitMode.PER_PERSON);
                  calculateWarnings(tripTravelers, SplitMode.PER_PERSON);
                }}
                className="text-blue-500"
              />
              <span className="text-sm text-gray-200">Por pessoa</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={splitMode === SplitMode.CUSTOM}
                onChange={() => {
                  setSplitMode(SplitMode.CUSTOM);
                  setShowCustomEditor(true);
                }}
                className="text-blue-500"
              />
              <span className="text-sm text-gray-200">Custom (manual)</span>
            </label>
          </div>
        </div>

        {/* Quem participa (não mostrar se custom) */}
        {splitMode !== SplitMode.CUSTOM && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quem participa</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={participationMode === ParticipationMode.INHERIT}
                  onChange={() => setParticipationMode(ParticipationMode.INHERIT)}
                  className="text-blue-500"
                />
                <span className="text-sm text-gray-200">Herdar da viagem</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={participationMode === ParticipationMode.ALL}
                  onChange={() => setParticipationMode(ParticipationMode.ALL)}
                  className="text-blue-500"
                />
                <span className="text-sm text-gray-200">Todos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={participationMode === ParticipationMode.PAYING_ONLY}
                  onChange={() => setParticipationMode(ParticipationMode.PAYING_ONLY)}
                  className="text-blue-500"
                />
                <span className="text-sm text-gray-200">Só pagantes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={participationMode === ParticipationMode.MANUAL}
                  onChange={() => {
                    setParticipationMode(ParticipationMode.MANUAL);
                    setShowManualPicker(true);
                  }}
                  className="text-blue-500"
                />
                <span className="text-sm text-gray-200">Manual</span>
              </label>
            </div>

            {/* Seleção manual */}
            {participationMode === ParticipationMode.MANUAL && (
              <div className="mt-2">
                <Button
                  onClick={() => setShowManualPicker(true)}
                  variant="secondary"
                  size="sm"
                >
                  {splitMode === SplitMode.PER_PERSON ? 
                    `Selecionar viajantes (${selectedTravelerIds.length})` :
                    `Selecionar casais (${selectedCoupleIds.length})`
                  }
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Botão recalcular */}
        <div className="pt-2 border-t border-gray-700">
          <Button
            onClick={handleRecalculate}
            disabled={loading || splitMode === SplitMode.CUSTOM}
            className="w-full"
          >
            {loading ? 'Recalculando...' : 'Recalcular split'}
          </Button>
          {splitMode === SplitMode.CUSTOM && (
            <p className="text-xs text-gray-400 mt-1 text-center">
              Use o editor customizado para gerenciar splits manualmente
            </p>
          )}
        </div>
      </div>

      {/* Modal de seleção manual */}
      {showManualPicker && (
        <Modal
          isOpen={showManualPicker}
          onClose={() => setShowManualPicker(false)}
          title={splitMode === SplitMode.PER_PERSON ? 'Selecionar Viajantes' : 'Selecionar Casais'}
        >
          {splitMode === SplitMode.PER_PERSON ? (
            <ManualTravelerPicker
              travelers={tripTravelers}
              selectedIds={selectedTravelerIds}
              onSelectionChange={setSelectedTravelerIds}
              onClose={() => setShowManualPicker(false)}
            />
          ) : (
            <ManualCouplePicker
              couples={couples}
              selectedIds={selectedCoupleIds}
              onSelectionChange={setSelectedCoupleIds}
              onClose={() => setShowManualPicker(false)}
            />
          )}
        </Modal>
      )}

      {/* Modal de confirmação */}
      {showConfirmModal && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirmar recálculo"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Isso vai substituir os valores customizados existentes. Deseja continuar?
            </p>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowConfirmModal(false)} variant="secondary">
                Cancelar
              </Button>
              <Button onClick={executeRecalculate} disabled={loading}>
                {loading ? 'Recalculando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Custom Editor */}
      {showCustomEditor && splitMode === SplitMode.CUSTOM && (
        <Modal
          isOpen={showCustomEditor}
          onClose={() => setShowCustomEditor(false)}
          title="Editor de Split Customizado"
          size="large"
        >
          <CustomSplitEditor
            expenseId={expenseId}
            tripId={tripId}
            expenseTotal={expenseTotal}
            travelers={tripTravelers}
            couples={couples}
            onClose={() => {
              setShowCustomEditor(false);
              if (onUpdated) onUpdated();
            }}
          />
        </Modal>
      )}
    </div>
  );
};
