
import React, { useState, useMemo, useEffect } from 'react';
import { Trip, Vendor, Quote, QuoteStatus } from '../types';
import { Card, Button, Badge, Input, Modal } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import LinkVendorsModal from './LinkVendorsModal';
import EditTripVendorModal from './EditTripVendorModal';
import QuickCreateVendorModal from './QuickCreateVendorModal';

interface VendorListProps {
  trip: Trip;
  onRefresh: () => void;
  onNavigateToVendor: (id: string) => void;
  onNavigateToWizard: () => void;
}

const VendorList: React.FC<VendorListProps> = ({ trip, onRefresh, onNavigateToVendor, onNavigateToWizard }) => {
  const [tripVendors, setTripVendors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [editingTripVendor, setEditingTripVendor] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [trip.id]);

  const loadData = async () => {
    try {
      const data = await supabaseDataProvider.getTripVendors(trip.id);
      setTripVendors(data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const handleQuickCreate = async (profileId: string) => {
    try {
      // Vincular automaticamente à viagem atual
      await supabaseDataProvider.linkVendorToTrip(trip.id, profileId);
      setIsQuickCreateOpen(false);
      await loadData();
      onRefresh();
      setSuccessMessage('Fornecedor criado e vinculado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao vincular fornecedor:', error);
    }
  };

  const handleUnlink = async (tripVendorId: string) => {
    try {
      await supabaseDataProvider.unlinkVendorFromTrip(tripVendorId);
      setEditingTripVendor(null);
      await loadData();
      onRefresh();
      setSuccessMessage('Fornecedor desvinculado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao desvincular fornecedor:', error);
    }
  };

  const filteredVendors = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return tripVendors.filter(tv => {
      const profile = tv.profile;
      if (!profile) return false;
      
      const name = profile.name || '';
      const tags = profile.tags || [];
      const matchesSearch = name.toLowerCase().includes(s) || tags.some((t: string) => t.toLowerCase().includes(s));
      const matchesCategory = filterCategory === 'all' || profile.categories?.includes(filterCategory);
      return matchesSearch && matchesCategory;
    });
  }, [tripVendors, searchTerm, filterCategory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Mensagem de sucesso */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg animate-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-bold">✓ {successMessage}</p>
        </div>
      )}
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Fornecedores</h2>
          <p className="text-sm text-gray-500 mt-1">Parceiros vinculados a esta viagem</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => setIsLinkModalOpen(true)}>
             <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
             </svg>
             Vincular Existente
           </Button>
           <Button variant="primary" onClick={() => setIsQuickCreateOpen(true)}>
             <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
             </svg>
             Criar Novo
           </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="!bg-indigo-600/20 !border-indigo-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{tripVendors.length}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase font-bold">Total</div>
          </div>
        </Card>
        <Card className="!bg-amber-600/20 !border-amber-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{tripVendors.filter(tv => tv.preferred).length}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase font-bold">Favoritos</div>
          </div>
        </Card>
        <Card className="!bg-green-600/20 !border-green-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">
              {tripVendors.filter(tv => tv.profile?.rating >= 4 && (tv.profile?.risk_flags?.length || 0) === 0).length}
            </div>
            <div className="text-xs text-gray-400 mt-1 uppercase font-bold">Confiáveis</div>
          </div>
        </Card>
        <Card className="!bg-red-600/20 !border-red-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">
              {tripVendors.filter(tv => (tv.profile?.risk_flags?.length || 0) > 0).length}
            </div>
            <div className="text-xs text-gray-400 mt-1 uppercase font-bold">Com Alertas</div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="!p-4 bg-gray-900/40 border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="md:col-span-2">
              <Input placeholder="🔍 Buscar por nome, categoria ou tag..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
           <Input as="select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">📂 Todas as categorias</option>
              {trip.categories.map(c => <option key={c} value={c}>{c}</option>)}
           </Input>
        </div>
      </Card>

      {filteredVendors.length === 0 ? (
        <Card className="py-16 text-center bg-gray-900/40 border-gray-800">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-bold text-white">
              {tripVendors.length === 0 ? 'Nenhum fornecedor vinculado' : 'Nenhum resultado encontrado'}
            </h3>
            <p className="text-gray-500 text-sm">
              {tripVendors.length === 0 
                ? 'Fornecedores são perfis globais reutilizáveis. Vincule fornecedores existentes ou crie novos para esta viagem.'
                : 'Tente ajustar os filtros de busca para encontrar o que procura.'
              }
            </p>
            {tripVendors.length === 0 && (
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" onClick={() => setIsLinkModalOpen(true)}>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Vincular da minha lista
                </Button>
                <Button variant="primary" onClick={() => setIsQuickCreateOpen(true)}>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Criar novo agora
                </Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map(tv => {
            const profile = tv.profile;
            if (!profile) return null;
            
            const isReliable = profile.rating >= 4 && (profile.risk_flags?.length || 0) === 0;
            const hasRisks = (profile.risk_flags?.length || 0) > 0;
            
            return (
              <Card 
                key={tv.id} 
                onClick={() => setEditingTripVendor(tv)} 
                className="group relative hover:!border-indigo-500 transition-all cursor-pointer !p-0 overflow-hidden"
              >
                {/* Badge de Favorito */}
                {tv.preferred && (
                  <div className="absolute top-0 right-0 z-10">
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white px-3 py-1 rounded-bl-xl shadow-lg">
                      <span className="text-xs font-black uppercase flex items-center gap-1">
                        ⭐ Favorito
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <h4 className="text-lg font-black text-white uppercase leading-tight group-hover:text-indigo-400 transition-colors">
                        {profile.name}
                      </h4>
                      {profile.legal_name && (
                        <p className="text-[10px] text-gray-600 mt-0.5">{profile.legal_name}</p>
                      )}
                    </div>
                    {hasRisks ? (
                      <Badge color="red" className="text-[9px]">⚠️ {profile.risk_flags.length}</Badge>
                    ) : isReliable ? (
                      <Badge color="green" className="text-[9px]">✓ OK</Badge>
                    ) : (
                      <Badge color="gray" className="text-[9px]">—</Badge>
                    )}
                  </div>

                  {/* Categories */}
                  {profile.categories && profile.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {profile.categories.slice(0, 3).map((cat: string) => (
                        <span key={cat} className="text-[9px] px-2 py-0.5 bg-indigo-600/20 text-indigo-400 rounded font-bold uppercase">
                          {cat}
                        </span>
                      ))}
                      {profile.categories.length > 3 && (
                        <span className="text-[9px] px-2 py-0.5 bg-gray-800 text-gray-500 rounded font-bold">
                          +{profile.categories.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-sm ${profile.rating >= s ? 'text-amber-400' : 'text-gray-800'}`}>★</span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">({profile.rating}/5)</span>
                  </div>

                  {/* Links rápidos */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
                    {profile.website_url && (
                      <a 
                        href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 flex items-center justify-center text-indigo-400 transition-colors"
                        title="Website"
                      >
                        🌐
                      </a>
                    )}
                    {profile.instagram_url && (
                      <a 
                        href={profile.instagram_url.startsWith('@') ? `https://instagram.com/${profile.instagram_url.slice(1)}` : `https://instagram.com/${profile.instagram_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 flex items-center justify-center text-pink-400 transition-colors"
                        title="Instagram"
                      >
                        📸
                      </a>
                    )}
                    {profile.youtube_url && (
                      <a 
                        href={profile.youtube_url.startsWith('http') ? profile.youtube_url : `https://youtube.com/${profile.youtube_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-lg bg-red-600/20 hover:bg-red-600/30 flex items-center justify-center text-red-400 transition-colors"
                        title="YouTube"
                      >
                        📺
                      </a>
                    )}
                    <div className="flex-1"></div>
                    <span className="text-[9px] text-gray-600 font-bold uppercase">Clique para editar</span>
                  </div>

                  {/* Custom notes preview */}
                  {tv.custom_notes && (
                    <div className="pt-3 border-t border-gray-800">
                      <p className="text-xs text-gray-500 italic line-clamp-2">{tv.custom_notes}</p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de vinculação */}
      {isLinkModalOpen && (
        <LinkVendorsModal
          trip={trip}
          onClose={() => setIsLinkModalOpen(false)}
          onLinked={async () => {
            await loadData();
            onRefresh();
            setSuccessMessage('Fornecedores vinculados com sucesso!');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}

      {/* Modal de edição do vínculo */}
      {editingTripVendor && (
        <EditTripVendorModal
          trip={trip}
          tripVendor={editingTripVendor}
          onClose={() => setEditingTripVendor(null)}
          onSaved={async () => {
            await loadData();
            onRefresh();
            setSuccessMessage('Configurações salvas com sucesso!');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
          onUnlink={() => handleUnlink(editingTripVendor.id)}
        />
      )}

      {/* Modal de criação rápida */}
      {isQuickCreateOpen && (
        <QuickCreateVendorModal
          onClose={() => setIsQuickCreateOpen(false)}
          onCreated={handleQuickCreate}
        />
      )}
    </div>
  );
};

export default VendorList;
