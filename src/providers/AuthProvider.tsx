
import { useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { authService } from '@/services/auth.service';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import { VERSAO_TERMO_ATUAL } from '@/lib/termos';
import type { LoginCredentials, RegisterData } from '@/types';
import { AuthContext } from './authContext';

function readInitialMockSession(): Session | null {
  if (isSupabaseConfigured || typeof window === 'undefined') return null;
  const savedMockSession = localStorage.getItem('pirituba_verde_mock_session');
  if (!savedMockSession) return null;
  try {
    return JSON.parse(savedMockSession) as Session;
  } catch {
    localStorage.removeItem('pirituba_verde_mock_session');
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readInitialMockSession());
  const [user, setUser] = useState<User | null>(() => readInitialMockSession()?.user ?? null);
  const [loading, setLoading] = useState(() => isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
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
            maioridade_declarada: true,
            termo_versao: VERSAO_TERMO_ATUAL,
            termo_aceito_em: new Date().toISOString(),
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
      throw new Error(translated, { cause: err });
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
            full_name: safeData.fullName?.trim() || null,
            cpf_hash: safeData.cpfHash || null,
            data_nascimento: safeData.dateOfBirth?.trim() || null,
            bairro_residencia: safeData.neighborhood?.trim() || null,
            rua: safeData.street?.trim() || null,
            telefone: safeData.phone?.trim() || null,
            maioridade_declarada: safeData.maioridadeDeclarada,
            termo_versao: safeData.termoVersao,
            termo_aceito_em: safeData.termoAceitoEm,
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
      throw new Error(translated, { cause: err });
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptTerms = useCallback(
    async (versao: string = VERSAO_TERMO_ATUAL) => {
      setError(null);
      const aceitoEm = new Date().toISOString();

      if (!isSupabaseConfigured) {
        if (!user || !session) return;
        const updatedUser: User = {
          ...user,
          user_metadata: {
            ...user.user_metadata,
            maioridade_declarada: true,
            termo_versao: versao,
            termo_aceito_em: aceitoEm,
          },
        };
        const updatedSession: Session = { ...session, user: updatedUser };
        localStorage.setItem('pirituba_verde_mock_session', JSON.stringify(updatedSession));
        setSession(updatedSession);
        setUser(updatedUser);
        return;
      }

      const updatedUser = await authService.updateTermsAcceptance(versao, aceitoEm);
      if (updatedUser) {
        setUser(updatedUser);
        setSession((prev) => (prev ? { ...prev, user: updatedUser } : prev));
      }
    },
    [session, user]
  );

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
    <AuthContext.Provider value={{ user, session, loading, error, login, register, acceptTerms, logout }}>
      {children}
    </AuthContext.Provider>
  );
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
