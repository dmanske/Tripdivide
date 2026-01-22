
import React, { useState, useEffect, useMemo } from 'react';
import { Trip, Expense, Payment, Reimbursement, Couple, ExpenseSplit } from '../types';
import { Card, Badge, Button } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';
import { Money } from '../lib/money';

interface SettlementPageProps {
  trip: Trip;
}

const SettlementPage: React.FC<SettlementPageProps> = ({ trip }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allReimbursements, setAllReimbursements] = useState<Reimbursement[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allSplits, setAllSplits] = useState<ExpenseSplit[]>([]);

  useEffect(() => {
    loadData();
  }, [trip.id]);

  const loadData = async () => {
    const [eList, rList, pList, sList] = await Promise.all([
      dataProvider.getExpenses(trip.id),
      dataProvider.getReimbursements(trip.id),
      dataProvider.getPaymentsByTrip(trip.id),
      dataProvider.getExpenseSplitsByTrip(trip.id)
    ]);
    
    setExpenses(eList);
    setAllReimbursements(rList);
    setPayments(pList);
    setAllSplits(sList);
  };

  const balances = useMemo(() => {
    // Calculamos tudo em centavos para evitar erros cumulativos
    const bCents: Record<string, { share: number, paid: number }> = {};
    
    trip.couples.forEach(c => bCents[c.id] = { share: 0, paid: 0 });

    payments.forEach(p => {
      if (bCents[p.paidByCoupleId]) bCents[p.paidByCoupleId].paid += Money.toCents(p.paidAmountBrl);
    });

    allSplits.forEach(s => {
      if (bCents[s.coupleId]) bCents[s.coupleId].share += Money.toCents(s.amountBrl);
    });

    allReimbursements.filter(r => r.status === 'paid').forEach(r => {
      const rCents = Money.toCents(r.amountBrl);
      if (bCents[r.fromCoupleId]) bCents[r.fromCoupleId].paid += rCents;
      if (bCents[r.toCoupleId]) bCents[r.toCoupleId].paid -= rCents;
    });

    const finalBalances: Record<string, { share: number, paid: number, net: number }> = {};
    Object.keys(bCents).forEach(k => {
      finalBalances[k] = {
        share: Money.fromCents(bCents[k].share),
        paid: Money.fromCents(bCents[k].paid),
        net: Money.fromCents(bCents[k].paid - bCents[k].share)
      };
    });
    return finalBalances;
  }, [allSplits, payments, allReimbursements, trip.couples]);

  const suggestedGlobalTransfers = useMemo(() => {
    const debtors = Object.keys(balances)
      .filter(k => balances[k].net < -0.009)
      .map(k => ({ id: k, cents: Math.abs(Money.toCents(balances[k].net)) }));
      
    const creditors = Object.keys(balances)
      .filter(k => balances[k].net > 0.009)
      .map(k => ({ id: k, cents: Money.toCents(balances[k].net) }));
    
    const transfers: Array<{ from: string, to: string, amount: number }> = [];
    
    let dIdx = 0;
    let cIdx = 0;
    
    while (dIdx < debtors.length && cIdx < creditors.length) {
      const amountCents = Math.min(debtors[dIdx].cents, creditors[cIdx].cents);
      if (amountCents > 0) {
        transfers.push({ from: debtors[dIdx].id, to: creditors[cIdx].id, amount: Money.fromCents(amountCents) });
      }
      
      debtors[dIdx].cents -= amountCents;
      creditors[cIdx].cents -= amountCents;
      
      if (debtors[dIdx].cents <= 0) dIdx++;
      if (creditors[cIdx].cents <= 0) cIdx++;
    }
    
    return transfers;
  }, [balances]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Acerto de Contas</h2>
        <p className="text-gray-500 mt-2">Saldo consolidado baseado nos rachas definidos em cada item</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trip.couples.map(c => {
          const b = balances[c.id];
          const isCreditor = b.net > 0.009;
          const isDebtor = b.net < -0.009;

          return (
            <Card key={c.id} className={`border-2 transition-all ${isCreditor ? 'border-emerald-500/30 bg-emerald-500/5' : isDebtor ? 'border-red-500/30 bg-red-500/5' : 'border-gray-800'}`}>
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{c.name}</p>
               <div className="mt-4 flex justify-between items-end">
                  <div>
                     <p className="text-[10px] text-gray-600 uppercase font-black">Saldo Líquido</p>
                     <p className={`text-3xl font-black ${isCreditor ? 'text-emerald-400' : isDebtor ? 'text-red-400' : 'text-gray-400'}`}>
                        {isCreditor ? '+' : ''} R$ {Money.format(b.net)}
                     </p>
                  </div>
                  <Badge color={isCreditor ? 'green' : isDebtor ? 'red' : 'gray'}>
                     {isCreditor ? 'A RECEBER' : isDebtor ? 'DEVEDOR' : 'QUITE'}
                  </Badge>
               </div>
               <div className="mt-6 pt-4 border-t border-gray-800/30 space-y-2">
                  <div className="flex justify-between text-[10px] text-gray-600"><span>Sua cota total nos rachas:</span><span>R$ {Money.format(b.share)}</span></div>
                  <div className="flex justify-between text-[10px] text-gray-600"><span>Total desembolsado por você:</span><span>R$ {Money.format(b.paid)}</span></div>
               </div>
            </Card>
          );
        })}
      </div>

      <section className="space-y-4">
         <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Transferências Recomendadas (Para Liquidar Viagem)</h3>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {suggestedGlobalTransfers.map((t, idx) => (
               <Card key={idx} className="flex items-center justify-between !p-4 !bg-gray-950 border border-indigo-500/20 shadow-xl">
                  <div className="flex-1">
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-200">{trip.couples.find(c => c.id === t.from)?.name}</span>
                        <div className="flex-1 h-px bg-gray-800 border-dashed border-b mx-2" />
                        <span className="text-sm font-bold text-indigo-400">{trip.couples.find(c => c.id === t.to)?.name}</span>
                     </div>
                     <div className="flex justify-between items-center mt-2">
                        <p className="text-xl font-black text-white">R$ {Money.format(t.amount)}</p>
                        <Badge color="yellow">ACERTO GLOBAL</Badge>
                     </div>
                  </div>
                  <div className="ml-6 flex flex-col gap-2">
                     <Button variant="primary" className="text-[10px] py-2 px-4" onClick={() => {
                        alert('Para liquidar um saldo global, registre um pagamento avulso ou marque os reembolsos individuais das despesas como pagos.');
                     }}>Como Liquidar?</Button>
                     <Button variant="ghost" className="text-[10px] py-1" onClick={() => { navigator.clipboard.writeText(`Oi ${trip.couples.find(c => c.id === t.to)?.name}, segundo o TripDivide meu saldo global devedor é R$ ${Money.format(t.amount)}. Me manda o PIX para eu liquidar?`); alert('Mensagem copiada!'); }}>Copiar Cobrança</Button>
                  </div>
               </Card>
            ))}
            {suggestedGlobalTransfers.length === 0 && (
               <div className="col-span-full py-20 bg-gray-900 border border-dashed border-gray-800 rounded-2xl flex flex-col items-center">
                  <span className="text-4xl mb-4">🥂</span>
                  <p className="font-bold text-gray-100">Viagem Liquidada!</p>
                  <p className="text-xs text-gray-600 mt-1 uppercase tracking-widest font-black">Nenhum acerto global pendente.</p>
               </div>
            )}
         </div>
      </section>

      <section className="space-y-4">
         <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Detalhes por Item (Reembolsos)</h3>
         <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-left bg-gray-900">
               <thead className="bg-gray-950 text-[10px] font-black uppercase text-gray-600 border-b border-gray-800">
                  <tr>
                     <th className="p-4">Item</th>
                     <th className="p-4">De</th>
                     <th className="p-4">Para</th>
                     <th className="p-4">Valor</th>
                     <th className="p-4">Status</th>
                     <th className="p-4 text-right">Ação</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-800">
                  {allReimbursements.map(r => (
                     <tr key={r.id} className="text-xs group hover:bg-gray-800/40">
                        <td className="p-4 font-bold text-gray-400">{expenses.find(e => e.id === r.expenseId)?.title || 'Ajuste'}</td>
                        <td className="p-4">{trip.couples.find(c => c.id === r.fromCoupleId)?.name}</td>
                        <td className="p-4 text-indigo-400">{trip.couples.find(c => c.id === r.toCoupleId)?.name}</td>
                        <td className="p-4 font-black">R$ {Money.format(r.amountBrl)}</td>
                        <td className="p-4">
                           <Badge color={r.status === 'paid' ? 'green' : 'yellow'}>{r.status.toUpperCase()}</Badge>
                        </td>
                        <td className="p-4 text-right">
                           {r.status === 'pending' && (
                              <Button variant="ghost" className="text-[10px] py-1" onClick={async () => { await dataProvider.markReimbursementAsPaid(r.id); loadData(); }}>Liquidado</Button>
                           )}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </section>
    </div>
  );
};

export default SettlementPage;
