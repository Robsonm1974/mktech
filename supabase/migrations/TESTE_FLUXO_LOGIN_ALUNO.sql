-- ============================================================================
-- TESTE COMPLETO: Fluxo de Login do Aluno
-- Data: 2025-10-20
-- ============================================================================

DO $$
DECLARE
  v_session_id UUID;
  v_session_code VARCHAR;
  v_turma_id UUID;
  v_aula_id UUID;
  v_aluno_id UUID;
  v_aluno_nome VARCHAR;
  v_aluno_pin VARCHAR;
  v_resultado JSONB;
  v_total_blocos INTEGER;
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '🧪 TESTE DO FLUXO COMPLETO DE LOGIN DO ALUNO';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- ══════════════════════════════════════════════════════════════════════
  -- ETAPA 1: Buscar sessão ativa
  -- ══════════════════════════════════════════════════════════════════════
  
  RAISE NOTICE '📍 ETAPA 1: Buscar sessão ativa';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';
  
  SELECT 
    id, 
    session_code, 
    turma_id, 
    aula_id
  INTO 
    v_session_id, 
    v_session_code, 
    v_turma_id, 
    v_aula_id
  FROM sessions
  WHERE status = 'active'
  ORDER BY iniciada_em DESC
  LIMIT 1;

  IF v_session_id IS NULL THEN
    RAISE NOTICE '❌ ERRO: Nenhuma sessão ativa encontrada!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 SOLUÇÃO: Professor precisa iniciar uma sessão primeiro.';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Sessão encontrada:';
  RAISE NOTICE '   ID: %', v_session_id;
  RAISE NOTICE '   Código: %', v_session_code;
  RAISE NOTICE '   Turma ID: %', v_turma_id;
  RAISE NOTICE '   Aula ID: %', v_aula_id;
  RAISE NOTICE '';

  -- ══════════════════════════════════════════════════════════════════════
  -- ETAPA 2: Verificar se aula tem blocos
  -- ══════════════════════════════════════════════════════════════════════
  
  RAISE NOTICE '📍 ETAPA 2: Verificar blocos da aula';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';
  
  SELECT COUNT(*)
  INTO v_total_blocos
  FROM aulas_blocos
  WHERE aula_id = v_aula_id;

  IF v_total_blocos = 0 THEN
    RAISE NOTICE '❌ ERRO: Aula não tem blocos cadastrados!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 SOLUÇÃO: Adicionar blocos à aula no admin.';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Aula tem % bloco(s)', v_total_blocos;
  RAISE NOTICE '';

  -- ══════════════════════════════════════════════════════════════════════
  -- ETAPA 3: Buscar aluno da turma
  -- ══════════════════════════════════════════════════════════════════════
  
  RAISE NOTICE '📍 ETAPA 3: Buscar aluno da turma';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';
  
  SELECT 
    id, 
    full_name, 
    pin_code
  INTO 
    v_aluno_id, 
    v_aluno_nome, 
    v_aluno_pin
  FROM alunos
  WHERE turma_id = v_turma_id
    AND active = true
  LIMIT 1;

  IF v_aluno_id IS NULL THEN
    RAISE NOTICE '❌ ERRO: Nenhum aluno ativo encontrado na turma!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 SOLUÇÃO: Cadastrar alunos na turma.';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Aluno encontrado:';
  RAISE NOTICE '   ID: %', v_aluno_id;
  RAISE NOTICE '   Nome: %', v_aluno_nome;
  RAISE NOTICE '   PIN: %', v_aluno_pin;
  RAISE NOTICE '';

  -- ══════════════════════════════════════════════════════════════════════
  -- ETAPA 4: Executar RPC aluno_entrar_sessao
  -- ══════════════════════════════════════════════════════════════════════
  
  RAISE NOTICE '📍 ETAPA 4: Executar RPC aluno_entrar_sessao';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';
  
  BEGIN
    v_resultado := aluno_entrar_sessao(v_session_id, v_aluno_id);
    
    RAISE NOTICE '✅ RPC executado com sucesso!';
    RAISE NOTICE '   Resultado: %', v_resultado;
    RAISE NOTICE '';

  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ ERRO ao executar RPC: %', SQLERRM;
      RAISE NOTICE '';
      RAISE NOTICE '💡 SOLUÇÃO: Verificar definição do RPC aluno_entrar_sessao';
      RETURN;
  END;

  -- ══════════════════════════════════════════════════════════════════════
  -- ETAPA 5: Verificar participação criada
  -- ══════════════════════════════════════════════════════════════════════
  
  RAISE NOTICE '📍 ETAPA 5: Verificar participação criada';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';
  
  IF (v_resultado->>'success')::boolean = true THEN
    DECLARE
      v_participacao_id UUID;
      v_progresso_count INTEGER;
    BEGIN
      v_participacao_id := (v_resultado->>'participacao_id')::UUID;
      
      SELECT COUNT(*)
      INTO v_progresso_count
      FROM progresso_blocos
      WHERE participacao_id = v_participacao_id;
      
      RAISE NOTICE '✅ Participação criada:';
      RAISE NOTICE '   ID: %', v_participacao_id;
      RAISE NOTICE '   Registros de progresso: %', v_progresso_count;
      RAISE NOTICE '';
    END;
  ELSE
    RAISE NOTICE '❌ RPC retornou erro: %', v_resultado->>'error';
    RAISE NOTICE '';
  END IF;

  -- ══════════════════════════════════════════════════════════════════════
  -- RESUMO FINAL
  -- ══════════════════════════════════════════════════════════════════════
  
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '📊 RESUMO DO TESTE';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Para testar no navegador use:';
  RAISE NOTICE '   Código da sessão: %', v_session_code;
  RAISE NOTICE '   Aluno: %', v_aluno_nome;
  RAISE NOTICE '   PIN: %', v_aluno_pin;
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

END $$;





