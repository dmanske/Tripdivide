
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
      
      {/* Header com gradiente premium */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-600/30 p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                🏢
              </div>
              <div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Fornecedores</h2>
                <p className="text-sm text-indigo-300 mt-1">Parceiros vinculados a esta viagem</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsLinkModalOpen(true)} 
              className="bg-gray-900/50 hover:bg-gray-900/70 text-white font-bold border-2 border-gray-700 backdrop-blur-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Vincular Existente
            </Button>
            <Button 
              onClick={() => setIsQuickCreateOpen(true)} 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-xl border-2 border-indigo-400/50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Criar Novo
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards com gradientes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="!p-6 !bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 !border-indigo-600/30 hover:!border-indigo-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">{tripVendors.length}</div>
              <div className="text-xs text-indigo-400 mt-2 uppercase font-bold tracking-wider">Total</div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-indigo-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              🏢
            </div>
          </div>
        </Card>

        <Card className="!p-6 !bg-gradient-to-br from-amber-600/20 to-amber-600/5 !border-amber-600/30 hover:!border-amber-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">{tripVendors.filter(tv => tv.preferred).length}</div>
              <div className="text-xs text-amber-400 mt-2 uppercase font-bold tracking-wider">Favoritos</div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-amber-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              ⭐
            </div>
          </div>
        </Card>

        <Card className="!p-6 !bg-gradient-to-br from-green-600/20 to-green-600/5 !border-green-600/30 hover:!border-green-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">
                {tripVendors.filter(tv => tv.profile?.rating >= 4 && (tv.profile?.risk_flags?.length || 0) === 0).length}
              </div>
              <div className="text-xs text-green-400 mt-2 uppercase font-bold tracking-wider">Confiáveis</div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-green-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              ✓
            </div>
          </div>
        </Card>

        <Card className="!p-6 !bg-gradient-to-br from-red-600/20 to-red-600/5 !border-red-600/30 hover:!border-red-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">
                {tripVendors.filter(tv => (tv.profile?.risk_flags?.length || 0) > 0).length}
              </div>
              <div className="text-xs text-red-400 mt-2 uppercase font-bold tracking-wider">Com Alertas</div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-red-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              ⚠️
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter premium */}
      <Card className="!p-6 bg-gradient-to-r from-gray-900/60 to-gray-900/40 border-gray-800 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, categoria ou tag..."
              className="w-full pl-12 pr-4 py-4 bg-gray-950/50 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
            className="px-4 py-4 bg-gray-950/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
            <option value="all">📂 Todas as categorias</option>
            {trip.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(tv => {
            const profile = tv.profile;
            if (!profile) return null;
            
            const isReliable = profile.rating >= 4 && (profile.risk_flags?.length || 0) === 0;
            const hasRisks = (profile.risk_flags?.length || 0) > 0;
            
            return (
              <Card 
                key={tv.id} 
                onClick={() => setEditingTripVendor(tv)} 
                className="!p-0 hover:!border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 cursor-pointer overflow-hidden group relative"
              >
                {/* Badge de Favorito */}
                {tv.preferred && (
                  <div className="absolute top-0 right-0 z-10">
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white px-3 py-1.5 rounded-bl-xl shadow-lg">
                      <span className="text-xs font-black uppercase flex items-center gap-1">
                        ⭐ Favorito
                      </span>
                    </div>
                  </div>
                )}

                {/* Gradiente de fundo sutil */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative p-6 space-y-4">
                  {/* Header com avatar */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300 border border-indigo-600/30">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-white text-xl group-hover:text-indigo-400 transition-colors leading-tight">
                        {profile.name}
                      </h4>
                      {profile.legal_name && (
                        <p className="text-xs text-gray-600 mt-1 truncate">{profile.legal_name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {hasRisks ? (
                          <Badge color="red" className="text-[9px]">⚠️ {profile.risk_flags.length} alertas</Badge>
                        ) : isReliable ? (
                          <Badge color="green" className="text-[9px]">✓ Confiável</Badge>
                        ) : (
                          <Badge color="gray" className="text-[9px]">—</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Categories com estilo premium */}
                  {profile.categories && profile.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.categories.slice(0, 4).map((cat: string) => (
                        <span key={cat} className="text-[10px] px-3 py-1.5 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-indigo-300 rounded-lg font-bold uppercase border border-indigo-600/30">
                          {cat}
                        </span>
                      ))}
                      {profile.categories.length > 4 && (
                        <span className="text-[10px] px-3 py-1.5 bg-gray-800 text-gray-500 rounded-lg font-bold border border-gray-700">
                          +{profile.categories.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rating com estrelas grandes */}
                  <div className="flex items-center gap-3 py-3 px-4 bg-gray-900/50 rounded-xl border border-gray-800">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-xl ${profile.rating >= s ? 'text-amber-400' : 'text-gray-800'}`}>★</span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 font-bold">({profile.rating}/5)</span>
                  </div>

                  {/* Links sociais com ícones grandes */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-800">
                    {profile.website_url && (
                      <a 
                        href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 hover:bg-indigo-600/30 transition-colors"
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
                        className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center text-pink-400 hover:from-purple-600/30 hover:to-pink-600/30 transition-colors"
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
                        className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center text-red-400 hover:bg-red-600/30 transition-colors"
                        title="YouTube"
                      >
                        📺
                      </a>
                    )}
                    <div className="flex-1"></div>
                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                      Clique para editar →
                    </span>
                  </div>

                  {/* Custom notes preview */}
                  {tv.custom_notes && (
                    <div className="pt-4 border-t border-gray-800">
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-indigo-400 font-bold">📝</span>
                        <p className="text-xs text-gray-500 italic line-clamp-2 flex-1">{tv.custom_notes}</p>
                      </div>
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
