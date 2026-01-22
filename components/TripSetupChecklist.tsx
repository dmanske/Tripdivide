import React, { useState, useEffect } from 'react';
import { Trip } from '../types';
import { Card, Button } from './CommonUI';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import { ICONS } from '../constants';

interface TripSetupChecklistProps {
  trip: Trip;
  onNavigate: (view: string) => void;
  onOpenLinkTravelers: () => void;
  onOpenLinkVendors: () => void;
  onRefresh: () => void;
}

const TripSetupChecklist: React.FC<TripSetupChecklistProps> = ({ 
  trip, 
  onNavigate, 
  onOpenLinkTravelers, 
  onOpenLinkVendors,
  onRefresh 
}) => {
  const [stats, setStats] = useState({
    travelersCount: 0,
    vendorsCount: 0,
    quotesCount: 0,
    expensesCount: 0,
    paymentsCount: 0
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
    
    // Verificar se já foi colapsado antes
    const collapsed = localStorage.getItem(`checklist-collapsed-${trip.id}`);
    if (collapsed === 'true') {
      setIsCollapsed(true);
    }
  }, [trip.id]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await supabaseDataProvider.getTripSetupStats(trip.id);
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar stats quando houver refresh
  useEffect(() => {
    loadStats();
  }, [onRefresh]);

  const tasks = [
    {
      id: 'travelers',
      label: 'Vincule viajantes',
      completed: stats.travelersCount >= 1,
      action: onOpenLinkTravelers,
      buttonLabel: 'Adicionar viajantes'
    },
    {
      id: 'vendors',
      label: 'Vincule fornecedores',
      completed: stats.vendorsCount >= 1,
      action: onOpenLinkVendors,
      buttonLabel: 'Adicionar fornecedores'
    },
    {
      id: 'quotes',
      label: 'Crie sua primeira cotação',
      completed: stats.quotesCount >= 1,
      action: () => onNavigate('quotes'),
      buttonLabel: 'Nova cotação'
    },
    {
      id: 'expenses',
      label: 'Feche sua primeira cotação',
      completed: stats.expensesCount >= 1,
      action: () => onNavigate('quotes'),
      buttonLabel: 'Ver cotações'
    },
    {
      id: 'payments',
      label: 'Registre um pagamento',
      completed: stats.paymentsCount >= 1,
      action: () => onNavigate('payments'),
      buttonLabel: 'Pagamentos'
    }
  ];

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = Math.round((completedCount / totalCount) * 100);
  const isComplete = completedCount === totalCount;

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(`checklist-collapsed-${trip.id}`, String(newState));
  };

  // Auto-colapsar quando completo
  useEffect(() => {
    if (isComplete && !isCollapsed) {
      const timer = setTimeout(() => {
        setIsCollapsed(true);
        localStorage.setItem(`checklist-collapsed-${trip.id}`, 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, isCollapsed, trip.id]);

  if (isLoading) {
    return null;
  }

  return (
    <Card className="border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
            {isComplete ? (
              <ICONS.Check className="w-6 h-6 text-indigo-400" />
            ) : (
              <span className="text-lg font-black text-indigo-400">{completedCount}</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-black text-white">
              {isComplete ? '🎉 Checklist Completo!' : 'Checklist da Viagem'}
            </h3>
            <p className="text-sm text-gray-400">
              {isComplete 
                ? 'Sua viagem está pronta para começar!' 
                : `${completedCount}/${totalCount} concluídos`}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          onClick={handleToggleCollapse}
          className="text-xs"
        >
          {isCollapsed ? 'Expandir' : 'Ocultar'}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  task.completed
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      task.completed
                        ? 'bg-emerald-500 border-emerald-400'
                        : 'border-gray-600'
                    }`}
                  >
                    {task.completed && <ICONS.Check className="w-4 h-4 text-white" />}
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      task.completed ? 'text-emerald-400 line-through' : 'text-gray-300'
                    }`}
                  >
                    {task.label}
                  </span>
                </div>
                {!task.completed && (
                  <Button
                    variant="ghost"
                    onClick={task.action}
                    className="text-xs py-1 px-3"
                  >
                    {task.buttonLabel}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {isComplete && (
            <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <p className="text-sm text-indigo-300 text-center">
                Parabéns! Você completou todas as etapas essenciais. Agora é só aproveitar! 🚀
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default TripSetupChecklist;
