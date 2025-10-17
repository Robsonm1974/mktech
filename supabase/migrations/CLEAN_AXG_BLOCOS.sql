-- ============================================================================
-- LIMPAR BLOCOS E QUIZZES AXG-1-* para reimportar
-- ============================================================================

-- 1. Ver o que será deletado
SELECT 
  '📊 Blocos que serão deletados:' as info;

SELECT 
  bt.codigo_bloco,
  bt.titulo,
  bt.quiz_id,
  q.titulo as quiz_titulo
FROM blocos_templates bt
LEFT JOIN quizzes q ON q.id = bt.quiz_id
WHERE bt.codigo_bloco LIKE 'AXG-%';

-- 2. Ver planejamento relacionado
SELECT 
  '📋 Planejamento que será deletado:' as info;

SELECT 
  p.id,
  p.titulo,
  p.codigo_base,
  d.nome as disciplina
FROM planejamentos p
LEFT JOIN disciplinas d ON d.id = p.disciplina_id
WHERE p.codigo_base = 'AXG-1';

-- 3. Deletar quizzes primeiro (CASCADE vai cuidar, mas vamos ser explícitos)
DELETE FROM quizzes
WHERE id IN (
  SELECT quiz_id 
  FROM blocos_templates 
  WHERE codigo_bloco LIKE 'AXG-%' 
    AND quiz_id IS NOT NULL
);

-- 4. Deletar blocos
DELETE FROM blocos_templates
WHERE codigo_bloco LIKE 'AXG-%';

-- 5. Deletar planejamento
DELETE FROM planejamentos
WHERE codigo_base = 'AXG-1';

-- 6. Verificar limpeza
SELECT 
  '✅ Após limpeza:' as info;

SELECT 
  'blocos_templates' as tabela,
  COUNT(*) as total
FROM blocos_templates
WHERE codigo_bloco LIKE 'AXG-%'
UNION ALL
SELECT 
  'quizzes' as tabela,
  COUNT(*) as total
FROM quizzes q
WHERE EXISTS (
  SELECT 1 FROM blocos_templates bt 
  WHERE bt.quiz_id = q.id 
    AND bt.codigo_bloco LIKE 'AXG-%'
)
UNION ALL
SELECT 
  'planejamentos' as tabela,
  COUNT(*) as total
FROM planejamentos
WHERE codigo_base = 'AXG-1';

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE '✅ LIMPEZA CONCLUÍDA!';
  RAISE NOTICE '======================================';
  RAISE NOTICE '📋 Todos os blocos AXG-1-* foram deletados';
  RAISE NOTICE '📋 Todos os quizzes relacionados foram deletados';
  RAISE NOTICE '📋 Planejamento AXG-1 foi deletado';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Pronto para reimportar com as 4 opções!';
  RAISE NOTICE '======================================';
END $$;

