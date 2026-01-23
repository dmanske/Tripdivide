
import React, { useState, useEffect } from 'react';
import { Trip, Expense, Payment } from '../types';
import { Card, Badge } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';
import { formatCurrency } from '../lib/formatters';

interface SettlementProps {
  trip: Trip;
  expenses: Expense[];
  onRefresh: () => void;
}

const Settlement: React.FC<SettlementProps> = ({ trip, expenses }) => {
  const [allPayments, setAllPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const ps: Payment[] = [];
      for (const e of expenses) {
        // FIX: getPayments -> getPaymentsByExpense (Fixes error on line 20)
        const p = await dataProvider.getPaymentsByExpense(e.id);
        ps.push(...p);
      }
      setAllPayments(ps);
    };
    fetch();
  }, [expenses]);

  const targetSplit: Record<string, number> = {};
  const actualPaid: Record<string, number> = {};

  trip.couples.forEach(c => {
    targetSplit[c.id] = 0;
    actualPaid[c.id] = 0;
  });

  expenses.forEach(e => {
    // Note: Expense type does not have splits property in types.ts, 
    // but ComparisonTool adds it at runtime. We cast to any for compatibility.
    (e as any).splits?.forEach((s: any) => {
      targetSplit[s.coupleId] = (targetSplit[s.coupleId] || 0) + s.amount;
    });
  });

  allPayments.forEach(p => {
    // FIX: coupleId -> paidByCoupleId, amount -> paidAmountBrl to match Payment type
    actualPaid[p.paidByCoupleId] = (actualPaid[p.paidByCoupleId] || 0) + p.paidAmountBrl;
  });

  const balances = trip.couples.map(c => {
    const paid = actualPaid[c.id] || 0;
    const share = targetSplit[c.id] || 0;
    const diff = paid - share;
    return { ...c, paid, share, diff };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <header>
          <h2 className="text-3xl font-bold text-white">Divisão & Acerto</h2>
          <p className="text-gray-400">Quem deve o quê para quem</p>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {balances.map(b => (
            <Card key={b.id} className={`${b.diff > 0 ? '!border-emerald-500/30' : b.diff < 0 ? '!border-red-500/30' : ''}`}>
               <h4 className="text-lg font-bold text-gray-100">{b.name}</h4>
               <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Sua Cota:</span>
                    <span>{formatCurrency(b.share)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Total Pago:</span>
                    <span>{formatCurrency(b.paid)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-800 flex justify-between items-center">
                    <span className="text-sm font-bold">Saldo:</span>
                    <span className={`text-lg font-black ${b.diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                       {b.diff >= 0 ? '+' : ''} {formatCurrency(b.diff)}
                    </span>
                  </div>
               </div>
               <div className="mt-4">
                  {b.diff > 0 ? (
                    <Badge color="green">A Receber</Badge>
                  ) : b.diff < 0 ? (
                    <Badge color="red">Deve ao Grupo</Badge>
                  ) : (
                    <Badge color="gray">Quitado</Badge>
                  )}
               </div>
            </Card>
          ))}
       </div>

       <section className="space-y-4">
          <h3 className="text-xl font-bold">Transferências Recomendadas</h3>
          <Card>
             <div className="space-y-4">
               {balances.filter(b => b.diff < -0.01).map(debtor => {
                  const creditor = balances.find(b => b.diff > 0.01);
                  if (!creditor) return null;
                  return (
                    <div key={debtor.id} className="flex items-center justify-between p-4 bg-gray-950 rounded-xl border border-gray-800">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                          </div>
                          <div>
                            <p className="font-bold text-gray-100">{debtor.name}</p>
                            <p className="text-xs text-gray-500">Transferir via PIX para</p>
                          </div>
                       </div>
                       <div className="text-center">
                          <p className="text-lg font-black text-indigo-400">{formatCurrency(Math.abs(debtor.diff))}</p>
                          <svg className="w-4 h-4 mx-auto text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                       </div>
                       <div className="flex items-center gap-4 text-right">
                          <div>
                            <p className="font-bold text-gray-100">{creditor.name}</p>
                            <p className="text-xs text-gray-500">Recebedor</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </div>
                       </div>
                    </div>
                  );
               })}
               {balances.every(b => Math.abs(b.diff) < 1) && (
                 <div className="py-10 text-center text-gray-600 italic">Todos estão quites! Nenhuma transferência necessária.</div>
               )}
             </div>
          </Card>
       </section>
    </div>
  );
};

export default Settlement;