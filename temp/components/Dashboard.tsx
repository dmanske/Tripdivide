
import React from 'react';
import { Trip, Quote, Expense, QuoteStatus, ExpenseStatus, Traveler } from '../types';
import { Card, Badge, Button } from './CommonUI';
import { Money } from '../lib/money';
import { dataProvider } from '../lib/dataProvider';

interface DashboardProps {
  trip: Trip;
  quotes: Quote[];
  expenses: Expense[];
  onNavigate: (tab: string) => void;
  onRefresh: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ trip, quotes, expenses, onNavigate, onRefresh }) => {
  const [showNewGroupInput, setShowNewGroupInput] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState('');
  const [travelers, setTravelers] = React.useState<Traveler[]>([]);
  
  // Carregar viajantes
  React.useEffect(() => {
    const loadTravelers = async () => {
      const list = await dataProvider.getTravelers(trip.id);
      setTravelers(list);
    };
    loadTravelers();
  }, [trip.id]);
  
  // Agrupar viajantes por casal
  const coupleMembers = React.useMemo(() => {
    const grouped: Record<string, { id: string; name: string; isChild: boolean }[]> = {};
    
    travelers.forEach(t => {
      const coupleId = t.coupleId || 'sem-grupo';
      if (!grouped[coupleId]) {
        grouped[coupleId] = [];
      }
      grouped[coupleId].push({
        id: t.id,
        name: t.fullName || 'Sem Nome',
        isChild: t.type !== 'Adulto'
      });
    });
    
    return grouped;
  }, [travelers]);
  
  const totalTravelers = travelers.length;
  
  const estimated = quotes.reduce((sum, q) => sum + (q.status === QuoteStatus.SHORTLIST || q.status === QuoteStatus.CHOSEN ? q.amountBrl : 0), 0);
  const totalPaid = expenses.reduce((sum, e) => sum + (e.status === ExpenseStatus.PAID ? e.amountBrl : 0), 0);
  const totalDue = expenses.reduce((sum, e) => sum + (e.status === ExpenseStatus.CONFIRMED ? e.amountBrl : 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Painel da Viagem</h2>
          <p className="text-gray-500">Logística e fluxos financeiros consolidados</p>
        </div>
        <div className="flex gap-2">
           <Badge color="indigo">{totalTravelers} Viajantes</Badge>
           <Badge color="gray">{trip.segments.length} Segmentos</Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="!bg-gray-900/50">
           <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Total Estimado (Favoritos)</p>
           <p className="text-3xl font-black text-white">R$ {Money.format(estimated)}</p>
        </Card>
        <Card className="!bg-amber-600/5 !border-amber-500/20">
           <p className="text-[10px] font-black text-amber-400 uppercase mb-1">Pendente de Pagamento</p>
           <p className="text-3xl font-black text-white">R$ {Money.format(totalDue)}</p>
        </Card>
        <Card className="!bg-emerald-600/5 !border-emerald-500/20">
           <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Total Efetivamente Pago</p>
           <p className="text-3xl font-black text-white">R$ {Money.format(totalPaid)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
               Casais e viajantes no grupo
            </h3>
            {!showNewGroupInput ? (
              <Button variant="ghost" className="text-[10px]" onClick={() => {
                setShowNewGroupInput(true);
                setNewGroupName('');
              }}>+ Novo Grupo</Button>
            ) : (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Nome do grupo"
                  className="px-3 py-1.5 bg-gray-950 border border-indigo-500 rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:border-indigo-400 transition-colors"
                  autoFocus
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && newGroupName.trim()) {
                      e.preventDefault();
                      await dataProvider.saveCouple(trip.id, { name: newGroupName.trim() });
                      setShowNewGroupInput(false);
                      setNewGroupName('');
                      onRefresh();
                    } else if (e.key === 'Escape') {
                      setShowNewGroupInput(false);
                      setNewGroupName('');
                    }
                  }}
                />
                <Button 
                  variant="primary" 
                  className="text-[10px] px-3 py-1.5"
                  disabled={!newGroupName.trim()}
                  onClick={async () => {
                    if (newGroupName.trim()) {
                      await dataProvider.saveCouple(trip.id, { name: newGroupName.trim() });
                      setShowNewGroupInput(false);
                      setNewGroupName('');
                      onRefresh();
                    }
                  }}
                >
                  Criar
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-[10px] px-2 py-1.5"
                  onClick={() => {
                    setShowNewGroupInput(false);
                    setNewGroupName('');
                  }}
                >
                  ✕
                </Button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trip.couples.map(couple => {
              const members = coupleMembers[couple.id] || [];
              return (
                <Card key={couple.id} className="hover:border-gray-700 transition-all cursor-pointer group" onClick={() => onNavigate('travelers')}>
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex-1 flex items-center gap-2">
                       <p className="font-bold text-gray-100 uppercase text-sm tracking-tight">{couple.name}</p>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           const input = e.currentTarget.parentElement?.querySelector('input[data-edit-group]') as HTMLInputElement;
                           if (input) {
                             input.style.display = 'block';
                             input.focus();
                             input.select();
                           }
                         }}
                         className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-indigo-400 text-xs"
                       >
                         ✏️
                       </button>
                       <input
                         data-edit-group
                         type="text"
                         defaultValue={couple.name}
                         style={{ display: 'none' }}
                         className="px-2 py-1 bg-gray-900 border border-indigo-500 rounded text-xs text-white"
                         onBlur={async (e) => {
                           const newName = e.target.value.trim();
                           if (newName && newName !== couple.name) {
                             await dataProvider.saveCouple(trip.id, { id: couple.id, name: newName });
                             onRefresh();
                           }
                           e.target.style.display = 'none';
                         }}
                         onKeyDown={async (e) => {
                           if (e.key === 'Enter') {
                             e.currentTarget.blur();
                           } else if (e.key === 'Escape') {
                             e.currentTarget.value = couple.name;
                             e.currentTarget.style.display = 'none';
                           }
                         }}
                         onClick={(e) => e.stopPropagation()}
                       />
                     </div>
                     <Badge color="gray">{members.length} PES</Badge>
                  </div>
                  <div className="space-y-1">
                     {members.length > 0 ? members.map(m => (
                       <div key={m.id} className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{m.name}</span>
                          {m.isChild && <Badge color="yellow" className="!text-[8px] px-1 py-0">KIDS</Badge>}
                       </div>
                     )) : <p className="text-xs text-gray-700 italic">Nenhum viajante cadastrado.</p>}
                  </div>
                </Card>
              );
            })}
            {trip.couples.length === 0 && <p className="text-gray-600 italic text-sm">Nenhum grupo configurado. Clique em "+ Novo Grupo" para começar.</p>}
          </div>
        </section>

        <section className="space-y-4">
           <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
             Atalhos Rápidos
          </h3>
          <Card className="space-y-3">
             <Button variant="outline" className="w-full justify-start text-xs font-bold" onClick={() => onNavigate('vendors')}>
                🏢 Fornecedores e Reputação
             </Button>
             <Button variant="outline" className="w-full justify-start text-xs font-bold" onClick={() => onNavigate('quotes')}>
                📄 Orçamentos Recebidos
             </Button>
             <Button variant="primary" className="w-full justify-start text-xs font-bold" onClick={() => onNavigate('settlement')}>
                💰 Acerto de Contas
             </Button>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
