// Formata telefone brasileiro
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove tudo que não é número
  const numbers = phone.replace(/\D/g, '');
  
  // Formata conforme o tamanho
  if (numbers.length === 11) {
    // Celular: (XX) XXXXX-XXXX
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (numbers.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (numbers.length === 13 && numbers.startsWith('55')) {
    // Com código do país +55
    return numbers.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
  }
  
  return phone;
};

// Remove formatação do telefone (apenas números)
export const unformatPhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

// Formata data para exibição (DD/MM/YYYY)
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Verifica se é uma data válida
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

// Formata data e hora para exibição (DD/MM/YYYY HH:MM)
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Verifica se é uma data válida
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Converte data do formato DD/MM/YYYY para YYYY-MM-DD (para input date)
export const dateToInput = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Verifica se é uma data válida
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Converte timestamp do Supabase para Date local
export const parseSupabaseDate = (timestamp: string | null | undefined): Date | null => {
  if (!timestamp) return null;
  
  // Supabase retorna timestamps em UTC, precisamos converter para local
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? null : date;
};

// Formata timestamp do Supabase para exibição
export const formatSupabaseDate = (timestamp: string | null | undefined): string => {
  const date = parseSupabaseDate(timestamp);
  return date ? formatDate(date) : '';
};

export const formatSupabaseDateTime = (timestamp: string | null | undefined): string => {
  const date = parseSupabaseDate(timestamp);
  return date ? formatDateTime(date) : '';
};
