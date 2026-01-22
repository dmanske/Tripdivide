
import React, { useState } from 'react';
import { Button, Input } from './CommonUI';

interface TravelerImportModalProps {
  onImport: (raw: string) => void;
  onClose: () => void;
}

const TravelerImportModal: React.FC<TravelerImportModalProps> = ({ onImport, onClose }) => {
  const [raw, setRaw] = useState('');

  return (
    <div className="space-y-6">
       <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl">
          <p className="text-sm font-bold text-white mb-2">Instruções de Importação</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Cole sua lista separada por ponto-e-vírgula (um viajante por linha):<br/>
            <code className="text-[10px] text-indigo-400 block mt-2 bg-gray-950 p-2 rounded">Nome Completo; Tipo; ID_Casal; Segmentos; Fone</code>
            <span className="text-[10px] block mt-1 italic text-gray-500">Ex: João Silva; Adulto; couple-1; seg-1,seg-2; +5511...</span>
          </p>
       </div>
       
       <Input as="textarea" rows={10} value={raw} onChange={e => setRaw(e.target.value)} placeholder="Cole aqui..." className="font-mono text-xs" />
       
       <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => onImport(raw)} disabled={!raw.trim()}>Importar Lista</Button>
       </div>
    </div>
  );
};

export default TravelerImportModal;
