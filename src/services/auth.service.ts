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
          full_name: registerData.fullName,
          cpf_hash: registerData.cpfHash,
          data_nascimento: registerData.dateOfBirth,
          bairro_residencia: registerData.neighborhood,
          rua: registerData.street,
          telefone: registerData.phone,
        },
      },
    });
    if (error) throw error;
    return data;
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
