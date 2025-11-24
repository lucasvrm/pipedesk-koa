import { createClient } from '@supabase/supabase-js';
import { Database } from './databaseTypes';

// Função auxiliar para garantir que a URL tenha protocolo
const ensureProtocol = (url: string | undefined) => {
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

const supabaseUrl = ensureProtocol(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Em produção, não queremos lançar erro fatal que quebre a página inteira com tela branca,
  // mas logar o erro é crucial.
  console.error("FATAL: Supabase URL and Anon Key must be provided in environment variables.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});