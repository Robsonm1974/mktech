-- ============================================================================
-- FIX: Corrigir RPC aluno_entrar_sessao
-- Data: 2025-10-27
-- 
-- PROBLEMAS CORRIGIDOS:
-- 1. Usar ordem_na_aula ao invés de ordem
-- 2. Adicionar logs detalhados para debug
-- 3. Verificar se sessão existe antes de processar
-- ============================================================================

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
  v_total_blocos INTEGER;
  v_aula_id UUID;
BEGIN
  RAISE NOTICE '🔵 [aluno_entrar_sessao] Iniciando...';
  RAISE NOTICE '   session_id: %', p_session_id;
  RAISE NOTICE '   aluno_id: %', p_aluno_id;
  
  -- Verificar se sessão existe e está ativa
  SELECT aula_id INTO v_aula_id
  FROM sessions
  WHERE id = p_session_id AND status = 'active';
  
  IF v_aula_id IS NULL THEN
    RAISE NOTICE '❌ Sessão não encontrada ou inativa';
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Sessão não encontrada ou inativa'
    );
  END IF;
  
  RAISE NOTICE '✅ Sessão encontrada. aula_id: %', v_aula_id;
  
  -- Contar total de blocos da aula (CORRETO: ordem_na_aula)
  SELECT COUNT(*) INTO v_total_blocos
  FROM aulas_blocos ab
  WHERE ab.aula_id = v_aula_id;
  
  RAISE NOTICE '📊 Total de blocos: %', v_total_blocos;
  
  IF v_total_blocos = 0 THEN
    RAISE NOTICE '⚠️ Nenhum bloco encontrado para esta aula';
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Aula sem blocos configurados'
    );
  END IF;

  -- Criar ou atualizar participação
  INSERT INTO participacoes_sessao (
    session_id,
    aluno_id,
    total_blocos,
    bloco_atual_numero,
    status
  ) VALUES (
    p_session_id,
    p_aluno_id,
    v_total_blocos,
    1,
    'active'
  )
  ON CONFLICT (session_id, aluno_id)
  DO UPDATE SET
    entrou_em = NOW(),
    ultima_atividade = NOW(),
    status = 'active'
  RETURNING id INTO v_participacao_id;
  
  RAISE NOTICE '✅ Participação criada/atualizada. ID: %', v_participacao_id;

  -- Criar progresso para todos os blocos (CORRETO: ordem_na_aula)
  INSERT INTO progresso_blocos (
    participacao_id,
    bloco_template_id,
    numero_sequencia,
    status
  )
  SELECT
    v_participacao_id,
    ab.bloco_template_id,
    ab.ordem_na_aula,  -- ✅ CORRIGIDO: era ab.ordem
    CASE WHEN ab.ordem_na_aula = 1 THEN 'active' ELSE 'locked' END
  FROM aulas_blocos ab
  WHERE ab.aula_id = v_aula_id
  ORDER BY ab.ordem_na_aula
  ON CONFLICT (participacao_id, bloco_template_id) DO NOTHING;
  
  RAISE NOTICE '✅ Progresso de blocos criado';

  -- Atualizar contador de participantes na sessão
  UPDATE sessions
  SET alunos_participantes = (
    SELECT COUNT(DISTINCT aluno_id)
    FROM participacoes_sessao
    WHERE session_id = p_session_id AND status = 'active'
  )
  WHERE id = p_session_id;
  
  RAISE NOTICE '✅ Contador de participantes atualizado';
  RAISE NOTICE '🟢 [aluno_entrar_sessao] Concluído com sucesso!';

  RETURN jsonb_build_object(
    'success', true,
    'participacao_id', v_participacao_id,
    'total_blocos', v_total_blocos,
    'message', 'Entrada registrada com sucesso'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO EXCEPTION: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Erro ao registrar entrada: ' || SQLERRM
    );
END;
$$;

-- ============================================================================
-- TESTAR
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RPC aluno_entrar_sessao ATUALIZADO!';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 MUDANÇAS:';
  RAISE NOTICE '   1. Corrigido ab.ordem → ab.ordem_na_aula';
  RAISE NOTICE '   2. Adicionados logs detalhados (RAISE NOTICE)';
  RAISE NOTICE '   3. Verificação de sessão ativa';
  RAISE NOTICE '   4. Verificação de blocos existentes';
  RAISE NOTICE '   5. Mensagens de erro mais detalhadas';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Para testar, execute no frontend e veja logs no Supabase';
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;



