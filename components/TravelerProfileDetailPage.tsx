import React, { useState, useEffect } from 'react';
import { TravelerProfile, TravelerProfileDocument } from '../types';
import { Card, Badge, Button, Input } from './CommonUI';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
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

interface TravelerProfileDetailPageProps {
  profileId: string;
  onBack: () => void;
  onRefresh: () => void;
}

const TravelerProfileDetailPage: React.FC<TravelerProfileDetailPageProps> = ({ 
  profileId, 
  onBack, 
  onRefresh 
}) => {
  const [profile, setProfile] = useState<TravelerProfile | null>(null);
  const [documents, setDocuments] = useState<TravelerProfileDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [showDocTypeSelector, setShowDocTypeSelector] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estado de edição
  const [editedProfile, setEditedProfile] = useState<Partial<TravelerProfile>>({});

  useEffect(() => {
    loadProfileData();
  }, [profileId]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const profiles = await supabaseDataProvider.getTravelerProfiles();
      const p = profiles.find(pr => pr.id === profileId);
      
      if (p) {
        setProfile(p);
        setEditedProfile(p);
        const docs = await supabaseDataProvider.getTravelerProfileDocuments(p.id);
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    try {
      await supabaseDataProvider.saveTravelerProfile({
        ...profile,
        ...editedProfile
      });
      
      showSuccess('Perfil atualizado com sucesso!');
      setIsEditing(false);
      await loadProfileData();
      onRefresh();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    }
  };

  const handleSaveDocument = async (doc: any) => {
    try {
      await supabaseDataProvider.saveTravelerProfileDocument({
        ...doc,
        travelerProfileId: profile?.id
      });
      
      showSuccess('Documento salvo com sucesso!');
      setSelectedDocument(null);
      setIsAddingDocument(false);
      await loadProfileData();
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await supabaseDataProvider.deleteTravelerProfileDocument(docId);
      showSuccess('Documento excluído com sucesso!');
      setSelectedDocument(null);
      await loadProfileData();
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
    }
  };

  const handleUpdateDocNumber = async (docId: string, newNumber: string) => {
    // TODO: Implementar criptografia do número
    console.log('Atualizar número do documento:', docId, newNumber);
    showSuccess('Número do documento atualizado!');
  };

  const handleAddDocument = (docType: string) => {
    setSelectedDocument({
      id: null,
      travelerProfileId: profile?.id,
      docType,
      isPrimary: false
    });
    setIsAddingDocument(true);
    setShowDocTypeSelector(false);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Perfil não encontrado</div>
      </div>
    );
  }

  const passports = documents.filter(d => d.docType === 'Passaporte');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-black text-white">{profile.fullName}</h1>
            <p className="text-sm text-gray-500">Perfil Global de Viajante</p>
          </div>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            ✏️ Editar Perfil
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleSaveProfile}>
              💾 Salvar
            </Button>
            <Button variant="ghost" onClick={() => {
              setIsEditing(false);
              setEditedProfile(profile);
            }}>
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-600/10 rounded-xl border border-green-600/20 text-green-400 text-sm animate-in slide-in-from-top-2">
          ✓ {successMessage}
        </div>
      )}

      {/* Informações do Perfil */}
      <Card>
        <h2 className="text-xl font-black mb-4">Informações Pessoais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nome Completo"
            value={isEditing ? editedProfile.fullName : profile.fullName}
            onChange={e => setEditedProfile({ ...editedProfile, fullName: e.target.value })}
            disabled={!isEditing}
          />
          <Input
            label="Apelido"
            value={isEditing ? (editedProfile.nickname || '') : (profile.nickname || '')}
            onChange={e => setEditedProfile({ ...editedProfile, nickname: e.target.value })}
            disabled={!isEditing}
          />
          <Input
            label="Email"
            type="email"
            value={isEditing ? (editedProfile.email || '') : (profile.email || '')}
            onChange={e => setEditedProfile({ ...editedProfile, email: e.target.value })}
            disabled={!isEditing}
          />
          <Input
            label="Telefone"
            value={isEditing ? (editedProfile.phone || '') : (profile.phone || '')}
            onChange={e => setEditedProfile({ ...editedProfile, phone: e.target.value })}
            disabled={!isEditing}
          />
          <Input
            label="Data de Nascimento"
            type="date"
            value={isEditing ? (editedProfile.birthDate || '') : (profile.birthDate || '')}
            onChange={e => setEditedProfile({ ...editedProfile, birthDate: e.target.value })}
            disabled={!isEditing}
          />
          <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-xl border border-gray-800">
            <input
              type="checkbox"
              checked={isEditing ? (editedProfile.canDrive || false) : (profile.canDrive || false)}
              onChange={e => setEditedProfile({ ...editedProfile, canDrive: e.target.checked })}
              disabled={!isEditing}
              className="w-5 h-5 accent-indigo-500"
            />
            <label className="text-sm text-gray-300">Pode dirigir</label>
          </div>
        </div>
        <div className="mt-4">
          <Input
            as="textarea"
            label="Observações"
            rows={3}
            value={isEditing ? (editedProfile.notes || '') : (profile.notes || '')}
            onChange={e => setEditedProfile({ ...editedProfile, notes: e.target.value })}
            disabled={!isEditing}
            placeholder="Informações adicionais sobre o viajante"
          />
        </div>
      </Card>

      {/* Documentos */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black">Documentos</h2>
          <Button onClick={() => setShowDocTypeSelector(true)}>
            + Adicionar Documento
          </Button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-2">📄</p>
            <p>Nenhum documento cadastrado</p>
            <p className="text-sm mt-1">Adicione documentos para reutilizar em todas as viagens</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocument(doc)}
                className="p-4 bg-gray-900 hover:bg-gray-800 rounded-xl border border-gray-800 hover:border-gray-700 transition-all text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-3xl">{DOC_ICONS[doc.docType]}</span>
                  {doc.isPrimary && (
                    <Badge color="yellow" size="sm">Principal</Badge>
                  )}
                </div>
                <p className="font-bold text-white mb-1">{doc.docType}</p>
                {doc.docNumberLast4 && (
                  <p className="text-sm text-gray-400 font-mono">
                    •••• {doc.docNumberLast4}
                  </p>
                )}
                {doc.docExpiry && (
                  <p className="text-xs text-gray-500 mt-2">
                    Validade: {formatSupabaseDate(doc.docExpiry)}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Modal de seleção de tipo de documento */}
      {showDocTypeSelector && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowDocTypeSelector(false)}
        >
          <div 
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-black mb-4">Selecione o tipo de documento</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Passaporte', 'RG', 'CPF', 'CNH', 'Visto', 'ESTA', 'Outro'].map(type => (
                <button
                  key={type}
                  onClick={() => handleAddDocument(type)}
                  className="p-4 bg-gray-950 hover:bg-gray-800 rounded-xl border border-gray-800 hover:border-indigo-500 transition-all"
                >
                  <div className="text-3xl mb-2">{DOC_ICONS[type]}</div>
                  <div className="text-sm font-bold text-white">{type}</div>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="ghost" onClick={() => setShowDocTypeSelector(false)} className="w-full">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Document Drawer */}
      {selectedDocument && (
        <DocumentDrawer
          document={selectedDocument}
          passports={passports}
          onClose={() => {
            setSelectedDocument(null);
            setIsAddingDocument(false);
          }}
          onSave={handleSaveDocument}
          onDelete={handleDeleteDocument}
          onUpdateNumber={handleUpdateDocNumber}
          isNewDocument={isAddingDocument}
        />
      )}
    </div>
  );
};

export default TravelerProfileDetailPage;
