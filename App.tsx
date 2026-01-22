
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
import GeneralDashboard from './components/GeneralDashboard';
import TripList from './components/TripList';
import TripWizard from './components/TripWizard';
import TripDashboard from './components/TripDashboard';
import TravelerProfileList from './components/TravelerProfileList';
import VendorProfileList from './components/VendorProfileList';
import { Trip, Quote, Expense, Vendor } from './types';
import { dataProvider } from './lib/dataProvider';
import { supabaseDataProvider } from './lib/supabaseDataProvider';
import { Button } from './components/CommonUI';

type ViewState =
  | { type: 'general-dashboard' } // Dashboard geral (sem viagem ativa)
  | { type: 'trips' } // Lista de viagens
  | { type: 'trip-dashboard'; tripId: string } // Dashboard de uma viagem específica
  | { type: 'travelers'; tripId?: string } // Viajantes (global ou por viagem)
  | { type: 'traveler-detail'; id: string; tripId?: string }
  | { type: 'vendors'; tripId?: string } // Fornecedores (global ou por viagem)
  | { type: 'vendor-detail'; id: string; tripId?: string }
  | { type: 'vendor-edit'; id?: string; tripId?: string }
  | { type: 'quotes'; tripId: string }
  | { type: 'quote-detail'; id: string; tripId: string }
  | { type: 'quote-compare'; ids: string[]; tripId: string }
  | { type: 'quote-edit'; id?: string; initialData?: Partial<Quote>; tripId: string }
  | { type: 'expenses'; tripId: string }
  | { type: 'expense-detail'; id: string; tripId: string }
  | { type: 'payments'; tripId: string }
  | { type: 'settlement'; tripId: string };

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<ViewState>({ type: 'general-dashboard' }); // Começa no dashboard geral
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null); // Viagem atualmente aberta (modo viagem)
  const [loading, setLoading] = useState(false); // Não carrega viagem automaticamente
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
      // Não carrega viagem automaticamente
      // Usuário começa no dashboard geral
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

  // Função para abrir uma viagem (entrar no modo viagem)
  const openTrip = async (tripId: string) => {
    await loadData(tripId);
    setActiveTripId(tripId);
    setView({ type: 'trip-dashboard', tripId });
  };

  // Função para fechar viagem (voltar ao modo geral)
  const closeTrip = () => {
    setActiveTripId(null);
    setTrip(null);
    setVendors([]);
    setQuotes([]);
    setExpenses([]);
    setView({ type: 'general-dashboard' });
  };

  const handleTripChange = async (tripId: string, forceNavigateToDashboard: boolean = false) => {
    await loadData(tripId);
    // Se forceNavigateToDashboard for true (ex: ao abrir viagem da lista), vai para dashboard
    // Caso contrário, mantém a view atual (ex: ao trocar viagem estando em Orçamentos)
    if (forceNavigateToDashboard) {
      setView({ type: 'trip-dashboard', tripId });
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
      // Modo Geral (sem viagem ativa)
      case 'general-dashboard': 
        return <GeneralDashboard onNavigate={(tab) => setView({ type: tab as any })} onOpenTrip={openTrip} />;
      
      case 'trips': 
        return <TripList onNavigateToTrip={(tripId) => openTrip(tripId)} onRefresh={() => {}} />;
      
      // Modo Viagem (com viagem ativa)
      case 'trip-dashboard': 
        if (!trip) return null;
        return <TripDashboard trip={trip} quotes={quotes} expenses={expenses} onNavigate={navigateTo} onRefresh={() => loadData(view.tripId)} />;
      
      case 'travelers': 
        if (view.tripId && trip) {
          // Modo viagem: viajantes vinculados
          return <TravelerList trip={trip} onRefresh={() => loadData(view.tripId!)} onNavigateToDetail={(id) => setView({ type: 'traveler-detail', id, tripId: view.tripId })} />;
        } else {
          // Modo geral: gerenciar perfis globais
          return <TravelerProfileList onNavigate={(tab) => setView({ type: tab as any })} />;
        }
      
      case 'traveler-detail': 
        if (!trip) return null;
        return <TravelerDetailPage trip={trip} travelerId={view.id} onBack={() => setView({ type: 'travelers', tripId: view.tripId })} onRefresh={() => loadData(activeTripId!)} />;

      case 'vendors': 
        if (view.tripId && trip) {
          // Modo viagem: fornecedores vinculados
          return <VendorList trip={trip} onRefresh={() => loadData(view.tripId!)} onNavigateToVendor={(id) => setView({ type: 'vendor-detail', id, tripId: view.tripId })} onNavigateToWizard={() => setView({ type: 'vendor-edit', tripId: view.tripId })} />;
        } else {
          // Modo geral: gerenciar perfis globais
          return <VendorProfileList onNavigate={(tab) => setView({ type: tab as any })} />;
        }
      
      case 'vendor-detail': {
        if (!trip) return null;
        const v = vendors.find(item => item.id === view.id);
        if (!v) return null;
        return <VendorDetailView trip={trip} vendor={v} onBack={() => setView({ type: 'vendors', tripId: view.tripId })} onEdit={() => setView({ type: 'vendor-edit', id: v.id, tripId: view.tripId })} onRefresh={() => loadData(activeTripId!)} onNavigateToQuote={(id) => setView({ type: 'quote-detail', id, tripId: activeTripId! })} onCreateQuote={() => setView({ type: 'quote-edit', tripId: activeTripId! })} />;
      }
      case 'vendor-edit': {
        if (!trip) return null;
        const v = vendors.find(item => item.id === view.id);
        return <VendorForm trip={trip} initialData={v || {}} onCancel={() => setView({ type: 'vendors', tripId: view.tripId })} onSave={async (vData) => { await dataProvider.saveVendor(vData); loadData(activeTripId!); setView({ type: 'vendors', tripId: view.tripId }); }} />;
      }

      case 'quotes': 
        if (!trip) return null;
        return <QuoteList
          trip={trip}
          vendors={vendors}
          quotes={quotes}
          onRefresh={() => loadData(view.tripId)}
          onNavigateToQuote={(id) => setView({ type: 'quote-detail', id, tripId: view.tripId })}
          onNavigateToWizard={(initialData) => setView({ type: 'quote-edit', initialData, tripId: view.tripId })}
          onNavigateToCompare={(ids) => setView({ type: 'quote-compare', ids, tripId: view.tripId })}
        />;
      case 'quote-detail': {
        if (!trip) return null;
        const q = quotes.find(item => item.id === view.id);
        if (!q) return null;
        return <QuoteDetailView trip={trip} quote={q} onBack={() => setView({ type: 'quotes', tripId: view.tripId })} onEdit={() => setView({ type: 'quote-edit', id: q.id, tripId: view.tripId })} onRefresh={() => loadData(view.tripId)} onNavigateToExpense={async () => { const exp = await dataProvider.closeQuoteToExpense(trip.id, q.id); if (exp) { await loadData(view.tripId); setView({ type: 'expense-detail', id: exp.id, tripId: view.tripId }); } }} onNavigateToQuote={(id) => setView({ type: 'quote-detail', id, tripId: view.tripId })} />;
      }
      case 'quote-compare': {
        if (!trip) return null;
        const qs = quotes.filter(q => view.ids.includes(q.id));
        return <ComparisonPage trip={trip} quotes={qs} onBack={() => setView({ type: 'quotes', tripId: view.tripId })} onRefresh={() => loadData(view.tripId)} onNavigateToQuote={(id) => setView({ type: 'quote-detail', id, tripId: view.tripId })} />;
      }
      case 'quote-edit': {
        if (!trip) return null;
        const q = quotes.find(item => item.id === view.id);
        const initial = view.initialData || {};
        return <QuoteWizard
          trip={trip}
          vendors={vendors}
          initialData={q || initial}
          onCancel={() => setView({ type: 'quotes', tripId: view.tripId })}
          onSave={async (qData) => { await dataProvider.saveQuote(qData); loadData(view.tripId); setView({ type: 'quotes', tripId: view.tripId }); }}
        />;
      }

      case 'expenses': 
        if (!trip) return null;
        return <ExpenseList trip={trip} expenses={expenses} onRefresh={() => loadData(view.tripId)} onNavigateToExpense={(id) => setView({ type: 'expense-detail', id, tripId: view.tripId })} />;
      case 'expense-detail': {
        if (!trip) return null;
        const exp = expenses.find(item => item.id === view.id);
        if (!exp) return null;
        return <ExpenseDetailView trip={trip} expense={exp} onBack={() => setView({ type: 'expenses', tripId: view.tripId })} onRefresh={() => loadData(view.tripId)} />;
      }
      case 'payments': 
        if (!trip) return null;
        return <PaymentsPage trip={trip} />;
      case 'settlement': 
        if (!trip) return null;
        return <SettlementPage trip={trip} />;
      default: 
        return <GeneralDashboard onNavigate={(tab) => setView({ type: tab as any })} onOpenTrip={openTrip} />;
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
      onCloseTrip={closeTrip}
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
