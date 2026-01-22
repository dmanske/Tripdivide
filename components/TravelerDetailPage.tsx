import React, { useState, useEffect } from 'react';
import { Trip, Traveler } from '../types';
import { Card, Badge, Button, Input, Modal } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';
import TravelerWizard from './TravelerWizard';
import DocumentDrawer from './DocumentDrawer';
import { formatPhone, formatSupabaseDate } from '../lib/formatters';

// Ícones por tipo de documento
const DOC_ICONS: Record<string, string> = {
  'Passaporte': '🛂',
  'RG': '🪪',
  'CPF': '📄',
  'CNH': '🚗',
  'Visto': '🌍',
  'ESTA': '✈️',
  'Outro': '📋'
};

// Formatação de números
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

interface TravelerDetailPageProps {
  trip: Trip;
  travelerId: string;
  onBack: () => void;
  onRefresh: () => void;
}

const TravelerDetailPage: React.FC<TravelerDetailPageProps> = ({ trip, travelerId, onBack, onRefresh }) => {
  const [traveler, setTraveler] = useState<Traveler | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingTraveler, setIsEditingTraveler] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [showDocTypeSelector, setShowDocTypeSelector] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filtros
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'identity' | 'entry'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTravelerData();
  }, [travelerId]);

  const loadTravelerData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Carregando viajante:', travelerId);
      const travelers = await dataProvider.getTravelers(trip.id);
      console.log('📋 Viajantes encontrados:', travelers.length);
      const t = travelers.find(tr => tr.id === travelerId);
      
      if (t) {
        console.log('✅ Viajante encontrado:', t.fullName);
        setTraveler(t);
        const docs = await dataProvider.getTravelerDocuments(t.id);
        console.log('📄 Documentos carregados:', docs.length);
        setDocuments(docs);
      } else {
        console.error('❌ Viajante não encontrado com ID:', travelerId);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar viajante:', error);
    }
    
    setLoading(false);
  };

  const handleDeleteTraveler = async () => {
    if (!traveler) return;
    await dataProvider.deleteTraveler(traveler.id);
    onRefresh();
    onBack();
  };

  const handleSaveDocument = async (doc: any) => {
    try {
      const mappedDoc = {
        id: doc.id,
        travelerId: doc.travelerId || traveler?.id,
        docType: doc.docType,
        docCategory: doc.docCategory,
        docNumber: doc.docNumber || '',
        issuerCountry: doc.issuerCountry || '',
        issuerState: doc.issuerState || '',
        issuerAgency: doc.issuerAgency || '',
        issuerPlace: doc.issuerPlace || '',
        regionOrCountry: doc.regionOrCountry || '',
        issueDate: doc.issueDate || '',
        docExpiry: doc.expiryDate || doc.docExpiry || '',
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
      await loadTravelerData();
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
      await loadTravelerData();
      setSuccessMessage('Documento excluído com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      alert('Erro ao excluir documento: ' + error.message);
    }
  };

  const handleUpdateDocumentNumber = async (docId: string, newNumber: string) => {
    try {
      const currentDoc = documents.find(d => d.id === docId);
      if (!currentDoc) return;

      await dataProvider.saveTravelerDocument({
        ...currentDoc,
        id: docId,
        docNumber: newNumber
      });

      await loadTravelerData();
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
      travelerId: traveler?.id,
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
      expiryDate: '',
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

  if (loading || !traveler) {
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <p className="text-gray-500 animate-pulse">Carregando viajante...</p>
        </div>
      );
    }
    
    // Viajante não encontrado
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">❌ Viajante não encontrado</p>
          <Button variant="outline" onClick={onBack}>
            ← Voltar para lista
          </Button>
        </div>
      </div>
    );
  }

  // Filtrar documentos
  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = categoryFilter === 'all' || doc.docCategory === categoryFilter;
    const matchesType = typeFilter === 'all' || doc.docType === typeFilter;
    const matchesSearch = !searchTerm || 
      doc.docNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.issuerCountry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.issuerState?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.customLabel?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesType && matchesSearch;
  });

  // Agrupar documentos
  const groupedDocs = {
    passports: filteredDocuments.filter(d => d.docType === 'Passaporte'),
    identity: filteredDocuments.filter(d => ['RG', 'CPF', 'CNH'].includes(d.docType)),
    entry: filteredDocuments.filter(d => ['Visto', 'ESTA'].includes(d.docType)),
    others: filteredDocuments.filter(d => d.docType === 'Outro')
  };

  const issues = dataProvider.computeTravelerIssues(traveler, trip);
  const couple = trip.couples.find(c => c.id === traveler.coupleId);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Mensagem de sucesso */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg animate-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-bold">✓ {successMessage}</p>
        </div>
      )}

      {/* Header Full Width */}
      <div className="bg-gray-900/50 border-b border-gray-800 px-8 py-6">
        <div className="max-w-[1600px] mx-auto">
          {/* Breadcrumb */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-xs font-bold uppercase">Viajantes</span>
          </button>

          {/* Header principal */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h1 className="text-3xl font-black text-white tracking-tight">{traveler.fullName}</h1>
                <div className="flex items-center gap-2">
                  <Badge color="indigo" className="text-[10px] px-2 py-0.5">{traveler.type}</Badge>
                  {couple && <Badge color="gray" className="text-[10px] px-2 py-0.5">{couple.name}</Badge>}
                  {traveler.isPayer && <Badge color="green" className="text-[10px] px-2 py-0.5">PAGANTE</Badge>}
                  {traveler.canDrive && <Badge color="blue" className="text-[10px] px-2 py-0.5">DIRIGE</Badge>}
                </div>
              </div>
              
              {/* Contato inline */}
              <div className="flex items-center gap-6 text-sm text-gray-400">
                {traveler.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">📞</span>
                    <span>{formatPhone(traveler.phone)}</span>
                  </div>
                )}
                {traveler.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">✉️</span>
                    <span className="truncate max-w-xs">{traveler.email}</span>
                  </div>
                )}
                {!traveler.phone && !traveler.email && (
                  <span className="text-gray-600 italic text-xs">Sem informações de contato</span>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditingTraveler(true)}>
                ✏️ Editar
              </Button>
              <Button variant="primary" size="sm" onClick={handleAddNewDocument}>
                + Documento
              </Button>
              
              {/* Menu de ações */}
              <div className="relative">
                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="px-3 py-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                ) : (
                  <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-3 w-64 z-10 animate-in slide-in-from-top-2">
                    <p className="text-xs text-red-400 font-bold mb-3">⚠️ Confirmar exclusão?</p>
                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 text-xs" onClick={handleDeleteTraveler}>
                        Excluir
                      </Button>
                      <Button variant="ghost" className="text-xs" onClick={() => setDeleteConfirm(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout - Apenas área de documentos (full width) */}
      <div className="max-w-[1600px] mx-auto px-8 py-6">
        {/* Pendências (se houver) */}
        {issues.length > 0 && (
          <div className="mb-6 p-4 bg-amber-600/10 rounded-xl border border-amber-600/20">
            <p className="text-xs font-black text-amber-500 uppercase mb-3">⚠️ {issues.length} Pendência{issues.length > 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {issues.map((issue, idx) => (
                <p key={idx} className="text-xs text-amber-400 leading-tight">• {issue.message}</p>
              ))}
            </div>
          </div>
        )}

        {/* ÁREA DE DOCUMENTOS - div simples para ocupar largura total */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            {/* Header compacto - sem botão duplicado */}
            <div className="mb-4">
              <h2 className="text-lg font-black text-white uppercase mb-3">Documentos</h2>

              {/* Filtros compactos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  as="select"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as any)}
                  className="text-xs"
                >
                  <option value="all">Todas Categorias</option>
                  <option value="identity">Identidade</option>
                  <option value="entry">Entrada no País</option>
                </Input>

                <Input
                  as="select"
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="text-xs"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="Passaporte">Passaporte</option>
                  <option value="RG">RG</option>
                  <option value="CPF">CPF</option>
                  <option value="CNH">CNH</option>
                  <option value="Visto">Visto</option>
                  <option value="ESTA">ESTA/ETA</option>
                  <option value="Outro">Outros</option>
                </Input>

                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Tabela de documentos */}
            {filteredDocuments.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-gray-600 italic mb-3">Nenhum documento encontrado</p>
                <Button variant="outline" size="sm" onClick={handleAddNewDocument}>
                  + Adicionar primeiro documento
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Passaportes */}
                {groupedDocs.passports.length > 0 && (
                  <DocumentSection
                    title="🛂 Passaportes"
                    count={groupedDocs.passports.length}
                    documents={groupedDocs.passports}
                    onEdit={(doc) => {
                      setSelectedDocument(doc);
                      setIsAddingDocument(false);
                    }}
                  />
                )}

                {/* Identidade */}
                {groupedDocs.identity.length > 0 && (
                  <DocumentSection
                    title="🪪 Identidade"
                    count={groupedDocs.identity.length}
                    documents={groupedDocs.identity}
                    onEdit={(doc) => {
                      setSelectedDocument(doc);
                      setIsAddingDocument(false);
                    }}
                  />
                )}

                {/* Entrada */}
                {groupedDocs.entry.length > 0 && (
                  <DocumentSection
                    title="🌍 Entrada no País"
                    count={groupedDocs.entry.length}
                    documents={groupedDocs.entry}
                    onEdit={(doc) => {
                      setSelectedDocument(doc);
                      setIsAddingDocument(false);
                    }}
                  />
                )}

                {/* Outros */}
                {groupedDocs.others.length > 0 && (
                  <DocumentSection
                    title="📋 Outros"
                    count={groupedDocs.others.length}
                    documents={groupedDocs.others}
                    onEdit={(doc) => {
                      setSelectedDocument(doc);
                      setIsAddingDocument(false);
                    }}
                  />
                )}
              </div>
            )}
          </div>
      </div>

      {/* Modais */}
      <Modal isOpen={isEditingTraveler} onClose={() => setIsEditingTraveler(false)} title="Editar Viajante" size="xl">
        <TravelerWizard
          trip={trip}
          initialData={traveler}
          onCancel={() => setIsEditingTraveler(false)}
          onSave={async (t) => {
            await dataProvider.saveTraveler(t);
            
            if (t.documents && t.documents.length > 0) {
              for (const doc of t.documents) {
                await dataProvider.saveTravelerDocument({
                  ...doc,
                  travelerId: t.id
                });
              }
            }
            
            setIsEditingTraveler(false);
            await loadTravelerData();
            onRefresh();
          }}
        />
      </Modal>

      <Modal isOpen={showDocTypeSelector} onClose={() => setShowDocTypeSelector(false)} title="Selecione o tipo de documento" size="lg">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { type: 'Passaporte', icon: '🛂', desc: 'Documento internacional', color: 'indigo' },
            { type: 'RG', icon: '🪪', desc: 'Registro Geral', color: 'blue' },
            { type: 'CPF', icon: '📄', desc: 'Cadastro de Pessoa Física', color: 'green' },
            { type: 'CNH', icon: '🚗', desc: 'Carteira de Habilitação', color: 'purple' },
            { type: 'Visto', icon: '🌍', desc: 'Autorização de entrada', color: 'yellow' },
            { type: 'ESTA', icon: '✈️', desc: 'Autorização eletrônica', color: 'cyan' },
            { type: 'Outro', icon: '📋', desc: 'Documento customizado', color: 'gray' }
          ].map(({ type, icon, desc, color }) => (
            <button
              key={type}
              onClick={() => handleSelectDocType(type)}
              className="group relative p-6 bg-gray-950 hover:bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-xl transition-all text-left overflow-hidden"
            >
              {/* Efeito de brilho no hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 via-indigo-600/0 to-indigo-600/0 group-hover:from-indigo-600/5 group-hover:via-indigo-600/10 group-hover:to-indigo-600/5 transition-all duration-300" />
              
              <div className="relative">
                <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-200">{icon}</div>
                <p className="font-black text-white text-lg mb-1">{type}</p>
                <p className="text-xs text-gray-500 leading-tight">{desc}</p>
              </div>
              
              {/* Indicador de hover */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </button>
          ))}
        </div>
      </Modal>

      {selectedDocument && (
        <DocumentDrawer
          document={selectedDocument}
          passports={documents.filter(d => d.docType === 'Passaporte')}
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

// Componente de linha de documento
const DocumentRow: React.FC<{ doc: any; onEdit: () => void }> = ({ doc, onEdit }) => {
  const getExpiryStatus = () => {
    if (!doc.expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(doc.expiryDate);
    const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return { color: 'red', label: 'Vencido' };
    if (daysUntil <= 30) return { color: 'red', label: `${daysUntil}d` };
    if (daysUntil <= 90) return { color: 'yellow', label: `${daysUntil}d` };
    return { color: 'green', label: 'OK' };
  };

  const status = getExpiryStatus();
  const location = doc.issuerCountry || doc.issuerState || doc.regionOrCountry || '—';
  const details = doc.visaCategory || doc.licenseCategory || doc.customLabel || '—';

  return (
    <button
      onClick={onEdit}
      className="w-full p-4 bg-gray-950 hover:bg-gray-900 rounded-xl border border-gray-800 hover:border-indigo-500 transition-all text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="text-2xl">{DOC_ICONS[doc.docType] || '📄'}</div>
          
          <div className="flex-1 grid grid-cols-5 gap-4 items-center">
            <div>
              <Badge color="indigo">{doc.docType}</Badge>
              {doc.isPrimary && <Badge color="green" className="ml-1 text-[8px]">PRINCIPAL</Badge>}
            </div>
            
            <div>
              <p className="text-xs text-gray-500">Local</p>
              <p className="text-sm font-medium text-white">{location}</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500">Detalhes</p>
              <p className="text-sm font-medium text-white truncate">{details}</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500">Vencimento</p>
              <p className="text-sm font-medium text-white">{doc.expiryDate ? formatSupabaseDate(doc.expiryDate) : '—'}</p>
            </div>
            
            <div className="text-right">
              {status && (
                <Badge color={status.color as any}>{status.label}</Badge>
              )}
            </div>
          </div>
        </div>
        
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
};

// Componente de seção de documentos com tabela premium
const DocumentSection: React.FC<{ 
  title: string; 
  count: number; 
  documents: any[]; 
  onEdit: (doc: any) => void;
}> = ({ title, count, documents, onEdit }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return { color: 'bg-red-600/20 text-red-400 border-red-600/30', label: 'Vencido', icon: '⚠️' };
    if (daysUntil <= 30) return { color: 'bg-red-600/20 text-red-400 border-red-600/30', label: `${daysUntil}d`, icon: '⚠️' };
    if (daysUntil <= 90) return { color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30', label: `${daysUntil}d`, icon: '⏰' };
    return { color: '', label: '', icon: '✓' };
  };

  const getIssuer = (doc: any) => {
    return doc.issuerCountry || doc.issuerState || doc.regionOrCountry || '—';
  };

  const getDetails = (doc: any) => {
    if (doc.docType === 'Visto' && doc.visaCategory) return doc.visaCategory;
    if (doc.docType === 'CNH' && doc.licenseCategory) return `Cat. ${doc.licenseCategory}`;
    if (doc.docType === 'Outro' && doc.customLabel) return doc.customLabel;
    if (doc.docType === 'Visto' && doc.entryType) return doc.entryType === 'multiple' ? 'Múltiplas' : 'Única';
    return null;
  };

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      {/* Header colapsável */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-4 py-2 bg-gray-900/50 flex items-center justify-between hover:bg-gray-900 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-gray-400 uppercase">{title}</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded font-bold">{count}</span>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-600 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Tabela */}
      {!isCollapsed && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/30 border-b border-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-500 uppercase">Emissor</th>
                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-500 uppercase">Número</th>
                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-500 uppercase">Validade</th>
                <th className="px-4 py-2 text-center text-[10px] font-black text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-center text-[10px] font-black text-gray-500 uppercase w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {documents.map(doc => {
                const status = getExpiryStatus(doc.expiryDate);
                const issuer = getIssuer(doc);
                const details = getDetails(doc);

                return (
                  <tr 
                    key={doc.id} 
                    onClick={() => onEdit(doc)}
                    className="hover:bg-gray-900/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{DOC_ICONS[doc.docType] || '📄'}</span>
                        <div>
                          <p className="text-xs font-bold text-white">{doc.docType}</p>
                          {details && <p className="text-[10px] text-gray-500">{details}</p>}
                          {doc.isPrimary && (
                            <span className="inline-block mt-0.5 text-[8px] px-1.5 py-0.5 bg-emerald-600/20 text-emerald-400 rounded uppercase font-bold border border-emerald-600/30">
                              Principal
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-300">{issuer}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-white">{formatDocNumber(doc.docNumber, doc.docType)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-300">
                        {doc.expiryDate ? formatSupabaseDate(doc.expiryDate) : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {status && status.label ? (
                        <span className={`inline-block text-[10px] px-2 py-1 rounded uppercase font-bold border ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                      ) : (
                        <span className="text-emerald-500 text-sm">{status?.icon}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(doc);
                        }}
                        className="text-gray-600 hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TravelerDetailPage;
