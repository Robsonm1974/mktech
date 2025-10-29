-- ============================================
-- FIX: Corrigir ordem dos blocos na aula
-- A aula "Teste de aula com jogo" tem ordem 2, 3, 4
-- Deve ser 1, 2, 3
-- ============================================

-- 1. Ver situação atual
SELECT 
  a.titulo as aula,
  ab.ordem_na_aula,
  bt.titulo as bloco,
  aj.ordem_na_aula as ordem_jogo,
  g.titulo as jogo
FROM aulas a
LEFT JOIN aulas_blocos ab ON ab.aula_id = a.id
LEFT JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
LEFT JOIN aulas_jogos aj ON aj.aula_id = a.id
LEFT JOIN games g ON g.id = aj.game_id
WHERE a.id = '0db70d0d-e6b6-4d18-801f-ce4fe8ea4586'
ORDER BY ab.ordem_na_aula, aj.ordem_na_aula;

-- 2. Corrigir ordem dos blocos (subtrair 1)
UPDATE aulas_blocos
SET ordem_na_aula = ordem_na_aula - 1
WHERE aula_id = '0db70d0d-e6b6-4d18-801f-ce4fe8ea4586'
  AND ordem_na_aula > 1;

-- 3. Verificar resultado
SELECT 
  'BLOCOS' as tipo,
  ab.ordem_na_aula,
  bt.titulo
FROM aulas_blocos ab
JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
WHERE ab.aula_id = '0db70d0d-e6b6-4d18-801f-ce4fe8ea4586'
ORDER BY ab.ordem_na_aula

UNION ALL

SELECT 
  'JOGOS' as tipo,
  aj.ordem_na_aula,
  g.titulo
FROM aulas_jogos aj
JOIN games g ON g.id = aj.game_id
WHERE aj.aula_id = '0db70d0d-e6b6-4d18-801f-ce4fe8ea4586'
ORDER BY aj.ordem_na_aula;

-- 4. Mostrar resumo final
SELECT 
  a.titulo,
  COUNT(DISTINCT ab.bloco_template_id) as blocos,
  COUNT(DISTINCT aj.game_id) as jogos,
  MIN(ab.ordem_na_aula) as primeira_ordem_bloco,
  MAX(COALESCE(aj.ordem_na_aula, ab.ordem_na_aula)) as ultima_ordem
FROM aulas a
LEFT JOIN aulas_blocos ab ON ab.aula_id = a.id
LEFT JOIN aulas_jogos aj ON aj.aula_id = a.id
WHERE a.id = '0db70d0d-e6b6-4d18-801f-ce4fe8ea4586'
GROUP BY a.id, a.titulo;



