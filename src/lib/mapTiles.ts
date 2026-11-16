/**
 * Configuração central dos tiles do Leaflet.
 *
 * Usa OpenStreetMap por padrão (sem necessidade de API Key), evitando erros de
 * autenticação em basemaps que exigem chave comercial. Pode ser sobrescrito via
 * variáveis `VITE_MAP_TILE_URL` e `VITE_MAP_TILE_ATTRIBUTION`.
 */
export const MAP_TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ||
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const MAP_TILE_ATTRIBUTION =
  import.meta.env.VITE_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
