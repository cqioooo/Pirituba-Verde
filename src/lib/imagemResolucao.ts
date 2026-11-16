import { ErroAcaoModeracao } from './moderacao';

export const FOTOS_RESOLUCAO_BUCKET = 'fotos-resolucao';
export const TAMANHO_MAX_FOTO_RESOLUCAO_BYTES = 5 * 1024 * 1024; // 5 MB
export const DIMENSAO_MAX_FOTO_RESOLUCAO_PX = 1600;
export const QUALIDADE_COMPRESSAO_FOTO_RESOLUCAO = 0.82;

export const TIPOS_FOTO_RESOLUCAO_ACEITOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type TipoFotoResolucao = (typeof TIPOS_FOTO_RESOLUCAO_ACEITOS)[number];

const MIME_PARA_EXT: Record<TipoFotoResolucao, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const EXT_PARA_MIME: Record<string, TipoFotoResolucao> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function obterExtensaoArquivo(nome: string): string {
  const idx = nome.lastIndexOf('.');
  if (idx < 0 || idx === nome.length - 1) return '';
  return nome.slice(idx + 1).toLowerCase();
}

export function resolverMimeFotoResolucao(file: File): TipoFotoResolucao | null {
  if ((TIPOS_FOTO_RESOLUCAO_ACEITOS as readonly string[]).includes(file.type)) {
    return file.type as TipoFotoResolucao;
  }
  if (!file.type) {
    const ext = obterExtensaoArquivo(file.name);
    return EXT_PARA_MIME[ext] ?? null;
  }
  return null;
}

export function validarArquivoFotoResolucao(file: File | null | undefined): string | null {
  if (!file) {
    return 'Anexe uma foto de resolução em formato JPEG, PNG ou WebP.';
  }

  const mime = resolverMimeFotoResolucao(file);
  if (!mime) {
    return 'Formato de imagem inválido. Envie apenas arquivos JPEG, PNG ou WebP.';
  }

  const ext = obterExtensaoArquivo(file.name);
  if (ext && EXT_PARA_MIME[ext] && EXT_PARA_MIME[ext] !== mime) {
    return 'A extensão do arquivo não corresponde ao tipo da imagem selecionada.';
  }

  if (file.size <= 0) {
    return 'O arquivo de imagem selecionado está vazio.';
  }

  if (file.size > TAMANHO_MAX_FOTO_RESOLUCAO_BYTES) {
    return 'A foto excede o limite de 5 MB. Escolha ou reduza a imagem antes de enviar.';
  }

  return null;
}

function gerarUuidSeguro(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = (Date.now() + i * 31) & 0xff;
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Gera o caminho privado conforme a convenção da KAN-84:
 * `{ocorrencia_id}/{timestamp}-{uuid}.{ext}`
 */
export function construirCaminhoFotoResolucao(
  ocorrenciaId: string,
  mimeType: TipoFotoResolucao,
  timestamp = Date.now(),
  uuid = gerarUuidSeguro()
): string {
  const idLimpo = ocorrenciaId.trim();
  if (!idLimpo || idLimpo.includes('/') || idLimpo.includes('..')) {
    throw new ErroAcaoModeracao('arquivo_invalido', 'Identificador da ocorrência inválido para upload.');
  }
  const ext = MIME_PARA_EXT[mimeType];
  return `${idLimpo}/${timestamp}-${uuid}.${ext}`;
}

/**
 * Remove segmentos de metadados (EXIF/XMP/IPTC/comentários, incluindo GPS) diretamente
 * no binário para JPEG, PNG e WebP. Complementa a recodificação via `<canvas>`.
 */
export function removerMetadadosExifBinarios(
  bytes: Uint8Array,
  mimeType: TipoFotoResolucao
): Uint8Array {
  if (mimeType === 'image/jpeg') {
    return removerMetadadosJpeg(bytes);
  }
  if (mimeType === 'image/png') {
    return removerMetadadosPng(bytes);
  }
  if (mimeType === 'image/webp') {
    return removerMetadadosWebp(bytes);
  }
  return bytes;
}

function removerMetadadosJpeg(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return bytes;
  }

  const partes: Uint8Array[] = [bytes.slice(0, 2)];
  let offset = 2;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      partes.push(bytes.slice(offset));
      break;
    }

    while (offset < bytes.length && bytes[offset] === 0xff) {
      offset += 1;
    }
    if (offset >= bytes.length) break;

    const marker = bytes[offset];
    offset += 1;

    // SOS (Start of Scan): copiar o restante da imagem até EOI intacto
    if (marker === 0xda) {
      partes.push(new Uint8Array([0xff, marker]));
      partes.push(bytes.slice(offset));
      break;
    }

    // EOI ou marcadores RSTn sem payload
    if (marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01 || marker === 0x00) {
      partes.push(new Uint8Array([0xff, marker]));
      continue;
    }

    if (offset + 2 > bytes.length) break;
    const segLen = (bytes[offset] << 8) | bytes[offset + 1];
    if (segLen < 2 || offset + segLen > bytes.length) {
      partes.push(bytes.slice(offset - 2));
      break;
    }

    // Remove APP1 (EXIF/XMP), APP2..APP15 (inclui IPTC/APP13 e perfis extras) e COM (0xFE)
    const ehSegmentoMetadado =
      marker === 0xe1 || (marker >= 0xe3 && marker <= 0xef) || marker === 0xfe;

    if (!ehSegmentoMetadado) {
      partes.push(new Uint8Array([0xff, marker]));
      partes.push(bytes.slice(offset, offset + segLen));
    }

    offset += segLen;
  }

  return concatenarUint8Arrays(partes);
}

function removerMetadadosPng(bytes: Uint8Array): Uint8Array {
  const assinatura = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 8 || !assinatura.every((b, i) => bytes[i] === b)) {
    return bytes;
  }

  const chunksRemoviveis = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME']);
  const partes: Uint8Array[] = [bytes.slice(0, 8)];
  let offset = 8;

  while (offset + 12 <= bytes.length) {
    const length =
      ((bytes[offset] << 24) >>> 0) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3];
    const tipo = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );
    const totalChunk = 12 + length;
    if (offset + totalChunk > bytes.length) {
      partes.push(bytes.slice(offset));
      break;
    }
    if (!chunksRemoviveis.has(tipo)) {
      partes.push(bytes.slice(offset, offset + totalChunk));
    }
    offset += totalChunk;
    if (tipo === 'IEND') break;
  }

  return concatenarUint8Arrays(partes);
}

function removerMetadadosWebp(bytes: Uint8Array): Uint8Array {
  if (
    bytes.length < 12 ||
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== 'RIFF' ||
    String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) !== 'WEBP'
  ) {
    return bytes;
  }

  const chunksRemoviveis = new Set(['EXIF', 'XMP ']);
  const payloadChunks: Uint8Array[] = [];
  let offset = 12;

  while (offset + 8 <= bytes.length) {
    const fourCC = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
    const chunkSize =
      bytes[offset + 4] |
      (bytes[offset + 5] << 8) |
      (bytes[offset + 6] << 16) |
      ((bytes[offset + 7] << 24) >>> 0);
    const paddedSize = chunkSize + (chunkSize % 2);
    const totalChunk = 8 + paddedSize;

    if (offset + totalChunk > bytes.length) {
      payloadChunks.push(bytes.slice(offset));
      break;
    }

    if (!chunksRemoviveis.has(fourCC)) {
      const chunkSlice = bytes.slice(offset, offset + totalChunk);
      // Limpa flags EXIF (0x08) e XMP (0x04) no chunk estendido VP8X
      if (fourCC === 'VP8X' && chunkSlice.length >= 9) {
        chunkSlice[8] &= ~0x0c;
      }
      payloadChunks.push(chunkSlice);
    }

    offset += totalChunk;
  }

  const payloadTotal = payloadChunks.reduce((acc, c) => acc + c.length, 0);
  const riffSize = 4 + payloadTotal;
  const header = new Uint8Array(12);
  header.set(bytes.slice(0, 4), 0); // 'RIFF'
  header[4] = riffSize & 0xff;
  header[5] = (riffSize >>> 8) & 0xff;
  header[6] = (riffSize >>> 16) & 0xff;
  header[7] = (riffSize >>> 24) & 0xff;
  header.set(bytes.slice(8, 12), 8); // 'WEBP'

  return concatenarUint8Arrays([header, ...payloadChunks]);
}

function concatenarUint8Arrays(partes: Uint8Array[]): Uint8Array {
  const total = partes.reduce((acc, item) => acc + item.length, 0);
  const saida = new Uint8Array(total);
  let cursor = 0;
  for (const parte of partes) {
    saida.set(parte, cursor);
    cursor += parte.length;
  }
  return saida;
}

interface FonteImagemDecodificada {
  largura: number;
  altura: number;
  desenhar: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  liberar: () => void;
}

async function decodificarImagem(file: File): Promise<FonteImagemDecodificada | null> {
  if (typeof globalThis.createImageBitmap === 'function') {
    try {
      const bitmap = await globalThis.createImageBitmap(file);
      return {
        largura: bitmap.width,
        altura: bitmap.height,
        desenhar: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
        liberar: () => bitmap.close(),
      };
    } catch {
      // Continua para fallback via HTMLImageElement quando createImageBitmap não suportar o blob
    }
  }

  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return null;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const elemento = new Image();
      const timeoutId = setTimeout(() => {
        elemento.onload = null;
        elemento.onerror = null;
        reject(new Error('Tempo limite ao decodificar imagem'));
      }, 2000);
      elemento.onload = () => {
        clearTimeout(timeoutId);
        resolve(elemento);
      };
      elemento.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Falha ao carregar imagem'));
      };
      elemento.src = objectUrl;
    });

    return {
      largura: img.naturalWidth || img.width,
      altura: img.naturalHeight || img.height,
      desenhar: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      liberar: () => URL.revokeObjectURL(objectUrl),
    };
  } catch {
    URL.revokeObjectURL(objectUrl);
    return null;
  }
}

function canvasParaBlob(
  canvas: HTMLCanvasElement,
  mimeType: TipoFotoResolucao,
  quality: number
): Promise<Blob | null> {
  return new Promise(resolve => {
    if (typeof canvas.toBlob !== 'function') {
      resolve(null);
      return;
    }
    canvas.toBlob(blob => resolve(blob), mimeType, quality);
  });
}

function substituirExtensao(nome: string, novaExt: string): string {
  const base = nome.replace(/\.[^.]+$/, '') || 'resolucao';
  return `${base}.${novaExt}`;
}

async function lerBytesBlob(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }
  if (typeof Response !== 'undefined') {
    return new Uint8Array(await new Response(blob).arrayBuffer());
  }
  return await new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(new Uint8Array(reader.result as ArrayBuffer));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler os bytes da imagem.'));
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Valida, comprime no cliente via `<canvas>` (quando disponível no navegador) e garante
 * remoção de metadados EXIF/GPS antes do upload para o bucket privado.
 */
export async function prepararFotoResolucao(file: File): Promise<{
  arquivo: File;
  mimeType: TipoFotoResolucao;
}> {
  const erroValidacao = validarArquivoFotoResolucao(file);
  if (erroValidacao) {
    throw new ErroAcaoModeracao('arquivo_invalido', erroValidacao);
  }

  const mimeOriginal = resolverMimeFotoResolucao(file);
  if (!mimeOriginal) {
    throw new ErroAcaoModeracao(
      'arquivo_invalido',
      'Formato de imagem inválido. Envie apenas JPEG, PNG ou WebP.'
    );
  }

  let blobFinal: Blob = file;
  let mimeFinal: TipoFotoResolucao = mimeOriginal;

  const canvasTeste =
    typeof document !== 'undefined' ? document.createElement('canvas') : null;
  const ctxTeste = canvasTeste?.getContext('2d') ?? null;

  if (canvasTeste && ctxTeste) {
    const imagem = await decodificarImagem(file);
    if (imagem) {
      try {
        const maiorLado = Math.max(imagem.largura, imagem.altura);
        const escala =
          maiorLado > DIMENSAO_MAX_FOTO_RESOLUCAO_PX
            ? DIMENSAO_MAX_FOTO_RESOLUCAO_PX / maiorLado
            : 1;
        const larguraAlvo = Math.max(1, Math.round(imagem.largura * escala));
        const alturaAlvo = Math.max(1, Math.round(imagem.altura * escala));

        canvasTeste.width = larguraAlvo;
        canvasTeste.height = alturaAlvo;
        const ctx = canvasTeste.getContext('2d');

        if (ctx) {
          imagem.desenhar(ctx, larguraAlvo, alturaAlvo);
          const recomprimido = await canvasParaBlob(
            canvasTeste,
            mimeOriginal,
            QUALIDADE_COMPRESSAO_FOTO_RESOLUCAO
          );

          if (recomprimido && recomprimido.size > 0) {
            if (
              mimeOriginal === 'image/png' &&
              recomprimido.size > TAMANHO_MAX_FOTO_RESOLUCAO_BYTES
            ) {
              const fallbackWebp = await canvasParaBlob(
                canvasTeste,
                'image/webp',
                QUALIDADE_COMPRESSAO_FOTO_RESOLUCAO
              );
              if (fallbackWebp && fallbackWebp.size > 0) {
                blobFinal = fallbackWebp;
                mimeFinal = 'image/webp';
              } else {
                blobFinal = recomprimido;
              }
            } else {
              blobFinal = recomprimido;
            }
          }
        }
      } finally {
        imagem.liberar();
      }
    }
  }

  const bytesLimpos = removerMetadadosExifBinarios(await lerBytesBlob(blobFinal), mimeFinal);
  const bufferLimpo = new Uint8Array(bytesLimpos).buffer;

  if (bytesLimpos.byteLength > TAMANHO_MAX_FOTO_RESOLUCAO_BYTES) {
    throw new ErroAcaoModeracao(
      'arquivo_invalido',
      'Mesmo após compressão, a foto excede o limite de 5 MB.'
    );
  }

  const extFinal = MIME_PARA_EXT[mimeFinal];
  const arquivoProcessado = new File(
    [bufferLimpo],
    substituirExtensao(file.name, extFinal),
    { type: mimeFinal, lastModified: Date.now() }
  );

  return {
    arquivo: arquivoProcessado,
    mimeType: mimeFinal,
  };
}
