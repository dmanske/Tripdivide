
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import VendorList from './components/VendorList';
import QuoteList from './components/QuoteList';
import ExpenseList from './components/ExpenseList';
import ExpenseDetailView from './components/ExpenseDetailView';
import PaymentsPage from './components/PaymentsPage';
import SettlementPage from './components/SettlementPage';
import TravelerList from './components/TravelerList';
import QuoteDetailView from './components/QuoteDetailView';
import VendorDetailView from './components/VendorDetailView';
import QuoteWizard from './components/QuoteWizard';
import VendorForm from './components/VendorForm';
import ComparisonPage from './components/ComparisonPage';
import LandingHero from './components/LandingHero';
import HowItWorks from './components/HowItWorks';
import { Trip, Quote, Expense, Vendor } from './types';
import { dataProvider } from './lib/dataProvider';
import { Button } from './components/CommonUI';

type ViewState = 
  | { type: 'dashboard' }
  | { type: 'travelers' }
  | { type: 'vendors' }
  | { type: 'vendor-detail'; id: string }
  | { type: 'vendor-edit'; id?: string }
  | { type: 'quotes' }
  | { type: 'quote-detail'; id: string }
  | { type: 'quote-compare'; ids: string[] }
  | { type: 'quote-edit'; id?: string; prefillVendorId?: string; initialData?: Partial<Quote> }
  | { type: 'expenses' }
  | { type: 'expense-detail'; id: string }
  | { type: 'payments' }
  | { type: 'settlement' };

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>({ type: 'dashboard' });
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const loadData = async () => {
    const tripsList = await dataProvider.getTrips();
    if (tripsList.length > 0) {
      const currentTrip = tripsList[0];
      setTrip(currentTrip);
      
      const [vs, qs, es] = await Promise.all([
        dataProvider.getVendors(currentTrip.id),
        dataProvider.getQuotes(currentTrip.id),
        dataProvider.getExpenses(currentTrip.id)
      ]);
      
      setVendors(vs);
      setQuotes(qs);
      setExpenses(es);
    } else {
      setTrip(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500 animate-pulse font-black uppercase tracking-widest italic">Iniciando TripDivide...</div>;
  }

  const handleCreateInitialTrip = async () => {
    const newTrip: Trip = {
      id: 'trip-' + Math.random().toString(36).substr(2, 9),
      name: 'Minha Nova Viagem',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      segments: [{ id: 'seg-all', name: 'Geral', startDate: '', endDate: '' }],
      couples: [{ id: 'cp-1', name: 'Grupo Principal', members: [] }],
      categories: ['Voo', 'Hospedagem', 'Aluguel de Carro', 'Restaurantes', 'Diversos'],
      consensusRule: '2/3'
    };
    await dataProvider.saveTrip(newTrip);
    await loadData();
  };

  if (!trip) {
    return (
      <main className="bg-[#02040a]">
        <LandingHero onCreateTrip={handleCreateInitialTrip} />
        <HowItWorks />
      </main>
    );
  }

  const navigateTo = (tab: string) => setView({ type: tab as any });

  const renderContent = () => {
    switch (view.type) {
      case 'dashboard': return <Dashboard trip={trip} quotes={quotes} expenses={expenses} onNavigate={navigateTo} onRefresh={loadData} />;
      case 'travelers': return <TravelerList trip={trip} onRefresh={loadData} />;
      
      case 'vendors': return <VendorList trip={trip} onRefresh={loadData} onNavigateToVendor={(id) => setView({ type: 'vendor-detail', id })} onNavigateToWizard={() => setView({ type: 'vendor-edit' })} />;
      case 'vendor-detail': {
         const v = vendors.find(item => item.id === view.id);
         if (!v) return null;
         return <VendorDetailView trip={trip} vendor={v} onBack={() => setView({ type: 'vendors' })} onEdit={() => setView({ type: 'vendor-edit', id: v.id })} onRefresh={loadData} onNavigateToQuote={(id) => setView({ type: 'quote-detail', id })} onCreateQuote={() => setView({ type: 'quote-edit', prefillVendorId: v.id })} />;
      }
      case 'vendor-edit': {
         const v = vendors.find(item => item.id === view.id);
         return <VendorForm trip={trip} initialData={v || {}} onCancel={() => setView({ type: 'vendors' })} onSave={async (vData) => { await dataProvider.saveVendor(vData); loadData(); setView({ type: 'vendors' }); }} />;
      }

      case 'quotes': return <QuoteList 
        trip={trip} 
        vendors={vendors} 
        quotes={quotes} 
        onRefresh={loadData} 
        onNavigateToQuote={(id) => setView({ type: 'quote-detail', id })} 
        onNavigateToWizard={(initialData) => setView({ type: 'quote-edit', initialData })} 
        onNavigateToCompare={(ids) => setView({ type: 'quote-compare', ids })} 
      />;
      case 'quote-detail': {
         const q = quotes.find(item => item.id === view.id);
         if (!q) return null;
         return <QuoteDetailView trip={trip} quote={q} vendor={vendors.find(v => v.id === q.vendorId)} onBack={() => setView({ type: 'quotes' })} onEdit={() => setView({ type: 'quote-edit', id: q.id })} onRefresh={loadData} onNavigateToExpense={async () => { const exp = await dataProvider.closeQuoteToExpense(trip.id, q.id); if (exp) { await loadData(); setView({ type: 'expense-detail', id: exp.id }); } }} onNavigateToQuote={(id) => setView({ type: 'quote-detail', id })} />;
      }
      case 'quote-compare': {
         const qs = quotes.filter(q => view.ids.includes(q.id));
         return <ComparisonPage trip={trip} quotes={qs} onBack={() => setView({ type: 'quotes' })} onRefresh={loadData} onNavigateToQuote={(id) => setView({ type: 'quote-detail', id })} />;
      }
      case 'quote-edit': {
         const q = quotes.find(item => item.id === view.id);
         const initial = view.initialData || (view.prefillVendorId ? { vendorId: view.prefillVendorId, provider: vendors.find(v => v.id === view.prefillVendorId)?.name } : {});
         return <QuoteWizard 
            trip={trip} 
            vendors={vendors} 
            initialData={q || initial} 
            onCancel={() => setView({ type: 'quotes' })} 
            onSave={async (qData) => { await dataProvider.saveQuote(qData); loadData(); setView({ type: 'quotes' }); }} 
         />;
      }

      case 'expenses': return <ExpenseList trip={trip} expenses={expenses} onRefresh={loadData} onNavigateToExpense={(id) => setView({ type: 'expense-detail', id })} />;
      case 'expense-detail': {
         const exp = expenses.find(item => item.id === view.id);
         if (!exp) return null;
         return <ExpenseDetailView trip={trip} expense={exp} onBack={() => setView({ type: 'expenses' })} onRefresh={loadData} />;
      }
      case 'payments': return <PaymentsPage trip={trip} />;
      case 'settlement': return <SettlementPage trip={trip} />;
      default: return <Dashboard trip={trip} quotes={quotes} expenses={expenses} onNavigate={navigateTo} onRefresh={loadData} />;
    }
  };

  return (
    <Layout activeTab={view.type.split('-')[0]} setActiveTab={navigateTo} tripName={trip.name}>
      {renderContent()}
    </Layout>
  );
};

export default App;
