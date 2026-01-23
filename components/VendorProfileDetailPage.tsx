import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Modal, Input } from './CommonUI';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';

interface VendorProfileDetailPageProps {
  profileId: string;
  onBack: () => void;
  onRefresh: () => void;
}

const VendorProfileDetailPage: React.FC<VendorProfileDetailPageProps> = ({ profileId, onBack, onRefresh }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [history, setHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
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
    loadProfile();
    loadHistory();
  }, [profileId]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await supabaseDataProvider.getVendorProfileHistory(profileId);
      setHistory(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await supabaseDataProvider.getVendorProfileById(profileId);
      setProfile(data);
      // Populate form data for editing
      setFormData({
        name: data.name || '',
        legalName: data.legal_name || '',
        categories: data.categories || [],
        rating: data.rating || 3,
        tags: data.tags || [],
        riskFlags: data.risk_flags || [],
        contacts: data.contacts || [],
        websiteUrl: data.website_url || '',
        instagramUrl: data.instagram_url || '',
        youtubeUrl: data.youtube_url || '',
        paymentTermsDefault: data.payment_terms_default || '',
        cancellationPolicyNotes: data.cancellation_policy_notes || ''
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await supabaseDataProvider.deleteVendorProfile(profileId);
      onBack();
    } catch (error) {
      console.error('Erro ao arquivar perfil:', error);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await supabaseDataProvider.saveVendorProfile({
        id: profileId,
        ...formData
      });
      setShowEditModal(false);
      await loadProfile();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Carregando perfil...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-6xl">❌</div>
        <div className="text-gray-500">Perfil não encontrado</div>
        <Button onClick={onBack}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white group">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">Perfis de Fornecedores</span>
        </button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEditModal(true)}>Editar Perfil</Button>
          <Button variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setConfirmDelete(true)}>
            Arquivar
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-800">
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{profile.name}</h1>
          {profile.legal_name && (
            <p className="text-sm text-gray-500">{profile.legal_name}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {(profile.categories || []).map((c: string) => (
              <Badge key={c} color="indigo">{c}</Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={`text-2xl ${profile.rating >= s ? 'text-amber-400' : 'text-gray-800'}`}>★</span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Avaliação Global</p>
          </div>
        </div>
      </header>

      {/* Content - Tudo junto */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Coluna Esquerda */}
        <div className="space-y-6">
            {/* Links e Redes Sociais */}
            <Card>
              <h3 className="text-sm font-black text-gray-400 uppercase mb-4">Links e Redes Sociais</h3>
              <div className="space-y-3">
                {profile.website_url && (
                  <div className="flex items-center gap-2">
                    <a 
                      href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-indigo-600/50 rounded-xl transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/30">
                        🌐
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-500 uppercase">Website</p>
                        <p className="text-sm text-white truncate group-hover:text-indigo-400 transition-colors">{profile.website_url}</p>
                      </div>
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(profile.website_url);
                        const btn = document.activeElement as HTMLButtonElement;
                        btn.innerHTML = '<svg class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
                        setTimeout(() => {
                          btn.innerHTML = '<svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>';
                        }, 1500);
                      }}
                      className="p-3 hover:bg-gray-800 rounded-xl transition-colors border border-gray-800"
                      title="Copiar link"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                )}

                {profile.instagram_url && (
                  <div className="flex items-center gap-2">
                    <a 
                      href={profile.instagram_url.startsWith('@') ? `https://instagram.com/${profile.instagram_url.slice(1)}` : `https://instagram.com/${profile.instagram_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-pink-600/50 rounded-xl transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center text-pink-400 group-hover:from-purple-600/30 group-hover:to-pink-600/30">
                        📸
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-500 uppercase">Instagram</p>
                        <p className="text-sm text-white truncate group-hover:text-pink-400 transition-colors">
                          {profile.instagram_url.startsWith('@') ? profile.instagram_url : `@${profile.instagram_url}`}
                        </p>
                      </div>
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(profile.instagram_url);
                        const btn = document.activeElement as HTMLButtonElement;
                        btn.innerHTML = '<svg class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
                        setTimeout(() => {
                          btn.innerHTML = '<svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>';
                        }, 1500);
                      }}
                      className="p-3 hover:bg-gray-800 rounded-xl transition-colors border border-gray-800"
                      title="Copiar link"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                )}

                {profile.youtube_url && (
                  <div className="flex items-center gap-2">
                    <a 
                      href={profile.youtube_url.startsWith('http') ? profile.youtube_url : `https://youtube.com/${profile.youtube_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-red-600/50 rounded-xl transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center text-red-400 group-hover:bg-red-600/30">
                        📺
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-500 uppercase">YouTube</p>
                        <p className="text-sm text-white truncate group-hover:text-red-400 transition-colors">{profile.youtube_url}</p>
                      </div>
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(profile.youtube_url);
                        const btn = document.activeElement as HTMLButtonElement;
                        btn.innerHTML = '<svg class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
                        setTimeout(() => {
                          btn.innerHTML = '<svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>';
                        }, 1500);
                      }}
                      className="p-3 hover:bg-gray-800 rounded-xl transition-colors border border-gray-800"
                      title="Copiar link"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                )}

                {!profile.website_url && !profile.instagram_url && !profile.youtube_url && (
                  <div className="text-center py-8 text-gray-600 italic text-sm">
                    Nenhum link cadastrado
                  </div>
                )}
              </div>
            </Card>

            {/* Tags */}
            {profile.tags && profile.tags.length > 0 && (
              <Card>
                <h3 className="text-sm font-black text-gray-400 uppercase mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map((tag: string) => (
                    <span key={tag} className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs font-bold text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Flags de Risco */}
            {profile.risk_flags && profile.risk_flags.length > 0 && (
              <Card className="!bg-red-600/10 !border-red-600/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">⚠️</span>
                  <h3 className="text-sm font-black text-red-400 uppercase">Alertas de Risco</h3>
                </div>
                <div className="space-y-2">
                  {profile.risk_flags.map((flag: string) => (
                    <div key={flag} className="flex items-center gap-2 text-sm text-red-400">
                      <span>•</span>
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

        {/* Coluna Direita */}
        <div className="space-y-6">
          {/* Contatos */}
          <Card>
            <h3 className="text-sm font-black text-gray-400 uppercase mb-4">Equipe de Atendimento</h3>
            {profile.contacts && profile.contacts.length > 0 ? (
              <div className="space-y-4">
                {profile.contacts.map((contact: any) => (
                  <div key={contact.id} className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white">{contact.name}</h4>
                        <p className="text-xs text-gray-500">{contact.role}</p>
                      </div>
                      {contact.isPrimary && (
                        <Badge color="indigo" className="text-[9px]">Principal</Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      {contact.phone && (
                        <div className="flex items-center gap-2">
                          <a 
                            href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center gap-2 p-2 bg-green-600/10 hover:bg-green-600/20 border border-green-600/30 hover:border-green-600/50 rounded-lg transition-all group text-sm"
                          >
                            <span className="text-green-400">💬</span>
                            <span className="text-white group-hover:text-green-400 transition-colors">{contact.phone}</span>
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(contact.phone);
                              const btn = document.activeElement as HTMLButtonElement;
                              btn.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
                              setTimeout(() => {
                                btn.innerHTML = '<svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>';
                              }, 1500);
                            }}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <a 
                            href={`mailto:${contact.email}`}
                            className="flex-1 flex items-center gap-2 p-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 hover:border-blue-600/50 rounded-lg transition-all group text-sm"
                          >
                            <span className="text-blue-400">✉️</span>
                            <span className="text-white truncate group-hover:text-blue-400 transition-colors">{contact.email}</span>
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(contact.email);
                              const btn = document.activeElement as HTMLButtonElement;
                              btn.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
                              setTimeout(() => {
                                btn.innerHTML = '<svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>';
                              }, 1500);
                            }}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Preferido:</span>
                        <Badge color="gray" className="text-[9px]">{contact.preferredMethod}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 italic text-sm">
                Nenhum contato cadastrado
              </div>
            )}
          </Card>

          {/* Condições de Pagamento */}
          <Card>
            <h3 className="text-sm font-black text-gray-400 uppercase mb-4">Condições de Pagamento</h3>
            {profile.payment_terms_default ? (
              <div className="space-y-3">
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                  <p className="text-white">{profile.payment_terms_default}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(profile.payment_terms_default);
                    const btn = document.activeElement as HTMLButtonElement;
                    const originalText = btn.textContent;
                    btn.textContent = '✓ Copiado!';
                    btn.classList.add('!text-green-400');
                    setTimeout(() => {
                      btn.textContent = originalText;
                      btn.classList.remove('!text-green-400');
                    }, 1500);
                  }}
                  className="text-xs text-gray-500 hover:text-indigo-400 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar condições
                </button>
              </div>
            ) : (
              <p className="text-gray-600 italic text-sm">Não informado</p>
            )}
          </Card>

          {/* Política de Cancelamento */}
          <Card>
            <h3 className="text-sm font-black text-gray-400 uppercase mb-4">Política de Cancelamento</h3>
            {profile.cancellation_policy_notes ? (
              <div className="space-y-3">
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                  <p className="text-white whitespace-pre-wrap">{profile.cancellation_policy_notes}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(profile.cancellation_policy_notes);
                    const btn = document.activeElement as HTMLButtonElement;
                    const originalText = btn.textContent;
                    btn.textContent = '✓ Copiado!';
                    btn.classList.add('!text-green-400');
                    setTimeout(() => {
                      btn.textContent = originalText;
                      btn.classList.remove('!text-green-400');
                    }, 1500);
                  }}
                  className="text-xs text-gray-500 hover:text-indigo-400 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar política
                </button>
              </div>
            ) : (
              <p className="text-gray-600 italic text-sm">Não informado</p>
            )}
          </Card>
        </div>
      </div>

      {/* Histórico de Uso */}
      <Card className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-gray-400 uppercase">Histórico de Uso</h3>
          {history && (
            <div className="flex gap-4 text-xs">
              <span className="text-gray-500">{history.totalTrips} viagens</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">{history.totalQuotes} orçamentos</span>
              <span className="text-gray-500">•</span>
              <span className="text-indigo-400 font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(history.totalValue)}
              </span>
            </div>
          )}
        </div>

        {loadingHistory ? (
          <div className="text-center py-8 text-gray-500">Carregando histórico...</div>
        ) : !history || (history.trips.length === 0 && history.quotes.length === 0) ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-gray-600 italic text-sm">
              Este fornecedor ainda não foi usado em nenhuma viagem
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Viagens */}
            {history.trips.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Viagens ({history.trips.length})</h4>
                <div className="space-y-2">
                  {history.trips.map((tv: any) => (
                    <div key={tv.id} className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-indigo-600/50 transition-colors">
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm">{tv.trip?.name || 'Viagem sem nome'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {tv.trip?.start_date && tv.trip?.end_date && (
                            <span>{new Date(tv.trip.start_date).toLocaleDateString('pt-BR')} - {new Date(tv.trip.end_date).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {tv.preferred && <Badge color="amber" className="text-[9px]">⭐ Favorito</Badge>}
                        <Badge color="gray" className="text-[9px]">{tv.trip?.status || 'ativo'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orçamentos */}
            {history.quotes.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Orçamentos ({history.quotes.length})</h4>
                <div className="space-y-2">
                  {history.quotes.slice(0, 5).map((quote: any) => (
                    <div key={quote.id} className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-lg">
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm">{cleanText(quote.title)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {quote.trip?.name} • {quote.category}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white text-sm">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.amount_brl || 0)}
                        </div>
                        <Badge color={quote.status === 'Fechada' ? 'green' : 'gray'} className="text-[9px] mt-1">
                          {quote.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {history.quotes.length > 5 && (
                    <div className="text-center py-2">
                      <span className="text-xs text-gray-600">+ {history.quotes.length - 5} orçamentos</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <Modal isOpen={true} onClose={() => setConfirmDelete(false)}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Confirmar Arquivamento</h3>
            <p className="text-gray-400 mb-6">
              Tem certeza que deseja arquivar o perfil de <span className="font-bold text-white">{profile.name}</span>? 
              Ele não será mais exibido na lista de fornecedores.
            </p>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setConfirmDelete(false)} className="bg-gray-800 hover:bg-gray-700">
                Cancelar
              </Button>
              <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Arquivar Perfil
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de edição */}
      {showEditModal && (
        <Modal isOpen={true} onClose={() => setShowEditModal(false)}>
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white">Editar Perfil</h3>
            
            <div className="space-y-6">
              {/* Identificação */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-400 uppercase border-b border-gray-800 pb-2">Identificação</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Nome Comercial *</label>
                    <input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Nome do fornecedor"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Razão Social</label>
                    <input 
                      value={formData.legalName} 
                      onChange={e => setFormData({...formData, legalName: e.target.value})}
                      placeholder="Razão social (opcional)"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Avaliação</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({...formData, rating: star})}
                        className={`text-2xl ${formData.rating >= star ? 'text-amber-400' : 'text-gray-700'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Links e Redes Sociais */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-400 uppercase border-b border-gray-800 pb-2">Links e Redes Sociais</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">🌐 Website</label>
                    <input 
                      value={formData.websiteUrl} 
                      onChange={e => setFormData({...formData, websiteUrl: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">📸 Instagram</label>
                    <input 
                      value={formData.instagramUrl} 
                      onChange={e => setFormData({...formData, instagramUrl: e.target.value})}
                      placeholder="@usuario"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-400 mb-1">📺 YouTube</label>
                    <input 
                      value={formData.youtubeUrl} 
                      onChange={e => setFormData({...formData, youtubeUrl: e.target.value})}
                      placeholder="https://youtube.com/@canal ou link do vídeo"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Contatos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <h4 className="text-sm font-black text-gray-400 uppercase">Contatos</h4>
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
                    className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    + Adicionar
                  </button>
                </div>

                {(formData.contacts || []).length === 0 ? (
                  <div className="text-center py-6 bg-gray-900/50 border border-gray-800 rounded-xl">
                    <p className="text-sm text-gray-600 italic mb-2">Nenhum contato cadastrado</p>
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
                          isPrimary: true
                        };
                        setFormData({...formData, contacts: [newContact]});
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Adicionar primeiro contato
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(formData.contacts || []).map((contact, idx) => (
                      <div key={contact.id} className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
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
                                className="px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500"
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
                                className="px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500"
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
                                placeholder="WhatsApp/Telefone"
                                className="px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500"
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
                                className="px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex items-center gap-3 text-xs">
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
                              <span className="text-gray-600">|</span>
                              <span className="text-gray-600">Preferido:</span>
                              {['WhatsApp', 'Email'].map(m => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(formData.contacts || [])];
                                    updated[idx] = {...contact, preferredMethod: m};
                                    setFormData({...formData, contacts: updated});
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${contact.preferredMethod === m ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}
                                >
                                  {m}
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
                            className="ml-2 text-red-500/50 hover:text-red-500 p-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Condições */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-400 uppercase border-b border-gray-800 pb-2">Condições</h4>
                
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Condições de Pagamento</label>
                  <input 
                    value={formData.paymentTermsDefault} 
                    onChange={e => setFormData({...formData, paymentTermsDefault: e.target.value})}
                    placeholder="Ex: 50% entrada + 50% 30 dias"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Política de Cancelamento</label>
                  <textarea 
                    value={formData.cancellationPolicyNotes} 
                    onChange={e => setFormData({...formData, cancellationPolicyNotes: e.target.value})}
                    placeholder="Descreva a política de cancelamento..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
              <Button onClick={() => setShowEditModal(false)} className="bg-gray-800 hover:bg-gray-700">
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} className="bg-indigo-600 hover:bg-indigo-700" disabled={!formData.name.trim()}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default VendorProfileDetailPage;
