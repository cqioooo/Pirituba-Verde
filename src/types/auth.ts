import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthState {
  user: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName?: string;
  cpf?: string;
  cpfHash?: string;
  dateOfBirth?: string;
  neighborhood?: string;
  street?: string;
  phone?: string;
  maioridadeDeclarada: boolean;
  termoAceito: boolean;
  termoVersao: string;
  termoAceitoEm: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  acceptTerms: (versao?: string) => Promise<void>;
  logout: () => Promise<void>;
}
