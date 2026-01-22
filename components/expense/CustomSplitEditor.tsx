import React, { useState, useEffect, useMemo } from 'react';
import { TripTraveler, Couple, ExpenseSplit } from '../../types';
import { Button, Modal } from '../CommonUI';
import { supabase } from '../../lib/supabase';

interface CustomSplitRow {
  id?: string;
  participantType: 'traveler' | 'couple';
  participantId: string;
  participantName: string;
  amount: number;
}

interface Props {
  expenseId: string;
  tripId: string;
  expenseTotal: number;
  travelers: TripTraveler[];
  couples: Couple[];
  onClose: () => void;
}

export const CustomSplitEditor: React.FC<Props> = ({
  expenseId,
  tripId,
  expenseTotal,
  travelers,
  couples,
  onClose
}) => {
  const [rows, setRows] = useState<CustomSplitRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'traveler' | 'couple'>('traveler');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadExistingSplits();
  }, [expenseId]);

  const loadExistingSplits = async () => {
    try {
      const { data: splits, error } = await supabase
        .from('td_expense_splits')
        .select(`
          *,
          trip_traveler:td_trip_travelers(
            id,
            profile:td_traveler_profiles(full_name)
          ),
          couple:td_couples(id, name)
        `)
        .eq('expense_id', expenseId);

      if (error) throw error;

      if (splits && splits.length > 0) {
        const customRows: CustomSplitRow[] = splits.map(s => ({
          id: s.id,
          participantType: s.participant_type,
          participantId: s.participant_type === 'traveler' ? s.trip_traveler_id : s.couple_id,
          participantName: s.participant_type === 'traveler' ? 
            s.trip_traveler?.profile?.full_name || 'Sem nome' :
            s.couple?.name || 'Sem nome',
          amount: s.amount_brl
        }));
        setRows(customRows);
      }
    } catch (error) {
      console.error('Erro ao carregar splits:', error);
    }
  };

  const totalAmount = useMemo(() => {
    return rows.reduce((sum, row) => sum + row.amount, 0);
  }, [rows]);

  const difference = useMemo(() => {
    return expenseTotal - totalAmount;
  }, [expenseTotal, totalAmount]);

  const isValid = useMemo(() => {
    return Math.abs(difference) < 0.01;
  }, [difference]);

  const handleAddParticipant = (type: 'traveler' | 'couple', id: string, name: string) => {
    // Verificar se já existe
    const exists = rows.some(r => r.participantType === type && r.participantId === id);
    if (exists) {
      setError('Este participante já foi adicionado');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const newRow: CustomSplitRow = {
      participantType: type,
      participantId: id,
      participantName: name,
      amount: 0
    };

    setRows([...rows, newRow]);
    setShowAddModal(false);
    setError('');
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleAmountChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newRows = [...rows];
    newRows[index].amount = numValue;
    setRows(newRows);
  };

  const handleAutoAdjust = () => {
    if (rows.length === 0) return;

    const perParticipant = expenseTotal / rows.length;
    const newRows = rows.map(r => ({ ...r, amount: perParticipant }));
    setRows(newRows);
  };

  const handleSave = async () => {
    setError('');
    
    if (!isValid) {
      setError('A soma dos valores deve ser igual ao total da despesa');
      return;
    }

    if (rows.length === 0) {
      setError('Adicione pelo menos um participante');
      return;
    }

    setLoading(true);
    try {
      // Deletar splits existentes
      await supabase
        .from('td_expense_splits')
        .delete()
        .eq('expense_id', expenseId);

      // Inserir novos splits
      const splitsToInsert = rows.map(row => ({
        expense_id: expenseId,
        trip_id: tripId,
        participant_type: row.participantType,
        trip_traveler_id: row.participantType === 'traveler' ? row.participantId : null,
        couple_id: row.participantType === 'couple' ? row.participantId : null,
        split_type: 'fixed',
        amount_brl: row.amount
      }));

      const { error: insertError } = await supabase
        .from('td_expense_splits')
        .insert(splitsToInsert);

      if (insertError) throw insertError;

      // Toast de sucesso
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50';
      toast.textContent = 'Splits customizados salvos!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

      onClose();
    } catch (error: any) {
      setError(error.message || 'Erro ao salvar splits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header com resumo */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Total da despesa:</span>
          <span className="text-lg font-bold">R$ {expenseTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Soma atual:</span>
          <span className="text-lg font-bold">R$ {totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Diferença:</span>
          <span className={`text-lg font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            R$ {difference.toFixed(2)}
          </span>
        </div>
        {error && (
          <div className="mt-3 bg-red-100 text-red-800 text-sm px-3 py-2 rounded">
            ❌ {error}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => setShowAddModal(true)} variant="secondary" size="sm">
          + Adicionar participante
        </Button>
        <Button onClick={handleAutoAdjust} variant="secondary" size="sm" disabled={rows.length === 0}>
          Ajustar automaticamente
        </Button>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Participante</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                  Nenhum participante adicionado. Clique em "+ Adicionar participante" para começar.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{row.participantName}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      row.participantType === 'couple' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {row.participantType === 'couple' ? 'Casal' : 'Pessoa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={row.amount}
                      onChange={e => handleAmountChange(index, e.target.value)}
                      className="w-32 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleRemoveRow(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
        <Button onClick={onClose} variant="secondary" disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={loading || !isValid}>
          {loading ? 'Salvando...' : 'Salvar splits'}
        </Button>
      </div>

      {/* Add Participant Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Adicionar Participante"
        >
          <div className="space-y-4">
            {/* Type selector */}
            <div className="flex gap-2">
              <Button
                onClick={() => setAddType('traveler')}
                variant={addType === 'traveler' ? 'primary' : 'secondary'}
                size="sm"
              >
                Viajante
              </Button>
              <Button
                onClick={() => setAddType('couple')}
                variant={addType === 'couple' ? 'primary' : 'secondary'}
                size="sm"
              >
                Casal
              </Button>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {addType === 'traveler' ? (
                travelers.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleAddParticipant('traveler', t.id, t.profile?.fullName || 'Sem nome')}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="font-medium text-sm">{t.profile?.fullName || 'Sem nome'}</div>
                    <div className="text-xs text-gray-500">{t.type}</div>
                  </button>
                ))
              ) : (
                couples.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleAddParticipant('couple', c.id, c.name)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="text-xs text-gray-500">
                      {c.members?.length || 0} membro{c.members?.length !== 1 ? 's' : ''}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
