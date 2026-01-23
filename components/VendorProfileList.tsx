import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Badge, Modal } from './CommonUI';
import { ICONS } from '../constants';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';

interface VendorProfileListProps {
  onNavigate: (tab: string) => void;
}

const VendorProfileList: React.FC<VendorProfileListProps> = ({ onNavigate }) => {
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
    return <div className="text-center py-12 text-gray-500">Carregando perfis...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Perfis de Fornecedores</h1>
          <p className="text-sm text-gray-500 mt-1">Cadastros globais reutilizáveis em qualquer viagem</p>
        </div>
        <Button onClick={() => setShowNewProfile(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <ICONS.Plus className="w-4 h-4 mr-2" />
          Novo Perfil
        </Button>
      </div>

      {/* Search */}
      <Card className="!p-4 bg-gray-900/40 border-gray-800">
        <Input 
          placeholder="Buscar por nome ou razão social..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
        />
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="!bg-indigo-600/20 !border-indigo-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{profiles.length}</div>
            <div className="text-sm text-gray-400 mt-1">Total</div>
          </div>
        </Card>
        <Card className="!bg-green-600/20 !border-green-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{profiles.filter(p => p.rating >= 4).length}</div>
            <div className="text-sm text-gray-400 mt-1">Bem Avaliados</div>
          </div>
        </Card>
        <Card className="!bg-red-600/20 !border-red-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{profiles.filter(p => p.risk_flags?.length > 0).length}</div>
            <div className="text-sm text-gray-400 mt-1">Com Alertas</div>
          </div>
        </Card>
      </div>

      {/* List */}
      {filteredProfiles.length === 0 ? (
        <Card className="text-center py-12">
          <ICONS.Vendors className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum perfil cadastrado ainda</p>
          <Button onClick={() => setShowNewProfile(true)} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
            Criar primeiro perfil
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map(profile => (
            <Card key={profile.id} className="!p-4 hover:!border-indigo-600/50 transition-all cursor-pointer" onClick={() => handleEdit(profile)}>
              <div className="space-y-3">
                <div>
                  <div className="font-bold text-white text-lg">{profile.name}</div>
                  {profile.legal_name && (
                    <div className="text-xs text-gray-500">{profile.legal_name}</div>
                  )}
                </div>

                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`text-sm ${profile.rating >= s ? 'text-amber-400' : 'text-gray-800'}`}>★</span>
                  ))}
                </div>

                {profile.categories && profile.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {profile.categories.map((cat: string) => (
                      <span key={cat} className="text-[9px] px-2 py-0.5 bg-indigo-600/20 text-indigo-400 rounded font-bold uppercase">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                  {profile.risk_flags?.length > 0 ? (
                    <Badge color="red">⚠️ {profile.risk_flags.length} alertas</Badge>
                  ) : (
                    <Badge color="green">✓ OK</Badge>
                  )}
                  <Button 
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(profile.id); }} 
                    className="bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs"
                  >
                    Arquivar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <Modal isOpen={true} onClose={() => setConfirmDelete(null)}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Confirmar Arquivamento</h3>
            <p className="text-gray-400 mb-6">Tem certeza que deseja arquivar este perfil? Ele não será mais exibido na lista.</p>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setConfirmDelete(null)} className="bg-gray-800 hover:bg-gray-700">
                Cancelar
              </Button>
              <Button onClick={() => handleDelete(confirmDelete)} className="bg-red-600 hover:bg-red-700">
                Arquivar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de criação/edição */}
      <Modal isOpen={showNewProfile} onClose={() => { setShowNewProfile(false); setEditingProfile(null); }}>
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-white">{editingProfile ? 'Editar Perfil' : 'Novo Perfil Global'}</h3>
          
          <div className="space-y-6">
            {/* Identificação */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-gray-400 uppercase border-b border-gray-800 pb-2">Identificação</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Nome Comercial *</label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Nome do fornecedor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Razão Social</label>
                  <Input 
                    value={formData.legalName} 
                    onChange={e => setFormData({...formData, legalName: e.target.value})}
                    placeholder="Razão social (opcional)"
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
                  <Input 
                    value={formData.websiteUrl} 
                    onChange={e => setFormData({...formData, websiteUrl: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">📸 Instagram</label>
                  <Input 
                    value={formData.instagramUrl} 
                    onChange={e => setFormData({...formData, instagramUrl: e.target.value})}
                    placeholder="@usuario"
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
                <Input 
                  value={formData.paymentTermsDefault} 
                  onChange={e => setFormData({...formData, paymentTermsDefault: e.target.value})}
                  placeholder="Ex: 50% entrada + 50% 30 dias"
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
            <Button onClick={() => { setShowNewProfile(false); setEditingProfile(null); }} className="bg-gray-800 hover:bg-gray-700">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700" disabled={!formData.name.trim()}>
              {editingProfile ? 'Salvar Alterações' : 'Criar Perfil'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VendorProfileList;
