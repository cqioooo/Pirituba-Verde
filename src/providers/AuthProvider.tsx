
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { authService } from '@/services/auth.service';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import type { AuthContextType, LoginCredentials, RegisterData } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Se Supabase não está configurado, carregar dados mockados do localStorage
    if (!isSupabaseConfigured) {
      const savedMockSession = localStorage.getItem('pirituba_verde_mock_session');
      if (savedMockSession) {
        try {
          const parsed = JSON.parse(savedMockSession) as Session;
          setSession(parsed);
          setUser(parsed.user);
        } catch {
          localStorage.removeItem('pirituba_verde_mock_session');
        }
      }
      setLoading(false);
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;

    async function init() {
      try {
        // Recuperar sessão existente
        const existingSession = await authService.getSession();
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
      } catch {
        // Supabase não configurado ou offline — continuar sem sessão
      } finally {
        setLoading(false);
      }

      try {
        // Escutar mudanças de estado
        const { data } = authService.onAuthStateChange(
          async (_event, newSession) => {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            setLoading(false);
          }
        );
        subscription = data.subscription;
      } catch {
        // Listener não pôde ser criado — continuar sem ele
      }
    }

    init();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setError(null);
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        // Simula um delay realista de rede
        await new Promise((resolve) => setTimeout(resolve, 800));

        const mockUserObj: User = {
          id: 'mock-user-id-' + Date.now(),
          email: credentials.email,
          user_metadata: {
            full_name: 'Maria Silva (Mock)',
            cpf: '123.456.789-00',
            date_of_birth: '1995-10-10',
            neighborhood: 'Pirituba Centro',
            street: 'Rua Paula Ferreira, 1000',
            phone: '(11) 98888-8888',
          },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User;

        const mockSessionObj = {
          access_token: 'mock-token-' + Date.now(),
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: mockUserObj,
        } as Session;

        localStorage.setItem('pirituba_verde_mock_session', JSON.stringify(mockSessionObj));
        setSession(mockSessionObj);
        setUser(mockUserObj);
        return;
      }

      await authService.signIn(credentials.email, credentials.password);
    } catch (err) {
      let message = 'Erro ao fazer login';
      let code: string | undefined = undefined;
      if (err instanceof Error) {
        message = err.message;
        if ('code' in err && typeof err.code === 'string') {
          code = err.code;
        }
      }
      const translated = translateAuthError(message, code);
      setError(translated);
      throw new Error(translated);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setError(null);
    setLoading(true);
    try {
      let finalCpfHash: string | undefined = undefined;

      if (isSupabaseConfigured && data.cpf) {
        // Verificar duplicidade
        const { data: cpfExiste } = await authService.checkCpf(data.cpf);
        if (cpfExiste) {
          throw new Error('User already registered');
        }
        // Gerar hash
        const { data: cpfHash } = await authService.hashCpf(data.cpf);
        if (cpfHash) {
          finalCpfHash = cpfHash;
        }
      }

      const safeData = { ...data, cpfHash: finalCpfHash };
      // Limpar CPF em texto puro da memória
      delete safeData.cpf;

      if (!isSupabaseConfigured) {
        // Simula um delay realista de rede
        await new Promise((resolve) => setTimeout(resolve, 800));

        const mockUserObj: User = {
          id: 'mock-user-id-' + Date.now(),
          email: safeData.email,
          user_metadata: {
            full_name: safeData.fullName,
            cpf_hash: safeData.cpfHash,
            data_nascimento: safeData.dateOfBirth,
            bairro_residencia: safeData.neighborhood,
            rua: safeData.street,
            telefone: safeData.phone,
          },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User;

        const mockSessionObj = {
          access_token: 'mock-token-' + Date.now(),
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: mockUserObj,
        } as Session;

        localStorage.setItem('pirituba_verde_mock_session', JSON.stringify(mockSessionObj));
        setSession(mockSessionObj);
        setUser(mockUserObj);
        return;
      }

      await authService.signUp(safeData);
    } catch (err) {
      let message = 'Erro ao criar conta';
      let code: string | undefined = undefined;
      if (err instanceof Error) {
        message = err.message;
        if ('code' in err && typeof err.code === 'string') {
          code = err.code;
        }
      }
      const translated = translateAuthError(message, code);
      setError(translated);
      throw new Error(translated);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      if (!isSupabaseConfigured) {
        localStorage.removeItem('pirituba_verde_mock_session');
        setSession(null);
        setUser(null);
        return;
      }
      await authService.signOut();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao sair';
      setError(message);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

/**
 * Traduz mensagens de erro do Supabase para português.
 */
function translateAuthError(message: string, code?: string): string {
  const lowercaseMsg = message.toLowerCase();
  const lowercaseCode = code?.toLowerCase() || '';

  if (lowercaseCode === 'over_email_send_rate_limit' || lowercaseMsg.includes('rate limit exceeded') || lowercaseMsg.includes('rate_limit')) {
    return 'Muitas tentativas de envio de e-mail. Por favor, aguarde alguns minutos antes de tentar novamente.';
  }
  if (lowercaseCode === 'email_address_invalid' || (lowercaseMsg.includes('email address') && lowercaseMsg.includes('invalid'))) {
    return 'O e-mail informado não é válido.';
  }

  if (lowercaseCode === 'email_provider_disabled' || lowercaseMsg.includes('email signups are disabled') || lowercaseMsg.includes('provider_disabled')) {
    return 'O cadastro por e-mail foi desativado no painel do Supabase. Verifique se o provedor "Email" e a opção "Allow signup" estão ativos em Authentication -> Providers -> Email.';
  }

  const translations: Record<string, string> = {
    'invalid login credentials': 'E-mail ou senha incorretos.',
    'email not confirmed': 'Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.',
    'email address not confirmed': 'Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.',
    'user already registered': 'Este e-mail já está cadastrado.',
    'password should be at least': 'A senha deve ter pelo menos 6 caracteres.',
    'signup requires a valid password': 'Informe uma senha válida.',
  };

  for (const [key, translation] of Object.entries(translations)) {
    if (lowercaseMsg.includes(key)) return translation;
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
}
