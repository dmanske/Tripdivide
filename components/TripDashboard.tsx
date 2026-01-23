import React, { useState, useEffect } from 'react';
import { Trip, Quote, Expense } from '../types';
import { Button, Card, Modal } from './CommonUI';
import { ICONS } from '../constants';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import { formatDateShort, formatDateVeryShort, formatCurrency } from '../lib/formatters';
import TripSetupChecklist from './TripSetupChecklist';
import LinkTravelersModal from './LinkTravelersModal';
import LinkVendorsModal from './LinkVendorsModal';

interface TripDashboardProps {
  trip: Trip;
  quotes: Quote[];
  expenses: Expense[];
  onNavigate: (tab: string) => void;
  onNavigateToQuote: (id: string) => void;
  onRefresh: () => void;
  onEditTrip: () => void;
}

const TripDashboard: React.FC<TripDashboardProps> = ({ trip, quotes, expenses, onNavigate, onNavigateToQuote, onRefresh, onEditTrip }) => {
  const [travelers, setTravelers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkTravelers, setShowLinkTravelers] = useState(false);
  const [showLinkVendors, setShowLinkVendors] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const cleanText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\n\r]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  useEffect(() => {
    loadTravelers();
  }, [trip.id, trip]);

  const loadTravelers = async () => {
    setLoading(true);
    try {
      const data = await supabaseDataProvider.getTripTravelers(trip.id);
      setTravelers(data);
    } catch (error) {
      console.error('Erro ao carregar viajantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} dias`;
  };

  const totalQuotes = quotes.length;
  const approvedQuotes = quotes.filter(q => q.status === 'Aprovada' || q.status === 'Fechada').length;
  const totalExpenses = expenses.length;
  const totalBudget = quotes.reduce((sum, q) => sum + (q.amountBrl || 0), 0);
  const totalSpent = expenses.reduce((sum, e) => sum + (e.amountBrl || 0), 0);
  const balance = totalBudget - totalSpent;

  const hasTravelers = travelers.length > 0;
  const hasSegments = trip.segments && trip.segments.length > 1;
  const hasQuotes = quotes.length > 0;

  const checklistItems = [
    {
      id: 'travelers',
      label: 'Adicionar viajantes',
      completed: hasTravelers,
      action: () => onNavigate('travelers'),
      priority: !hasTravelers
    },
    {
      id: 'segments',
      label: 'Definir segmentos da viagem',
      completed: hasSegments,
      action: () => onNavigate('dashboard'),
      priority: false
    },
    {
      id: 'quotes',
      label: 'Importar ou criar orçamentos',
      completed: hasQuotes,
      action: () => onNavigate('quotes'),
      priority: hasTravelers && !hasQuotes
    }
  ];

  const nextStep = checklistItems.find(item => !item.completed && item.priority) || checklistItems.find(item => !item.completed);

  if (loading) {
    return <div className="text-center py-12 text-gray-500 animate-pulse">Carregando...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2Mi1oMnYtMmgtMnptMC00djJoMnYtMmgtMnptMC00djJoMnYtMmgtMnptMC00djJoMnYtMmgtMnptMC00djJoMnYtMmgtMnptMC00djJoMnYtMmgtMnptMC00djJoMnYtMmgtMnptMC00djJoMnYtMmgtMnptMC00djJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        
        <div className="relative p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-3">
                {trip.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-xl">📅</span>
                  <span className="font-bold">{formatDateShort(trip.startDate)} - {formatDateShort(trip.endDate)}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-xl">⏱️</span>
                  <span className="font-bold">{getDuration(trip.startDate, trip.endDate)}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-xl">👥</span>
                  <span className="font-bold">{travelers.length} {travelers.length === 1 ? 'viajante' : 'viajantes'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => onNavigate('quotes')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 shadow-lg"
              >
                <ICONS.Plus className="w-5 h-5 mr-2" />
                Novo Orçamento
              </Button>
              <Button 
                onClick={() => setShowChecklist(true)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 shadow-lg"
              >
                <span className="text-lg mr-2">📋</span>
                Checklist
              </Button>
              <Button 
                onClick={onEditTrip}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 shadow-lg"
              >
                <span className="text-lg mr-2">✏️</span>
                Editar
              </Button>
            </div>
          </div>
          
          {trip.segments && trip.segments.length > 0 && trip.segments[0].name !== 'Viagem Completa' && (
            <div className="flex flex-wrap gap-2">
              {trip.segments.map((segment) => (
                <div key={segment.id} className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white">
                  <span className="text-lg">📍</span>
                  <div>
                    <span className="font-bold">{segment.name}</span>
                    {segment.startDate && segment.endDate && (
                      <span className="ml-2 opacity-75 text-sm">
                        {formatDateVeryShort(segment.startDate)} - {formatDateVeryShort(segment.endDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {nextStep && (
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-2 border-amber-500/30 p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center text-3xl flex-shrink-0">
              💡
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Próximo Passo</h3>
              <p className="text-gray-300 mb-4">{nextStep.label}</p>
              <Button onClick={nextStep.action} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg border-0">
                {nextStep.id === 'travelers' ? '👥 Adicionar Viajantes' : nextStep.id === 'quotes' ? '💰 Ver Orçamentos' : '▶️ Continuar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!p-6 !bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 !border-indigo-600/30 hover:!border-indigo-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">{totalQuotes}</div>
              <div className="text-xs text-indigo-400 mt-2 uppercase font-bold tracking-wider">Orçamentos</div>
              <div className="text-xs text-gray-600 mt-1">{approvedQuotes} aprovados</div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-indigo-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              💰
            </div>
          </div>
        </Card>

        <Card className="!p-6 !bg-gradient-to-br from-green-600/20 to-green-600/5 !border-green-600/30 hover:!border-green-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">{totalExpenses}</div>
              <div className="text-xs text-green-400 mt-2 uppercase font-bold tracking-wider">Fechados</div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-green-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              ✓
            </div>
          </div>
        </Card>

        <Card className="!p-6 !bg-gradient-to-br from-cyan-600/20 to-cyan-600/5 !border-cyan-600/30 hover:!border-cyan-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-black text-white group-hover:scale-110 transition-transform">
                {formatCurrency(totalBudget)}
              </div>
              <div className="text-xs text-cyan-400 mt-2 uppercase font-bold tracking-wider">Orçamento</div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-cyan-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              💵
            </div>
          </div>
        </Card>

        <Card className={`!p-6 ${balance >= 0 ? '!bg-gradient-to-br from-green-600/20 to-green-600/5 !border-green-600/30 hover:!border-green-500' : '!bg-gradient-to-br from-red-600/20 to-red-600/5 !border-red-600/30 hover:!border-red-500'} transition-all group`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-black text-white group-hover:scale-110 transition-transform">
                {formatCurrency(balance)}
              </div>
              <div className={`text-xs mt-2 uppercase font-bold tracking-wider ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                Saldo
              </div>
            </div>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform ${balance >= 0 ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
              {balance >= 0 ? '📈' : '📉'}
            </div>
          </div>
        </Card>
      </div>

      <Card className="!p-6 bg-gradient-to-r from-gray-900/60 to-gray-900/40 border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-2xl">
              👥
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Viajantes</h2>
          </div>
          <Button onClick={() => onNavigate('travelers')} className="bg-indigo-600 hover:bg-indigo-700 text-sm font-bold">
            <ICONS.Plus className="w-4 h-4 mr-2" />
            Gerenciar
          </Button>
        </div>

        {travelers.length === 0 ? (
          <div className="text-center py-12 bg-gray-950/50 rounded-xl border border-gray-800 border-dashed">
            <div className="text-5xl mb-4 opacity-20">👥</div>
            <p className="text-gray-500 mb-4">Nenhum viajante adicionado ainda</p>
            <Button onClick={() => onNavigate('travelers')} className="bg-indigo-600 hover:bg-indigo-700 font-bold">
              <ICONS.Plus className="w-4 h-4 mr-2" />
              Adicionar Viajantes
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {travelers.map((traveler) => (
              <div key={traveler.id} className="p-4 bg-gray-950/50 rounded-xl border border-gray-800 hover:border-indigo-600/50 transition-all text-center group">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {traveler.type === 'Adulto' ? '👤' : traveler.type === 'Criança' ? '👶' : '🐾'}
                </div>
                <div className="font-bold text-white text-sm">{traveler.profile?.full_name}</div>
                <div className="text-xs text-gray-500 mt-1">{traveler.type}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="!p-6 bg-gradient-to-r from-gray-900/60 to-gray-900/40 border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-2xl">
              💰
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Orçamentos Recentes</h2>
          </div>
          <Button onClick={() => onNavigate('quotes')} className="bg-indigo-600 hover:bg-indigo-700 text-sm font-bold">
            Ver Todos →
          </Button>
        </div>

        {quotes.length === 0 ? (
          <div className="text-center py-12 bg-gray-950/50 rounded-xl border border-gray-800 border-dashed">
            <div className="text-5xl mb-4 opacity-20">💰</div>
            <p className="text-gray-500 mb-4">Nenhum orçamento cadastrado ainda</p>
            <Button onClick={() => onNavigate('quotes')} className="bg-indigo-600 hover:bg-indigo-700 font-bold">
              <ICONS.Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Orçamento
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {quotes.slice(0, 5).map((quote) => (
              <div 
                key={quote.id} 
                className="flex items-center justify-between p-4 bg-gray-950/50 rounded-xl border border-gray-800 hover:border-indigo-600/50 transition-all cursor-pointer group" 
                onClick={() => onNavigateToQuote(quote.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                    {cleanText(quote.title)}
                  </div>
                  <div className="text-sm text-gray-500 truncate">{quote.provider} • {quote.category}</div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <div className="font-black text-indigo-400 text-lg">
                    {formatCurrency(quote.amountBrl || 0)}
                  </div>
                </div>
              </div>
            ))}
            {quotes.length > 5 && (
              <Button onClick={() => onNavigate('quotes')} className="w-full bg-gray-950/50 hover:bg-gray-900 text-sm font-bold border border-gray-800">
                Ver todos os {quotes.length} orçamentos →
              </Button>
            )}
          </div>
        )}
      </Card>

      {expenses.length > 0 && (
        <Card className="!p-6 bg-gradient-to-r from-gray-900/60 to-gray-900/40 border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center text-2xl">
                ✓
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Itens Fechados</h2>
            </div>
            <Button onClick={() => onNavigate('expenses')} className="bg-gray-800 hover:bg-gray-700 text-sm font-bold">
              Ver Todos →
            </Button>
          </div>

          <div className="space-y-2">
            {expenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-950/50 rounded-xl border border-gray-800">
                <div className="flex-1">
                  <div className="font-bold text-white">{expense.title}</div>
                  <div className="text-sm text-gray-500">{expense.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">
                    {formatCurrency(expense.amountBrl || 0)}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-lg inline-block mt-1 ${
                    expense.status === 'paid' ? 'bg-green-600/20 text-green-400' :
                    expense.status === 'confirmed' ? 'bg-blue-600/20 text-blue-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {expense.status === 'paid' ? 'Pago' : expense.status === 'confirmed' ? 'Confirmado' : 'Planejado'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showLinkTravelers && (
        <LinkTravelersModal
          trip={trip}
          onClose={() => setShowLinkTravelers(false)}
          onLinked={() => {
            setShowLinkTravelers(false);
            loadTravelers();
            onRefresh();
          }}
        />
      )}

      {showLinkVendors && (
        <LinkVendorsModal
          trip={trip}
          onClose={() => setShowLinkVendors(false)}
          onLinked={() => {
            setShowLinkVendors(false);
            onRefresh();
          }}
        />
      )}

      {showChecklist && (
        <Modal isOpen={true} onClose={() => setShowChecklist(false)} title="Checklist de Configuração">
          <div className="p-6">
            <TripSetupChecklist
              key={`checklist-${showChecklist}`}
              trip={trip}
              onNavigate={(tab) => {
                setShowChecklist(false);
                onNavigate(tab);
              }}
              onOpenLinkTravelers={() => {
                setShowChecklist(false);
                setShowLinkTravelers(true);
              }}
              onOpenLinkVendors={() => {
                setShowChecklist(false);
                setShowLinkVendors(true);
              }}
              onRefresh={onRefresh}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TripDashboard;
