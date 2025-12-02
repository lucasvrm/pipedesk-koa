import { createClient } from '@supabase/supabase-js';
import { Database } from './databaseTypes';
import { safeFetch } from './safeFetch';

// Função auxiliar para garantir HTTPS
const ensureProtocol = (url: string | undefined) => {
  if (!url) return '';
  const cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return `https://${cleanUrl}`;
  }
  return cleanUrl;
};

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseUrl = ensureProtocol(rawUrl);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Logs para debug (confirmar que as chaves estão sendo lidas)
console.log('[Supabase] Client Init:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length || 0
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("FATAL: Variáveis de ambiente do Supabase não encontradas.");
}

// Cliente padrão, sem sobrescrever o fetch global
export const supabase = createClient<Database>(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: safeFetch
  }
});