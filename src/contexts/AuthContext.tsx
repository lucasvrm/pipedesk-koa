import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@/lib/types'

interface AuthContextType {
  user: SupabaseUser | null
  profile: User | null
  session: Session | null
  loading: boolean
  error: Error | null
  signInWithMagicLink: (email: string) => Promise<boolean>
  signIn: (email: string, password: string) => Promise<any>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<any>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<boolean>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const loadedProfileId = useRef<string | null>(null);

  // Função auxiliar de log com timestamp
  const log = (msg: string, data?: any) => {
    const time = new Date().toISOString().split('T')[1].slice(0, -1);
    console.log(`[Auth Debug ${time}] ${msg}`, data || '');
  };

  const fetchProfile = async (userId: string, userEmail?: string) => {
    log(`fetchProfile chamado para ID: ${userId}`);

    // Cache simples
    if (loadedProfileId.current === userId && profile) {
        log('Perfil já carregado em memória. Retornando.');
        return;
    }

    try {
      log('Iniciando query ao Supabase (profiles)...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      log('Query finalizada.', { hasData: !!data, error });

      if (error) {
        // Erro: Perfil não encontrado (PGRST116)
        if (error.code === 'PGRST116') {
          log('Perfil não encontrado (PGRST116). Tentando criar default...');
          const timestamp = Math.floor(Date.now() / 1000);
          const emailName = userEmail?.split('@')[0] || 'User';
          
          const newProfileData = {
              id: userId,
              username: `${emailName}_${timestamp}`, // Username único
              name: emailName,
              email: userEmail,
              role: 'client'
          };

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfileData as any)
            .select()
            .single();

          if (createError) {
             log('Erro ao criar perfil default:', createError);
          } else if (newProfile) {
             log('Perfil default criado com sucesso.');
             setProfile({ ...newProfile, avatar: newProfile.avatar_url });
             loadedProfileId.current = userId;
          }
        } else {
            // Outros erros (ex: rede, permissão)
            console.error('[Auth Debug] Erro ao buscar perfil:', error);
        }
      } else if (data) {
        // Sucesso
        log('Perfil carregado com sucesso.');
        setProfile({ ...data, avatar: data.avatar_url });
        loadedProfileId.current = userId;
      }

    } catch (err) {
      console.error('[Auth Debug] Exceção em fetchProfile:', err);
    } finally {
        log('fetchProfile finalizado.');
    }
  }

  useEffect(() => {
    let mounted = true;
    log('AuthProvider montado. Iniciando initializeAuth...');

    const initializeAuth = async () => {
      try {
        log('Obtendo sessão inicial (getSession)...');
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            log('Erro ao obter sessão:', sessionError);
            throw sessionError;
        }

        log('Sessão obtida:', { hasSession: !!initialSession, userId: initialSession?.user?.id });
        
        if (mounted) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            
            log('Aguardando fetchProfile...');
            // AWAIT IMPORTANTE: Aqui é onde pode estar travando se o banco não responder
            await fetchProfile(initialSession.user.id, initialSession.user.email);
            log('fetchProfile retornou no initializeAuth.');
          } else {
            log('Nenhuma sessão ativa encontrada.');
          }
        }
      } catch (err) {
        console.error('[Auth Debug] Erro fatal no initializeAuth:', err);
        setError(err instanceof Error ? err : new Error('Auth init failed'));
      } finally {
        if (mounted) {
          log('initializeAuth FINALLY -> setLoading(false)');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listener de eventos
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      log(`Evento Auth disparado: ${event}`);
      
      // Só atualiza estados se houver mudança real para evitar loops
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      
      // setUser pode disparar re-renders, fazemos com cuidado
      setUser(prev => {
          if (prev?.id !== newUser?.id) return newUser;
          return prev;
      });

      if (newUser) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
            // Só busca se não estivermos já carregando (o initializeAuth cuida da primeira carga)
            if (!loading) {
                await fetchProfile(newUser.id, newUser.email);
            }
        }
      } else if (event === 'SIGNED_OUT') {
        log('Usuário deslogou. Limpando estados.');
        setProfile(null);
        loadedProfileId.current = null;
        setLoading(false);
      }
    });

    return () => {
      log('AuthProvider desmontado.');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- Métodos de Auth (Mantidos iguais) ---

  const signInWithMagicLink = async (email: string): Promise<boolean> => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send magic link'));
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign in'));
      throw err;
    }
  }

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign in with Google'));
      throw err;
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign up'));
      throw err;
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reset password'));
      throw err;
    }
  }

  const signOut = async (): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);
      loadedProfileId.current = null;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    error,
    signInWithMagicLink,
    signIn,
    signInWithGoogle,
    signUp,
    resetPassword,
    signOut,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}