
import React, { useState, useMemo, useEffect } from 'react';
import { Trip, Traveler, TravelerType, Couple, TravelerIssue } from '../types';
import { Card, Badge, Button, Input, Modal } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';
import TravelerWizard from './TravelerWizard';
import TravelerImportModal from './TravelerImportModal';
import DocumentDrawer from './DocumentDrawer';
import { formatPhone, formatSupabaseDate } from '../lib/formatters';

// Funções de formatação de documentos
const formatDocNumber = (value: string, docType: string): string => {
  if (!value) return '';
  
  // Remove tudo que não é letra ou número
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '');
  
  switch (docType) {
    case 'CPF':
      // 000.000.000-00
      return cleaned
        .slice(0, 11)
        .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        .replace(/(\d{3})(\d{3})(\d{3})(\d{1})$/, '$1.$2.$3-$4')
        .replace(/(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3')
        .replace(/(\d{3})(\d{2})$/, '$1.$2');
    
    case 'RG':
      // 00.000.000-0
      return cleaned
        .slice(0, 9)
        .replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4')
        .replace(/(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3')
        .replace(/(\d{2})(\d{3})$/, '$1.$2');
    
    case 'CNH':
      // 00000000000 (11 dígitos sem formatação)
      return cleaned.slice(0, 11);
    
    case 'Passaporte':
      // AA000000 (2 letras + 6 números)
      return cleaned.slice(0, 8).toUpperCase();
    
    default:
      return value;
  }
};

interface TravelerListProps {
  trip: Trip;
  onRefresh: () => void;
  onNavigateToDetail: (travelerId: string) => void;
}

const TravelerList: React.FC<TravelerListProps> = ({ trip, onRefresh, onNavigateToDetail }) => {
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingTraveler, setEditingTraveler] = useState<Partial<Traveler> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTravelers();
  }, [trip.id]);

  const loadTravelers = async () => {
    const list = await dataProvider.getTravelers(trip.id);
    setTravelers(list);
  };

  const filteredTravelers = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return travelers.filter(t => {
      const fullName = t.fullName || '';
      const nickname = t.nickname || '';
      const phone = t.phone || '';
      
      const matchesSearch = fullName.toLowerCase().includes(searchLower) || 
                            phone.includes(searchTerm) || 
                            nickname.toLowerCase().includes(searchLower);
      const matchesType = filterType === 'all' || t.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [travelers, searchTerm, filterType]);

  const handleOpenWizard = (t: Partial<Traveler> | null = null) => {
    setEditingTraveler(t);
    setIsWizardOpen(true);
  };

  const handleImport = async (raw: string) => {
    const count = await dataProvider.bulkImportTravelers(trip.id, raw);
    setIsImportOpen(false);
    loadTravelers();
    onRefresh();
    setSuccessMessage(`${count} viajantes importados com sucesso!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="flex flex-col h-full gap-8 animate-in fade-in duration-500">
      {/* Mensagem de sucesso */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg animate-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-bold">✓ {successMessage}</p>
        </div>
      )}
      
      {/* LISTA DE VIAJANTES */}
      <div className="flex-1 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Viajantes</h2>
            <p className="text-gray-500">Gestão de participantes e documentos</p>
          </div>
          <div className="flex gap-2">
             <Button variant="primary" onClick={() => handleOpenWizard()}>+ Novo Viajante</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900/40 p-4 rounded-2xl border border-gray-800">
           <div className="md:col-span-2">
              <Input placeholder="Buscar por nome, fone, email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
           <Input as="select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">Todos os tipos</option>
              {Object.values(TravelerType).map(t => <option key={t} value={t}>{t}</option>)}
           </Input>
           <div className="flex items-center gap-2 justify-center">
              <Badge color="indigo">{travelers.length} Total</Badge>
              <Badge color="gray">{travelers.filter(t => t.type === TravelerType.ADULT).length} ADU</Badge>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-[10px] font-black uppercase text-gray-500 border-b border-gray-800">
              <tr>
                <th className="p-4">Nome / Tipo</th>
                <th className="p-4">Casal / Grupo</th>
                <th className="p-4">Segmentos</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Issues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredTravelers.map(t => {
                const issues = dataProvider.computeTravelerIssues(t, trip);
                const hasErrors = issues.some(i => i.type === 'error');
                const hasWarnings = issues.some(i => i.type === 'warning');
                const displayName = t.fullName || 'Sem Nome';

                return (
                  <tr key={t.id} onClick={() => {
                    console.log('🖱️ Clicou no viajante:', t.fullName, 'ID:', t.id);
                    onNavigateToDetail(t.id);
                  }} className="hover:bg-gray-900/40 transition-colors cursor-pointer">
                    <td className="p-4">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${t.type === TravelerType.ADULT ? 'bg-indigo-600/20 text-indigo-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                             {displayName.charAt(0)}
                          </div>
                          <div>
                             <p className="font-bold text-gray-200">{displayName}</p>
                             <p className="text-[10px] text-gray-500 uppercase">{t.type} {t.nickname ? `• ${t.nickname}` : ''}</p>
                          </div>
                       </div>
                    </td>
                    <td className="p-4">
                       <span className="text-sm text-gray-400 font-medium">{trip.couples.find(c => c.id === t.coupleId)?.name}</span>
                    </td>
                    <td className="p-4">
                       <div className="flex flex-wrap gap-1">
                          {(t.goesToSegments || []).map(sid => {
                            const seg = trip.segments.find(s => s.id === sid);
                            return <span key={sid} className="text-[9px] px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded uppercase font-bold">{seg?.name}</span>
                          })}
                       </div>
                    </td>
                    <td className="p-4">
                       <Badge color={t.isPayer ? 'green' : 'gray'}>{t.isPayer ? 'Pagante' : 'Não pagante'}</Badge>
                    </td>
                    <td className="p-4 text-center">
                       <div className="flex justify-center gap-1">
                          {hasErrors && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Erro crítico" />}
                          {hasWarnings && <div className="w-2 h-2 rounded-full bg-amber-500" title="Atenção" />}
                          {!hasErrors && !hasWarnings && <span className="text-emerald-500 text-xs">✅</span>}
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTravelers.length === 0 && (
             <div className="py-20 text-center text-gray-600 italic">Nenhum viajante encontrado.</div>
          )}
        </div>
      </div>

      {/* Modais */}
      <Modal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} title={editingTraveler?.id ? "Editar Viajante" : "Novo Viajante"}>
         <TravelerWizard 
           trip={trip} 
           initialData={editingTraveler || undefined}
           onCancel={() => setIsWizardOpen(false)}
           onSave={async (t) => {
              const savedTraveler = await dataProvider.saveTraveler(t);
              
              // Salvar documentos
              if (t.documents && t.documents.length > 0) {
                for (const doc of t.documents) {
                  await dataProvider.saveTravelerDocument({
                    ...doc,
                    travelerId: savedTraveler.id
                  });
                }
              }
              
              setIsWizardOpen(false);
              loadTravelers();
              onRefresh();
           }}
         />
      </Modal>

      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Importar Viajantes em Lote">
         <TravelerImportModal onImport={handleImport} onClose={() => setIsImportOpen(false)} />
      </Modal>
    </div>
  );
};

export default TravelerList;
