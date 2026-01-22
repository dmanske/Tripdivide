
import React, { useState, useMemo, useEffect } from 'react';
import { Trip, Traveler, TravelerType } from '../types';
import { Badge, Button, Input, Modal } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';
import TravelerWizard from './TravelerWizard';
import TravelerImportModal from './TravelerImportModal';

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
  const [filterCouple, setFilterCouple] = useState('all');
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
    return travelers.filter((t: Traveler) => {
      const fullName = t.fullName || '';
      const nickname = t.nickname || '';
      const phone = t.phone || '';
      const couple = trip.couples.find((c: any) => c.id === t.coupleId);
      const coupleName = couple?.name || '';
      
      const matchesSearch = fullName.toLowerCase().includes(searchLower) || 
                            phone.includes(searchTerm) || 
                            nickname.toLowerCase().includes(searchLower) ||
                            coupleName.toLowerCase().includes(searchLower);
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCouple = filterCouple === 'all' || t.coupleId === filterCouple;
      return matchesSearch && matchesType && matchesCouple;
    });
  }, [travelers, searchTerm, filterType, filterCouple, trip.couples]);

  // Agrupar viajantes por casal
  const groupedTravelers = useMemo(() => {
    const groups: Record<string, Traveler[]> = {};
    
    filteredTravelers.forEach((t: Traveler) => {
      const coupleId = t.coupleId || 'sem-grupo';
      if (!groups[coupleId]) {
        groups[coupleId] = [];
      }
      groups[coupleId].push(t);
    });

    // Ordenar dentro de cada grupo: adultos primeiro, depois crianças
    Object.keys(groups).forEach((coupleId: string) => {
      groups[coupleId].sort((a: Traveler, b: Traveler) => {
        if (a.type === 'Adulto' && b.type !== 'Adulto') return -1;
        if (a.type !== 'Adulto' && b.type === 'Adulto') return 1;
        return (a.fullName || '').localeCompare(b.fullName || '');
      });
    });

    return groups;
  }, [filteredTravelers]);

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
           <div className="md:col-span-1">
              <Input placeholder="Buscar por nome, fone, grupo..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} />
           </div>
           <Input as="select" value={filterType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)}>
              <option value="all">Todos os tipos</option>
              {Object.values(TravelerType).map((t: string) => <option key={t} value={t}>{t}</option>)}
           </Input>
           <Input as="select" value={filterCouple} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCouple(e.target.value)}>
              <option value="all">Todos os grupos</option>
              {trip.couples.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
           </Input>
           <div className="flex items-center gap-2 justify-center">
              <Badge color="indigo">{travelers.length} Total</Badge>
              <Badge color="gray">{travelers.filter((t: Traveler) => t.type === TravelerType.ADULT).length} ADU</Badge>
           </div>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedTravelers).map(([coupleId, groupTravelers]: [string, Traveler[]]) => {
            const couple = trip.couples.find((c: any) => c.id === coupleId);
            const coupleName = couple?.name || 'Sem Grupo';
            
            return (
              <div key={coupleId} className="bg-gray-900/40 rounded-2xl border border-gray-800 overflow-hidden">
                {/* Header do grupo */}
                <div className="px-6 py-3 bg-gray-900/60 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-wide">{coupleName}</h3>
                    <Badge color="gray">{groupTravelers.length} {groupTravelers.length === 1 ? 'viajante' : 'viajantes'}</Badge>
                  </div>
                </div>

                {/* Tabela do grupo */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-[10px] font-black uppercase text-gray-500 border-b border-gray-800">
                      <tr>
                        <th className="p-4">Nome / Tipo</th>
                        <th className="p-4">Segmentos</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {groupTravelers.map((t: Traveler) => {
                        const issues = dataProvider.computeTravelerIssues(t, trip);
                        const hasErrors = issues.some((i: any) => i.type === 'error');
                        const hasWarnings = issues.some((i: any) => i.type === 'warning');
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
                               <div className="flex flex-wrap gap-1">
                                  {(t.goesToSegments || []).map((sid: string) => {
                                    const seg = trip.segments.find((s: any) => s.id === sid);
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
                </div>
              </div>
            );
          })}
          
          {Object.keys(groupedTravelers).length === 0 && (
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
           onSave={async (t: any) => {
              const savedTraveler = await dataProvider.saveTraveler(t);
              
              // Salvar documentos
              if (t.documents && Array.isArray(t.documents) && t.documents.length > 0) {
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
