-- ============================================================================
-- LIMPAR TURMAS DE TESTE (Hardcoded)
-- Data: 2025-10-20
-- Descrição: Remove turmas criadas com IDs fixos durante testes
-- ============================================================================

-- 1. Listar turmas de teste (IDs fixos)
SELECT '=== TURMAS DE TESTE (IDs fixos) ===' AS info;
SELECT id, name, created_at, tenant_id
FROM turmas
WHERE id IN (
  '55555555-5555-5555-5555-555555555551',
  '55555555-5555-5555-5555-555555555552',
  '55555555-5555-5555-5555-555555555553'
)
ORDER BY name;

-- 2. Verificar se há alunos associados
SELECT '=== ALUNOS ASSOCIADOS ÀS TURMAS DE TESTE ===' AS info;
SELECT 
  t.name AS turma_nome,
  COUNT(a.id) AS total_alunos
FROM turmas t
LEFT JOIN alunos a ON t.id = a.turma_id AND a.active = true
WHERE t.id IN (
  '55555555-5555-5555-5555-555555555551',
  '55555555-5555-5555-5555-555555555552',
  '55555555-5555-5555-5555-555555555553'
)
GROUP BY t.id, t.name
ORDER BY t.name;

-- 3. Desassociar alunos dessas turmas (se houver)
UPDATE alunos
SET turma_id = NULL, updated_at = NOW()
WHERE turma_id IN (
  '55555555-5555-5555-5555-555555555551',
  '55555555-5555-5555-5555-555555555552',
  '55555555-5555-5555-5555-555555555553'
);

-- 4. Deletar as turmas de teste
DELETE FROM turmas
WHERE id IN (
  '55555555-5555-5555-5555-555555555551',
  '55555555-5555-5555-5555-555555555552',
  '55555555-5555-5555-5555-555555555553'
);

-- 5. Verificação final
SELECT '=== TURMAS RESTANTES ===' AS info;
SELECT id, name, ano_escolar_id, designacao, created_at
FROM turmas
WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC;

-- 6. Mensagem de sucesso
DO $$
DECLARE
  v_count_turmas INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_turmas FROM turmas WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000';
  
  RAISE NOTICE '✅ Turmas de teste removidas com sucesso!';
  RAISE NOTICE '📊 Total de turmas restantes: %', v_count_turmas;
END $$;

