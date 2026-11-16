import { describe, expect, it } from 'vitest';
import {
  TAMANHO_MAX_FOTO_RESOLUCAO_BYTES,
  construirCaminhoFotoResolucao,
  prepararFotoResolucao,
  removerMetadadosExifBinarios,
  validarArquivoFotoResolucao,
} from '@/lib/imagemResolucao';

function criarJpegComExif(): Uint8Array {
  // SOI (FF D8) + APP1 Exif GPS ("Exif\0\0GPS!") + SOF0/SOS (FF DA + image bytes) + EOI (FF D9)
  const exifPayload = new TextEncoder().encode('Exif\0\0GPS_LAT_23_55');
  const app1Length = exifPayload.length + 2;
  return new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xe1,
    (app1Length >> 8) & 0xff,
    app1Length & 0xff,
    ...exifPayload,
    0xff,
    0xda,
    0x00,
    0x08,
    0x01,
    0x02,
    0x03,
    0x04,
    0xaa,
    0xbb,
    0xff,
    0xd9,
  ]);
}

function escreverUint32BE(val: number): [number, number, number, number] {
  return [
    (val >>> 24) & 0xff,
    (val >>> 16) & 0xff,
    (val >>> 8) & 0xff,
    val & 0xff,
  ];
}

function criarPngChunk(tipo: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  out.set(escreverUint32BE(data.length), 0);
  out.set(new TextEncoder().encode(tipo), 4);
  out.set(data, 8);
  // CRC dummy
  out.set([0x01, 0x02, 0x03, 0x04], 8 + data.length);
  return out;
}

function criarPngComExif(): Uint8Array {
  const sig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = criarPngChunk('IHDR', new Uint8Array(13));
  const exif = criarPngChunk('eXIf', new TextEncoder().encode('GPS_COORDS'));
  const idat = criarPngChunk('IDAT', new Uint8Array([1, 2, 3]));
  const iend = criarPngChunk('IEND', new Uint8Array(0));
  const total = new Uint8Array(
    sig.length + ihdr.length + exif.length + idat.length + iend.length
  );
  let offset = 0;
  for (const part of [sig, ihdr, exif, idat, iend]) {
    total.set(part, offset);
    offset += part.length;
  }
  return total;
}

function escreverUint32LE(val: number): [number, number, number, number] {
  return [
    val & 0xff,
    (val >>> 8) & 0xff,
    (val >>> 16) & 0xff,
    (val >>> 24) & 0xff,
  ];
}

function criarWebpChunk(fourCC: string, payload: Uint8Array): Uint8Array {
  const paddedLen = payload.length + (payload.length % 2);
  const out = new Uint8Array(8 + paddedLen);
  out.set(new TextEncoder().encode(fourCC), 0);
  out.set(escreverUint32LE(payload.length), 4);
  out.set(payload, 8);
  return out;
}

function criarWebpComExif(): Uint8Array {
  const vp8xPayload = new Uint8Array(10);
  vp8xPayload[0] = 0x0c; // EXIF (0x08) + XMP (0x04) flags
  const vp8x = criarWebpChunk('VP8X', vp8xPayload);
  const vp8 = criarWebpChunk('VP8 ', new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  const exif = criarWebpChunk('EXIF', new TextEncoder().encode('GPS_WEBP_LOC'));

  const riffPayloadSize = 4 + vp8x.length + vp8.length + exif.length;
  const out = new Uint8Array(8 + riffPayloadSize);
  out.set(new TextEncoder().encode('RIFF'), 0);
  out.set(escreverUint32LE(riffPayloadSize), 4);
  out.set(new TextEncoder().encode('WEBP'), 8);
  let offset = 12;
  for (const part of [vp8x, vp8, exif]) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

describe('imagemResolucao (KAN-84)', () => {
  it('valida MIME, extensão, vazio e limite de 5 MB', () => {
    const valid = new File([new Uint8Array(1024)], 'foto.jpg', { type: 'image/jpeg' });
    expect(validarArquivoFotoResolucao(valid)).toBeNull();

    const validWebp = new File([new Uint8Array(1024)], 'foto.webp', { type: 'image/webp' });
    expect(validarArquivoFotoResolucao(validWebp)).toBeNull();

    const pdf = new File([new Uint8Array(128)], 'doc.pdf', { type: 'application/pdf' });
    expect(validarArquivoFotoResolucao(pdf)).toMatch(/formato de imagem inválido/i);

    const gif = new File([new Uint8Array(128)], 'anim.gif', { type: 'image/gif' });
    expect(validarArquivoFotoResolucao(gif)).toMatch(/formato de imagem inválido/i);

    const mismatch = new File([new Uint8Array(128)], 'foto.png', { type: 'image/jpeg' });
    expect(validarArquivoFotoResolucao(mismatch)).toMatch(/extensão do arquivo/i);

    const empty = new File([], 'vazia.jpg', { type: 'image/jpeg' });
    expect(validarArquivoFotoResolucao(empty)).toMatch(/vazio/i);

    const grande = new File(
      [new Uint8Array(TAMANHO_MAX_FOTO_RESOLUCAO_BYTES + 1)],
      'grande.png',
      { type: 'image/png' }
    );
    expect(validarArquivoFotoResolucao(grande)).toMatch(/5 MB/i);
  });

  it('constrói o caminho seguindo a convenção {ocorrencia_id}/{timestamp}-{uuid}.{ext}', () => {
    const uuid = '11111111-2222-4333-8444-555555555555';
    expect(construirCaminhoFotoResolucao('oc-99', 'image/jpeg', 1731600000000, uuid)).toBe(
      'oc-99/1731600000000-11111111-2222-4333-8444-555555555555.jpg'
    );
    expect(construirCaminhoFotoResolucao('oc-99', 'image/png', 1731600000000, uuid)).toBe(
      'oc-99/1731600000000-11111111-2222-4333-8444-555555555555.png'
    );
    expect(construirCaminhoFotoResolucao('oc-99', 'image/webp', 1731600000000, uuid)).toBe(
      'oc-99/1731600000000-11111111-2222-4333-8444-555555555555.webp'
    );
  });

  it('remove segmentos APP1/EXIF de JPEG mantendo os dados da imagem intactos', () => {
    const comExif = criarJpegComExif();
    const semExif = removerMetadadosExifBinarios(comExif, 'image/jpeg');
    const texto = new TextDecoder().decode(semExif);

    expect(texto).not.toContain('GPS_LAT');
    expect(texto).not.toContain('Exif');
    expect(semExif[0]).toBe(0xff);
    expect(semExif[1]).toBe(0xd8);
    expect(semExif[semExif.length - 2]).toBe(0xff);
    expect(semExif[semExif.length - 1]).toBe(0xd9);
  });

  it('remove chunks eXIf de PNG mantendo IHDR, IDAT e IEND', () => {
    const comExif = criarPngComExif();
    const semExif = removerMetadadosExifBinarios(comExif, 'image/png');
    const texto = new TextDecoder().decode(semExif);

    expect(texto).not.toContain('eXIf');
    expect(texto).not.toContain('GPS_COORDS');
    expect(texto).toContain('IHDR');
    expect(texto).toContain('IDAT');
    expect(texto).toContain('IEND');
  });

  it('remove chunks EXIF de WebP e limpa os sinalizadores de metadados em VP8X', () => {
    const comExif = criarWebpComExif();
    const semExif = removerMetadadosExifBinarios(comExif, 'image/webp');
    const texto = new TextDecoder().decode(semExif);

    expect(texto).not.toContain('EXIF');
    expect(texto).not.toContain('GPS_WEBP_LOC');
    expect(texto).toContain('VP8 ');
    // Flags byte inside VP8X at offset 20 should have EXIF/XMP bits cleared (0x0c -> 0x00)
    expect(semExif[20] & 0x0c).toBe(0);
  });

  it('prepara o arquivo para upload removendo metadados de localização antes de enviar', async () => {
    const jpegBytes = criarJpegComExif();
    const file = new File([new Uint8Array(jpegBytes).buffer], 'resolucao.jpeg', {
      type: 'image/jpeg',
    });

    const preparado = await prepararFotoResolucao(file);
    expect(preparado.mimeType).toBe('image/jpeg');
    const finalBytes = new Uint8Array(await new Response(preparado.arquivo).arrayBuffer());
    const finalText = new TextDecoder().decode(finalBytes);
    expect(finalText).not.toContain('GPS_LAT');
  });
});
