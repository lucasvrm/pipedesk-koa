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

  // Função segura com Timeout para evitar travamento infinito
  const fetchProfileSafe = async (userId: string, userEmail?: string): Promise<boolean> => {
    // Se já temos esse perfil carregado, ignora
    if (loadedProfileId.current === userId) {
        console.log('[Auth] Profile already loaded (cache hit)');
        return true;
    }

    console.log('[Auth] Fetching profile for:', userId);

    try {
      // Cria uma promessa de fetch real
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Cria uma promessa de timeout (5 segundos)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );

      // Competição: quem terminar primeiro ganha
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        // Se não achou perfil, tenta criar (Lógica de auto-fix)
        if (error.code === 'PGRST116') {
          console.log('[Auth] Profile missing, auto-creating...');
          const timestamp = Math.floor(Date.now() / 1000);
          const emailName = userEmail?.split('@')[0] || 'User';
          
          const newProfileData = {
              id: userId,
              username: `${emailName}_${timestamp}`,
              name: emailName,
              email: userEmail,
              role: 'client'
          };

          const { data: newProfile } = await supabase
            .from('profiles')
            .insert(newProfileData as any)
            .select()
            .single();

          if (newProfile) {
             setProfile({ ...newProfile, avatar: newProfile.avatar_url });
             loadedProfileId.current = userId;
             return true;
          }
        }
        console.error('[Auth] Profile fetch error:', error);
        return false;
      } 
      
      // Sucesso
      if (data) {
        console.log('[Auth] Profile loaded successfully');
        setProfile({ ...data, avatar: data.avatar_url });
        loadedProfileId.current = userId;
        return true;
      }
      
      return false;

    } catch (err) {
      console.error('[Auth] Critical error or timeout:', err);
      return false;
    }
  }

  useEffect(() => {
    let mounted = true;
    console.log('[Auth] Initializing App...');

    const initializeAuth = async () => {
      try {
        // 1. Tenta pegar sessão existente
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted && initialSession?.user) {
          console.log('[Auth] Found existing session. Verifying...');
          setSession(initialSession);
          setUser(initialSession.user);
          
          // 2. Tenta carregar perfil com o Timeout de segurança
          const success = await fetchProfileSafe(initialSession.user.id, initialSession.user.email);
          
          // 3. SE FALHAR (Timeout ou Erro): A sessão é zumbi/inválida. Matamos ela.
          if (!success) {
            console.warn('[Auth] Session appears stale or invalid. Forcing cleanup.');
            await supabase.auth.signOut(); // <--- O SEGREDO: Limpa o storage automaticamente
            if (mounted) {
              setSession(null);
              setUser(null);
              setProfile(null);
            }
          }
        }
      } catch (err) {
        console.error('[Auth] Init crashed:', err);
      } finally {
        if (mounted) {
          // SEMPRE destrava a tela, não importa o que aconteça
          console.log('[Auth] Init finished. Unlocking UI.');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listener para mudanças em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[Auth] State Change:', event);
      if (!mounted) return;
      
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);

      if (newUser) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Se o usuário mudou, invalida cache
            if (loadedProfileId.current !== newUser.id) {
                loadedProfileId.current = null;
            }
            // Background refresh (sem travar a tela se já estiver carregada)
            await fetchProfileSafe(newUser.id, newUser.email);
        }
      } else if (event === 'SIGNED_OUT') {
        loadedProfileId.current = null;
        setProfile(null);
        // Garante que loading fique false ao sair
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
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