import React, { useState, useEffect, useRef } from 'react';
import { supabaseDataProvider } from '../lib/supabaseDataProvider';
import { Button } from './CommonUI';
import { ICONS } from '../constants';

interface TripSwitcherProps {
  currentTripId: string | null;
  currentTripName: string;
  onTripChange: (tripId: string) => void;
  onCreateNew: () => void;
}

const TripSwitcher: React.FC<TripSwitcherProps> = ({ currentTripId, currentTripName, onTripChange, onCreateNew }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadTrips();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const allTrips = await supabaseDataProvider.getTrips();
      setTrips(allTrips.filter((t: any) => t.status !== 'archived'));
    } catch (error) {
      console.error('Erro ao carregar viagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = async (tripId: string) => {
    try {
      await supabaseDataProvider.setActiveTrip(tripId);
      onTripChange(tripId);
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao trocar viagem:', error);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg hover:border-indigo-600/50 transition-all"
      >
        <ICONS.Dashboard className="w-4 h-4 text-indigo-400" />
        <div className="text-left">
          <div className="text-xs text-gray-500 font-bold uppercase">Viagem Ativa</div>
          <div className="text-sm font-bold text-white">{currentTripName}</div>
        </div>
        <ICONS.ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Carregando...</div>
          ) : (
            <>
              {/* Viagens Ativas */}
              <div className="p-2">
                <div className="text-xs font-bold text-gray-500 uppercase px-2 py-1">Viagens</div>
                {trips.filter(t => t.status === 'active').map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => handleSelectTrip(trip.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                      trip.id === currentTripId
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <div className="font-bold text-sm">{trip.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                      {trip.destinations && trip.destinations.length > 0 && (
                        <span className="ml-2">• {trip.destinations[0]}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Rascunhos */}
              {trips.filter(t => t.status === 'draft').length > 0 && (
                <div className="p-2 border-t border-gray-800">
                  <div className="text-xs font-bold text-gray-500 uppercase px-2 py-1">Rascunhos</div>
                  {trips.filter(t => t.status === 'draft').map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => handleSelectTrip(trip.id)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-sm">{trip.name || 'Viagem sem nome'}</div>
                        <span className="px-1.5 py-0.5 bg-yellow-600/20 text-yellow-400 text-[10px] font-bold rounded">RASCUNHO</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Ações */}
              <div className="p-2 border-t border-gray-800">
                <Button
                  onClick={() => {
                    onCreateNew();
                    setIsOpen(false);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-sm"
                >
                  <ICONS.Plus className="w-4 h-4 mr-2" />
                  Nova Viagem
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TripSwitcher;
