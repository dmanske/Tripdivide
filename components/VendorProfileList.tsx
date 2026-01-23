import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Badge, Modal } from './CommonUI';
import { ICONS } from '../constants';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';

interface VendorProfileListProps {
  onNavigateToDetail: (profileId: string) => void;
}

const VendorProfileList: React.FC<VendorProfileListProps> = ({ onNavigateToDetail }) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    categories: [] as string[],
    rating: 3,
    tags: [] as string[],
    riskFlags: [] as string[],
    contacts: [] as any[],
    websiteUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    paymentTermsDefault: '',
    cancellationPolicyNotes: ''
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await supabaseDataProvider.getVendorProfiles();
      setProfiles(data);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await supabaseDataProvider.saveVendorProfile({
        id: editingProfile?.id,
        ...formData
      });
      
      setShowNewProfile(false);
      setEditingProfile(null);
      setFormData({
        name: '',
        legalName: '',
        categories: [],
        rating: 3,
        tags: [],
        riskFlags: [],
        contacts: [],
        websiteUrl: '',
        instagramUrl: '',
        youtubeUrl: '',
        paymentTermsDefault: '',
        cancellationPolicyNotes: ''
      });
      
      await loadProfiles();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    }
  };

  const handleEdit = (profile: any) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      legalName: profile.legal_name || '',
      categories: profile.categories || [],
      rating: profile.rating || 3,
      tags: profile.tags || [],
      riskFlags: profile.risk_flags || [],
      contacts: profile.contacts || [],
      websiteUrl: profile.website_url || '',
      instagramUrl: profile.instagram_url || '',
      youtubeUrl: profile.youtube_url || '',
      paymentTermsDefault: profile.payment_terms_default || '',
      cancellationPolicyNotes: profile.cancellation_policy_notes || ''
    });
    setShowNewProfile(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await supabaseDataProvider.deleteVendorProfile(id);
      setConfirmDelete(null);
      await loadProfiles();
    } catch (error) {
      console.error('Erro ao deletar perfil:', error);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.legal_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-pulse">🏢</div>
          <p className="text-gray-500 animate-pulse">Carregando fornecedores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header com gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-600/30 p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                🏢
              </div>
              <div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Fornecedores</h1>
                <p className="text-sm text-indigo-300 mt-1">Sua rede de parceiros confiáveis</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowNewProfile(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-xl border-2 border-indigo-400/50">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Stats Cards com gradientes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="!p-6 !bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 !border-indigo-600/30 hover:!border-indigo-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">{profiles.length}</div>
              <div className="text-xs text-indigo-400 mt-2 uppercase font-bold tracking-wider">Total de Fornecedores</div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-indigo-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              🏢
            </div>
          </div>
        </Card>

        <Card className="!p-6 !bg-gradient-to-br from-green-600/20 to-green-600/5 !border-green-600/30 hover:!border-green-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">{profiles.filter(p => p.rating >= 4).length}</div>
              <div className="text-xs text-green-400 mt-2 uppercase font-bold tracking-wider">Bem Avaliados</div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-green-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              ⭐
            </div>
          </div>
        </Card>

        <Card className="!p-6 !bg-gradient-to-br from-amber-600/20 to-amber-600/5 !border-amber-600/30 hover:!border-amber-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">
                {profiles.filter(p => p.website_url || p.instagram_url || p.youtube_url).length}
              </div>
              <div className="text-xs text-amber-400 mt-2 uppercase font-bold tracking-wider">Com Presença Online</div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-amber-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              🌐
            </div>
          </div>
        </Card>

        <Card className="!p-6 !bg-gradient-to-br from-red-600/20 to-red-600/5 !border-red-600/30 hover:!border-red-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">{profiles.filter(p => p.risk_flags?.length > 0).length}</div>
              <div className="text-xs text-red-400 mt-2 uppercase font-bold tracking-wider">Com Alertas</div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-red-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              ⚠️
            </div>
          </div>
        </Card>
      </div>

      {/* Search com estilo premium */}
      <Card className="!p-6 bg-gradient-to-r from-gray-900/60 to-gray-900/40 border-gray-800 backdrop-blur-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar fornecedor por nome, razão social, categoria..."
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
      </Card>

      {/* List */}
      {filteredProfiles.length === 0 ? (
        <Card className="text-center py-16 bg-gray-900/40 border-gray-800">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-bold text-white">
              {profiles.length === 0 ? 'Nenhum perfil cadastrado' : 'Nenhum resultado encontrado'}
            </h3>
            <p className="text-gray-500 text-sm">
              {profiles.length === 0 
                ? 'Crie perfis globais de fornecedores para reutilizar em todas as suas viagens'
                : 'Tente ajustar sua busca para encontrar o fornecedor desejado'
              }
            </p>
            {profiles.length === 0 && (
              <Button onClick={() => setShowNewProfile(true)} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Criar primeiro perfil
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map(profile => {
            const isReliable = profile.rating >= 4 && (profile.risk_flags?.length || 0) === 0;
            const hasRisks = (profile.risk_flags?.length || 0) > 0;
            const hasOnlinePresence = profile.website_url || profile.instagram_url || profile.youtube_url;
            
            return (
              <Card 
                key={profile.id} 
                className="!p-0 hover:!border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 cursor-pointer overflow-hidden group relative" 
                onClick={() => onNavigateToDetail(profile.id)}
              >
                {/* Gradiente de fundo sutil */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative p-6 space-y-4">
                  {/* Header com avatar */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300 border border-indigo-600/30">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-white text-xl group-hover:text-indigo-400 transition-colors leading-tight">
                        {profile.name}
                      </h3>
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
                        {hasOnlinePresence && (
                          <Badge color="indigo" className="text-[9px]">🌐 Online</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating com estrelas grandes */}
                  <div className="flex items-center gap-3 py-3 px-4 bg-gray-900/50 rounded-xl border border-gray-800">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-xl ${profile.rating >= s ? 'text-amber-400' : 'text-gray-800'}`}>★</span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 font-bold">({profile.rating}/5)</span>
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

                  {/* Links sociais com ícones grandes */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-800">
                    {profile.website_url && (
                      <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 hover:bg-indigo-600/30 transition-colors" title="Website">
                        🌐
                      </div>
                    )}
                    {profile.instagram_url && (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center text-pink-400 hover:from-purple-600/30 hover:to-pink-600/30 transition-colors" title="Instagram">
                        📸
                      </div>
                    )}
                    {profile.youtube_url && (
                      <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center text-red-400 hover:bg-red-600/30 transition-colors" title="YouTube">
                        📺
                      </div>
                    )}
                    {profile.contacts && profile.contacts.length > 0 && (
                      <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center text-green-400 hover:bg-green-600/30 transition-colors" title={`${profile.contacts.length} contatos`}>
                        👥
                      </div>
                    )}
                    <div className="flex-1"></div>
                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver detalhes →
                    </span>
                  </div>

                  {/* Actions com estilo moderno */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-800">
                    <Button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(profile); }} 
                      className="flex-1 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white text-sm py-2.5 font-bold"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </Button>
                    <Button 
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(profile.id); }} 
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm px-4 py-2.5 font-bold border border-red-600/30"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <Modal isOpen={true} onClose={() => setConfirmDelete(null)}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center text-2xl">
                ⚠️
              </div>
              <h3 className="text-xl font-bold text-white">Confirmar Exclusão</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Tem certeza que deseja <span className="font-bold text-red-400">excluir permanentemente</span> este perfil? 
              Esta ação não pode ser desfeita e todos os dados serão perdidos.
            </p>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setConfirmDelete(null)} className="bg-gray-800 hover:bg-gray-700">
                Cancelar
              </Button>
              <Button onClick={() => handleDelete(confirmDelete)} className="bg-red-600 hover:bg-red-700">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Sim, Excluir Permanentemente
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de criação/edição - COMPACTO */}
      <Modal isOpen={showNewProfile} onClose={() => { setShowNewProfile(false); setEditingProfile(null); }}>
        <div className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center text-xl">
              🏢
            </div>
            <h3 className="text-lg font-bold text-white">{editingProfile ? 'Editar Perfil' : 'Novo Perfil'}</h3>
          </div>
          
          <div className="space-y-4">
            {/* Identificação - Grid compacto */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nome Comercial *</label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Nome"
                  className="!py-2 !text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Razão Social</label>
                <Input 
                  value={formData.legalName} 
                  onChange={e => setFormData({...formData, legalName: e.target.value})}
                  placeholder="Opcional"
                  className="!py-2 !text-sm"
                />
              </div>
            </div>

            {/* Avaliação inline */}
            <div className="flex items-center gap-3 py-2 px-3 bg-gray-900/50 rounded-lg border border-gray-800">
              <span className="text-xs font-bold text-gray-500">Avaliação:</span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({...formData, rating: star})}
                    className={`text-xl ${formData.rating >= star ? 'text-amber-400' : 'text-gray-700'} hover:scale-110 transition-transform`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Links - Grid 3 colunas */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">🌐 Website</label>
                <Input 
                  value={formData.websiteUrl} 
                  onChange={e => setFormData({...formData, websiteUrl: e.target.value})}
                  placeholder="https://..."
                  className="!py-2 !text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">📸 Instagram</label>
                <Input 
                  value={formData.instagramUrl} 
                  onChange={e => setFormData({...formData, instagramUrl: e.target.value})}
                  placeholder="@usuario"
                  className="!py-2 !text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">📺 YouTube</label>
                <Input 
                  value={formData.youtubeUrl} 
                  onChange={e => setFormData({...formData, youtubeUrl: e.target.value})}
                  placeholder="URL"
                  className="!py-2 !text-sm"
                />
              </div>
            </div>

            {/* Contatos - Compacto */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-xs font-bold text-gray-500 uppercase">Contatos ({(formData.contacts || []).length})</span>
                <button
                  type="button"
                  onClick={() => {
                    const newContact = {
                      id: Math.random().toString(36).substr(2, 9),
                      name: '',
                      role: 'Comercial',
                      phone: '',
                      email: '',
                      preferredMethod: 'WhatsApp',
                      isPrimary: (formData.contacts || []).length === 0
                    };
                    setFormData({...formData, contacts: [...(formData.contacts || []), newContact]});
                  }}
                  className="text-[10px] px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition-colors"
                >
                  + Adicionar
                </button>
              </div>

              {(formData.contacts || []).length === 0 ? (
                <div className="text-center py-4 bg-gray-900/30 border border-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 italic">Nenhum contato</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(formData.contacts || []).map((contact, idx) => (
                    <div key={contact.id} className="p-2 bg-gray-900/50 border border-gray-800 rounded-lg">
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={contact.name}
                              onChange={e => {
                                const updated = [...(formData.contacts || [])];
                                updated[idx] = {...contact, name: e.target.value};
                                setFormData({...formData, contacts: updated});
                              }}
                              placeholder="Nome"
                              className="px-2 py-1.5 bg-gray-950 border border-gray-800 rounded text-white text-xs placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              value={contact.role}
                              onChange={e => {
                                const updated = [...(formData.contacts || [])];
                                updated[idx] = {...contact, role: e.target.value};
                                setFormData({...formData, contacts: updated});
                              }}
                              placeholder="Cargo"
                              className="px-2 py-1.5 bg-gray-950 border border-gray-800 rounded text-white text-xs placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="tel"
                              value={contact.phone || ''}
                              onChange={e => {
                                const updated = [...(formData.contacts || [])];
                                updated[idx] = {...contact, phone: e.target.value};
                                setFormData({...formData, contacts: updated});
                              }}
                              placeholder="WhatsApp/Tel"
                              className="px-2 py-1.5 bg-gray-950 border border-gray-800 rounded text-white text-xs placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                            />
                            <input
                              type="email"
                              value={contact.email || ''}
                              onChange={e => {
                                const updated = [...(formData.contacts || [])];
                                updated[idx] = {...contact, email: e.target.value};
                                setFormData({...formData, contacts: updated});
                              }}
                              placeholder="Email"
                              className="px-2 py-1.5 bg-gray-950 border border-gray-800 rounded text-white text-xs placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.isPrimary}
                                onChange={e => {
                                  const updated = (formData.contacts || []).map((c, i) => ({
                                    ...c,
                                    isPrimary: i === idx ? e.target.checked : false
                                  }));
                                  setFormData({...formData, contacts: updated});
                                }}
                                className="accent-indigo-500"
                              />
                              <span className="text-gray-500">Principal</span>
                            </label>
                            <span className="text-gray-700">|</span>
                            {['WhatsApp', 'Email'].map(m => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => {
                                  const updated = [...(formData.contacts || [])];
                                  updated[idx] = {...contact, preferredMethod: m};
                                  setFormData({...formData, contacts: updated});
                                }}
                                className={`px-1.5 py-0.5 rounded font-bold transition-colors ${contact.preferredMethod === m ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-600 hover:bg-gray-700'}`}
                              >
                                {m === 'WhatsApp' ? 'WA' : 'EM'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (formData.contacts || []).filter((_, i) => i !== idx);
                            setFormData({...formData, contacts: updated});
                          }}
                          className="text-red-500/50 hover:text-red-500 px-1 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Condições - Grid 2 colunas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Condições de Pagamento</label>
                <Input 
                  value={formData.paymentTermsDefault} 
                  onChange={e => setFormData({...formData, paymentTermsDefault: e.target.value})}
                  placeholder="Ex: 50% + 50% 30d"
                  className="!py-2 !text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Política de Cancelamento</label>
                <Input 
                  value={formData.cancellationPolicyNotes} 
                  onChange={e => setFormData({...formData, cancellationPolicyNotes: e.target.value})}
                  placeholder="Resumo da política"
                  className="!py-2 !text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-gray-800">
            <Button onClick={() => { setShowNewProfile(false); setEditingProfile(null); }} className="bg-gray-800 hover:bg-gray-700 !py-2 !text-sm">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 !py-2 !text-sm" disabled={!formData.name.trim()}>
              {editingProfile ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VendorProfileList;
