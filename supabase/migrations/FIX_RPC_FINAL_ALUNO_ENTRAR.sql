-- ============================================================================
-- FIX FINAL: RPC aluno_entrar_sessao com nomes corretos de colunas
-- Data: 2025-10-20
-- ============================================================================

DROP FUNCTION IF EXISTS aluno_entrar_sessao(UUID, UUID);

CREATE OR REPLACE FUNCTION aluno_entrar_sessao(
  p_session_id UUID,
  p_aluno_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_participacao_id UUID;
  v_aula_id UUID;
  v_primeiro_bloco_id UUID;
  v_total_blocos INTEGER;
BEGIN
  -- 1. Verificar se sessão existe e está ativa
  SELECT aula_id 
  INTO v_aula_id
  FROM sessions
  WHERE id = p_session_id AND status = 'active';

  IF v_aula_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Sessão não encontrada ou não está ativa'
    );
  END IF;

  -- 2. Contar total de blocos da aula
  SELECT COUNT(*)
  INTO v_total_blocos
  FROM aulas_blocos
  WHERE aula_id = v_aula_id;

  -- 3. Buscar primeiro bloco da aula
  SELECT bt.id
  INTO v_primeiro_bloco_id
  FROM aulas_blocos ab
  JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
  WHERE ab.aula_id = v_aula_id
  ORDER BY ab.ordem_na_aula
  LIMIT 1;

  IF v_primeiro_bloco_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Aula sem blocos cadastrados'
    );
  END IF;

  -- 4. Verificar se aluno já está participando
  SELECT id INTO v_participacao_id
  FROM participacoes_sessao
  WHERE session_id = p_session_id 
    AND aluno_id = p_aluno_id;

  IF v_participacao_id IS NOT NULL THEN
    -- Já está participando, retornar dados da participação
    RETURN jsonb_build_object(
      'success', TRUE,
      'participacao_id', v_participacao_id,
      'primeiro_bloco_id', v_primeiro_bloco_id,
      'total_blocos', v_total_blocos,
      'message', 'Aluno já está na sessão'
    );
  END IF;

  -- 5. Criar participação
  INSERT INTO participacoes_sessao (
    session_id,
    aluno_id,
    bloco_atual_numero,
    blocos_completados,
    total_blocos,
    pontos_ganhos_sessao,
    status
  ) VALUES (
    p_session_id,
    p_aluno_id,
    1,
    0,
    v_total_blocos,
    0,
    'active'
  )
  RETURNING id INTO v_participacao_id;

  -- 6. Criar progresso para o primeiro bloco
  INSERT INTO progresso_blocos (
    participacao_id,
    bloco_template_id,
    numero_sequencia,
    status
  ) VALUES (
    v_participacao_id,
    v_primeiro_bloco_id,
    1,
    'active'
  );

  -- Retornar sucesso
  RETURN jsonb_build_object(
    'success', TRUE,
    'participacao_id', v_participacao_id,
    'primeiro_bloco_id', v_primeiro_bloco_id,
    'total_blocos', v_total_blocos
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
  RAISE NOTICE '✅ RPC aluno_entrar_sessao corrigido!';
  RAISE NOTICE 'Aguarde resultado do script VERIFICAR_AULAS_BLOCOS.sql';
  RAISE NOTICE 'para confirmar o nome correto da coluna.';
END $$;

