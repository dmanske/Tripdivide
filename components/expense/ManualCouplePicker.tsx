import React, { useState } from 'react';
import { Couple } from '../../types';
import { Button } from '../CommonUI';

interface Props {
  couples: Couple[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onClose: () => void;
}

export const ManualCouplePicker: React.FC<Props> = ({
  couples,
  selectedIds,
  onSelectionChange,
  onClose
}) => {
  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(couples.map(c => c.id));
  };

  const handleClear = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-4">
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
        {couples.map(couple => (
          <label
            key={couple.id}
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(couple.id)}
              onChange={() => handleToggle(couple.id)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">{couple.name}</div>
              <div className="text-xs text-gray-500">
                {couple.members?.length || 0} membro{couple.members?.length !== 1 ? 's' : ''}
                {couple.members && couple.members.length > 0 && (
                  <span className="ml-2">
                    ({couple.members.map(m => m.name).join(', ')})
                  </span>
                )}
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
