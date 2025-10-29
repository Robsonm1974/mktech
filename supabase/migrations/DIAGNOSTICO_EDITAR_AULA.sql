-- ============================================
-- DIAGNÓSTICO: Por que a página de edição não carrega blocos/jogos?
-- ============================================

-- 1. Ver todas as aulas
SELECT 
  id,
  titulo,
  descricao,
  pontos_totais,
  publicada,
  created_at
FROM aulas
ORDER BY created_at DESC
LIMIT 10;

-- 2. Para cada aula, ver seus BLOCOS
SELECT 
  a.id as aula_id,
  a.titulo as aula_titulo,
  ab.ordem_na_aula,
  ab.bloco_template_id,
  bt.codigo_bloco,
  bt.titulo as bloco_titulo,
  bt.pontos_bloco
FROM aulas a
LEFT JOIN aulas_blocos ab ON ab.aula_id = a.id
LEFT JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
ORDER BY a.created_at DESC, ab.ordem_na_aula
LIMIT 20;

-- 3. Para cada aula, ver seus JOGOS
SELECT 
  a.id as aula_id,
  a.titulo as aula_titulo,
  aj.ordem_na_aula,
  aj.game_id,
  g.codigo,
  g.titulo as jogo_titulo,
  g.duracao_segundos,
  g.publicado
FROM aulas a
LEFT JOIN aulas_jogos aj ON aj.aula_id = a.id
LEFT JOIN games g ON g.id = aj.game_id
ORDER BY a.created_at DESC, aj.ordem_na_aula
LIMIT 20;

-- 4. Ver última aula criada com TUDO
WITH ultima_aula AS (
  SELECT id, titulo FROM aulas ORDER BY created_at DESC LIMIT 1
)
SELECT 
  'BLOCOS' as tipo,
  ab.ordem_na_aula,
  bt.titulo,
  bt.pontos_bloco,
  NULL::int as duracao_segundos
FROM ultima_aula ua
JOIN aulas_blocos ab ON ab.aula_id = ua.id
JOIN blocos_templates bt ON bt.id = ab.bloco_template_id

UNION ALL

SELECT 
  'JOGOS' as tipo,
  aj.ordem_na_aula,
  g.titulo,
  NULL::int as pontos_bloco,
  g.duracao_segundos
FROM ultima_aula ua
JOIN aulas_jogos aj ON aj.aula_id = ua.id
JOIN games g ON g.id = aj.game_id

ORDER BY ordem_na_aula;

-- 5. Verificar se RLS está desabilitado
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS ATIVADO (PROBLEMA!)'
    ELSE '✅ RLS DESATIVADO'
  END as status
FROM pg_tables 
WHERE tablename IN ('aulas', 'aulas_blocos', 'aulas_jogos', 'blocos_templates', 'games')
ORDER BY tablename;

-- 6. Contar itens por aula
SELECT 
  a.id,
  a.titulo,
  COUNT(DISTINCT ab.bloco_template_id) as total_blocos,
  COUNT(DISTINCT aj.game_id) as total_jogos,
  COUNT(DISTINCT ab.bloco_template_id) + COUNT(DISTINCT aj.game_id) as total_itens
FROM aulas a
LEFT JOIN aulas_blocos ab ON ab.aula_id = a.id
LEFT JOIN aulas_jogos aj ON aj.aula_id = a.id
GROUP BY a.id, a.titulo
ORDER BY a.created_at DESC
LIMIT 10;

-- 7. Verificar foreign keys
SELECT 
  'aulas_blocos sem bloco' as problema,
  COUNT(*) as quantidade
FROM aulas_blocos ab
LEFT JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
WHERE bt.id IS NULL

UNION ALL

SELECT 
  'aulas_jogos sem jogo' as problema,
  COUNT(*) as quantidade
FROM aulas_jogos aj
LEFT JOIN games g ON g.id = aj.game_id
WHERE g.id IS NULL;

-- 8. Ver estrutura da query de JOIN (o que o frontend usa)
-- Simular a query do frontend para uma aula específica
DO $$
DECLARE
  v_aula_id UUID;
BEGIN
  -- Pegar a última aula
  SELECT id INTO v_aula_id FROM aulas ORDER BY created_at DESC LIMIT 1;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'TESTANDO QUERY DO FRONTEND';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Aula ID: %', v_aula_id;
  RAISE NOTICE '';
  
  -- Testar query de blocos (igual ao frontend)
  RAISE NOTICE 'Query de BLOCOS:';
  PERFORM 
    ab.ordem_na_aula,
    ab.bloco_template_id,
    bt.id,
    bt.codigo_bloco,
    bt.titulo,
    bt.pontos_bloco
  FROM aulas_blocos ab
  JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
  WHERE ab.aula_id = v_aula_id;
  
  RAISE NOTICE '  Blocos encontrados: %', (
    SELECT COUNT(*) FROM aulas_blocos WHERE aula_id = v_aula_id
  );
  
  -- Testar query de jogos (igual ao frontend)
  RAISE NOTICE 'Query de JOGOS:';
  PERFORM 
    aj.ordem_na_aula,
    aj.game_id,
    g.id,
    g.codigo,
    g.titulo
  FROM aulas_jogos aj
  JOIN games g ON g.id = aj.game_id
  WHERE aj.aula_id = v_aula_id;
  
  RAISE NOTICE '  Jogos encontrados: %', (
    SELECT COUNT(*) FROM aulas_jogos WHERE aula_id = v_aula_id
  );
  
END $$;



