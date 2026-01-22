
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
import TravelerDetailPage from './components/TravelerDetailPage';
import QuoteDetailView from './components/QuoteDetailView';
import VendorDetailView from './components/VendorDetailView';
import QuoteWizard from './components/QuoteWizard';
import VendorForm from './components/VendorForm';
import ComparisonPage from './components/ComparisonPage';
import LandingHero from './components/LandingHero';
import HowItWorks from './components/HowItWorks';
import TripList from './components/TripList';
import TripWizard from './components/TripWizard';
import TripDashboard from './components/TripDashboard';
import { Trip, Quote, Expense, Vendor } from './types';
import { dataProvider } from './lib/dataProvider';
import { supabaseDataProvider } from './lib/supabaseDataProvider';
import { Button } from './components/CommonUI';

type ViewState =
  | { type: 'dashboard' }
  | { type: 'trips' }
  | { type: 'travelers' }
  | { type: 'traveler-detail'; id: string }
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
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTripWizard, setShowTripWizard] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('login');
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

  const loadData = async (tripId?: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Buscar viagem ativa ou usar tripId fornecido
      let currentTripId = tripId;
      if (!currentTripId) {
        currentTripId = await supabaseDataProvider.getActiveTrip();
      }

      if (!currentTripId) {
        // Buscar primeira viagem disponível
        const tripsList = await supabaseDataProvider.getTrips();
        const activeTrips = tripsList.filter((t: any) => t.status === 'active');
        if (activeTrips.length > 0) {
          currentTripId = activeTrips[0].id;
          await supabaseDataProvider.setActiveTrip(currentTripId);
        }
      }

      if (currentTripId) {
        setActiveTripId(currentTripId);
        const currentTrip = await supabaseDataProvider.getTripById(currentTripId);
        
        // Load related data
        const [couples, segments, vs, qs, es] = await Promise.all([
          dataProvider.getCouples(currentTripId),
          dataProvider.getSegments(currentTripId),
          dataProvider.getVendors(currentTripId),
          dataProvider.getQuotes(currentTripId),
          dataProvider.getExpenses(currentTripId)
        ]);

        // Load travelers for each couple
        const travelers = await dataProvider.getTravelers(currentTripId);
        
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
        setActiveTripId(null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
      // Se o usuário está logado, sair da landing page
      setShowLanding(false);
    }
  }, [user]);

  if (authLoading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500 animate-pulse font-black uppercase tracking-widest italic">Carregando...</div>;
  }

  const handleCreateInitialTrip = async () => {
    // Se não estiver logado, mostrar tela de cadastro
    if (!user) {
      setAuthMode('signup');
      setShowLanding(false);
      return;
    }
    // Se já estiver logado, apenas sair da landing e ir para o app
    setShowLanding(false);
  };

  const handleTripChange = async (tripId: string, forceNavigateToDashboard: boolean = false) => {
    await loadData(tripId);
    // Se forceNavigateToDashboard for true (ex: ao abrir viagem da lista), vai para dashboard
    // Caso contrário, mantém a view atual (ex: ao trocar viagem estando em Orçamentos)
    if (forceNavigateToDashboard) {
      setView({ type: 'dashboard' });
    }
    // Se não forçar, mantém a view atual (view não muda)
  };

  const handleCreateTrip = () => {
    setShowTripWizard(true);
  };

  // Show landing page if not logged in
  if (!user) {
    if (showLanding) {
      return (
        <>
          <main className="bg-[#02040a]">
            <LandingHero
              onCreateTrip={handleCreateInitialTrip}
              hasTrip={false}
              onEnter={() => setShowLanding(false)}
            />
            <HowItWorks />
          </main>
        </>
      );
    }
    return <Auth onSuccess={() => setAuthLoading(false)} initialMode={authMode} />;
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500 animate-pulse font-black uppercase tracking-widest italic">Iniciando TripDivide...</div>;
  }

  if (showLanding) {
    return (
      <>
        <main className="bg-[#02040a]">
          <LandingHero
            onCreateTrip={handleCreateInitialTrip}
            hasTrip={!!trip}
            onEnter={() => setShowLanding(false)}
          />
          <HowItWorks />
        </main>
        
        {/* Trip Wizard */}
        {showTripWizard && (
          <TripWizard
            onClose={() => setShowTripWizard(false)}
            onSave={async (tripData) => {
              const newTrip = await supabaseDataProvider.saveTrip(tripData);
              
              // Create default segment
              await dataProvider.saveSegment({
                tripId: newTrip.id,
                name: 'Geral',
                startDate: '',
                endDate: ''
              });

              setShowTripWizard(false);
              setShowLanding(false);
              await loadData(newTrip.id);
              setView({ type: 'dashboard' });
            }}
          />
        )}
      </>
    );
  }

  const navigateTo = (tab: string) => setView({ type: tab as any });

  // Se não tem viagem, mostrar tela vazia com opção de criar
  if (!trip) {
    return (
      <Layout 
        activeTab="dashboard" 
        setActiveTab={navigateTo} 
        tripId={null}
        tripName="Sem viagem" 
        userEmail={user?.email}
        onTripChange={handleTripChange}
        onCreateTrip={handleCreateTrip}
      >
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="max-w-md space-y-6">
            <div className="text-6xl mb-4">🌍</div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">
              Nenhuma viagem criada
            </h2>
            <p className="text-gray-400 text-lg">
              Crie sua primeira viagem para começar a organizar cotações, despesas e viajantes.
            </p>
            <Button
              variant="primary"
              onClick={handleCreateTrip}
              className="!px-8 !py-4 !text-lg font-black uppercase"
            >
              + Criar Primeira Viagem
            </Button>
          </div>
        </div>
        
        {/* Trip Wizard */}
        {showTripWizard && (
          <TripWizard
            onClose={() => setShowTripWizard(false)}
            onSave={async (tripData) => {
              const newTrip = await supabaseDataProvider.saveTrip(tripData);
              
              // Create default segment
              await dataProvider.saveSegment({
                tripId: newTrip.id,
                name: 'Geral',
                startDate: '',
                endDate: ''
              });

              setShowTripWizard(false);
              await loadData(newTrip.id);
              setView({ type: 'dashboard' });
            }}
          />
        )}
      </Layout>
    );
  }

  const renderContent = () => {
    switch (view.type) {
      case 'dashboard': return <TripDashboard trip={trip} quotes={quotes} expenses={expenses} onNavigate={navigateTo} onRefresh={loadData} />;
      case 'trips': return <TripList onNavigateToTrip={handleTripChange} onRefresh={loadData} />;
      case 'travelers': return <TravelerList trip={trip} onRefresh={loadData} onNavigateToDetail={(id) => setView({ type: 'traveler-detail', id })} />;
      case 'traveler-detail': return <TravelerDetailPage trip={trip} travelerId={view.id} onBack={() => setView({ type: 'travelers' })} onRefresh={loadData} />;

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
    <Layout 
      activeTab={view.type.split('-')[0]} 
      setActiveTab={navigateTo} 
      tripId={activeTripId}
      tripName={trip?.name || 'Sem viagem'} 
      userEmail={user?.email}
      onTripChange={handleTripChange}
      onCreateTrip={handleCreateTrip}
    >
      {renderContent()}
      
      {/* Trip Wizard */}
      {showTripWizard && (
        <TripWizard
          onClose={() => setShowTripWizard(false)}
          onSave={async (tripData) => {
            const newTrip = await supabaseDataProvider.saveTrip(tripData);
            
            // Create default segment
            await dataProvider.saveSegment({
              tripId: newTrip.id,
              name: 'Geral',
              startDate: '',
              endDate: ''
            });

            setShowTripWizard(false);
            setShowLanding(false);
            await loadData(newTrip.id);
            setView({ type: 'dashboard' });
          }}
        />
      )}
    </Layout>
  );
};

export default App;
