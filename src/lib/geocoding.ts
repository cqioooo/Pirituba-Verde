export interface ReverseGeocodeResult {
  endereco: string;
  bairro: string | null;
  fonte: 'nominatim' | 'bigdatacloud';
}

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  house_number?: string;
  neighbourhood?: string;
  quarter?: string;
  suburb?: string;
  village?: string;
  city?: string;
  town?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

interface BigDataCloudResponse {
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  localityInfo?: {
    informative?: Array<{ name?: string; description?: string; order?: number }>;
    administrative?: Array<{ name?: string; description?: string; adminLevel?: number }>;
  };
}

const TERMO_ADMINISTRATIVO_IGNORADO = /\b(sub)?prefeitura\b|prefeitura\s+regional|regi[aã]o\s+metropolitana/i;
const geocodeCache = new Map<string, ReverseGeocodeResult>();

export function ehTermoPrefeituraOuSubprefeitura(valor: string | null | undefined): boolean {
  if (!valor) return false;
  return TERMO_ADMINISTRATIVO_IGNORADO.test(valor.trim());
}

function limparParteEndereco(valor: string | null | undefined): string | null {
  const limpo = valor?.trim();
  if (!limpo) return null;
  if (ehTermoPrefeituraOuSubprefeitura(limpo)) return null;
  return limpo;
}

export function formatarEnderecoNominatim(data: NominatimResponse): ReverseGeocodeResult | null {
  const addr = data.address;
  if (!addr) return null;

  const logradouro =
    limparParteEndereco(addr.road) ||
    limparParteEndereco(addr.pedestrian) ||
    limparParteEndereco(addr.footway) ||
    limparParteEndereco(addr.path);

  const numero = limparParteEndereco(addr.house_number);
  const bairro =
    limparParteEndereco(addr.neighbourhood) ||
    limparParteEndereco(addr.quarter) ||
    limparParteEndereco(addr.suburb) ||
    limparParteEndereco(addr.village);

  let endereco = '';
  if (logradouro) {
    endereco = numero ? `${logradouro}, ${numero}` : logradouro;
    if (bairro && bairro.toLowerCase() !== logradouro.toLowerCase()) {
      endereco = `${endereco} - ${bairro}`;
    }
  } else if (bairro) {
    endereco = bairro;
  } else if (data.display_name) {
    const partesValidas = data.display_name
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && !ehTermoPrefeituraOuSubprefeitura(p))
      .slice(0, 2);
    endereco = partesValidas.join(', ');
  }

  if (!endereco) return null;

  return {
    endereco,
    bairro: bairro ?? null,
    fonte: 'nominatim',
  };
}

function formatarEnderecoBigDataCloud(data: BigDataCloudResponse): ReverseGeocodeResult | null {
  const bairro =
    limparParteEndereco(data.locality) ||
    limparParteEndereco(
      data.localityInfo?.administrative
        ?.find((item) => item.adminLevel === 10 || item.adminLevel === 9)
        ?.name
    );

  const cidade = limparParteEndereco(data.city);
  const endereco =
    bairro && cidade && bairro.toLowerCase() !== cidade.toLowerCase()
      ? `${bairro}, ${cidade}`
      : bairro || cidade || '';

  if (!endereco) return null;

  return {
    endereco,
    bairro: bairro ?? null,
    fonte: 'bigdatacloud',
  };
}

function cacheKeyFor(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

export async function reverseGeocodeCoords(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<ReverseGeocodeResult | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude === 0 && longitude === 0) return null;

  const key = cacheKeyFor(latitude, longitude);
  const cached = geocodeCache.get(key);
  if (cached) return cached;

  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
      `&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}` +
      `&zoom=18&addressdetails=1&accept-language=pt-BR`;

    const response = await fetch(url, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const payload = (await response.json()) as NominatimResponse;
      const parsed = formatarEnderecoNominatim(payload);
      if (parsed) {
        geocodeCache.set(key, parsed);
        return parsed;
      }
    }
  } catch (error) {
    if (signal?.aborted) throw error;
  }

  try {
    const fallbackUrl =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}` +
      `&localityLanguage=pt`;

    const response = await fetch(fallbackUrl, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const payload = (await response.json()) as BigDataCloudResponse;
      const parsed = formatarEnderecoBigDataCloud(payload);
      if (parsed) {
        geocodeCache.set(key, parsed);
        return parsed;
      }
    }
  } catch (error) {
    if (signal?.aborted) throw error;
  }

  return null;
}
