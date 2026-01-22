
import React from 'react';
import { Trip, Quote, Expense, QuoteStatus, ExpenseStatus } from '../types';
import { Card, Badge, Button } from './CommonUI';
import { Money } from '../lib/money';

interface DashboardProps {
  trip: Trip;
  quotes: Quote[];
  expenses: Expense[];
  onNavigate: (tab: string) => void;
  onRefresh: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ trip, quotes, expenses, onNavigate }) => {
  const totalTravelers = trip.couples.reduce((sum, c) => sum + c.members.length, 0);
  
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
          <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
             Casais e viajantes no grupo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trip.couples.map(couple => (
              <Card key={couple.id} className="hover:border-gray-700 transition-all cursor-pointer" onClick={() => onNavigate('travelers')}>
                <div className="flex justify-between items-start mb-4">
                   <p className="font-bold text-gray-100 uppercase text-sm tracking-tight">{couple.name}</p>
                   <Badge color="gray">{couple.members.length} PES</Badge>
                </div>
                <div className="space-y-1">
                   {couple.members.length > 0 ? couple.members.map(m => (
                     <div key={m.id} className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{m.name}</span>
                        {m.isChild && <Badge color="yellow" className="!text-[8px] px-1 py-0">KIDS</Badge>}
                     </div>
                   )) : <p className="text-xs text-gray-700 italic">Nenhum viajante cadastrado.</p>}
                </div>
              </Card>
            ))}
            {trip.couples.length === 0 && <p className="text-gray-600 italic text-sm">Nenhum casal configurado na viagem.</p>}
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
