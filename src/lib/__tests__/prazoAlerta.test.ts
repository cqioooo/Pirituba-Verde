import { describe, expect, it } from 'vitest';
import {
  calcularAlertaPrazo,
  formatarMensagemAlertaPrazo,
  parsearConfiguracaoAlertaPrazo,
  parsearDiasAlertaConfig,
} from '@/lib/prazoAlerta';

describe('prazoAlerta (configuracoes_sistema)', () => {
  it('lê dias configurados sem valores fixos no código', () => {
    expect(parsearDiasAlertaConfig(undefined)).toEqual([]);
    expect(parsearDiasAlertaConfig('')).toEqual([]);
    expect(parsearDiasAlertaConfig('20, 27')).toEqual([20, 27]);
    expect(parsearDiasAlertaConfig('[10, 25, 10]')).toEqual([10, 25]);

    const desativado = parsearConfiguracaoAlertaPrazo(null, '30');
    expect(desativado).toEqual({ diasAlerta: [], cicloDias: null });

    const custom = parsearConfiguracaoAlertaPrazo('12, 24', '28');
    expect(custom).toEqual({ diasAlerta: [12, 24], cicloDias: 28 });
  });

  it('não dispara alerta antes do primeiro dia configurado nem quando configuração estiver ausente', () => {
    const prazo = '2026-11-30T12:00:00Z';
    const dia19 = new Date('2026-11-19T12:00:00Z'); // ciclo 30 => dia 19

    expect(
      calcularAlertaPrazo({
        prazoResolucao: prazo,
        statusOcorrencia: 'pendente',
        config: { diasAlerta: [20, 27], cicloDias: 30 },
        agora: dia19,
      })
    ).toBeNull();

    expect(
      calcularAlertaPrazo({
        prazoResolucao: prazo,
        statusOcorrencia: 'pendente',
        config: { diasAlerta: [], cicloDias: null },
        agora: new Date('2026-11-28T12:00:00Z'),
      })
    ).toBeNull();
  });

  it('emite alertas distintos nos dias configurados (ex: 20º atenção, 27º crítico) e vencido após o prazo', () => {
    const prazo = '2026-11-30T12:00:00Z';
    const config = { diasAlerta: [20, 27], cicloDias: 30 };

    const alertaDia20 = calcularAlertaPrazo({
      prazoResolucao: prazo,
      statusOcorrencia: 'em_revisao',
      config,
      agora: new Date('2026-11-20T12:00:00Z'),
    });
    expect(alertaDia20).not.toBeNull();
    expect(alertaDia20?.nivel).toBe('atencao');
    expect(alertaDia20?.diaAlerta).toBe(20);
    expect(alertaDia20?.diasRestantes).toBe(10);

    const alertaDia27 = calcularAlertaPrazo({
      prazoResolucao: prazo,
      statusOcorrencia: 'pendente',
      config,
      agora: new Date('2026-11-27T12:00:00Z'),
    });
    expect(alertaDia27).not.toBeNull();
    expect(alertaDia27?.nivel).toBe('critico');
    expect(alertaDia27?.diaAlerta).toBe(27);
    expect(alertaDia27?.diasRestantes).toBe(3);

    const alertaVencido = calcularAlertaPrazo({
      prazoResolucao: prazo,
      statusOcorrencia: 'pendente',
      config,
      agora: new Date('2026-12-02T12:00:00Z'),
    });
    expect(alertaVencido).not.toBeNull();
    expect(alertaVencido?.nivel).toBe('vencido');
    expect(alertaVencido?.diasRestantes).toBe(-2);
    expect(formatarMensagemAlertaPrazo(alertaVencido!).titulo).toMatch(/vencido/i);
  });

  it('respeita dias alternativos configurados e oculta alertas após prorrogação ou estado final', () => {
    const configCustom = { diasAlerta: [5, 10], cicloDias: 15 };
    const alertaCustom = calcularAlertaPrazo({
      prazoResolucao: '2026-11-15T12:00:00Z',
      statusOcorrencia: 'pendente',
      config: configCustom,
      agora: new Date('2026-11-05T12:00:00Z'),
    });
    expect(alertaCustom?.diaAlerta).toBe(5);

    // Após prorrogação (+30 dias), o novo prazo move o início do ciclo e limpa o alerta anterior
    expect(
      calcularAlertaPrazo({
        prazoResolucao: '2026-12-30T12:00:00Z',
        statusOcorrencia: 'em_revisao',
        config: { diasAlerta: [20, 27], cicloDias: 30 },
        agora: new Date('2026-11-28T12:00:00Z'),
      })
    ).toBeNull();

    for (const statusFinal of ['aprovada', 'rejeitada', 'arquivada'] as const) {
      expect(
        calcularAlertaPrazo({
          prazoResolucao: '2026-11-10T12:00:00Z',
          statusOcorrencia: statusFinal,
          config: { diasAlerta: [20, 27], cicloDias: 30 },
          agora: new Date('2026-11-28T12:00:00Z'),
        })
      ).toBeNull();
    }
  });
});
