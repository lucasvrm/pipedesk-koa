import { createClient } from '@supabase/supabase-js';
import { Database } from './databaseTypes';

// Função auxiliar para garantir HTTPS
const ensureProtocol = (url: string | undefined) => {
  if (!url) return '';
  // Remove espaços acidentais
  const cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return `https://${cleanUrl}`;
  }
  return cleanUrl;
};

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseUrl = ensureProtocol(rawUrl);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log de diagnóstico (mascarado para segurança)
console.log('[Supabase] Client Init:', {
  rawUrl: rawUrl ? 'Defined' : 'Missing',
  processedUrl: supabaseUrl, // Verifique no console se começa com https://
  hasKey: !!supabaseAnonKey
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("FATAL: Variáveis de ambiente do Supabase não encontradas.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  // Configuração de retentativa global
  global: {
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        // Garante que requisições não fiquem pendentes para sempre
        signal: AbortSignal.timeout(10000) // Timeout de 10 segundos
      }).catch(err => {
        console.error('[Supabase] Fetch Error:', err);
        throw err;
      });
    }
  }
});