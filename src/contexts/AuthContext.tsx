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

  const fetchProfile = async (userId: string, userEmail?: string) => {
    // Cache de memória
    if (loadedProfileId.current === userId && profile) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Auto-fix: Cria perfil se não existir
        if (error.code === 'PGRST116') {
          console.log('[Auth] Criando perfil padrão...');
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
          }
        } else {
            console.error('Erro ao buscar perfil:', error);
        }
      } else if (data) {
        setProfile({ ...data, avatar: data.avatar_url });
        loadedProfileId.current = userId;
      }
    } catch (err) {
      console.error('Erro inesperado no perfil:', err);
    }
  }

  useEffect(() => {
    let mounted = true;

    // A Solução Raiz:
    // Em vez de "await getSession()", usamos o listener que dispara imediatamente.
    // Isso evita o deadlock de Promessa pendente.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      console.log(`[Auth] Evento recebido: ${event}`);
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // Se temos usuário, buscamos o perfil e SÓ DEPOIS liberamos o loading
        fetchProfile(currentSession.user.id, currentSession.user.email)
          .finally(() => {
            if (mounted) setLoading(false);
          });
      } else {
        // Se não temos usuário (logout ou inicial), liberamos o loading imediatamente
        setProfile(null);
        loadedProfileId.current = null;
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- Métodos de Auth ---

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