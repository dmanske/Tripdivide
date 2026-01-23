
import React, { useState } from 'react';
import { Button, Input, Card, Badge } from './CommonUI';
import { parseWhatsAppQuotes, ParsedQuoteBlock } from '../lib/whatsapp/parseWhatsAppQuotes';
import { Trip, Vendor } from '../types';
import { formatCurrency } from '../lib/formatters';

interface WhatsAppImportModalProps {
  trip: Trip;
  onImport: (blocks: ParsedQuoteBlock[]) => void;
  onClose: () => void;
  onEditBlock: (block: ParsedQuoteBlock) => void;
}

const WhatsAppImportModal: React.FC<WhatsAppImportModalProps> = ({ trip, onImport, onClose, onEditBlock }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [rawText, setRawText] = useState('');
  const [blocks, setBlocks] = useState<ParsedQuoteBlock[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [config, setConfig] = useState({
    myName: 'Daniel Manske',
    ignoreUser: true
  });

  const handleAnalyze = () => {
    if (!rawText.trim()) return;
    const detected = parseWhatsAppQuotes(rawText, { 
      myNames: [config.myName], 
      myPhones: [] 
    });
    setBlocks(detected);
    setSelectedIds(detected.filter(b => b.confidence !== 'baixa').map(b => b.id));
    setStep(2);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleFinalize = () => {
    const toImport = blocks.filter(b => selectedIds.includes(b.id));
    onImport(toImport);
  };

  return (
    <div className="space-y-6">
      {step === 1 ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl">
             <h4 className="text-sm font-bold text-indigo-400 uppercase mb-2">Como Funciona</h4>
             <ul className="text-xs text-gray-400 space-y-1 list-disc ml-4">
                <li>Exporte a conversa do WhatsApp (sem mídia).</li>
                <li>Cole o texto bruto abaixo.</li>
                <li>O sistema ignorará suas mensagens e extrairá preços e datas automaticamente.</li>
             </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input 
                label="Meu Nome no WhatsApp" 
                value={config.myName} 
                onChange={e => setConfig({...config, myName: e.target.value})}
                placeholder="Ex: Daniel Manske"
             />
             <div className="flex items-center gap-3 h-full pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                   <input 
                     type="checkbox" 
                     className="accent-indigo-500" 
                     checked={config.ignoreUser} 
                     onChange={e => setConfig({...config, ignoreUser: e.target.checked})}
                   />
                   <span className="text-xs font-bold text-gray-400 uppercase">Filtrar minhas mensagens</span>
                </label>
             </div>
          </div>

          <Input 
            as="textarea" 
            label="Conteúdo da Conversa" 
            rows={12} 
            value={rawText} 
            onChange={e => setRawText(e.target.value)}
            placeholder="[09:11, 21/01/2026] Fornecedor: Orçamento SeaWorld..."
            className="font-mono text-[10px]"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
             <Button variant="ghost" onClick={onClose}>Cancelar</Button>
             <Button variant="primary" onClick={handleAnalyze} disabled={!rawText.trim()}>Analisar Texto ➔</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
           <header className="flex justify-between items-center">
              <div>
                 <h3 className="text-lg font-black text-white">{blocks.length} Orçamentos Detectados</h3>
                 <p className="text-xs text-gray-500">Selecione quais deseja criar na viagem</p>
              </div>
              <Button variant="ghost" className="text-xs" onClick={() => setStep(1)}>← Voltar e Ajustar</Button>
           </header>

           <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {blocks.map(block => (
                <Card 
                  key={block.id} 
                  className={`!p-4 border-2 transition-all cursor-pointer ${selectedIds.includes(block.id) ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-800 opacity-60'}`}
                  onClick={() => toggleSelect(block.id)}
                >
                   <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                         <input 
                            type="checkbox" 
                            checked={selectedIds.includes(block.id)}
                            onChange={() => {}} // Handle by parent Card click
                            className="w-5 h-5 accent-indigo-500"
                         />
                         <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase">{block.category}</p>
                            <h4 className="font-bold text-gray-100">{block.title}</h4>
                         </div>
                      </div>
                      <Badge color={block.confidence === 'alta' ? 'green' : block.confidence === 'média' ? 'yellow' : 'red'}>
                         Confiança {block.confidence}
                      </Badge>
                   </div>

                   <div className="grid grid-cols-3 gap-4 bg-gray-950 p-3 rounded-lg border border-gray-800">
                      <div>
                         <p className="text-[9px] font-black text-gray-600 uppercase">Valor</p>
                         <p className="text-sm font-black text-indigo-400">{block.currency} {formatCurrency(block.totalAmount)}</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-gray-600 uppercase">Pagamento</p>
                         <p className="text-sm font-bold text-gray-300">{block.installments}x de {formatCurrency(block.installmentValue)}</p>
                      </div>
                      <div className="text-right">
                         <Button 
                           variant="ghost" 
                           className="text-[9px] py-1 px-2 h-7" 
                           onClick={(e) => { e.stopPropagation(); onEditBlock(block); }}
                         >
                           Editar
                         </Button>
                      </div>
                   </div>

                   {block.missingFields.length > 0 && (
                     <p className="text-[9px] text-red-400 mt-2 font-bold uppercase">⚠️ Faltando: {block.missingFields.join(', ')}</p>
                   )}
                </Card>
              ))}
           </div>

           <div className="flex justify-between items-center pt-6 border-t border-gray-800">
              <p className="text-xs text-gray-500 font-bold">{selectedIds.length} selecionados para importação</p>
              <div className="flex gap-2">
                 <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                 <Button variant="primary" onClick={handleFinalize} disabled={selectedIds.length === 0}>Criar Selecionados ➔</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppImportModal;
