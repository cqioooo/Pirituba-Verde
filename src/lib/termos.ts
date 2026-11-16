import type { User } from '@supabase/supabase-js';
import type { Perfil } from '@/types';

/** Versão vigente do Termo de Uso e Aviso de Privacidade. */
export const VERSAO_TERMO_ATUAL = '2026-11-16';

export interface RegistroAceiteTermo {
  termo_versao: string;
  termo_aceito_em: string;
  maioridade_declarada: boolean;
}

export function obterAceiteTermoUsuario(
  user: User | null | undefined,
  perfil?: Pick<Perfil, 'termo_versao' | 'termo_aceito_em' | 'maioridade_declarada'> | null
): RegistroAceiteTermo | null {
  const versao =
    (typeof user?.user_metadata?.termo_versao === 'string' && user.user_metadata.termo_versao) ||
    perfil?.termo_versao ||
    null;

  const aceitoEm =
    (typeof user?.user_metadata?.termo_aceito_em === 'string' &&
      user.user_metadata.termo_aceito_em) ||
    perfil?.termo_aceito_em ||
    null;

  const maioridade =
    user?.user_metadata?.maioridade_declarada === true ||
    perfil?.maioridade_declarada === true;

  if (!versao || !aceitoEm || !maioridade) {
    return null;
  }

  return {
    termo_versao: versao,
    termo_aceito_em: aceitoEm,
    maioridade_declarada: true,
  };
}

export function usuarioPrecisaAceitarTermo(
  user: User | null | undefined,
  perfil?: Pick<Perfil, 'termo_versao' | 'termo_aceito_em' | 'maioridade_declarada'> | null,
  versaoAtual: string = VERSAO_TERMO_ATUAL
): boolean {
  if (!user) return false;
  const registro = obterAceiteTermoUsuario(user, perfil);
  if (!registro) return true;
  return registro.termo_versao !== versaoAtual;
}
