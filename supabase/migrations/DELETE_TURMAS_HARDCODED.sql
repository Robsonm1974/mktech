-- ============================================================================
-- DELETAR TURMAS COM IDs HARDCODED
-- Data: 2025-10-20
-- Descrição: Remove as 3 turmas criadas com IDs fixos durante testes
-- ============================================================================

-- 1. Mostrar as turmas que serão deletadas
SELECT '=== TURMAS QUE SERÃO DELETADAS ===' AS info;
SELECT id, name, grade_level, ano_escolar_id, created_at
FROM turmas
WHERE id IN (
  '55555555-5555-5555-5555-555555555551',
  '55555555-5555-5555-5555-555555555552',
  '55555555-5555-5555-5555-555555555553'
);

-- 2. Verificar se há alunos associados
SELECT '=== VERIFICAR ALUNOS ASSOCIADOS ===' AS info;
SELECT 
  t.name,
  COUNT(a.id) AS total_alunos
FROM turmas t
LEFT JOIN alunos a ON t.id = a.turma_id
WHERE t.id IN (
  '55555555-5555-5555-5555-555555555551',
  '55555555-5555-5555-5555-555555555552',
  '55555555-5555-5555-5555-555555555553'
)
GROUP BY t.id, t.name;

-- 3. Desassociar alunos (se houver)
UPDATE alunos
SET turma_id = NULL, updated_at = NOW()
WHERE turma_id IN (
  '55555555-5555-5555-5555-555555555551',
  '55555555-5555-5555-5555-555555555552',
  '55555555-5555-5555-5555-555555555553'
);

-- 4. DELETAR AS 3 TURMAS DIRETAMENTE (SEM RPC)
DELETE FROM turmas
WHERE id = '55555555-5555-5555-5555-555555555551';

DELETE FROM turmas
WHERE id = '55555555-5555-5555-5555-555555555552';

DELETE FROM turmas
WHERE id = '55555555-5555-5555-5555-555555555553';

-- 5. Verificar turmas restantes
SELECT '=== TURMAS RESTANTES NO SISTEMA ===' AS info;
SELECT 
  id,
  name,
  ano_escolar_id,
  designacao,
  sala,
  turno,
  created_at
FROM turmas
WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC;

-- 6. Contagem final
DO $$
DECLARE
  v_turmas_deletadas INTEGER := 3;
  v_turmas_restantes INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_turmas_restantes 
  FROM turmas 
  WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000';
  
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ LIMPEZA DE TURMAS DE TESTE CONCLUÍDA!';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🗑️  Turmas deletadas: %', v_turmas_deletadas;
  RAISE NOTICE '   • 5º Ano A (55555555-...-551)';
  RAISE NOTICE '   • 6º Ano B (55555555-...-552)';
  RAISE NOTICE '   • 7º Ano C (55555555-...-553)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Turmas restantes: %', v_turmas_restantes;
  RAISE NOTICE '   • Apenas turmas criadas por você';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Sistema limpo e pronto para uso!';
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;

