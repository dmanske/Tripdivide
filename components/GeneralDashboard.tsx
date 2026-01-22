import React, { useState, useEffect } from 'react';
import { Button, Card } from './CommonUI';
import { ICONS } from '../constants';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';

interface GeneralDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenTrip: (tripId: string) => void;
}

const GeneralDashboard: React.FC<GeneralDashboardProps> = ({ onNavigate, onOpenTrip }) => {
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    totalTravelers: 0,
    totalVendors: 0
  });
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trips, travelerProfiles, vendorProfiles] = await Promise.all([
        supabaseDataProvider.getTrips(),
        supabaseDataProvider.getTravelerProfiles(),
        supabaseDataProvider.getVendorProfiles()
      ]);
      
      const activeTrips = trips.filter((t: any) => t.status === 'active');
      
      setStats({
        totalTrips: trips.length,
        activeTrips: activeTrips.length,
        totalTravelers: travelerProfiles.length,
        totalVendors: vendorProfiles.length
      });
      
      setRecentTrips(trips.slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Dashboard Geral</h1>
        <p className="text-sm opacity-90">Visão geral de todas as suas viagens e recursos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!bg-indigo-600/20 !border-indigo-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{stats.totalTrips}</div>
            <div className="text-sm text-gray-400 mt-1">Viagens</div>
            <div className="text-xs text-indigo-400 mt-1">{stats.activeTrips} ativas</div>
          </div>
        </Card>

        <Card className="!bg-cyan-600/20 !border-cyan-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{stats.totalTravelers}</div>
            <div className="text-sm text-gray-400 mt-1">Viajantes</div>
            <div className="text-xs text-cyan-400 mt-1">Cadastrados</div>
          </div>
        </Card>

        <Card className="!bg-green-600/20 !border-green-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{stats.totalVendors}</div>
            <div className="text-sm text-gray-400 mt-1">Fornecedores</div>
            <div className="text-xs text-green-400 mt-1">Cadastrados</div>
          </div>
        </Card>

        <Card className="!bg-orange-600/20 !border-orange-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">0</div>
            <div className="text-sm text-gray-400 mt-1">Orçamentos</div>
            <div className="text-xs text-orange-400 mt-1">Pendentes</div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button onClick={() => onNavigate('trips')} className="bg-indigo-600 hover:bg-indigo-700 flex flex-col items-center gap-2 py-4">
            <ICONS.Dashboard className="w-6 h-6" />
            <span className="text-xs font-bold">Ver Viagens</span>
          </Button>
          
          <Button onClick={() => onNavigate('travelers')} className="bg-cyan-600 hover:bg-cyan-700 flex flex-col items-center gap-2 py-4">
            <ICONS.Travelers className="w-6 h-6" />
            <span className="text-xs font-bold">Viajantes</span>
          </Button>
          
          <Button onClick={() => onNavigate('vendors')} className="bg-green-600 hover:bg-green-700 flex flex-col items-center gap-2 py-4">
            <ICONS.Vendors className="w-6 h-6" />
            <span className="text-xs font-bold">Fornecedores</span>
          </Button>
          
          <Button onClick={() => onNavigate('trips')} className="bg-orange-600 hover:bg-orange-700 flex flex-col items-center gap-2 py-4">
            <ICONS.Plus className="w-6 h-6" />
            <span className="text-xs font-bold">Nova Viagem</span>
          </Button>
        </div>
      </Card>

      {/* Recent Trips */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Viagens Recentes</h2>
          <Button onClick={() => onNavigate('trips')} className="bg-gray-800 hover:bg-gray-700 text-xs">
            Ver Todas
          </Button>
        </div>

        {recentTrips.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ICONS.Dashboard className="w-12 h-12 mx-auto mb-3 text-gray-700" />
            <p>Nenhuma viagem criada ainda</p>
            <Button onClick={() => onNavigate('trips')} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
              Criar Primeira Viagem
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTrips.map((trip) => (
              <div key={trip.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-white">{trip.name}</div>
                    {trip.status === 'active' && (
                      <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs font-bold rounded">ATIVA</span>
                    )}
                    {trip.status === 'draft' && (
                      <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 text-xs font-bold rounded">RASCUNHO</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                    {trip.destinations && trip.destinations.length > 0 && (
                      <span className="ml-2">• {trip.destinations.join(', ')}</span>
                    )}
                  </div>
                </div>
                <Button onClick={() => onOpenTrip(trip.id)} className="bg-indigo-600 hover:bg-indigo-700 text-xs">
                  Abrir
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Getting Started */}
      {stats.totalTrips === 0 && (
        <Card className="!bg-indigo-600/10 !border-indigo-600/30">
          <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4">Começando</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white flex-shrink-0">1</div>
              <div>
                <div className="font-bold text-white">Crie sua primeira viagem</div>
                <div className="text-sm text-gray-400">Defina nome, datas e destinos</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white flex-shrink-0">2</div>
              <div>
                <div className="font-bold text-gray-400">Cadastre viajantes e fornecedores</div>
                <div className="text-sm text-gray-500">Perfis globais reutilizáveis</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white flex-shrink-0">3</div>
              <div>
                <div className="font-bold text-gray-400">Vincule perfis à viagem</div>
                <div className="text-sm text-gray-500">Selecione quem participa</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white flex-shrink-0">4</div>
              <div>
                <div className="font-bold text-gray-400">Comece a cotar e fechar itens</div>
                <div className="text-sm text-gray-500">Organize orçamentos e despesas</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default GeneralDashboard;
