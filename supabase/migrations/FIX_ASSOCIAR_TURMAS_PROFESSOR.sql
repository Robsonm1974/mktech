-- ============================================================================
-- FIX: Associar Turmas ao Professor Robson
-- ============================================================================
-- Data: 24/10/2024
-- Problema: Professor tem turmas visíveis na UI mas não no banco
-- ============================================================================

-- Passo 1: Encontrar o user_id do professor
DO $$
DECLARE
  v_professor_id uuid;
  v_turma_count integer;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO v_professor_id
  FROM auth.users
  WHERE email = 'robsonm1974@gmail.com';
  
  IF v_professor_id IS NULL THEN
    RAISE NOTICE '❌ ERRO: Usuário robsonm1974@gmail.com não encontrado!';
    RAISE NOTICE 'Verifique se você está logado com este email.';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Professor encontrado!';
  RAISE NOTICE '   Email: robsonm1974@gmail.com';
  RAISE NOTICE '   User ID: %', v_professor_id;
  RAISE NOTICE '';
  
  -- Verificar turmas existentes
  SELECT COUNT(*) INTO v_turma_count
  FROM turmas
  WHERE professor_id = v_professor_id;
  
  RAISE NOTICE '📊 Turmas associadas ao professor: %', v_turma_count;
  
  IF v_turma_count = 0 THEN
    RAISE NOTICE '⚠️  O professor não tem turmas associadas!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Listando turmas disponíveis para associar:';
    
    -- Listar todas as turmas (sem professor ou com outro professor)
    FOR v_turma_count IN 
      SELECT 
        t.id::text as turma_id,
        t.name as turma_nome,
        t.grade_level as ano,
        CASE 
          WHEN t.professor_id IS NULL THEN 'Sem professor'
          ELSE 'Professor: ' || COALESCE(u.email, 'N/A')
        END as status
      FROM turmas t
      LEFT JOIN auth.users u ON u.id = t.professor_id
      ORDER BY t.name
      LIMIT 10
    LOOP
      RAISE NOTICE '   - % (%) - %', 
        v_turma_count.turma_nome, 
        v_turma_count.ano,
        v_turma_count.status;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 AÇÃO NECESSÁRIA:';
    RAISE NOTICE '   Vou associar as turmas EF1, EF3 e EF7 ao professor...';
    RAISE NOTICE '';
    
    -- Associar turmas ao professor
    UPDATE turmas
    SET professor_id = v_professor_id
    WHERE name IN ('EF1', 'EF3', 'EF7', '1º Ano', '3º Ano', '7º Ano')
      AND (professor_id IS NULL OR professor_id != v_professor_id);
    
    GET DIAGNOSTICS v_turma_count = ROW_COUNT;
    RAISE NOTICE '✅ % turmas associadas ao professor!', v_turma_count;
    
  ELSE
    RAISE NOTICE '✅ Professor já tem turmas associadas!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Lista de turmas:';
    
    FOR v_turma_count IN
      SELECT 
        t.name as turma_nome,
        t.grade_level as ano,
        COUNT(a.id) as total_alunos
      FROM turmas t
      LEFT JOIN alunos a ON a.turma_id = t.id AND a.active = true
      WHERE t.professor_id = v_professor_id
      GROUP BY t.id, t.name, t.grade_level
      ORDER BY t.name
    LOOP
      RAISE NOTICE '   - % (%) - % alunos', 
        v_turma_count.turma_nome,
        v_turma_count.ano,
        v_turma_count.total_alunos;
    END LOOP;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🧪 TESTANDO RPCs...';
  RAISE NOTICE '========================================';
  
  -- Testar get_sessoes_professor
  DECLARE
    v_sessoes_count integer;
  BEGIN
    SELECT COUNT(*) INTO v_sessoes_count
    FROM get_sessoes_professor(v_professor_id::text);
    
    RAISE NOTICE '📊 Total de sessões encontradas: %', v_sessoes_count;
    
    IF v_sessoes_count > 0 THEN
      RAISE NOTICE '✅ RPC get_sessoes_professor funcionando!';
      
      -- Mostrar detalhes das sessões
      FOR v_turma_count IN
        SELECT 
          session_code,
          aula_titulo,
          turma_nome,
          status,
          total_alunos,
          to_char(data_inicio, 'DD/MM/YYYY HH24:MI') as data_inicio_fmt
        FROM get_sessoes_professor(v_professor_id::text)
        LIMIT 5
      LOOP
        RAISE NOTICE '   📝 Sessão %: % - % (%)', 
          v_turma_count.session_code,
          v_turma_count.aula_titulo,
          v_turma_count.turma_nome,
          v_turma_count.status;
      END LOOP;
    ELSE
      RAISE NOTICE '⚠️  Nenhuma sessão encontrada';
      RAISE NOTICE '   Isso é normal se você ainda não iniciou nenhuma sessão.';
    END IF;
  END;
  
  RAISE NOTICE '';
  
  -- Testar get_estatisticas_professor
  DECLARE
    v_stats json;
  BEGIN
    SELECT get_estatisticas_professor(v_professor_id::text) INTO v_stats;
    
    RAISE NOTICE '📊 Estatísticas do professor:';
    RAISE NOTICE '   Total de turmas: %', v_stats->>'total_turmas';
    RAISE NOTICE '   Total de alunos: %', v_stats->>'total_alunos';
    RAISE NOTICE '   Sessões realizadas: %', v_stats->>'sessoes_realizadas';
    RAISE NOTICE '   Sessões ativas: %', v_stats->>'sessoes_ativas';
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DIAGNÓSTICO COMPLETO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRÓXIMOS PASSOS:';
  RAISE NOTICE '   1. Recarregue o dashboard do professor';
  RAISE NOTICE '   2. Verifique se as turmas aparecem';
  RAISE NOTICE '   3. Inicie uma sessão de teste';
  RAISE NOTICE '   4. Veja se a sessão aparece em "Sessões Recentes"';
  RAISE NOTICE '';
  
END $$;

