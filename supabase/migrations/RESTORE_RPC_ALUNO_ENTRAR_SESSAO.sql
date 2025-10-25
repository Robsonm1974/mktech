-- ============================================================================
-- RESTORE: Versão segura do RPC aluno_entrar_sessao
-- Data: 2025-10-20
-- ============================================================================

-- Drop da função antiga
DROP FUNCTION IF EXISTS aluno_entrar_sessao(UUID, UUID);

-- Recriar função com logs e tratamento de erros
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
  RAISE NOTICE '🔍 Iniciando aluno_entrar_sessao para session: %, aluno: %', p_session_id, p_aluno_id;

  -- 1. Verificar se sessão existe e está ativa
  SELECT aula_id 
  INTO v_aula_id
  FROM sessions
  WHERE id = p_session_id AND status = 'active';

  IF v_aula_id IS NULL THEN
    RAISE NOTICE '❌ Sessão não encontrada ou inativa';
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Sessão não encontrada ou não está ativa'
    );
  END IF;

  RAISE NOTICE '✅ Sessão encontrada, aula_id: %', v_aula_id;

  -- 2. Buscar primeiro bloco da aula
  BEGIN
    SELECT 
      bt.id,
      (SELECT COUNT(*) FROM aulas_blocos WHERE aula_id = v_aula_id) AS total
    INTO v_primeiro_bloco_id, v_total_blocos
    FROM aulas_blocos ab
    JOIN blocos_templates bt ON ab.bloco_id = bt.id
    WHERE ab.aula_id = v_aula_id
    ORDER BY ab.ordem_na_aula
    LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Erro ao buscar blocos: %', SQLERRM;
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'Erro ao buscar blocos: ' || SQLERRM
      );
  END;

  IF v_primeiro_bloco_id IS NULL THEN
    RAISE NOTICE '❌ Nenhum bloco encontrado para aula: %', v_aula_id;
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Aula sem blocos cadastrados'
    );
  END IF;

  RAISE NOTICE '✅ Primeiro bloco: %, Total: %', v_primeiro_bloco_id, v_total_blocos;

  -- 3. Verificar se aluno já está participando
  SELECT id INTO v_participacao_id
  FROM participacoes_sessao
  WHERE session_id = p_session_id 
    AND aluno_id = p_aluno_id;

  IF v_participacao_id IS NOT NULL THEN
    RAISE NOTICE '✅ Aluno já participa, participacao_id: %', v_participacao_id;
    RETURN jsonb_build_object(
      'success', TRUE,
      'participacao_id', v_participacao_id,
      'message', 'Aluno já está na sessão'
    );
  END IF;

  -- 4. Criar participação
  BEGIN
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

    RAISE NOTICE '✅ Participação criada: %', v_participacao_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Erro ao criar participação: %', SQLERRM;
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'Erro ao criar participação: ' || SQLERRM
      );
  END;

  -- 5. Criar progresso para o primeiro bloco
  BEGIN
    INSERT INTO progresso_blocos (
      participacao_id,
      bloco_id,
      status,
      numero_bloco
    ) VALUES (
      v_participacao_id,
      v_primeiro_bloco_id,
      'active',
      1
    );

    RAISE NOTICE '✅ Progresso criado para primeiro bloco';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Erro ao criar progresso: %', SQLERRM;
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'Erro ao criar progresso: ' || SQLERRM
      );
  END;

  -- Retornar sucesso
  RAISE NOTICE '✅ Aluno entrou com sucesso na sessão';
  RETURN jsonb_build_object(
    'success', TRUE,
    'participacao_id', v_participacao_id,
    'primeiro_bloco_id', v_primeiro_bloco_id,
    'total_blocos', v_total_blocos
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro geral: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$;

-- Testar RPC
DO $$
DECLARE
  v_session_id UUID;
  v_aluno_id UUID;
  v_result JSONB;
BEGIN
  -- Pegar primeira sessão ativa
  SELECT id INTO v_session_id FROM sessions WHERE status = 'active' LIMIT 1;
  
  -- Pegar primeiro aluno
  SELECT id INTO v_aluno_id FROM alunos LIMIT 1;
  
  IF v_session_id IS NOT NULL AND v_aluno_id IS NOT NULL THEN
    RAISE NOTICE '══════════════════════════════════════';
    RAISE NOTICE '🧪 TESTANDO RPC COM:';
    RAISE NOTICE 'Session ID: %', v_session_id;
    RAISE NOTICE 'Aluno ID: %', v_aluno_id;
    RAISE NOTICE '══════════════════════════════════════';
    
    v_result := aluno_entrar_sessao(v_session_id, v_aluno_id);
    
    RAISE NOTICE '══════════════════════════════════════';
    RAISE NOTICE '📊 RESULTADO: %', v_result;
    RAISE NOTICE '══════════════════════════════════════';
  ELSE
    RAISE NOTICE '⚠️ Não há sessão ativa ou aluno cadastrado para testar';
  END IF;
END $$;





