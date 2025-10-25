-- ============================================================================
-- FIX: RPC aluno_completar_bloco (avançar para próximo bloco)
-- Data: 2025-10-20
-- ============================================================================

DROP FUNCTION IF EXISTS aluno_completar_bloco(UUID, UUID, INTEGER);

CREATE OR REPLACE FUNCTION aluno_completar_bloco(
  p_participacao_id UUID,
  p_bloco_template_id UUID,
  p_pontos_conteudo INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_aula_id UUID;
  v_numero_atual INTEGER;
  v_total_blocos INTEGER;
  v_proximo_bloco_id UUID;
  v_proximo_numero INTEGER;
  v_pontos_totais INTEGER;
BEGIN
  -- Buscar dados da participação
  SELECT 
    session_id,
    bloco_atual_numero,
    total_blocos,
    pontos_ganhos_sessao
  INTO 
    v_session_id,
    v_numero_atual,
    v_total_blocos,
    v_pontos_totais
  FROM participacoes_sessao
  WHERE id = p_participacao_id;

  IF v_session_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Participação não encontrada'
    );
  END IF;

  -- Buscar aula_id da sessão
  SELECT aula_id INTO v_aula_id
  FROM sessions
  WHERE id = v_session_id;

  -- Marcar bloco atual como completado
  UPDATE progresso_blocos
  SET 
    status = 'completed',
    completado_em = NOW(),
    pontos_conteudo = p_pontos_conteudo,
    pontos_total = pontos_quiz + p_pontos_conteudo,
    updated_at = NOW()
  WHERE participacao_id = p_participacao_id
    AND bloco_template_id = p_bloco_template_id;

  -- Atualizar pontos totais da participação
  v_pontos_totais := v_pontos_totais + p_pontos_conteudo;

  -- Verificar se há próximo bloco
  v_proximo_numero := v_numero_atual + 1;

  IF v_proximo_numero <= v_total_blocos THEN
    -- Buscar próximo bloco
    SELECT bt.id INTO v_proximo_bloco_id
    FROM aulas_blocos ab
    JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
    WHERE ab.aula_id = v_aula_id
      AND ab.ordem_na_aula = v_proximo_numero
    LIMIT 1;

    IF v_proximo_bloco_id IS NOT NULL THEN
      -- Criar progresso para próximo bloco
      INSERT INTO progresso_blocos (
        participacao_id,
        bloco_template_id,
        numero_sequencia,
        status
      ) VALUES (
        p_participacao_id,
        v_proximo_bloco_id,
        v_proximo_numero,
        'active'
      )
      ON CONFLICT (participacao_id, bloco_template_id) 
      DO UPDATE SET status = 'active', updated_at = NOW();

      -- Atualizar participação para próximo bloco
      UPDATE participacoes_sessao
      SET 
        bloco_atual_numero = v_proximo_numero,
        blocos_completados = v_numero_atual,
        pontos_ganhos_sessao = v_pontos_totais,
        ultima_atividade = NOW(),
        updated_at = NOW()
      WHERE id = p_participacao_id;

      RETURN jsonb_build_object(
        'success', TRUE,
        'proximo_bloco', v_proximo_numero,
        'sessao_completa', FALSE
      );
    END IF;
  END IF;

  -- Sessão completa
  UPDATE participacoes_sessao
  SET 
    bloco_atual_numero = v_total_blocos,
    blocos_completados = v_total_blocos,
    pontos_ganhos_sessao = v_pontos_totais,
    status = 'completed',
    saiu_em = NOW(),
    ultima_atividade = NOW(),
    updated_at = NOW()
  WHERE id = p_participacao_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'sessao_completa', TRUE,
    'pontos_totais', v_pontos_totais
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$;

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ RPC aluno_completar_bloco corrigido com lógica de avanço!';
END $$;





