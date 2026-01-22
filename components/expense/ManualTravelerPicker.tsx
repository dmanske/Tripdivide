import React, { useState, useMemo } from 'react';
import { TripTraveler } from '../../types';
import { Button } from '../CommonUI';

interface Props {
  travelers: TripTraveler[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onClose: () => void;
}

export const ManualTravelerPicker: React.FC<Props> = ({
  travelers,
  selectedIds,
  onSelectionChange,
  onClose
}) => {
  const [search, setSearch] = useState('');

  const filteredTravelers = useMemo(() => {
    if (!search) return travelers;
    const lower = search.toLowerCase();
    return travelers.filter(t => 
      t.profile?.fullName?.toLowerCase().includes(lower) ||
      t.profile?.nickname?.toLowerCase().includes(lower)
    );
  }, [travelers, search]);

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(filteredTravelers.map(t => t.id));
  };

  const handleClear = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar viajante..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        autoFocus
      />

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleSelectAll} variant="secondary" size="sm">
          Selecionar todos
        </Button>
        <Button onClick={handleClear} variant="secondary" size="sm">
          Limpar
        </Button>
        <div className="ml-auto text-sm text-gray-600 flex items-center">
          {selectedIds.length} selecionado{selectedIds.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredTravelers.map(traveler => (
          <label
            key={traveler.id}
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(traveler.id)}
              onChange={() => handleToggle(traveler.id)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">
                {traveler.profile?.fullName || 'Sem nome'}
              </div>
              <div className="text-xs text-gray-500 flex gap-2">
                <span>{traveler.type}</span>
                {traveler.isPayer && <span className="text-green-600">• Pagante</span>}
                {traveler.countInSplit && <span className="text-blue-600">• Conta no split</span>}
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Footer */}
      <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
        <Button onClick={onClose} variant="secondary">
          Cancelar
        </Button>
        <Button onClick={onClose}>
          Confirmar ({selectedIds.length})
        </Button>
      </div>
    </div>
  );
};
