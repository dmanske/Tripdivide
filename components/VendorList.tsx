
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
          <p className="text-gray-500">Gestão de parceiros e reputação</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => setIsLinkModalOpen(true)}>+ Adicionar da minha lista</Button>
           <Button variant="primary" onClick={() => setIsQuickCreateOpen(true)}>+ Criar Novo</Button>
        </div>
      </header>

      <Card className="!p-4 bg-gray-900/40 border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="md:col-span-2">
              <Input placeholder="Buscar fornecedor ou tag..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
           <Input as="select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">Todas as categorias</option>
              {trip.categories.map(c => <option key={c} value={c}>{c}</option>)}
           </Input>
        </div>
      </Card>

      {filteredVendors.length === 0 ? (
        <Card className="py-16 text-center bg-gray-900/40 border-gray-800">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-bold text-white">Nenhum fornecedor vinculado</h3>
            <p className="text-gray-500 text-sm">
              Fornecedores são perfis globais reutilizáveis. Vincule fornecedores existentes ou crie novos para esta viagem.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="outline" onClick={() => setIsLinkModalOpen(true)}>
                + Adicionar da minha lista
              </Button>
              <Button variant="primary" onClick={() => setIsQuickCreateOpen(true)}>
                + Criar novo agora
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(tv => {
            const profile = tv.profile;
            if (!profile) return null;
            
            const isReliable = profile.rating >= 4 && (profile.risk_flags?.length || 0) === 0;
            return (
              <Card key={tv.id} onClick={() => setEditingTripVendor(tv)} className="group relative border-2 hover:border-indigo-500 transition-all cursor-pointer">
                {tv.preferred && <div className="absolute top-0 right-0 w-10 h-10 bg-indigo-600 text-white flex items-center justify-center font-bold text-lg rounded-bl-2xl">⭐</div>}
                <div className="flex flex-col gap-4">
                   <div className="flex justify-between items-start pr-8">
                      <div>
                         <h4 className="text-xl font-black text-white uppercase leading-tight group-hover:text-indigo-400 transition-colors">{profile.name}</h4>
                         <div className="flex flex-wrap gap-1 mt-1">
                            {(profile.categories || []).map((cat: string) => <span key={cat} className="text-[9px] font-black uppercase text-indigo-400">{cat}</span>)}
                         </div>
                      </div>
                      {isReliable && <Badge color="green">OK</Badge>}
                   </div>
                   <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => <span key={s} className={`text-xs ${profile.rating >= s ? 'text-amber-400' : 'text-gray-800'}`}>★</span>)}
                   </div>
                   <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                      <span className="text-[10px] text-gray-600 font-bold uppercase">Clique para configurar</span>
                   </div>
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
