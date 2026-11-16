import { supabase } from '@/integrations/supabase/client';
import type { RegisterData } from '@/types';

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(registerData: RegisterData) {
    const { data, error } = await supabase.auth.signUp({
      email: registerData.email,
      password: registerData.password,
      options: {
        data: {
          full_name: registerData.fullName?.trim() || null,
          cpf_hash: registerData.cpfHash || null,
          data_nascimento: registerData.dateOfBirth?.trim() || null,
          bairro_residencia: registerData.neighborhood?.trim() || null,
          rua: registerData.street?.trim() || null,
          telefone: registerData.phone?.trim() || null,
          maioridade_declarada: registerData.maioridadeDeclarada,
          termo_versao: registerData.termoVersao,
          termo_aceito_em: registerData.termoAceitoEm,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  async updateTermsAcceptance(versao: string, aceitoEm: string) {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        maioridade_declarada: true,
        termo_versao: versao,
        termo_aceito_em: aceitoEm,
      },
    });
    if (error) throw error;
    return data.user;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback);
  },

  async checkCpf(cpf: string) {
    return supabase.rpc('cpf_ja_cadastrado', { cpf });
  },

  async hashCpf(cpf: string) {
    return supabase.rpc('hash_cpf', { cpf });
  },
};
