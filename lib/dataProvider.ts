import { supabaseDataProvider } from './supabaseDataProvider';
import { TravelerIssue, Traveler, Trip } from '../types';

// Re-export Supabase data provider as the main data provider
export const dataProvider = {
  ...supabaseDataProvider,
  
  // Helper functions
  computeTravelerIssues: (t: Traveler, trip: Trip): TravelerIssue[] => {
    const issues: TravelerIssue[] = [];
    if (!t.phone) issues.push({ type: 'warning', message: 'Sem telefone de contato' });
    if (t.docType === 'Passaporte' && (!t.docNumber || !t.docExpiry)) {
      issues.push({ type: 'error', message: 'Dados de passaporte pendentes' });
    }
    return issues;
  }
};
