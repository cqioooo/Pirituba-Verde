import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  ehTermoPrefeituraOuSubprefeitura,
  formatarEnderecoNominatim,
  reverseGeocodeCoords,
} from '@/lib/geocoding';

describe('geocoding reverso a partir do GPS', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extrai logradouro, número e bairro sem incluir prefeitura ou subprefeitura', () => {
    expect(ehTermoPrefeituraOuSubprefeitura('Subprefeitura de Pirituba/Jaraguá')).toBe(true);
    expect(ehTermoPrefeituraOuSubprefeitura('Prefeitura Regional de Pirituba')).toBe(true);
    expect(ehTermoPrefeituraOuSubprefeitura('Pirituba')).toBe(false);

    const resultado = formatarEnderecoNominatim({
      address: {
        road: 'Rua Paula Ferreira',
        house_number: '1450',
        neighbourhood: 'Pirituba',
        suburb: 'Subprefeitura de Pirituba/Jaraguá',
        city: 'São Paulo',
      },
    });

    expect(resultado).toEqual({
      endereco: 'Rua Paula Ferreira, 1450 - Pirituba',
      bairro: 'Pirituba',
      fonte: 'nominatim',
    });
    expect(resultado?.endereco).not.toMatch(/prefeitura|subprefeitura/i);
  });

  it('usa fallback quando Nominatim falha ou não retorna endereço', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: false } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          locality: 'Vila Zatt',
          city: 'São Paulo',
        }),
      } as Response);

    const resultado = await reverseGeocodeCoords(-23.48123, -46.72345);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(resultado).toEqual({
      endereco: 'Vila Zatt, São Paulo',
      bairro: 'Vila Zatt',
      fonte: 'bigdatacloud',
    });
  });
});
