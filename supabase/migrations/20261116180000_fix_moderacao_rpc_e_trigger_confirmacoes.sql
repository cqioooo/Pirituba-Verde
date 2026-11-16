-- ═════════════════════════════════════════════════════════════════════════════
-- Pirituba Verde — Correção definitiva de DEF-06, DEF-08 e DEF-09 no banco
-- Gerada a partir das definições reais de:
--   - public.executar_acao_moderacao(uuid, text, text, text)
--   - public.fn_validar_ponto_por_confirmacoes()
--   - public.trigger_validar_ponto_em_confirmacao() (trigger legado conflitante)
--   - constraint pontos_descarte_status_check
-- ═════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 1. DEF-06 & DEF-08: public.executar_acao_moderacao
--    - DEF-06: Permitir `invalidar` em pontos antes da confirmação:
--      ('novo', 'em_confirmacao', 'em_analise'), bloqueando a partir de `confirmado`.
--    - DEF-08: Capturar `prazo_resolucao` gravado com RETURNING INTO v_novo_prazo
--      e devolver esse mesmo timestamp no JSONB de retorno.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.executar_acao_moderacao(
  p_ocorrencia_id uuid,
  p_acao text,
  p_justificativa text,
  p_evidencia_path text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_ocorrencia public.ocorrencias%ROWTYPE;
  v_transicao public.transicoes_moderacao%ROWTYPE;
  v_perfil_usuario text;
  v_ponto_id uuid;
  v_ponto_status_anterior text;
  v_ponto_status_novo text;
  v_status_moderacao text;
  v_novo_prazo public.ocorrencias.prazo_resolucao%TYPE;
BEGIN
  IF p_justificativa IS NULL OR btrim(p_justificativa) = '' THEN
    RAISE EXCEPTION 'Justificativa é obrigatória';
  END IF;

  SELECT * INTO v_ocorrencia
  FROM public.ocorrencias
  WHERE id = p_ocorrencia_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ocorrência não encontrada';
  END IF;

  SELECT perfil INTO v_perfil_usuario
  FROM public.perfis
  WHERE id = auth.uid();

  IF v_perfil_usuario IS NULL OR v_perfil_usuario NOT IN ('gestor', 'analista', 'admin') THEN
    RAISE EXCEPTION 'Apenas gestão pode executar ações de moderação';
  END IF;

  SELECT * INTO v_transicao
  FROM public.transicoes_moderacao
  WHERE acao = p_acao
    AND estado_origem_ocorrencia = v_ocorrencia.status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transição inválida: ação % não permitida no estado %', p_acao, v_ocorrencia.status;
  END IF;

  IF v_transicao.perfil_necessario = 'gestor' AND v_perfil_usuario NOT IN ('gestor', 'admin') THEN
    RAISE EXCEPTION 'Perfil insuficiente para a ação %', p_acao;
  END IF;

  IF p_acao = 'prorrogar' AND v_ocorrencia.prorrogado_em IS NOT NULL THEN
    RAISE EXCEPTION 'Prorrogação já foi utilizada nesta ocorrência';
  END IF;

  v_ponto_id := v_ocorrencia.ponto_id;
  v_ponto_status_novo := v_transicao.estado_destino_ponto;

  IF v_ponto_id IS NOT NULL AND v_ponto_status_novo IS NOT NULL THEN
    SELECT status INTO v_ponto_status_anterior
    FROM public.pontos_descarte
    WHERE id = v_ponto_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Ponto vinculado não encontrado';
    END IF;

    IF p_acao = 'invalidar'
       AND (
         v_ponto_status_anterior IS NULL
         OR v_ponto_status_anterior NOT IN ('novo', 'em_confirmacao', 'em_analise')
       ) THEN
      RAISE EXCEPTION 'Invalidação só é permitida antes da confirmação do ponto. Status atual: %', v_ponto_status_anterior;
    END IF;
  END IF;

  IF v_transicao.exige_foto AND (p_evidencia_path IS NULL OR btrim(p_evidencia_path) = '') THEN
    RAISE EXCEPTION 'Foto é obrigatória para a ação %', p_acao;
  END IF;

  v_ponto_status_novo := v_transicao.estado_destino_ponto;

  UPDATE public.ocorrencias
  SET status = v_transicao.estado_destino_ocorrencia,
      updated_at = now(),
      prorrogado_em = CASE
        WHEN p_acao = 'prorrogar' THEN now()
        ELSE v_ocorrencia.prorrogado_em
      END,
      prazo_resolucao = CASE
        WHEN p_acao = 'prorrogar' THEN
          coalesce(v_ocorrencia.prazo_resolucao, v_ocorrencia.data_registro + interval '30 days') + interval '30 days'
        ELSE v_ocorrencia.prazo_resolucao
      END,
      fotos = CASE
        WHEN v_transicao.exige_foto AND p_evidencia_path IS NOT NULL
          THEN array_append(v_ocorrencia.fotos, p_evidencia_path)
        ELSE v_ocorrencia.fotos
      END
  WHERE id = p_ocorrencia_id
  RETURNING prazo_resolucao INTO v_novo_prazo;

  v_status_moderacao := CASE
    WHEN p_acao IN ('aprovar', 'resolver') THEN 'aprovada'
    WHEN p_acao = 'invalidar' THEN 'rejeitada'
    ELSE 'pendente'
  END;

  INSERT INTO public.moderacao_ocorrencias
    (ocorrencia_id, motivo, status, moderado_por, observacao)
  VALUES
    (p_ocorrencia_id, 'outro', v_status_moderacao, auth.uid(), p_justificativa);

  IF v_ponto_id IS NOT NULL AND v_ponto_status_novo IS NOT NULL THEN
    UPDATE public.pontos_descarte
    SET status = v_ponto_status_novo,
        updated_at = now()
    WHERE id = v_ponto_id;

    INSERT INTO public.historico_status_ponto
      (ponto_id, status_anterior, status_novo, alterado_por, motivo)
    VALUES
      (v_ponto_id, v_ponto_status_anterior, v_ponto_status_novo, auth.uid(), p_justificativa);
  END IF;

  RETURN jsonb_build_object(
    'sucesso', true,
    'acao', p_acao,
    'status_ocorrencia', v_transicao.estado_destino_ocorrencia,
    'status_ponto', v_ponto_status_novo,
    'prazo_resolucao', CASE WHEN p_acao = 'prorrogar' THEN v_novo_prazo ELSE NULL END
  );
END;
$function$;

-- -----------------------------------------------------------------------------
-- 2. DEF-09: Alinhar `confirmacoes_para_validar = '4'` e unificar triggers
--    AFTER INSERT em `public.confirmacoes`
--    - Remove `on_confirmacao_inserted` + `trigger_validar_ponto_em_confirmacao()`,
--      que tentava gravar status `'validado'` (violando `pontos_descarte_status_check`).
--    - Mantém `trigger_validar_ponto_confirmacoes` -> `fn_validar_ponto_por_confirmacoes()`
--      usando exclusivamente `'em_confirmacao'` / `'confirmado'`, gravando
--      `historico_status_ponto` na mudança de status e chamando `recalcular_criticidade`.
-- -----------------------------------------------------------------------------
UPDATE public.configuracoes_sistema
SET valor = '4'
WHERE chave = 'confirmacoes_para_validar';

DROP TRIGGER IF EXISTS on_confirmacao_inserted ON public.confirmacoes;
DROP FUNCTION IF EXISTS public.trigger_validar_ponto_em_confirmacao();

CREATE OR REPLACE FUNCTION public.fn_validar_ponto_por_confirmacoes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_total_confirmacoes INT;
  v_minimo INT;
  v_status_atual TEXT;
  v_status_novo TEXT;
BEGIN
  SELECT NULLIF(btrim(valor), '')::INT INTO v_minimo
  FROM public.configuracoes_sistema
  WHERE chave = 'confirmacoes_para_validar'
  LIMIT 1;

  IF v_minimo IS NULL OR v_minimo < 1 THEN
    v_minimo := 4;
  END IF;

  SELECT COUNT(DISTINCT usuario_id)::INT INTO v_total_confirmacoes
  FROM public.confirmacoes
  WHERE ponto_id = NEW.ponto_id;

  SELECT status INTO v_status_atual
  FROM public.pontos_descarte
  WHERE id = NEW.ponto_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF v_total_confirmacoes >= v_minimo
     AND v_status_atual IN ('novo', 'em_confirmacao', 'em_analise') THEN
    v_status_novo := 'confirmado';

    UPDATE public.pontos_descarte
    SET confirmacoes = v_total_confirmacoes,
        status       = v_status_novo,
        validado     = true,
        updated_at   = now()
    WHERE id = NEW.ponto_id;

    INSERT INTO public.historico_status_ponto
      (ponto_id, status_anterior, status_novo, alterado_por, motivo)
    VALUES
      (
        NEW.ponto_id,
        v_status_atual,
        v_status_novo,
        NEW.usuario_id,
        'Atingiu ' || v_total_confirmacoes || ' confirmações comunitárias'
      );
  ELSE
    v_status_novo := CASE
      WHEN v_status_atual = 'novo' THEN 'em_confirmacao'
      ELSE v_status_atual
    END;

    UPDATE public.pontos_descarte
    SET confirmacoes = v_total_confirmacoes,
        status       = v_status_novo,
        updated_at   = now()
    WHERE id = NEW.ponto_id;

    IF v_status_novo IS DISTINCT FROM v_status_atual THEN
      INSERT INTO public.historico_status_ponto
        (ponto_id, status_anterior, status_novo, alterado_por, motivo)
      VALUES
        (
          NEW.ponto_id,
          v_status_atual,
          v_status_novo,
          NEW.usuario_id,
          'Recebeu confirmação comunitária (' || v_total_confirmacoes || '/' || v_minimo || ')'
        );
    END IF;
  END IF;

  PERFORM public.recalcular_criticidade(NEW.ponto_id);

  RETURN NEW;
END;
$function$;
