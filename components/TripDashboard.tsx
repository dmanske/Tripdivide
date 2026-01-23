import React, { useState, useEffect } from 'react';
import { Trip, Quote, Expense } from '../types';
import { Button, Card, Modal } from './CommonUI';
import { ICONS } from '../constants';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import { formatDateShort, formatDateVeryShort } from '../lib/formatters';
import TripSetupChecklist from './TripSetupChecklist';
import LinkTravelersModal from './LinkTravelersModal';
import LinkVendorsModal from './LinkVendorsModal';

interface TripDashboardProps {
  trip: Trip;
  quotes: Quote[];
  expenses: Expense[];
  onNavigate: (tab: string) => void;
  onRefresh: () => void;
  onEditTrip: () => void; // Nova prop
}

const TripDashboard: React.FC<TripDashboardProps> = ({ trip, quotes, expenses, onNavigate, onRefresh, onEditTrip }) => {
  const [travelers, setTravelers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkTravelers, setShowLinkTravelers] = useState(false);
  const [showLinkVendors, setShowLinkVendors] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  useEffect(() => {
    loadTravelers();
  }, [trip.id, trip]); // Recarrega quando trip.id ou trip mudar

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
    // Usar parseSupabaseDate para evitar problema de timezone
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} dias`;
  };

  // KPIs
  const totalQuotes = quotes.length;
  const approvedQuotes = quotes.filter(q => q.status === 'Aprovada' || q.status === 'Fechada').length;
  const totalExpenses = expenses.length;
  const totalBudget = quotes.reduce((sum, q) => sum + (q.amountBRL || 0), 0);
  const totalSpent = expenses.reduce((sum, e) => sum + (e.amountBRL || 0), 0);
  const balance = totalBudget - totalSpent;

  // Checklist
  const hasTravelers = travelers.length > 0;
  const hasSegments = trip.segments && trip.segments.length > 1; // Mais de 1 (o "Geral" sempre existe)
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
      action: () => onNavigate('dashboard'), // TODO: criar tela de segmentos
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
    return <div className="text-center py-12 text-gray-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de checklist */}
      <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-3xl font-black uppercase tracking-tight">{trip.name}</h1>
          <div className="flex gap-2">
            <Button 
              onClick={onEditTrip}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0"
            >
              ✏️ Editar
            </Button>
            <Button 
              onClick={() => setShowChecklist(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0"
            >
              📋 Checklist
            </Button>
          </div>
        </div>
        
        {/* Informações da viagem */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-4 text-sm opacity-90">
            <span>📅 {formatDateShort(trip.startDate)} - {formatDateShort(trip.endDate)}</span>
            <span>•</span>
            <span>⏱️ {getDuration(trip.startDate, trip.endDate)}</span>
          </div>
          
          {/* Mostrar segmentos se houver múltiplos destinos */}
          {trip.segments && trip.segments.length > 0 && trip.segments[0].name !== 'Viagem Completa' && (
            <div className="flex flex-wrap gap-2">
              {trip.segments.map((segment, index) => (
                <div key={segment.id} className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs">
                  <span className="font-bold">📍 {segment.name}</span>
                  {segment.startDate && segment.endDate && (
                    <span className="opacity-75">
                      {formatDateVeryShort(segment.startDate)} - {formatDateVeryShort(segment.endDate)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Next Step Alert */}
      {nextStep && (
        <Card className="!bg-yellow-500/10 !border-yellow-500/30">
          <div className="flex items-start gap-4">
            <div className="text-3xl">👉</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">Próximo passo</h3>
              <p className="text-gray-400 mb-3">{nextStep.label}</p>
              <Button onClick={nextStep.action} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                {nextStep.id === 'travelers' ? 'Adicionar Viajantes' : nextStep.id === 'quotes' ? 'Ver Orçamentos' : 'Continuar'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!bg-indigo-600/20 !border-indigo-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{totalQuotes}</div>
            <div className="text-sm text-gray-400 mt-1">Orçamentos</div>
            <div className="text-xs text-indigo-400 mt-1">{approvedQuotes} aprovados</div>
          </div>
        </Card>

        <Card className="!bg-green-600/20 !border-green-600/30">
          <div className="text-center">
            <div className="text-3xl font-black text-white">{totalExpenses}</div>
            <div className="text-sm text-gray-400 mt-1">Itens Fechados</div>
          </div>
        </Card>

        <Card className="!bg-cyan-600/20 !border-cyan-600/30">
          <div className="text-center">
            <div className="text-2xl font-black text-white">
              {totalBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-sm text-gray-400 mt-1">Orçamento Total</div>
          </div>
        </Card>

        <Card className={`${balance >= 0 ? '!bg-green-600/20 !border-green-600/30' : '!bg-red-600/20 !border-red-600/30'}`}>
          <div className="text-center">
            <div className="text-2xl font-black text-white">
              {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-sm text-gray-400 mt-1">Saldo</div>
          </div>
        </Card>
      </div>

      {/* Viajantes */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Viajantes</h2>
          <Button onClick={() => onNavigate('travelers')} className="bg-indigo-600 hover:bg-indigo-700 text-xs">
            <ICONS.Plus className="w-4 h-4 mr-1" />
            Gerenciar
          </Button>
        </div>

        {travelers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum viajante adicionado ainda</p>
            <Button onClick={() => onNavigate('travelers')} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
              Adicionar Viajantes
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {travelers.map((traveler) => (
              <div key={traveler.id} className="p-3 bg-gray-800 rounded-lg text-center">
                <div className="text-2xl mb-1">
                  {traveler.profile?.type === 'Adulto' ? '👤' : traveler.profile?.type === 'Criança' ? '👶' : '🐾'}
                </div>
                <div className="font-bold text-white text-sm">{traveler.profile?.full_name}</div>
                <div className="text-xs text-gray-500 mt-1">{traveler.profile?.type}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Orçamentos Recentes */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Orçamentos Recentes</h2>
          <div className="flex gap-2">
            <Button onClick={() => onNavigate('quotes')} className="bg-cyan-600 hover:bg-cyan-700 text-xs">
              Importar do WhatsApp
            </Button>
            <Button onClick={() => onNavigate('quotes')} className="bg-indigo-600 hover:bg-indigo-700 text-xs">
              <ICONS.Plus className="w-4 h-4 mr-1" />
              Novo Orçamento
            </Button>
          </div>
        </div>

        {quotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ICONS.Quotes className="w-12 h-12 mx-auto mb-3 text-gray-700" />
            <p>Nenhum orçamento cadastrado ainda</p>
            <Button onClick={() => onNavigate('quotes')} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
              Criar Primeiro Orçamento
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {quotes.slice(0, 5).map((quote) => (
              <div key={quote.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                <div className="flex-1">
                  <div className="font-bold text-white">{quote.title}</div>
                  <div className="text-sm text-gray-500">{quote.provider} • {quote.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">
                    {quote.amountBRL?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded inline-block ${
                    quote.status === 'Aprovada' ? 'bg-green-600/20 text-green-400' :
                    quote.status === 'Fechada' ? 'bg-blue-600/20 text-blue-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {quote.status}
                  </div>
                </div>
              </div>
            ))}
            {quotes.length > 5 && (
              <Button onClick={() => onNavigate('quotes')} className="w-full bg-gray-800 hover:bg-gray-700 text-xs">
                Ver todos os {quotes.length} orçamentos
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Itens Fechados Recentes */}
      {expenses.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Itens Fechados Recentes</h2>
            <Button onClick={() => onNavigate('expenses')} className="bg-gray-800 hover:bg-gray-700 text-xs">
              Ver Todos
            </Button>
          </div>

          <div className="space-y-2">
            {expenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <div className="font-bold text-white">{expense.title}</div>
                  <div className="text-sm text-gray-500">{expense.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">
                    {expense.amountBRL?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded inline-block ${
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

      {/* Modais */}
      {showLinkTravelers && (
        <LinkTravelersModal
          trip={trip}
          onClose={() => setShowLinkTravelers(false)}
          onLinked={() => {
            setShowLinkTravelers(false);
            loadTravelers(); // Recarrega viajantes do dashboard
            onRefresh(); // Recarrega dados gerais da viagem
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

      {/* Modal do Checklist */}
      {showChecklist && (
        <Modal isOpen={true} onClose={() => setShowChecklist(false)} title="Checklist de Configuração">
          <div className="p-6">
            <TripSetupChecklist
              key={`checklist-${showChecklist}`} // Força reload quando modal abre
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
