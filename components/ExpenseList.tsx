
import React, { useState, useMemo } from 'react';
import { Trip, Expense, ExpenseStatus, Couple } from '../types';
import { Card, Badge, Button, Input } from './CommonUI';

interface ExpenseListProps {
  trip: Trip;
  expenses: Expense[];
  onRefresh: () => void;
  onNavigateToExpense: (id: string) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ trip, expenses, onRefresh, onNavigateToExpense }) => {
  const [filters, setFilters] = useState({
    segment: 'all',
    category: 'all',
    status: 'all',
    search: ''
  });

  const summary = useMemo(() => {
    const total = expenses.filter(e => e.status !== ExpenseStatus.CANCELLED).reduce((sum, e) => sum + e.amountBrl, 0);
    const confirmed = expenses.filter(e => e.status === ExpenseStatus.CONFIRMED).reduce((sum, e) => sum + e.amountBrl, 0);
    const paid = expenses.filter(e => e.status === ExpenseStatus.PAID).reduce((sum, e) => sum + e.amountBrl, 0);
    return { total, confirmed, paid };
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(filters.search.toLowerCase()) || 
                            e.category.toLowerCase().includes(filters.search.toLowerCase());
      const matchesSegment = filters.segment === 'all' || e.segmentId === filters.segment;
      const matchesCategory = filters.category === 'all' || e.category === filters.category;
      const matchesStatus = filters.status === 'all' || e.status === filters.status;
      return matchesSearch && matchesSegment && matchesCategory && matchesStatus;
    }).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }, [expenses, filters]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Itens Fechados</h2>
          <p className="text-gray-500">Gestão de despesas oficiais e racha</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={onRefresh}>Sincronizar</Button>
           <Button variant="primary">Exportar PDF</Button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="!bg-indigo-600/5 !border-indigo-500/20">
          <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Total Fechado</p>
          <p className="text-3xl font-black text-white">R$ {summary.total.toLocaleString('pt-BR')}</p>
        </Card>
        <Card className="!bg-amber-600/5 !border-amber-500/20">
          <p className="text-[10px] font-black text-amber-400 uppercase mb-1">Total Confirmado (Pendente)</p>
          <p className="text-3xl font-black text-white">R$ {summary.confirmed.toLocaleString('pt-BR')}</p>
        </Card>
        <Card className="!bg-emerald-600/5 !border-emerald-500/20">
          <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Total Efetivamente Pago</p>
          <p className="text-3xl font-black text-white">R$ {summary.paid.toLocaleString('pt-BR')}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="!p-4 bg-gray-900/40 border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Input placeholder="Buscar por título ou categoria..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
           <Input as="select" value={filters.segment} onChange={e => setFilters({...filters, segment: e.target.value})}>
              <option value="all">Todos os Segmentos</option>
              {trip.segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
           </Input>
           <Input as="select" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
              <option value="all">Todas Categorias</option>
              {trip.categories.map(c => <option key={c} value={c}>{c}</option>)}
           </Input>
           <Input as="select" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option value="all">Todos Status</option>
              <option value={ExpenseStatus.CONFIRMED}>Confirmado</option>
              <option value={ExpenseStatus.PAID}>Pago</option>
              <option value={ExpenseStatus.PLANNED}>Planejado</option>
           </Input>
        </div>
      </Card>

      {/* Expenses Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-800">
        <table className="w-full text-left border-collapse bg-gray-900">
          <thead className="bg-gray-950 text-[10px] font-black uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th className="p-4">Título / Segmento</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Fornecedor / Fonte</th>
              <th className="p-4">Valor Total</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredExpenses.map(e => (
              <tr 
                key={e.id} 
                className="hover:bg-gray-800/40 transition-colors cursor-pointer group"
                onClick={() => onNavigateToExpense(e.id)}
              >
                <td className="p-4">
                  <div className="font-bold text-gray-100 group-hover:text-indigo-400 transition-colors">{e.title}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-black">{trip.segments.find(s => s.id === e.segmentId)?.name || 'Geral'}</div>
                </td>
                <td className="p-4">
                  <Badge color="indigo">{e.category}</Badge>
                </td>
                <td className="p-4">
                  {e.vendor_profile_id ? (
                    <div className="text-sm text-gray-300 font-medium">Fornecedor vinculado</div>
                  ) : e.source_type ? (
                    <div className="flex items-center gap-2">
                      <Badge color="amber" className="text-[9px]">Sem fornecedor</Badge>
                      <span className="text-xs text-gray-500">
                        {e.source_type === 'link' ? '🔗' : e.source_type === 'texto' ? '📄' : '✍️'} 
                        {e.source_type}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600 italic">Não informado</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="font-black text-white">R$ {e.amountBrl.toLocaleString('pt-BR')}</div>
                  <div className="text-[10px] text-gray-600">{e.currency} {e.amount.toLocaleString()} ({e.exchangeRate})</div>
                </td>
                <td className="p-4">
                  <Badge color={e.status === ExpenseStatus.PAID ? 'green' : e.status === ExpenseStatus.CONFIRMED ? 'yellow' : 'gray'}>
                    {e.status.toUpperCase()}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  <Button variant="ghost" className="text-[10px] py-1 opacity-0 group-hover:opacity-100 transition-opacity">Ver Detalhes</Button>
                </td>
              </tr>
            ))}
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={6} className="p-20 text-center text-gray-600 italic">Nenhuma despesa oficial encontrada com estes filtros.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseList;
