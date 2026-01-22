
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
}

const TravelerList: React.FC<TravelerListProps> = ({ trip, onRefresh }) => {
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedTraveler, setSelectedTraveler] = useState<Traveler | null>(null);
  const [editingTraveler, setEditingTraveler] = useState<Partial<Traveler> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [showDocTypeSelector, setShowDocTypeSelector] = useState(false);

  useEffect(() => {
    loadTravelers();
  }, [trip.id]);

  const loadTravelers = async () => {
    const list = await dataProvider.getTravelers(trip.id);
    
    // Carregar documentos para cada viajante
    const travelersWithDocs = await Promise.all(
      list.map(async (t) => {
        const docs = await dataProvider.getTravelerDocuments(t.id);
        return { ...t, documents: docs };
      })
    );
    
    setTravelers(travelersWithDocs);
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

  const handleDelete = async (id: string) => {
    await dataProvider.deleteTraveler(id);
    loadTravelers();
    onRefresh();
    setSelectedTraveler(null);
    setDeleteConfirm(null);
  };

  const handleSaveDocument = async (doc: any) => {
    try {
      // Mapear campos do drawer para o formato esperado pela API
      const mappedDoc = {
        id: doc.id,
        travelerId: doc.travelerId || selectedTraveler?.id,
        docType: doc.docType,
        docCategory: doc.docCategory,
        docNumber: doc.docNumber || '',
        issuerCountry: doc.issuerCountry || '',
        issuerState: doc.issuerState || '',
        issuerAgency: doc.issuerAgency || '',
        issuerPlace: doc.issuerPlace || '',
        regionOrCountry: doc.regionOrCountry || '',
        issueDate: doc.issueDate || '',
        docExpiry: doc.expiryDate || doc.docExpiry || '', // API espera docExpiry
        visaCategory: doc.visaCategory || '',
        entryType: doc.entryType || '',
        stayDurationDays: doc.stayDurationDays || null,
        licenseCategory: doc.licenseCategory || '',
        customLabel: doc.customLabel || '',
        passportDocumentId: doc.passportDocumentId || null,
        isPrimary: doc.isPrimary || false,
        notes: doc.notes || ''
      };
      
      await dataProvider.saveTravelerDocument(mappedDoc);
      await loadTravelers();
      setSuccessMessage('Documento salvo com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setSelectedDocument(null);
      setIsAddingDocument(false);
    } catch (error: any) {
      alert('Erro ao salvar documento: ' + error.message);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await dataProvider.deleteTravelerDocument(docId);
      await loadTravelers();
      setSuccessMessage('Documento excluído com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      alert('Erro ao excluir documento: ' + error.message);
    }
  };

  const handleUpdateDocumentNumber = async (docId: string, newNumber: string) => {
    try {
      // Buscar documento atual
      const currentDoc = selectedTraveler?.documents?.find((d: any) => d.id === docId);
      if (!currentDoc) return;

      // Atualizar com novo número
      await dataProvider.saveTravelerDocument({
        ...currentDoc,
        id: docId,
        docNumber: newNumber
      });

      await loadTravelers();
      setSuccessMessage('Número do documento atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      alert('Erro ao atualizar número: ' + error.message);
    }
  };

  const handleAddNewDocument = () => {
    setShowDocTypeSelector(true);
  };

  const handleSelectDocType = (docType: string) => {
    setShowDocTypeSelector(false);
    setIsAddingDocument(true);
    
    const baseDoc = {
      travelerId: selectedTraveler?.id,
      docType,
      docCategory: (docType === 'Visto' || docType === 'ESTA') ? 'entry' : 'identity',
      docNumber: '',
      notes: '',
      issuerCountry: '',
      issuerState: '',
      issuerAgency: '',
      issuerPlace: '',
      regionOrCountry: '',
      issueDate: '',
      expiryDate: '', // DocumentDrawer usa expiryDate
      visaCategory: '',
      entryType: '',
      stayDurationDays: null,
      licenseCategory: '',
      customLabel: '',
      passportDocumentId: null,
      isPrimary: false
    };

    setSelectedDocument(baseDoc);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-8 animate-in fade-in duration-500">
      {/* Mensagem de sucesso */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg animate-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-bold">✓ {successMessage}</p>
        </div>
      )}
      
      {/* PAINEL ESQUERDA: LISTA */}
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
                  <tr key={t.id} onClick={() => setSelectedTraveler(t)} className={`hover:bg-gray-900/40 transition-colors cursor-pointer ${selectedTraveler?.id === t.id ? 'bg-indigo-600/5' : ''}`}>
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

      {/* PAINEL DIREITA: DETALHES / DRAWER */}
      <div className={`w-full lg:w-96 transition-all ${selectedTraveler ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none absolute lg:relative'}`}>
         {selectedTraveler && (
           <Card className="sticky top-4 h-[calc(100vh-12rem)] flex flex-col !p-0">
              <header className="p-6 border-b border-gray-800 bg-gray-950 flex justify-between items-start">
                 <div>
                    <h3 className="text-xl font-black text-white leading-tight">{selectedTraveler.fullName}</h3>
                    <p className="text-xs text-indigo-400 font-bold uppercase">{selectedTraveler.type}</p>
                 </div>
                 <button onClick={() => setSelectedTraveler(null)} className="text-gray-500 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                 {/* Alertas / Issues */}
                 {dataProvider.computeTravelerIssues(selectedTraveler, trip).length > 0 && (
                   <section className="space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pendências & Alertas</p>
                      <div className="space-y-1">
                         {dataProvider.computeTravelerIssues(selectedTraveler, trip).map((issue, idx) => (
                           <div key={idx} className={`p-2 rounded-lg text-[10px] font-bold border ${issue.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                              ⚠️ {issue.message}
                           </div>
                         ))}
                      </div>
                   </section>
                 )}

                 <section className="space-y-4">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Informações de Contato</p>
                    <div className="space-y-3">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-950 flex items-center justify-center border border-gray-800 text-indigo-400">📞</div>
                          <div>
                             <p className="text-xs text-gray-500 font-bold uppercase">Telefone</p>
                             <p className="text-sm font-medium">{formatPhone(selectedTraveler.phone || '') || 'Não informado'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-950 flex items-center justify-center border border-gray-800 text-indigo-400">✉️</div>
                          <div>
                             <p className="text-xs text-gray-500 font-bold uppercase">Email</p>
                             <p className="text-sm font-medium truncate w-48">{selectedTraveler.email || 'Não informado'}</p>
                          </div>
                       </div>
                    </div>
                 </section>

                 <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Documentação</p>
                      <button
                        onClick={handleAddNewDocument}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        + Adicionar
                      </button>
                    </div>
                    {selectedTraveler.documents && selectedTraveler.documents.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTraveler.documents.map((doc: any) => (
                          <button
                            key={doc.id}
                            onClick={() => {
                              setSelectedDocument(doc);
                              setIsAddingDocument(false); // Não é novo, está editando
                            }}
                            className="w-full p-4 bg-gray-950 rounded-2xl border border-gray-800 hover:border-indigo-500/50 transition-all text-left"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <Badge color="indigo">{doc.docType}</Badge>
                              {doc.expiryDate && (
                                <span className="text-[10px] text-gray-500 font-bold">
                                  Vence: {formatSupabaseDate(doc.expiryDate)}
                                </span>
                              )}
                            </div>
                            <p className="text-lg font-black tracking-widest text-white mb-1">{formatDocNumber(doc.docNumber, doc.docType)}</p>
                            {doc.issuerCountry && (
                              <p className="text-xs text-gray-500">🌍 {doc.issuerCountry}</p>
                            )}
                            {doc.notes && (
                              <p className="text-xs text-gray-400 mt-2 italic line-clamp-2">{doc.notes}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800 text-center">
                        <p className="text-sm text-gray-600 italic mb-3">Nenhum documento cadastrado</p>
                        <Button variant="outline" size="sm" onClick={handleAddNewDocument}>
                          + Adicionar primeiro documento
                        </Button>
                      </div>
                    )}
                 </section>

                 <section className="space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Participação</p>
                    <div className="grid grid-cols-2 gap-2">
                       <div className={`p-3 rounded-xl border flex flex-col items-center gap-1 ${selectedTraveler.isPayer ? 'bg-emerald-600/5 border-emerald-500/20 text-emerald-500' : 'bg-gray-950 border-gray-800 text-gray-500 opacity-50'}`}>
                          <span className="text-xs font-bold">PAGANTE</span>
                          <span className="text-[8px] font-black uppercase">{selectedTraveler.isPayer ? 'SIM' : 'NÃO'}</span>
                       </div>
                       <div className={`p-3 rounded-xl border flex flex-col items-center gap-1 ${selectedTraveler.canDrive ? 'bg-indigo-600/5 border-indigo-500/20 text-indigo-500' : 'bg-gray-950 border-gray-800 text-gray-500 opacity-50'}`}>
                          <span className="text-xs font-bold">DIRIGE</span>
                          <span className="text-[8px] font-black uppercase">{selectedTraveler.canDrive ? 'SIM' : 'NÃO'}</span>
                       </div>
                    </div>
                 </section>
              </div>

              <footer className="p-6 border-t border-gray-800 bg-gray-950 flex gap-2">
                 <Button variant="outline" className="flex-1" onClick={() => handleOpenWizard(selectedTraveler)}>Editar</Button>
                 {deleteConfirm === selectedTraveler.id ? (
                   <>
                     <Button variant="ghost" className="px-3 bg-red-600/20 text-red-400 hover:bg-red-600/30" onClick={() => handleDelete(selectedTraveler.id)}>
                       Confirmar
                     </Button>
                     <Button variant="ghost" className="px-3" onClick={() => setDeleteConfirm(null)}>
                       Cancelar
                     </Button>
                   </>
                 ) : (
                   <Button variant="ghost" className="px-3" onClick={() => setDeleteConfirm(selectedTraveler.id)}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </Button>
                 )}
              </footer>
           </Card>
         )}
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

      {/* Modal de seleção de tipo de documento */}
      <Modal isOpen={showDocTypeSelector} onClose={() => setShowDocTypeSelector(false)} title="Selecione o tipo de documento">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleSelectDocType('Passaporte')}
            className="p-4 bg-gray-950 hover:bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-xl transition-all text-left"
          >
            <div className="text-2xl mb-2">🛂</div>
            <p className="font-bold text-white">Passaporte</p>
            <p className="text-xs text-gray-500">Documento internacional</p>
          </button>
          
          <button
            onClick={() => handleSelectDocType('RG')}
            className="p-4 bg-gray-950 hover:bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-xl transition-all text-left"
          >
            <div className="text-2xl mb-2">🪪</div>
            <p className="font-bold text-white">RG</p>
            <p className="text-xs text-gray-500">Registro Geral</p>
          </button>
          
          <button
            onClick={() => handleSelectDocType('CPF')}
            className="p-4 bg-gray-950 hover:bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-xl transition-all text-left"
          >
            <div className="text-2xl mb-2">📄</div>
            <p className="font-bold text-white">CPF</p>
            <p className="text-xs text-gray-500">Cadastro de Pessoa Física</p>
          </button>
          
          <button
            onClick={() => handleSelectDocType('CNH')}
            className="p-4 bg-gray-950 hover:bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-xl transition-all text-left"
          >
            <div className="text-2xl mb-2">🚗</div>
            <p className="font-bold text-white">CNH</p>
            <p className="text-xs text-gray-500">Carteira de Habilitação</p>
          </button>
          
          <button
            onClick={() => handleSelectDocType('Visto')}
            className="p-4 bg-gray-950 hover:bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-xl transition-all text-left"
          >
            <div className="text-2xl mb-2">🌍</div>
            <p className="font-bold text-white">Visto</p>
            <p className="text-xs text-gray-500">Autorização de entrada</p>
          </button>
          
          <button
            onClick={() => handleSelectDocType('ESTA')}
            className="p-4 bg-gray-950 hover:bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-xl transition-all text-left"
          >
            <div className="text-2xl mb-2">✈️</div>
            <p className="font-bold text-white">ESTA/ETA</p>
            <p className="text-xs text-gray-500">Autorização eletrônica</p>
          </button>
          
          <button
            onClick={() => handleSelectDocType('Outro')}
            className="p-4 bg-gray-950 hover:bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-xl transition-all text-left col-span-2"
          >
            <div className="text-2xl mb-2">📋</div>
            <p className="font-bold text-white">Outro</p>
            <p className="text-xs text-gray-500">Documento customizado</p>
          </button>
        </div>
      </Modal>

      {/* Document Drawer */}
      {selectedDocument && selectedTraveler && (
        <DocumentDrawer
          document={selectedDocument}
          passports={selectedTraveler.documents?.filter((d: any) => d.docType === 'Passaporte') || []}
          onClose={() => {
            setSelectedDocument(null);
            setIsAddingDocument(false);
          }}
          onSave={handleSaveDocument}
          onDelete={handleDeleteDocument}
          onUpdateNumber={handleUpdateDocumentNumber}
          isNewDocument={isAddingDocument}
        />
      )}
    </div>
  );
};

export default TravelerList;
