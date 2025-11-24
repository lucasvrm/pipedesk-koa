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

  // Função isolada para buscar perfil
  const fetchProfile = async (userId: string, currentUserEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating default...')
          // Fallback para criação segura
          const timestamp = Math.floor(Date.now() / 1000);
          const emailName = currentUserEmail?.split('@')[0] || 'User';
          
          const newProfileData = {
              id: userId,
              username: `${emailName}_${timestamp}`,
              name: emailName,
              email: currentUserEmail,
              role: 'client' // Segurança: Default role
          };

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfileData as any)
            .select()
            .single()

          if (createError) {
             console.error('Error auto-creating profile:', createError);
             // Estado mínimo para não travar a UI
             setProfile({
               ...newProfileData,
               role: 'client',
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString()
             } as User);
          } else {
             setProfile({ ...newProfile, avatar: newProfile.avatar_url });
          }
        } else {
          console.error('Error fetching profile:', error);
        }
      } else {
        setProfile({ ...data, avatar: data.avatar_url });
      }
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
    }
  }

  useEffect(() => {
    let mounted = true;

    // Função de inicialização robusta
    const initializeAuth = async () => {
      try {
        // 1. Pega a sessão inicial
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            await fetchProfile(initialSession.user.id, initialSession.user.email);
          }
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
        if (mounted) setError(err instanceof Error ? err : new Error('Auth init failed'));
      } finally {
        if (mounted) setLoading(false); // GARANTE que o loading pare
      }
    };

    initializeAuth();

    // 2. Escuta mudanças (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Apenas busca o perfil se mudou o usuário ou se ainda não temos perfil
        setLoading(true); // Breve loading durante troca de estado
        await fetchProfile(newSession.user.id, newSession.user.email);
        setLoading(false);
      } else {
        setProfile(null);
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
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
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
      setError(null)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign in'))
      throw err
    }
  }

  const signInWithGoogle = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign in with Google'))
      throw err
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: name }
        }
      })
      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign up'))
      throw err
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reset password'))
      throw err
    }
  }

  const signOut = async (): Promise<boolean> => {
    try {
      setError(null)
      setLoading(true) // Feedback visual imediato
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
      setSession(null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign out'))
      return false
    } finally {
      setLoading(false)
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