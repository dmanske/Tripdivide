import React, { useState, useEffect } from 'react';
import { Button, Input, Badge } from './CommonUI';
import { dateToInput } from '../lib/formatters';
import { dataProvider } from '../lib/dataProvider';

interface DocumentDrawerProps {
  document: any;
  passports: any[]; // Para vincular vistos
  onClose: () => void;
  onSave: (doc: any) => void;
  onDelete: (docId: string) => void;
  onUpdateNumber: (docId: string, newNumber: string) => void;
  isNewDocument?: boolean; // Indica se é um documento novo sendo criado
}

// Funções de formatação
const formatDocNumber = (value: string, docType: string): string => {
  if (!value) return '';
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '');
  
  switch (docType) {
    case 'CPF':
      return cleaned.slice(0, 11)
        .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        .replace(/(\d{3})(\d{3})(\d{3})(\d{1})$/, '$1.$2.$3-$4')
        .replace(/(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3')
        .replace(/(\d{3})(\d{2})$/, '$1.$2');
    case 'RG':
      return cleaned.slice(0, 9)
        .replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4')
        .replace(/(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3')
        .replace(/(\d{2})(\d{3})$/, '$1.$2');
    case 'CNH':
      return cleaned.slice(0, 11);
    case 'Passaporte':
      return cleaned.slice(0, 8).toUpperCase();
    default:
      return value;
  }
};

const DocumentDrawer: React.FC<DocumentDrawerProps> = ({ 
  document, 
  passports,
  onClose, 
  onSave, 
  onDelete,
  onUpdateNumber,
  isNewDocument = false
}) => {
  const [isEditing, setIsEditing] = useState(isNewDocument); // Se é novo, já abre em modo edição
  const [isUpdatingNumber, setIsUpdatingNumber] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [showNewNumber, setShowNewNumber] = useState(true);
  const [hasChanges, setHasChanges] = useState(isNewDocument); // Se é novo, já marca como tendo mudanças
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [editedDoc, setEditedDoc] = useState(document);

  useEffect(() => {
    setEditedDoc(document);
    setIsEditing(isNewDocument); // Reseta modo de edição baseado em isNewDocument
    setHasChanges(isNewDocument);
  }, [document, isNewDocument]);

  const handleFieldChange = (field: string, value: any) => {
    setEditedDoc({ ...editedDoc, [field]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave(editedDoc);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowUnsavedWarning(true);
      return;
    }
    setEditedDoc(document);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleConfirmDiscard = () => {
    setEditedDoc(document);
    setIsEditing(false);
    setHasChanges(false);
    setShowUnsavedWarning(false);
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowUnsavedWarning(true);
      return;
    }
    onClose();
  };

  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    onClose();
  };

  const handleUpdateNumber = async () => {
    if (!newNumber.trim()) return;
    await onUpdateNumber(document.id, newNumber);
    setIsUpdatingNumber(false);
    setNewNumber('');
  };

  const handleDelete = async () => {
    await onDelete(document.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-full bg-gray-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">{editedDoc.docType}</h2>
            <p className="text-sm text-gray-500">
              {isEditing ? 'Modo de edição' : 'Visualização'}
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Aviso de alterações não salvas */}
          {showUnsavedWarning && (
            <div className="p-4 bg-amber-600/10 rounded-xl border border-amber-600/20 space-y-3">
              <p className="text-sm text-amber-400 font-bold">
                ⚠️ Você tem alterações não salvas. Deseja descartar?
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30" onClick={isEditing ? handleConfirmDiscard : handleConfirmClose}>
                  Descartar alterações
                </Button>
                <Button variant="ghost" onClick={() => setShowUnsavedWarning(false)}>
                  Continuar editando
                </Button>
              </div>
            </div>
          )}

          {/* Número do documento */}
          <div className="p-4 bg-gray-950 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-500 uppercase">Número do Documento</p>
              {!isNewDocument && !isUpdatingNumber && editedDoc.docNumber && (
                <button
                  onClick={() => setIsUpdatingNumber(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  Atualizar número
                </button>
              )}
            </div>
            
            {/* Se é novo OU está atualizando, mostra input */}
            {(isNewDocument && isEditing) || isUpdatingNumber ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type={showNewNumber ? 'text' : 'password'}
                    value={showNewNumber ? formatDocNumber(isNewDocument ? editedDoc.docNumber : newNumber, editedDoc.docType) : (isNewDocument ? editedDoc.docNumber : newNumber)}
                    onChange={e => {
                      const cleaned = e.target.value.replace(/[^A-Za-z0-9]/g, '');
                      if (isNewDocument) {
                        handleFieldChange('docNumber', cleaned);
                      } else {
                        setNewNumber(cleaned);
                      }
                    }}
                    placeholder="Digite o número do documento"
                    className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    autoFocus={isNewDocument}
                  />
                  <button
                    onClick={() => setShowNewNumber(!showNewNumber)}
                    className="px-3 text-gray-500 hover:text-gray-300"
                  >
                    {showNewNumber ? '👁️' : '🙈'}
                  </button>
                </div>
                {!isNewDocument && (
                  <>
                    <div className="flex gap-2">
                      <Button variant="primary" onClick={handleUpdateNumber} disabled={!newNumber.trim()}>
                        Confirmar atualização
                      </Button>
                      <Button variant="ghost" onClick={() => { setIsUpdatingNumber(false); setNewNumber(''); }}>
                        Cancelar
                      </Button>
                    </div>
                    <p className="text-xs text-amber-500">
                      ⚠️ O número será criptografado e substituirá o atual
                    </p>
                  </>
                )}
              </div>
            ) : (
              <p className="text-2xl font-black tracking-widest text-white">
                {formatDocNumber(editedDoc.docNumber, editedDoc.docType) || '(não informado)'}
              </p>
            )}
          </div>

          {/* Metadados editáveis */}
          <div className="space-y-4">
            {/* Passaporte */}
            {editedDoc.docType === 'Passaporte' && (
              <>
                <Input
                  label="País Emissor"
                  value={editedDoc.issuerCountry || ''}
                  onChange={e => handleFieldChange('issuerCountry', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Local de Emissão"
                  value={editedDoc.issuerPlace || ''}
                  onChange={e => handleFieldChange('issuerPlace', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Data de Emissão"
                  type="date"
                  value={dateToInput(editedDoc.issueDate) || ''}
                  onChange={e => handleFieldChange('issueDate', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Vencimento"
                  type="date"
                  value={dateToInput(editedDoc.expiryDate) || ''}
                  onChange={e => handleFieldChange('expiryDate', e.target.value)}
                  disabled={!isEditing}
                />
                <div className="p-4 bg-gray-950 rounded-xl border border-gray-800">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editedDoc.isPrimary || false}
                      onChange={e => handleFieldChange('isPrimary', e.target.checked)}
                      disabled={!isEditing}
                      className="w-5 h-5 accent-indigo-500"
                    />
                    <div>
                      <p className="text-sm font-bold text-white">Passaporte Principal</p>
                      <p className="text-xs text-gray-500">Usado como referência para vistos</p>
                    </div>
                  </label>
                </div>
              </>
            )}

            {/* RG */}
            {editedDoc.docType === 'RG' && (
              <>
                <Input
                  label="Estado Emissor"
                  value={editedDoc.issuerState || ''}
                  onChange={e => handleFieldChange('issuerState', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Órgão Emissor"
                  value={editedDoc.issuerAgency || ''}
                  onChange={e => handleFieldChange('issuerAgency', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Data de Emissão"
                  type="date"
                  value={dateToInput(editedDoc.issueDate) || ''}
                  onChange={e => handleFieldChange('issueDate', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Vencimento"
                  type="date"
                  value={dateToInput(editedDoc.expiryDate) || ''}
                  onChange={e => handleFieldChange('expiryDate', e.target.value)}
                  disabled={!isEditing}
                />
              </>
            )}

            {/* CNH */}
            {editedDoc.docType === 'CNH' && (
              <>
                <Input
                  as="select"
                  label="Categoria"
                  value={editedDoc.licenseCategory || ''}
                  onChange={e => handleFieldChange('licenseCategory', e.target.value)}
                  disabled={!isEditing}
                >
                  <option value="">Selecione</option>
                  <option value="A">A - Moto</option>
                  <option value="B">B - Carro</option>
                  <option value="AB">AB - Moto e Carro</option>
                  <option value="C">C - Caminhão</option>
                  <option value="D">D - Ônibus</option>
                  <option value="E">E - Carreta</option>
                </Input>
                <Input
                  label="UF Emissora"
                  value={editedDoc.issuerState || ''}
                  onChange={e => handleFieldChange('issuerState', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Data de Emissão"
                  type="date"
                  value={dateToInput(editedDoc.issueDate) || ''}
                  onChange={e => handleFieldChange('issueDate', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Vencimento"
                  type="date"
                  value={dateToInput(editedDoc.expiryDate) || ''}
                  onChange={e => handleFieldChange('expiryDate', e.target.value)}
                  disabled={!isEditing}
                />
              </>
            )}

            {/* Visto */}
            {editedDoc.docType === 'Visto' && (
              <>
                <Input
                  label="País/Região"
                  value={editedDoc.regionOrCountry || ''}
                  onChange={e => handleFieldChange('regionOrCountry', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Categoria"
                  value={editedDoc.visaCategory || ''}
                  onChange={e => handleFieldChange('visaCategory', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Ex: B1/B2, Turismo"
                />
                <Input
                  as="select"
                  label="Tipo de Entrada"
                  value={editedDoc.entryType || ''}
                  onChange={e => handleFieldChange('entryType', e.target.value)}
                  disabled={!isEditing}
                >
                  <option value="">Selecione</option>
                  <option value="single">Entrada Única</option>
                  <option value="multiple">Múltiplas Entradas</option>
                </Input>
                <Input
                  label="Duração (dias)"
                  type="number"
                  value={editedDoc.stayDurationDays || ''}
                  onChange={e => handleFieldChange('stayDurationDays', parseInt(e.target.value) || null)}
                  disabled={!isEditing}
                />
                <Input
                  as="select"
                  label="Vinculado ao Passaporte"
                  value={editedDoc.passportDocumentId || ''}
                  onChange={e => handleFieldChange('passportDocumentId', e.target.value || null)}
                  disabled={!isEditing}
                >
                  <option value="">Nenhum</option>
                  {passports.map(p => (
                    <option key={p.id} value={p.id}>
                      {formatDocNumber(p.docNumber, 'Passaporte')} - {p.issuerCountry}
                    </option>
                  ))}
                </Input>
                <Input
                  label="Vencimento"
                  type="date"
                  value={dateToInput(editedDoc.expiryDate) || ''}
                  onChange={e => handleFieldChange('expiryDate', e.target.value)}
                  disabled={!isEditing}
                />
              </>
            )}

            {/* ESTA */}
            {editedDoc.docType === 'ESTA' && (
              <>
                <Input
                  label="País/Região"
                  value={editedDoc.regionOrCountry || ''}
                  onChange={e => handleFieldChange('regionOrCountry', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  as="select"
                  label="Vinculado ao Passaporte"
                  value={editedDoc.passportDocumentId || ''}
                  onChange={e => handleFieldChange('passportDocumentId', e.target.value || null)}
                  disabled={!isEditing}
                >
                  <option value="">Nenhum</option>
                  {passports.map(p => (
                    <option key={p.id} value={p.id}>
                      {formatDocNumber(p.docNumber, 'Passaporte')} - {p.issuerCountry}
                    </option>
                  ))}
                </Input>
                <Input
                  label="Vencimento"
                  type="date"
                  value={dateToInput(editedDoc.expiryDate) || ''}
                  onChange={e => handleFieldChange('expiryDate', e.target.value)}
                  disabled={!isEditing}
                />
              </>
            )}

            {/* Outro */}
            {editedDoc.docType === 'Outro' && (
              <>
                <Input
                  label="Nome do Documento"
                  value={editedDoc.customLabel || ''}
                  onChange={e => handleFieldChange('customLabel', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="País/Estado Emissor"
                  value={editedDoc.issuerCountry || editedDoc.issuerState || ''}
                  onChange={e => handleFieldChange('issuerCountry', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Vencimento"
                  type="date"
                  value={dateToInput(editedDoc.expiryDate) || ''}
                  onChange={e => handleFieldChange('expiryDate', e.target.value)}
                  disabled={!isEditing}
                />
              </>
            )}

            {/* Observações (todos os tipos) */}
            <Input
              as="textarea"
              label="Observações"
              rows={3}
              value={editedDoc.notes || ''}
              onChange={e => handleFieldChange('notes', e.target.value)}
              disabled={!isEditing}
              placeholder="Detalhes adicionais sobre o documento"
            />
          </div>

          {/* Excluir documento - só mostra se não for novo */}
          {!isNewDocument && (
            <>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full p-3 text-red-400 hover:bg-red-600/10 rounded-xl border border-red-600/20 transition-colors text-sm font-bold"
                >
                  🗑️ Excluir documento
                </button>
              ) : (
                <div className="p-4 bg-red-600/10 rounded-xl border border-red-600/20 space-y-3">
                  <p className="text-sm text-red-400 font-bold">
                    ⚠️ Tem certeza que deseja excluir este documento?
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" className="flex-1 bg-red-600/20 text-red-400 hover:bg-red-600/30" onClick={handleDelete}>
                      Confirmar exclusão
                    </Button>
                    <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-950 flex gap-3">
          {!isEditing ? (
            <>
              <Button variant="primary" className="flex-1" onClick={() => setIsEditing(true)}>
                ✏️ Editar
              </Button>
              <Button variant="ghost" onClick={handleClose}>
                Fechar
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" className="flex-1" onClick={handleSave} disabled={!hasChanges}>
                {isNewDocument ? '💾 Cadastrar documento' : '💾 Salvar alterações'}
              </Button>
              <Button variant="ghost" onClick={handleCancel}>
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentDrawer;
