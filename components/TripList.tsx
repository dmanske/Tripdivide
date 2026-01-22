import React, { useState, useEffect } from 'react';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import { Button, Modal } from './CommonUI';
import { ICONS } from '../constants';
import TripWizard from './TripWizard';

interface TripListProps {
  onNavigateToTrip: (tripId: string) => void;
  onRefresh: () => void;
}

const TripList: React.FC<TripListProps> = ({ onNavigateToTrip, onRefresh }) => {
  const [trips, setTrips] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const allTrips = await supabaseDataProvider.getTrips();
      setTrips(allTrips.filter((t: any) => t.status === 'active' || t.status === 'archived'));
      setDrafts(allTrips.filter((t: any) => t.status === 'draft'));
    } catch (error) {
      console.error('Erro ao carregar viagens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const handleDuplicate = async (tripId: string) => {
    try {
      await supabaseDataProvider.duplicateTrip(tripId);
      await loadTrips();
      onRefresh();
    } catch (error) {
      console.error('Erro ao duplicar viagem:', error);
    }
  };

  const handleArchive = async (tripId: string) => {
    try {
      await supabaseDataProvider.archiveTrip(tripId);
      await loadTrips();
      onRefresh();
    } catch (error) {
      console.error('Erro ao arquivar viagem:', error);
    }
  };

  const handleDelete = async (tripId: string) => {
    try {
      await supabaseDataProvider.deleteTrip(tripId);
      setConfirmDelete(null);
      await loadTrips();
      onRefresh();
    } catch (error) {
      console.error('Erro ao excluir viagem:', error);
    }
  };

  const handleSetActive = async (tripId: string) => {
    try {
      await supabaseDataProvider.setActiveTrip(tripId);
      onNavigateToTrip(tripId);
      onRefresh();
    } catch (error) {
      console.error('Erro ao definir viagem ativa:', error);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} dias`;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Carregando viagens...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Minhas Viagens</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie todas as suas viagens</p>
        </div>
        <Button onClick={() => setShowWizard(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <ICONS.Plus className="w-4 h-4 mr-2" />
          Nova Viagem
        </Button>
      </div>

      {/* Rascunhos */}
      {drafts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Rascunhos</h2>
          <div className="grid gap-3">
            {drafts.map((trip) => (
              <div key={trip.id} className="bg-gray-900 border border-yellow-600/30 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{trip.name || 'Viagem sem nome'}</h3>
                      <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 text-xs font-bold rounded">RASCUNHO</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Criado em {formatDate(trip.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => onNavigateToTrip(trip.id)} className="bg-yellow-600 hover:bg-yellow-700 text-xs">
                      Finalizar
                    </Button>
                    <Button onClick={() => setConfirmDelete(trip.id)} className="bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs">
                      Descartar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Viagens Ativas */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Viagens</h2>
        {trips.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
            <ICONS.Travelers className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma viagem criada ainda</p>
            <Button onClick={() => setShowWizard(true)} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
              Criar primeira viagem
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {trips.map((trip) => (
              <div key={trip.id} className={`bg-gray-900 border rounded-xl p-4 ${trip.status === 'archived' ? 'border-gray-800 opacity-60' : 'border-gray-800 hover:border-indigo-600/50'} transition-all`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{trip.name}</h3>
                      {trip.status === 'archived' && (
                        <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs font-bold rounded">ARQUIVADA</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
                      <span>•</span>
                      <span>{getDuration(trip.start_date, trip.end_date)}</span>
                      {trip.destinations && trip.destinations.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{trip.destinations.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleSetActive(trip.id)} className="bg-indigo-600 hover:bg-indigo-700 text-xs">
                      Abrir
                    </Button>
                    <Button onClick={() => handleDuplicate(trip.id)} className="bg-gray-800 hover:bg-gray-700 text-xs">
                      Duplicar
                    </Button>
                    {trip.status === 'active' ? (
                      <Button onClick={() => handleArchive(trip.id)} className="bg-gray-800 hover:bg-gray-700 text-xs">
                        Arquivar
                      </Button>
                    ) : (
                      <Button onClick={() => setConfirmDelete(trip.id)} className="bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs">
                        Excluir
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wizard de criação */}
      {showWizard && (
        <TripWizard
          onClose={() => setShowWizard(false)}
          onSave={async (tripData) => {
            const newTrip = await supabaseDataProvider.saveTrip(tripData);
            setShowWizard(false);
            
            // Definir como ativa e navegar para o painel
            await supabaseDataProvider.setActiveTrip(newTrip.id);
            onNavigateToTrip(newTrip.id);
            onRefresh();
          }}
        />
      )}

      {/* Confirmação de exclusão */}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-400 mb-6">Tem certeza que deseja excluir esta viagem? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setConfirmDelete(null)} className="bg-gray-800 hover:bg-gray-700">
                Cancelar
              </Button>
              <Button onClick={() => handleDelete(confirmDelete)} className="bg-red-600 hover:bg-red-700">
                Excluir
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TripList;
