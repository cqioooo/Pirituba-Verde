import { describe, expect, it } from 'vitest';
import {
  ErroAcaoModeracao,
  MIN_JUSTIFICATIVA_CHARS,
  estadoOcorrenciaEhFinal,
  formatarDataCurta,
  formatarDataHoraCurta,
  formatarMensagemSucessoAcao,
  formatarTempoDecorrido,
  mapearErroModeracao,
  obterAcoesDisponiveis,
  ordenarFilaModeracao,
  pontoPermiteInvalidacao,
  validarJustificativa,
} from '@/lib/moderacao';
import { calcularResumoPrazo } from '@/lib/prazoAlerta';

describe('moderacao domain helpers', () => {
  it('calcula ações compatíveis conforme matriz e estados finais', () => {
    expect(
      obterAcoesDisponiveis({
        statusOcorrencia: 'pendente',
        statusPonto: 'em_analise',
        prorrogadoEm: null,
      })
    ).toEqual(['aprovar', 'manter_em_analise', 'invalidar', 'prorrogar']);

    expect(
      obterAcoesDisponiveis({
        statusOcorrencia: 'pendente',
        statusPonto: 'novo',
        prorrogadoEm: null,
      })
    ).toEqual(['aprovar', 'manter_em_analise', 'invalidar', 'prorrogar']);

    expect(
      obterAcoesDisponiveis({
        statusOcorrencia: 'pendente',
        statusPonto: 'em_confirmacao',
        prorrogadoEm: null,
      })
    ).toEqual(['aprovar', 'manter_em_analise', 'invalidar', 'prorrogar']);

    expect(
      obterAcoesDisponiveis({
        statusOcorrencia: 'pendente',
        statusPonto: 'confirmado',
        prorrogadoEm: null,
      })
    ).toEqual(['aprovar', 'manter_em_analise', 'prorrogar']);

    expect(
      obterAcoesDisponiveis({
        statusOcorrencia: 'pendente',
        statusPonto: 'em_analise',
        prorrogadoEm: '2026-10-01T10:00:00Z',
      })
    ).toEqual(['aprovar', 'manter_em_analise', 'invalidar']);

    expect(
      obterAcoesDisponiveis({
        statusOcorrencia: 'em_revisao',
        statusPonto: 'em_analise',
        prorrogadoEm: null,
      })
    ).toEqual(['resolver', 'prorrogar']);

    expect(
      obterAcoesDisponiveis({
        statusOcorrencia: 'em_revisao',
        statusPonto: 'em_analise',
        prorrogadoEm: '2026-10-01T10:00:00Z',
      })
    ).toEqual(['resolver']);

    expect(
      obterAcoesDisponiveis({
        statusOcorrencia: 'aprovada',
        statusPonto: 'resolvido',
        prorrogadoEm: null,
      })
    ).toEqual(['arquivar']);

    expect(
      obterAcoesDisponiveis({
        statusOcorrencia: 'rejeitada',
        statusPonto: 'arquivado',
        prorrogadoEm: null,
      })
    ).toEqual([]);

    expect(
      obterAcoesDisponiveis({
        statusOcorrencia: 'arquivada',
        statusPonto: 'arquivado',
        prorrogadoEm: null,
      })
    ).toEqual([]);
  });

  it('identifica estados finais da ocorrência corretamente', () => {
    expect(estadoOcorrenciaEhFinal('rejeitada')).toBe(true);
    expect(estadoOcorrenciaEhFinal('arquivada')).toBe(true);
    expect(estadoOcorrenciaEhFinal('pendente')).toBe(false);
    expect(estadoOcorrenciaEhFinal('em_revisao')).toBe(false);
    expect(estadoOcorrenciaEhFinal('aprovada')).toBe(false);
  });

  it('permite invalidar apenas pontos antes da confirmação', () => {
    expect(pontoPermiteInvalidacao('novo')).toBe(true);
    expect(pontoPermiteInvalidacao('em_confirmacao')).toBe(true);
    expect(pontoPermiteInvalidacao('em_analise')).toBe(true);
    expect(pontoPermiteInvalidacao('confirmado')).toBe(false);
    expect(pontoPermiteInvalidacao('encaminhado')).toBe(false);
    expect(pontoPermiteInvalidacao('resolvido')).toBe(false);
    expect(pontoPermiteInvalidacao('arquivado')).toBe(false);
    expect(pontoPermiteInvalidacao(null)).toBe(false);
  });

  it(`valida justificativa mínima de ${MIN_JUSTIFICATIVA_CHARS} caracteres`, () => {
    expect(validarJustificativa('')).toMatch(/preencha a justificativa/i);
    expect(validarJustificativa('   ')).toMatch(/preencha a justificativa/i);
    expect(validarJustificativa('curta')).toMatch(/pelo menos 10 caracteres/i);
    expect(validarJustificativa('   abcdefghi   ')).toMatch(/pelo menos 10 caracteres/i);
    expect(validarJustificativa('Equipe realizou limpeza no ponto.')).toBeNull();
  });

  it('mapeia mensagens da RPC executar_acao_moderacao para erros tipados em português', () => {
    const errPermissao = mapearErroModeracao({
      message: 'Apenas gestão pode executar ações de moderação',
      code: '42501',
    });
    expect(errPermissao).toBeInstanceOf(ErroAcaoModeracao);
    expect(errPermissao.codigo).toBe('sem_permissao');
    expect(errPermissao.message).toMatch(/permissão insuficiente/i);

    const errTransicao = mapearErroModeracao({
      message: 'Transição inválida de aprovada para manter_em_analise',
    });
    expect(errTransicao.codigo).toBe('transicao_invalida');
    expect(errTransicao.message).toMatch(/ação não disponível/i);

    const errJust = mapearErroModeracao({
      message: 'Justificativa é obrigatória',
    });
    expect(errJust.codigo).toBe('justificativa_obrigatoria');
    expect(errJust.message).toMatch(/preencha a justificativa/i);

    const errFoto = mapearErroModeracao({
      message: 'Foto é obrigatória para resolver a ocorrência',
    });
    expect(errFoto.codigo).toBe('foto_obrigatoria');
    expect(errFoto.message).toMatch(/anexe a foto/i);

    const errProrrogar = mapearErroModeracao({
      message: 'Prorrogação já foi utilizada nesta ocorrência',
    });
    expect(errProrrogar.codigo).toBe('prorrogacao_utilizada');
    expect(errProrrogar.message).toMatch(/já foi prorrogada/i);

    const errInvalidar = mapearErroModeracao({
      message: 'Invalidação só é permitida com ponto em_analise',
    });
    expect(errInvalidar.codigo).toBe('invalidacao_fora_analise');
    expect(errInvalidar.message).toMatch(/ainda não confirmados/i);

    const errInvalidarConfirmado = mapearErroModeracao({
      message: 'Invalidação só é permitida antes da confirmação do ponto',
    });
    expect(errInvalidarConfirmado.codigo).toBe('invalidacao_fora_analise');
    expect(errInvalidarConfirmado.message).toMatch(/ainda não confirmados/i);

    const errOrfao = mapearErroModeracao(
      { message: 'Transição inválida' },
      'oc-1/123-uuid.jpg'
    );
    expect(errOrfao.evidenciaOrfaPath).toBe('oc-1/123-uuid.jpg');
  });

  it('formata mensagem de sucesso incluindo novo vencimento na prorrogação', () => {
    const msg = formatarMensagemSucessoAcao({
      sucesso: true,
      acao: 'prorrogar',
      status_ocorrencia: 'em_revisao',
      status_ponto: 'em_analise',
      prazo_resolucao: '2026-12-20T12:00:00Z',
    });
    expect(msg).toMatch(/30 dias/i);
    expect(msg).toMatch(/20\/12\/2026/);
    expect(
      ordenarFilaModeracao([
        {
          id: 'sem-sinal-antiga',
          sinal_reincidencia: false,
          sinal_duplicata: false,
          sinal_faixa_cinzenta: false,
          data_registro: '2026-11-01T08:00:00Z',
        },
        {
          id: 'faixa',
          sinal_reincidencia: false,
          sinal_duplicata: false,
          sinal_faixa_cinzenta: true,
          data_registro: '2026-11-02T09:00:00Z',
        },
        {
          id: 'duplicata',
          sinal_reincidencia: false,
          sinal_duplicata: true,
          sinal_faixa_cinzenta: false,
          data_registro: '2026-11-02T10:00:00Z',
        },
        {
          id: 'reincidencia',
          sinal_reincidencia: true,
          sinal_duplicata: false,
          sinal_faixa_cinzenta: false,
          data_registro: '2026-11-03T10:00:00Z',
        },
      ]).map(item => item.id)
    ).toEqual(['reincidencia', 'duplicata', 'faixa', 'sem-sinal-antiga']);
  });

  it('formata datas pt-BR sem distorção tipo 20/26/1115 nem shift de timezone em date-only', () => {
    expect(formatarDataCurta('2026-11-15')).toBe('15/11/2026');
    expect(formatarDataCurta('2026-11-01')).toBe('01/11/2026');
    expect(formatarDataCurta('2026-11-15T14:30:00-03:00')).toBe('15/11/2026');
    expect(formatarDataCurta('2026-02-31')).toBeNull();
    expect(formatarDataCurta('data-invalida')).toBeNull();

    expect(formatarDataHoraCurta('2026-11-01')).toBe('01/11/2026');
    expect(formatarDataHoraCurta('2026-11-15T14:30:00-03:00')).toMatch(/15\/11\/2026/);
    expect(formatarDataHoraCurta('invalida')).toBeNull();

    const refAgora = new Date('2026-11-15T15:00:00Z');
    expect(formatarTempoDecorrido('2026-11-12T15:00:00Z', refAgora)).toBe('há 3 dias');
    expect(formatarTempoDecorrido('2026-11-15T10:00:00Z', refAgora)).toBe('há 5 horas');
    expect(formatarTempoDecorrido('2026-11-20T10:00:00Z', refAgora)).toBeNull();
    expect(formatarTempoDecorrido('invalida', refAgora)).toBeNull();
  });

  it('calcula resumo de prazo consistente com regra e alertas de prazoAlerta', () => {
    const agora = new Date('2026-11-15T12:00:00-03:00');
    const config = { diasAlerta: [20, 27], cicloDias: 30 };

    const vence5 = calcularResumoPrazo({
      prazoResolucao: '2026-11-20T12:00:00-03:00',
      statusOcorrencia: 'pendente',
      config,
      agora,
    });
    expect(vence5.status).toBe('vigente');
    expect(vence5.textoPrincipal).toBe('Vence em 5 dias');
    expect(vence5.dataFormatada).toBe('20/11/2026');
    expect(vence5.alerta?.nivel).toBe('atencao');

    const vencido = calcularResumoPrazo({
      prazoResolucao: '2026-11-13',
      statusOcorrencia: 'pendente',
      config,
      agora,
    });
    expect(vencido.status).toBe('vencido');
    expect(vencido.textoPrincipal).toBe('Prazo vencido há 2 dias');

    const ausente = calcularResumoPrazo({
      prazoResolucao: null,
      statusOcorrencia: 'pendente',
      config,
      agora,
    });
    expect(ausente.status).toBe('ausente');
    expect(ausente.textoPrincipal).toBe('Prazo não informado');
  });
});
