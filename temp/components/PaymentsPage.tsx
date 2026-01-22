
import React, { useState, useEffect, useMemo } from 'react';
import { Trip, Payment, Expense } from '../types';
import { Card, Badge, Input, Button } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';
import { formatSupabaseDate } from '../lib/formatters';

interface PaymentsPageProps {
  trip: Trip;
}

const PaymentsPage: React.FC<PaymentsPageProps> = ({ trip }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterCouple, setFilterCouple] = useState('all');

  useEffect(() => {
    loadData();
  }, [trip.id]);

  const loadData = async () => {
    const [pList, eList] = await Promise.all([
      // FIX: getPayments -> getPaymentsByTrip (Fixes error on line 22)
      dataProvider.getPaymentsByTrip(trip.id),
      dataProvider.getExpenses(trip.id)
    ]);
    setPayments(pList);
    setExpenses(eList);
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(p => filterCouple === 'all' || p.paidByCoupleId === filterCouple)
                   .sort((a,b) => b.paidAt.localeCompare(a.paidAt));
  }, [payments, filterCouple]);

  const totalPaid = useMemo(() => filteredPayments.reduce((sum, p) => sum + p.paidAmountBrl, 0), [filteredPayments]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Fluxo de Caixa</h2>
          <p className="text-gray-500">Todos os pagamentos realizados na viagem</p>
        </div>
        <Card className="!p-3 !bg-indigo-600/10 border-indigo-500/20">
           <p className="text-[10px] font-black text-indigo-400 uppercase">Total Desembolsado</p>
           <p className="text-2xl font-black text-white">R$ {totalPaid.toLocaleString('pt-BR')}</p>
        </Card>
      </header>

      <Card className="!p-4 bg-gray-900/40 border-gray-800">
        <div className="flex gap-4 items-end">
           <Input as="select" label="Filtrar por Pagador" value={filterCouple} onChange={e => setFilterCouple(e.target.value)} className="max-w-xs">
              <option value="all">Todos os Casais</option>
              {trip.couples.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
           </Input>
           <Button variant="ghost" className="text-xs" onClick={() => setFilterCouple('all')}>Limpar Filtros</Button>
        </div>
      </Card>

      <div className="overflow-x-auto rounded-2xl border border-gray-800">
        <table className="w-full text-left bg-gray-900">
           <thead className="bg-gray-950 text-[10px] font-black uppercase text-gray-500 border-b border-gray-800">
              <tr>
                 <th className="p-4">Data</th>
                 <th className="p-4">Quem Pagou</th>
                 <th className="p-4">Despesa Vinculada</th>
                 <th className="p-4">Método</th>
                 <th className="p-4 text-right">Valor BRL</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-gray-800">
              {filteredPayments.map(p => {
                const expense = expenses.find(e => e.id === p.expenseId);
                const couple = trip.couples.find(c => c.id === p.paidByCoupleId);
                return (
                  <tr key={p.id} className="hover:bg-gray-800/20 transition-colors">
                     <td className="p-4 text-gray-400 text-sm">{formatSupabaseDate(p.paidAt)}</td>
                     <td className="p-4 font-bold text-gray-200 text-sm">{couple?.name}</td>
                     <td className="p-4 text-gray-400 text-sm">{expense?.title || 'Avulso'}</td>
                     <td className="p-4"><Badge color="indigo">{p.method.toUpperCase()}</Badge></td>
                     <td className="p-4 text-right font-black text-emerald-400">R$ {p.paidAmountBrl.toLocaleString('pt-BR')}</td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr><td colSpan={5} className="p-20 text-center text-gray-600 italic">Nenhum pagamento registrado.</td></tr>
              )}
           </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsPage;
