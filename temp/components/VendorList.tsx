
import React, { useState, useMemo, useEffect } from 'react';
import { Trip, Vendor, Quote, QuoteStatus } from '../types';
import { Card, Button, Badge, Input, Modal } from './CommonUI';
import { dataProvider } from '../lib/dataProvider';

interface VendorListProps {
  trip: Trip;
  onRefresh: () => void;
  onNavigateToVendor: (id: string) => void;
  onNavigateToWizard: () => void;
}

const VendorList: React.FC<VendorListProps> = ({ trip, onRefresh, onNavigateToVendor, onNavigateToWizard }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadData();
  }, [trip.id]);

  const loadData = async () => {
    const vList = await dataProvider.getVendors(trip.id);
    setVendors(vList);
  };

  const filteredVendors = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return vendors.filter(v => {
      const name = v.name || '';
      const tags = v.tags || [];
      const matchesSearch = name.toLowerCase().includes(s) || tags.some(t => t.toLowerCase().includes(s));
      const matchesCategory = filterCategory === 'all' || v.categories.includes(filterCategory);
      return matchesSearch && matchesCategory;
    });
  }, [vendors, searchTerm, filterCategory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Fornecedores</h2>
          <p className="text-gray-500">Gestão de parceiros e reputação</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => onRefresh()}>Atualizar</Button>
           <Button variant="primary" onClick={onNavigateToWizard}>+ Novo Fornecedor</Button>
        </div>
      </header>

      <Card className="!p-4 bg-gray-900/40 border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="md:col-span-2">
              <Input placeholder="Buscar fornecedor ou tag..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
           <Input as="select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">Todas as categorias</option>
              {trip.categories.map(c => <option key={c} value={c}>{c}</option>)}
           </Input>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map(v => {
          const isReliable = v.rating >= 4 && v.riskFlags.length === 0;
          return (
            <Card key={v.id} onClick={() => onNavigateToVendor(v.id)} className="group relative cursor-pointer border-2 hover:border-indigo-500 transition-all">
              {v.preferred && <div className="absolute top-0 right-0 w-10 h-10 bg-indigo-600 text-white flex items-center justify-center font-bold text-lg rounded-bl-2xl">⭐</div>}
              <div className="flex flex-col gap-4">
                 <div className="flex justify-between items-start pr-8">
                    <div>
                       <h4 className="text-xl font-black text-white uppercase leading-tight group-hover:text-indigo-400 transition-colors">{v.name}</h4>
                       <div className="flex flex-wrap gap-1 mt-1">
                          {v.categories.map(cat => <span key={cat} className="text-[9px] font-black uppercase text-indigo-400">{cat}</span>)}
                       </div>
                    </div>
                    {isReliable && <Badge color="green">OK</Badge>}
                 </div>
                 <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => <span key={s} className={`text-xs ${v.rating >= s ? 'text-amber-400' : 'text-gray-800'}`}>★</span>)}
                 </div>
                 <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                    <span className="text-[10px] text-gray-600 font-bold uppercase">SLA: {v.slaNotes || 'N/D'}</span>
                    <Button variant="ghost" className="text-[10px] py-1 h-6" onClick={(e) => { e.stopPropagation(); onNavigateToVendor(v.id); }}>Ver Detalhes</Button>
                 </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default VendorList;
