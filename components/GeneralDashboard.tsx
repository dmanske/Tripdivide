import React, { useState, useEffect } from 'react';
import { Button, Card } from './CommonUI';
import { ICONS } from '../constants';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';

interface GeneralDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenTrip: (tripId: string) => void;
}

interface StatCardProps {
  value: number;
  label: string;
  sublabel: string;
  color: 'indigo' | 'cyan' | 'green' | 'orange' | 'purple';
  icon: React.ComponentType<{ className?: string }>;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, sublabel, color, icon: Icon, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const colorClasses = {
    indigo: 'bg-indigo-600/20 border-indigo-600/30 hover:bg-indigo-600/30',
    cyan: 'bg-cyan-600/20 border-cyan-600/30 hover:bg-cyan-600/30',
    green: 'bg-green-600/20 border-green-600/30 hover:bg-green-600/30',
    orange: 'bg-orange-600/20 border-orange-600/30 hover:bg-orange-600/30',
    purple: 'bg-purple-600/20 border-purple-600/30 hover:bg-purple-600/30'
  };

  const textColors = {
    indigo: 'text-indigo-400',
    cyan: 'text-cyan-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400'
  };

  return (
    <Card className={`${colorClasses[color]} transition-all duration-300 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} cursor-pointer group`}>
      <div className="text-center relative overflow-hidden">
        <Icon className={`w-8 h-8 mx-auto mb-2 ${textColors[color]} opacity-50 group-hover:opacity-100 transition-opacity`} />
        <div className="text-4xl font-black text-white mb-1 group-hover:scale-110 transition-transform">{value}</div>
        <div className="text-sm text-gray-300 font-semibold">{label}</div>
        <div className={`text-xs ${textColors[color]} mt-1 font-medium`}>{sublabel}</div>
      </div>
    </Card>
  );
};

const GeneralDashboard: React.FC<GeneralDashboardProps> = ({ onNavigate, onOpenTrip }) => {
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    totalTravelers: 0,
    totalVendors: 0,
    totalQuotes: 0,
    totalExpenses: 0
  });
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    loadData();
    setGreeting(getGreeting());
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [trips, travelerProfiles, vendorProfiles] = await Promise.all([
        supabaseDataProvider.getTrips(),
        supabaseDataProvider.getTravelerProfiles(),
        supabaseDataProvider.getVendorProfiles()
      ]);
      
      const activeTrips = trips.filter((t: any) => t.status === 'active');
      
      // Contar quotes e expenses de todas as viagens
      let totalQuotes = 0;
      let totalExpenses = 0;
      
      for (const trip of trips) {
        const quotes = await supabaseDataProvider.getQuotes(trip.id);
        const expenses = await supabaseDataProvider.getExpenses(trip.id);
        totalQuotes += quotes.length;
        totalExpenses += expenses.length;
      }
      
      setStats({
        totalTrips: trips.length,
        activeTrips: activeTrips.length,
        totalTravelers: travelerProfiles.length,
        totalVendors: vendorProfiles.length,
        totalQuotes,
        totalExpenses
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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 animate-pulse">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header com gradiente animado */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <ICONS.Dashboard className="w-8 h-8" />
            <h1 className="text-4xl font-black uppercase tracking-tight">{greeting}!</h1>
          </div>
          <p className="text-lg opacity-90 font-medium">Visão geral de todas as suas viagens e recursos</p>
          
          {stats.activeTrips > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-bold">{stats.activeTrips} viagem{stats.activeTrips > 1 ? 's' : ''} ativa{stats.activeTrips > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid com animação */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          value={stats.totalTrips}
          label="Viagens"
          sublabel={`${stats.activeTrips} ativas`}
          color="indigo"
          icon={ICONS.Dashboard}
          delay={0}
        />
        
        <StatCard
          value={stats.activeTrips}
          label="Ativas"
          sublabel="Em andamento"
          color="green"
          icon={ICONS.Check}
          delay={100}
        />
        
        <StatCard
          value={stats.totalTravelers}
          label="Viajantes"
          sublabel="Cadastrados"
          color="cyan"
          icon={ICONS.Travelers}
          delay={200}
        />
        
        <StatCard
          value={stats.totalVendors}
          label="Fornecedores"
          sublabel="Cadastrados"
          color="purple"
          icon={ICONS.Vendors}
          delay={300}
        />
        
        <StatCard
          value={stats.totalQuotes}
          label="Orçamentos"
          sublabel="Total"
          color="orange"
          icon={ICONS.Quotes}
          delay={400}
        />
        
        <StatCard
          value={stats.totalExpenses}
          label="Despesas"
          sublabel="Registradas"
          color="green"
          icon={ICONS.Expenses}
          delay={500}
        />
      </div>

      {/* Quick Actions com hover effects */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full"></div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Ações Rápidas</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('trips')}
            className="group relative bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/50"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-colors"></div>
            <div className="relative flex flex-col items-center gap-3">
              <ICONS.Dashboard className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-white">Ver Viagens</span>
            </div>
          </button>
          
          <button
            onClick={() => onNavigate('travelers')}
            className="group relative bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/50"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-colors"></div>
            <div className="relative flex flex-col items-center gap-3">
              <ICONS.Travelers className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-white">Viajantes</span>
            </div>
          </button>
          
          <button
            onClick={() => onNavigate('vendors')}
            className="group relative bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/50"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-colors"></div>
            <div className="relative flex flex-col items-center gap-3">
              <ICONS.Vendors className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-white">Fornecedores</span>
            </div>
          </button>
          
          <button
            onClick={() => onNavigate('trips')}
            className="group relative bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-orange-500/50"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-colors"></div>
            <div className="relative flex flex-col items-center gap-3">
              <ICONS.Plus className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-white">Nova Viagem</span>
            </div>
          </button>
        </div>
      </Card>

      {/* Recent Trips com design melhorado */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full"></div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Viagens Recentes</h2>
          </div>
          {recentTrips.length > 0 && (
            <Button onClick={() => onNavigate('trips')} className="bg-gray-800 hover:bg-gray-700 text-sm font-bold">
              Ver Todas →
            </Button>
          )}
        </div>

        {recentTrips.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <ICONS.Dashboard className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-400 text-lg mb-2">Nenhuma viagem criada ainda</p>
            <p className="text-gray-500 text-sm mb-6">Comece criando sua primeira viagem</p>
            <Button onClick={() => onNavigate('trips')} className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 font-bold">
              <ICONS.Plus className="w-4 h-4 mr-2" />
              Criar Primeira Viagem
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTrips.map((trip, index) => (
              <div
                key={trip.id}
                className="group relative bg-gray-800/50 hover:bg-gray-800 rounded-xl p-5 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg border border-gray-700/50 hover:border-indigo-500/50"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                        <ICONS.Dashboard className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white text-lg truncate">{trip.name}</h3>
                          {trip.status === 'active' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                              ATIVA
                            </span>
                          )}
                          {trip.status === 'draft' && (
                            <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/30">
                              RASCUNHO
                            </span>
                          )}
                          {trip.status === 'completed' && (
                            <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs font-bold rounded-full border border-gray-500/30">
                              CONCLUÍDA
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <ICONS.Calendar className="w-4 h-4" />
                            {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                          </span>
                          {trip.destinations && trip.destinations.length > 0 && (
                            <span className="flex items-center gap-1 truncate">
                              <ICONS.MapPin className="w-4 h-4" />
                              {trip.destinations.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => onOpenTrip(trip.id)}
                    className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-sm font-bold flex-shrink-0 group-hover:scale-105 transition-transform"
                  >
                    Abrir →
                  </Button>
                </div>
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
