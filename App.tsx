
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import Auth from './components/Auth';
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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<ViewState>({ type: 'dashboard' });
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [showLanding, setShowLanding] = useState(true);

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadData = async () => {
    if (!user) return;
    
    const tripsList = await dataProvider.getTrips();
    if (tripsList.length > 0) {
      const currentTrip = tripsList[0];
      
      // Load related data
      const [couples, segments, vs, qs, es] = await Promise.all([
        dataProvider.getCouples(currentTrip.id),
        dataProvider.getSegments(currentTrip.id),
        dataProvider.getVendors(currentTrip.id),
        dataProvider.getQuotes(currentTrip.id),
        dataProvider.getExpenses(currentTrip.id)
      ]);

      // Load travelers for each couple
      const travelers = await dataProvider.getTravelers(currentTrip.id);
      
      // Build couples with members
      const couplesWithMembers = couples.map(c => ({
        id: c.id,
        name: c.name,
        members: travelers
          .filter(t => t.couple_id === c.id)
          .map(t => ({
            id: t.id,
            name: t.full_name,
            isChild: t.type !== 'Adulto'
          }))
      }));

      // Build segments
      const segmentsFormatted = segments.map(s => ({
        id: s.id,
        name: s.name,
        startDate: s.start_date,
        endDate: s.end_date
      }));

      // Build complete trip object
      const completeTrip: Trip = {
        id: currentTrip.id,
        name: currentTrip.name,
        startDate: currentTrip.start_date,
        endDate: currentTrip.end_date,
        consensusRule: currentTrip.consensus_rule,
        categories: currentTrip.categories,
        couples: couplesWithMembers,
        segments: segmentsFormatted.length > 0 ? segmentsFormatted : [{ id: 'seg-all', name: 'Geral', startDate: '', endDate: '' }]
      };

      setTrip(completeTrip);
      setVendors(vs);
      setQuotes(qs);
      setExpenses(es);
    } else {
      setTrip(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  if (authLoading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500 animate-pulse font-black uppercase tracking-widest italic">Carregando...</div>;
  }

  // Show landing page if not logged in
  if (!user) {
    if (showLanding) {
      return (
        <main className="bg-[#02040a]">
          <LandingHero
            onCreateTrip={() => setShowLanding(false)}
            hasTrip={false}
            onEnter={() => setShowLanding(false)}
          />
          <HowItWorks />
        </main>
      );
    }
    return <Auth onSuccess={() => setAuthLoading(false)} />;
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500 animate-pulse font-black uppercase tracking-widest italic">Iniciando TripDivide...</div>;
  }

  const handleCreateInitialTrip = async () => {
    const newTrip = await dataProvider.saveTrip({
      name: 'Minha Nova Viagem',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      consensusRule: '2/3',
      categories: ['Voo', 'Hospedagem', 'Aluguel de Carro', 'Restaurantes', 'Diversos']
    });

    // Create default couple
    await dataProvider.saveCouple(newTrip.id, { name: 'Grupo Principal' });
    
    // Create default segment
    await dataProvider.saveSegment({
      tripId: newTrip.id,
      name: 'Geral',
      startDate: '',
      endDate: ''
    });

    await loadData();
    setShowLanding(false);
  };

  if (showLanding) {
    return (
      <main className="bg-[#02040a]">
        <LandingHero
          onCreateTrip={handleCreateInitialTrip}
          hasTrip={!!trip}
          onEnter={() => setShowLanding(false)}
        />
        <HowItWorks />
      </main>
    );
  }

  if (!trip) {
    return (
      <main className="bg-[#02040a]">
        <LandingHero onCreateTrip={handleCreateInitialTrip} hasTrip={false} />
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
    <Layout activeTab={view.type.split('-')[0]} setActiveTab={navigateTo} tripName={trip.name} userEmail={user?.email}>
      {renderContent()}
    </Layout>
  );
};

export default App;
