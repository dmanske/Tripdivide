
import React, { useState, useEffect, useMemo } from 'react';
import { Trip, Expense, ExpenseStatus, Couple, ExpenseSplit, SplitType, Payment, Reimbursement, PaymentMethod } from '../types';
import { Card, Badge, Button, Modal, Input } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';
import { Money } from '../lib/money';

interface ExpenseDetailViewProps {
  trip: Trip;
  expense: Expense;
  onBack: () => void;
  onRefresh: () => void;
}

const ExpenseDetailView: React.FC<ExpenseDetailViewProps> = ({ trip, expense, onBack, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'split' | 'payments' | 'reimbursements'>('summary');
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [expense.id]);

  const loadData = async () => {
    const [sList, pList, rList] = await Promise.all([
      dataProvider.getExpenseSplits(expense.id),
      dataProvider.getPaymentsByExpense(expense.id),
      dataProvider.getReimbursements(trip.id)
    ]);
    setSplits(sList);
    setPayments(pList);
    setReimbursements(rList.filter(r => r.expenseId === expense.id));
  };

  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.paidAmountBrl, 0), [payments]);
  const paymentProgress = Math.min(100, Math.round((totalPaid / expense.amountBrl) * 100));

  const handleRegisterPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const amount = Number(data.get('amount'));
    
    await dataProvider.savePayment({
      id: '',
      tripId: trip.id,
      expenseId: expense.id,
      paidByCoupleId: data.get('coupleId') as string,
      method: data.get('method') as PaymentMethod,
      paidAmountBrl: amount,
      paidAt: new Date().toISOString()
    });
    
    setIsPaymentModalOpen(false);
    onRefresh();
    loadData();
  };

  const handleUpdateSplitType = async (type: SplitType) => {
    let newSplits: ExpenseSplit[] = [];
    
    if (type === SplitType.EQUAL) {
      const splitAmounts = Money.splitEqual(expense.amountBrl, trip.couples.length);
      newSplits = trip.couples.map((c, i) => ({
        id: Math.random().toString(36).substr(2, 9),
        expenseId: expense.id,
        coupleId: c.id,
        splitType: type,
        amountBrl: splitAmounts[i]
      }));
    } else if (type === SplitType.PER_PERSON) {
      const weights = trip.couples.map(c => c.members.length);
      const splitAmounts = Money.splitByWeight(expense.amountBrl, weights);
      
      newSplits = trip.couples.map((c, i) => ({
        id: Math.random().toString(36).substr(2, 9),
        expenseId: expense.id,
        coupleId: c.id,
        splitType: type,
        amountBrl: splitAmounts[i],
        value: c.members.length 
      }));
    }

    if (newSplits.length > 0) {
      await dataProvider.updateExpenseSplits(expense.id, newSplits);
      loadData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white group">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span className="text-xs font-black uppercase tracking-widest">Lista de Fechados</span>
        </button>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => setIsPaymentModalOpen(true)}>+ Adicionar Pagamento</Button>
           <Button variant="primary" onClick={() => setActiveTab('split')}>Ajustar Racha</Button>
        </div>
      </div>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-800">
         <div className="space-y-2">
            <div className="flex gap-2">
               <Badge color="indigo">{expense.category}</Badge>
               <Badge color={expense.status === ExpenseStatus.PAID ? 'green' : 'yellow'}>{expense.status.toUpperCase()}</Badge>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{expense.title}</h1>
            <p className="text-lg text-gray-500 font-medium">Segmento: {trip.segments.find(s => s.id === expense.segmentId)?.name || 'Geral'}</p>
         </div>
         <div className="text-right space-y-2">
            <div className="flex items-center gap-4 justify-end">
               <div>
                  <p className="text-[10px] font-black text-gray-600 uppercase">Pago</p>
                  <p className="text-lg font-black text-emerald-400">R$ {Money.format(totalPaid)}</p>
               </div>
               <div className="w-px h-8 bg-gray-800" />
               <div>
                  <p className="text-[10px] font-black text-gray-600 uppercase">Total Geral</p>
                  <p className="text-3xl font-black text-white">R$ {Money.format(expense.amountBrl)}</p>
               </div>
            </div>
            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
               <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${paymentProgress}%` }} />
            </div>
         </div>
      </header>

      <div className="flex border-b border-gray-800 overflow-x-auto">
        {(['summary', 'split', 'payments', 'reimbursements'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab === 'summary' ? 'Resumo' : tab === 'split' ? 'Divisão (Racha)' : tab === 'payments' ? 'Pagamentos' : 'Reembolsos Automáticos'}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'summary' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
              <Card title="Dados Técnicos">
                 {expense.hotelDetails && (
                   <div className="space-y-4">
                      <p className="text-xs text-gray-400">Hotel: {expense.hotelDetails.roomType || 'Standard'}</p>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <p className="text-[10px] text-gray-600 uppercase font-black">Check-in</p>
                            <p className="text-sm font-bold text-gray-200">{expense.hotelDetails.checkin}</p>
                         </div>
                         <div>
                            <p className="text-[10px] text-gray-600 uppercase font-black">Check-out</p>
                            <p className="text-sm font-bold text-gray-200">{expense.hotelDetails.checkout}</p>
                         </div>
                      </div>
                   </div>
                 )}
                 {!expense.hotelDetails && <p className="text-gray-600 italic">Nenhum detalhe técnico específico disponível.</p>}
              </Card>
              <Card title="Notas e Observações">
                 <p className="text-sm text-gray-400 leading-relaxed">{expense.notesGroup || 'Sem notas adicionais para o grupo.'}</p>
              </Card>
           </div>
        )}

        {activeTab === 'split' && (
           <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Como este custo é dividido?</h3>
                 <div className="flex gap-2">
                    <Button variant="ghost" className="text-[10px]" onClick={() => handleUpdateSplitType(SplitType.EQUAL)}>Igualitário</Button>
                    <Button variant="ghost" className="text-[10px]" onClick={() => handleUpdateSplitType(SplitType.PER_PERSON)}>Por Pessoa</Button>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {splits.map(s => {
                   const couple = trip.couples.find(c => c.id === s.coupleId);
                   return (
                     <Card key={s.id} className="text-center group border-2 hover:border-indigo-500 transition-all">
                        <p className="text-[10px] text-gray-500 uppercase font-black mb-1">{couple?.name}</p>
                        <p className="text-2xl font-black text-white">R$ {Money.format(s.amountBrl)}</p>
                        <Badge color="indigo" className="mt-2">
                           {s.splitType === SplitType.EQUAL ? 'Igual' : `${s.value} Pessoas`}
                        </Badge>
                     </Card>
                   );
                 })}
              </div>
           </div>
        )}

        {activeTab === 'payments' && (
           <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Histórico de Pagamentos Efetuados</h3>
                 <Button variant="primary" onClick={() => setIsPaymentModalOpen(true)}>+ Novo Pagamento</Button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                 <table className="w-full text-left bg-gray-900">
                    <thead className="bg-gray-950 text-[10px] uppercase font-black text-gray-600 border-b border-gray-800">
                       <tr>
                          <th className="p-4">Data</th>
                          <th className="p-4">Quem Pagou</th>
                          <th className="p-4">Método</th>
                          <th className="p-4 text-right">Valor Pago</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                       {payments.map(p => (
                         <tr key={p.id} className="text-sm">
                            <td className="p-4 text-gray-400">{new Date(p.paidAt).toLocaleDateString('pt-BR')}</td>
                            <td className="p-4 text-white font-bold">{trip.couples.find(c => c.id === p.paidByCoupleId)?.name}</td>
                            <td className="p-4"><Badge color="indigo">{p.method.toUpperCase()}</Badge></td>
                            <td className="p-4 text-right font-black text-emerald-400">R$ {Money.format(p.paidAmountBrl)}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'reimbursements' && (
           <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {reimbursements.map(r => (
                    <Card key={r.id} className={`flex items-center justify-between !p-4 border-2 ${r.status === 'paid' ? 'opacity-40 border-gray-800' : 'border-indigo-500/30'}`}>
                       <div className="flex-1">
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-bold text-white">{trip.couples.find(c => c.id === r.fromCoupleId)?.name}</span>
                             <span className="text-[10px] text-gray-600 font-black uppercase">deve para</span>
                             <span className="text-sm font-bold text-indigo-400">{trip.couples.find(c => c.id === r.toCoupleId)?.name}</span>
                          </div>
                          <p className="text-lg font-black text-white mt-1">R$ {Money.format(r.amountBrl)}</p>
                       </div>
                       <div className="flex gap-2">
                          {r.status === 'pending' ? (
                             <Button variant="primary" className="text-[10px] py-1" onClick={async () => { await dataProvider.markReimbursementAsPaid(r.id); loadData(); }}>Marcar Pago</Button>
                          ) : <Badge color="green">LIQUIDADO</Badge>}
                       </div>
                    </Card>
                 ))}
              </div>
           </div>
        )}
      </div>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Registrar Pagamento">
         <form onSubmit={handleRegisterPayment} className="space-y-4">
            <Input as="select" label="Quem pagou?" name="coupleId" required>
               {trip.couples.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Input>
            <div className="grid grid-cols-2 gap-4">
               <Input as="select" label="Método" name="method" required>
                  <option value={PaymentMethod.PIX}>PIX</option>
                  <option value={PaymentMethod.CREDIT_CARD}>Cartão</option>
                  <option value={PaymentMethod.CASH}>Espécie</option>
               </Input>
               <Input label="Valor (R$)" name="amount" type="number" step="0.01" defaultValue={expense.amountBrl} required />
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-800">
               <Button variant="primary" type="submit">Confirmar</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
};

export default ExpenseDetailView;
