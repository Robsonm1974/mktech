-- ============================================================================
-- DIAGNÓSTICO COMPLETO - Sistema de Turmas
-- Data: 2025-10-18
-- ============================================================================

-- 1. Verificar estrutura da tabela turmas
SELECT '=== ESTRUTURA DA TABELA TURMAS ===' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'turmas'
ORDER BY ordinal_position;

-- 2. Verificar dados na tabela turmas
SELECT '=== DADOS NA TABELA TURMAS ===' AS info;
SELECT id, tenant_id, name, ano_escolar_id, designacao, professor_id, grade_level, created_at
FROM turmas
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar tabela anos_escolares
SELECT '=== DADOS NA TABELA ANOS_ESCOLARES ===' AS info;
SELECT id, nome, idade_referencia, ordem
FROM anos_escolares
ORDER BY ordem;

-- 4. Verificar usuários (professores)
SELECT '=== PROFESSORES DISPONÍVEIS ===' AS info;
SELECT id, email, full_name, role
FROM users
WHERE role IN ('professor', 'admin_escola')
ORDER BY email;

-- 5. Verificar a função RPC
SELECT '=== FUNÇÃO get_turmas_admin ===' AS info;
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_turmas_admin'
  AND n.nspname = 'public';

-- 6. Testar a função RPC diretamente (sem parâmetro)
SELECT '=== TESTE RPC get_turmas_admin (NULL) ===' AS info;
DO $$
BEGIN
  BEGIN
    PERFORM * FROM get_turmas_admin(NULL);
    RAISE NOTICE '✅ RPC executado sem erros';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ ERRO ao executar RPC: % (código: %)', SQLERRM, SQLSTATE;
  END;
END $$;

-- 7. Testar com tenant específico (se houver)
SELECT '=== TESTE RPC get_turmas_admin (com tenant) ===' AS info;
DO $$
DECLARE
  v_tenant_id UUID;
  v_result RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Pegar primeiro tenant disponível
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RAISE NOTICE '⚠️ Nenhum tenant encontrado';
  ELSE
    RAISE NOTICE 'Testando com tenant_id: %', v_tenant_id;
    
    BEGIN
      FOR v_result IN SELECT * FROM get_turmas_admin(v_tenant_id) LOOP
        v_count := v_count + 1;
      END LOOP;
      
      RAISE NOTICE '✅ RPC retornou % turmas', v_count;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO ao executar RPC: % (código: %)', SQLERRM, SQLSTATE;
    END;
  END IF;
END $$;

-- 8. Verificar permissões RLS
SELECT '=== PERMISSÕES RLS ===' AS info;
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('turmas', 'anos_escolares', 'users', 'alunos')
  AND schemaname = 'public';

-- 9. Verificar se existe a tabela alunos
SELECT '=== VERIFICAR TABELA ALUNOS ===' AS info;
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_name = 'alunos'
) AS alunos_table_exists;

-- 10. Se a tabela alunos existir, mostrar estrutura
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alunos') THEN
    RAISE NOTICE '=== ESTRUTURA DA TABELA ALUNOS ===';
  END IF;
END $$;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'alunos'
ORDER BY ordinal_position;

-- 11. Resumo final
SELECT '=== RESUMO FINAL ===' AS info;
SELECT 
  'Turmas' AS tabela, 
  COUNT(*) AS total 
FROM turmas
UNION ALL
SELECT 
  'Anos Escolares' AS tabela, 
  COUNT(*) AS total 
FROM anos_escolares
UNION ALL
SELECT 
  'Professores' AS tabela, 
  COUNT(*) AS total 
FROM users 
WHERE role IN ('professor', 'admin_escola')
UNION ALL
SELECT 
  'Alunos' AS tabela, 
  COUNT(*) AS total 
FROM alunos
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alunos');

RAISE NOTICE '✅ Diagnóstico completo finalizado!';

