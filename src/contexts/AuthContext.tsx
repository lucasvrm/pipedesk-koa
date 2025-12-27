import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { User as SupabaseUser, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@/lib/types'
import { ProfileDB } from '@/lib/databaseTypes'
import { getAuthSettings } from '@/services/settingsService'

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

  const forceLogout = async (reason: string) => {
    console.error('[Auth] Encerrando sessão por segurança:', reason)
    loadedProfileId.current = null
    setUser(null)
    setProfile(null)
    setSession(null)
    setError(new Error(reason))

    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (signOutError) {
      console.error('[Auth] Erro ao forçar signOut:', signOutError)
    }

    if (typeof window !== 'undefined') {
      window.location.replace('/login')
    }
  }

  // Helper function to map ProfileDB to User type
  const mapProfileDBToUser = (profile: ProfileDB): User => ({
    id: profile.id,
    name: profile.name ?? '',
    email: profile.email ?? '',
    role: (profile.role as User['role']) ?? 'client',
    avatar: profile.avatar_url ?? undefined,
    avatar_url: profile.avatar_url ?? undefined,
    avatarBgColor: profile.avatar_bg_color ?? undefined,
    avatarTextColor: profile.avatar_text_color ?? undefined,
    avatarBorderColor: profile.avatar_border_color ?? undefined,
    bannerStyle: profile.banner_style ?? undefined,
    clientEntity: profile.client_entity ?? undefined,
    has_completed_onboarding: profile.has_completed_onboarding ?? undefined,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    address: profile.address ?? undefined,
    cellphone: profile.cellphone ?? undefined,
    pixKeyPJ: profile.pix_key_pj ?? undefined,
    pixKeyPF: profile.pix_key_pf ?? undefined,
    rg: profile.rg ?? undefined,
    cpf: profile.cpf ?? undefined,
    secondaryEmail: profile.secondary_email ?? undefined,
    docIdentityUrl: profile.doc_identity_url ?? undefined,
    docSocialContractUrl: profile.doc_social_contract_url ?? undefined,
    docServiceAgreementUrl: profile.doc_service_agreement_url ?? undefined,
    title: profile.title ?? undefined,
    department: profile.department ?? undefined,
    birthDate: profile.birth_date ?? undefined,
    linkedin: profile.linkedin ?? undefined,
    bio: profile.bio ?? undefined,
    status: profile.status as User['status'],
    lastLogin: profile.last_login ?? undefined,
  })

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
            const profileRow = newProfile as unknown as ProfileDB;
            setProfile(mapProfileDBToUser(profileRow));
            loadedProfileId.current = userId;
          }
        } else {
          console.error('Erro ao buscar perfil:', error);
        }
      } else if (data) {
        const profileRow = data as unknown as ProfileDB;
        setProfile(mapProfileDBToUser(profileRow));
        loadedProfileId.current = userId;
      }
    } catch (err) {
      console.error('Erro inesperado no perfil:', err);
    }
  }

  useEffect(() => {
    let mounted = true;

    const handleAuthEvent = async (event: AuthChangeEvent, currentSession: Session | null) => {
      if (!mounted) return;

      console.log(`[Auth] Evento recebido: ${event}`);

      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event) && !currentSession) {
        await forceLogout('Sessão inválida retornada pelo Supabase.');
        return;
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        loadedProfileId.current = null;
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // Se temos usuário, buscamos o perfil e SÓ DEPOIS liberamos o loading
        fetchProfile(currentSession.user.id, currentSession.user.email)
          .catch((err) => {
            console.error('[Auth] Falha ao buscar perfil após evento de auth:', err);
            setError(err instanceof Error ? err : new Error('Falha ao carregar perfil'));
          })
          .finally(() => {
            if (mounted) setLoading(false);
          });
      } else {
        // Se não temos usuário (logout ou inicial), liberamos o loading imediatamente
        setProfile(null);
        loadedProfileId.current = null;
        if (mounted) setLoading(false);
      }
    }

    // A Solução Raiz:
    // Em vez de "await getSession()", usamos o listener que dispara imediatamente.
    // Isso evita o deadlock de Promessa pendente.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      handleAuthEvent(event, currentSession).catch((err) => {
        console.error('[Auth] Erro inesperado no listener de auth:', err)
        setError(err instanceof Error ? err : new Error('Erro desconhecido de autenticação'))
        setLoading(false)
      })
    });

    const handleHtmlResponse = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      const url = detail?.url || 'desconhecida';
      forceLogout(`Resposta HTML inesperada detectada em ${url}`);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('network:html-response', handleHtmlResponse as EventListener);
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('network:html-response', handleHtmlResponse as EventListener);
      }
    };
  }, []);

  // --- Helpers de Política de Segurança ---

  const checkRestrictions = async (email: string, type: 'magic_link' | 'signup') => {
    try {
      // Busca as configurações atuais do banco
      const settings = await getAuthSettings();

      // 1. Verificar Magic Links
      if (type === 'magic_link' && !settings.enableMagicLinks) {
        throw new Error('O login via Magic Link foi desabilitado pelo administrador.');
      }

      // 2. Verificar Restrição de Domínio no Cadastro
      if (type === 'signup' && settings.restrictDomain && settings.allowedDomain) {
        const domain = email.split('@')[1];
        if (domain !== settings.allowedDomain) {
          throw new Error(`O cadastro é restrito apenas para e-mails do domínio @${settings.allowedDomain}`);
        }
      }
    } catch (err) {
      // Repassa o erro para ser tratado no catch dos métodos de login
      throw err;
    }
  }

  // --- Métodos de Auth ---

  const signInWithMagicLink = async (email: string): Promise<boolean> => {
    try {
      setError(null);

      // Verifica políticas antes de chamar o Supabase
      await checkRestrictions(email, 'magic_link');

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao enviar magic link';
      setError(new Error(message));
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
      setError(err instanceof Error ? err : new Error('Falha ao entrar'));
      throw err;
    }
  }

  const signInWithGoogle = async () => {
    try {
      setError(null);
      // Nota: OAuth geralmente bypassa restrições de domínio simples aqui,
      // pois a validação ocorre no provedor ou via triggers no banco se necessário strict mode.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Falha ao entrar com Google'));
      throw err;
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setError(null);

      // Verifica políticas antes de criar conta
      await checkRestrictions(email, 'signup');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      if (error) throw error;
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao cadastrar';
      setError(new Error(message));
      throw err; // Re-throw para a UI mostrar o toast de erro
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Falha ao redefinir senha'));
      throw err;
    }
  }

  const signOut = async (): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);
      loadedProfileId.current = null;
      
      // Use local scope to only clear session on this device
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      // If signOut fails, verify if session was actually cleared
      if (error) {
        console.warn('[Auth] signOut error:', error);
        
        // Check if session is actually cleared despite the error
        const { data: { session } } = await supabase.auth.getSession();
        
        // If session is cleared, consider it a success (idempotent behavior)
        if (!session) {
          console.log('[Auth] Session cleared despite error - treating as success');
          return true;
        }
        
        // Session still exists, this is a real failure
        throw error;
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Falha ao sair'));
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