import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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

  // Função isolada para buscar perfil com logs
  const fetchProfile = async (userId: string, currentUserEmail?: string) => {
    console.log('[Auth] Fetching profile for:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('[Auth] Profile not found, auto-creating...');
          const timestamp = Math.floor(Date.now() / 1000);
          const emailName = currentUserEmail?.split('@')[0] || 'User';
          
          const newProfileData = {
              id: userId,
              username: `${emailName}_${timestamp}`,
              name: emailName,
              email: currentUserEmail,
              role: 'client'
          };

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfileData as any)
            .select()
            .single()

          if (createError) {
             console.error('[Auth] Error auto-creating profile:', createError);
             // Fallback para não travar
             setProfile({
               ...newProfileData,
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString()
             } as User);
          } else {
             console.log('[Auth] Profile created successfully');
             setProfile({ ...newProfile, avatar: newProfile.avatar_url });
          }
        } else {
          console.error('[Auth] Error fetching profile:', error);
        }
      } else {
        console.log('[Auth] Profile found');
        setProfile({ ...data, avatar: data.avatar_url });
      }
    } catch (err) {
      console.error('[Auth] Unexpected error in fetchProfile:', err);
    }
  }

  useEffect(() => {
    let mounted = true;
    console.log('[Auth] Initializing...');

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (initialSession) {
            console.log('[Auth] Session found on init');
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchProfile(initialSession.user.id, initialSession.user.email);
          } else {
            console.log('[Auth] No session on init');
          }
        }
      } catch (err) {
        console.error('[Auth] Init failed:', err);
        if (mounted) setError(err instanceof Error ? err : new Error('Auth init failed'));
      } finally {
        if (mounted) {
          console.log('[Auth] Init done, setting loading=false');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[Auth] Event:', event);
      if (!mounted) return;
      
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);

      if (newUser) {
        // Lógica crucial: Só mostra loading se for um login explícito (SIGNED_IN)
        // Eventos como INITIAL_SESSION ou TOKEN_REFRESHED não devem bloquear a tela se já carregamos antes
        if (event === 'SIGNED_IN') {
            console.log('[Auth] Signed In - fetching profile');
            setLoading(true);
            await fetchProfile(newUser.id, newUser.email);
            setLoading(false);
        } else if (!profile && event !== 'INITIAL_SESSION') {
            // Se por acaso temos usuário mas sem perfil (e não é o init que já trata isso)
            await fetchProfile(newUser.id, newUser.email);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Métodos auxiliares mantidos iguais...
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      setSession(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
      return false;
    } finally {
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