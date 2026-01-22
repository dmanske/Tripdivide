
import React from 'react';
import { supabase } from '../lib/supabase';
import { ICONS } from '../constants.tsx';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tripName: string;
  userEmail?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, tripName, userEmail }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: ICONS.Dashboard },
    { id: 'travelers', label: 'Viajantes', icon: ICONS.Travelers },
    { id: 'vendors', label: 'Fornecedores', icon: ICONS.Vendors },
    { id: 'quotes', label: 'Orçamentos', icon: ICONS.Quotes },
    { id: 'expenses', label: 'Itens Fechados', icon: ICONS.Expenses },
    { id: 'payments', label: 'Fluxo de Caixa', icon: ICONS.Expenses },
    { id: 'settlement', label: 'Acerto de Contas', icon: ICONS.Settlement },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 hidden md:flex flex-col fixed h-full z-10 shadow-2xl">
        <div className="p-6 border-b border-gray-800 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold italic text-white shadow-lg shadow-indigo-600/30">TD</div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">TripDivide</h1>
          </div>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest truncate">{tripName}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-tight text-left ${
                  activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
           <div className="flex items-center gap-3 p-2 bg-gray-950 rounded-xl border border-gray-800">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 border border-indigo-500/30">
                {userEmail ? userEmail[0].toUpperCase() : 'U'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-bold truncate text-white uppercase">{userEmail || 'Usuário'}</p>
                <p className="text-[9px] text-gray-500 font-black uppercase">Organizador</p>
              </div>
           </div>
           <button
             onClick={handleLogout}
             className="w-full px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 hover:border-red-600/30 rounded-xl text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-tight transition-all"
           >
             Sair
           </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
