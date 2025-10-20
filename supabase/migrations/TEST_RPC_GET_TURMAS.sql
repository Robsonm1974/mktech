-- ============================================================================
-- TESTE DIRETO DO RPC get_turmas_admin
-- Data: 2025-10-20
-- ============================================================================

-- 1. Teste com tenant específico (Escola Piloto)
SELECT '=== TESTE 1: Com tenant Escola Piloto ===' AS teste;
SELECT * FROM get_turmas_admin('550e8400-e29b-41d4-a716-446655440000'::UUID);

-- 2. Teste sem tenant (NULL - todas as turmas)
SELECT '=== TESTE 2: Sem tenant (NULL) ===' AS teste;
SELECT * FROM get_turmas_admin(NULL);

-- 3. Verificar se há diferença nos resultados
SELECT '=== RESUMO ===' AS info;
SELECT 
  'Com tenant' AS tipo,
  COUNT(*) AS total
FROM get_turmas_admin('550e8400-e29b-41d4-a716-446655440000'::UUID)
UNION ALL
SELECT 
  'Sem tenant' AS tipo,
  COUNT(*) AS total
FROM get_turmas_admin(NULL);

-- 4. Verificar se o RPC está retornando as colunas corretas
SELECT '=== COLUNAS RETORNADAS ===' AS info;
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'turmas'
ORDER BY ordinal_position;

RAISE NOTICE '✅ Testes concluídos!';

