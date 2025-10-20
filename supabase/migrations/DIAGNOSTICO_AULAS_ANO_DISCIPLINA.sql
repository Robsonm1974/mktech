-- ===================================================
-- DIAGNÓSTICO: Aulas com Ano e Disciplina
-- Verifica estrutura, dados e RPCs
-- ===================================================

\echo '═══════════════════════════════════════════════════'
\echo '📊 DIAGNÓSTICO: Sistema de Aulas'
\echo '═══════════════════════════════════════════════════'

-- 1. Verificar estrutura da tabela aulas
\echo '\n1️⃣ ESTRUTURA DA TABELA AULAS:'
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'aulas' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar aulas com ano e disciplina
\echo '\n2️⃣ AULAS CADASTRADAS (com Ano e Disciplina):'
SELECT 
  id,
  titulo,
  ano_escolar_id,
  disciplina_id,
  ordem,
  created_at
FROM aulas
ORDER BY created_at DESC
LIMIT 10;

-- 3. Testar RPC get_aulas_with_relations_admin
\echo '\n3️⃣ TESTE RPC - Listar Aulas com Relações:'
SELECT 
  id,
  titulo,
  ano_escolar_id,
  ano_nome,
  disciplina_codigo,
  disciplina_nome,
  total_blocos
FROM get_aulas_with_relations_admin()
LIMIT 10;

-- 4. Estatísticas por ano
\echo '\n4️⃣ ESTATÍSTICAS POR ANO:'
SELECT 
  COALESCE(a.ano_escolar_id, 'SEM ANO') AS ano,
  ae.nome AS nome_ano,
  COUNT(a.id) AS total_aulas,
  COUNT(DISTINCT a.disciplina_id) AS disciplinas_diferentes,
  SUM((SELECT COUNT(*) FROM aulas_blocos ab WHERE ab.aula_id = a.id)) AS total_blocos_vinculados
FROM aulas a
LEFT JOIN anos_escolares ae ON ae.id = a.ano_escolar_id
GROUP BY a.ano_escolar_id, ae.nome
ORDER BY a.ano_escolar_id;

-- 5. Estatísticas por disciplina
\echo '\n5️⃣ ESTATÍSTICAS POR DISCIPLINA:'
SELECT 
  COALESCE(d.codigo, 'SEM DISC') AS codigo,
  d.nome AS disciplina,
  COUNT(a.id) AS total_aulas
FROM aulas a
LEFT JOIN disciplinas d ON d.id = a.disciplina_id
GROUP BY d.codigo, d.nome
ORDER BY COUNT(a.id) DESC;

-- 6. Aulas sem ano ou disciplina (problemas)
\echo '\n6️⃣ AULAS COM DADOS INCOMPLETOS:'
SELECT 
  id,
  titulo,
  ano_escolar_id,
  disciplina_id,
  CASE 
    WHEN ano_escolar_id IS NULL THEN '⚠️ SEM ANO'
    WHEN disciplina_id IS NULL THEN '⚠️ SEM DISCIPLINA'
    ELSE '✅ OK'
  END AS status
FROM aulas
WHERE ano_escolar_id IS NULL OR disciplina_id IS NULL;

-- 7. Verificar RPCs disponíveis
\echo '\n7️⃣ RPCs DE AULAS DISPONÍVEIS:'
SELECT 
  proname AS nome_funcao,
  pg_get_function_arguments(oid) AS argumentos,
  pg_get_function_result(oid) AS retorno
FROM pg_proc
WHERE proname LIKE '%aula%admin%'
ORDER BY proname;

-- 8. Contadores gerais
\echo '\n8️⃣ RESUMO GERAL:'
SELECT 
  'Total de Aulas' AS metrica,
  COUNT(*)::TEXT AS valor
FROM aulas
UNION ALL
SELECT 
  'Aulas com Ano',
  COUNT(*)::TEXT
FROM aulas WHERE ano_escolar_id IS NOT NULL
UNION ALL
SELECT 
  'Aulas com Disciplina',
  COUNT(*)::TEXT
FROM aulas WHERE disciplina_id IS NOT NULL
UNION ALL
SELECT 
  'Aulas Completas (Ano + Disc)',
  COUNT(*)::TEXT
FROM aulas WHERE ano_escolar_id IS NOT NULL AND disciplina_id IS NOT NULL;

\echo '\n═══════════════════════════════════════════════════'
\echo '✅ DIAGNÓSTICO CONCLUÍDO!'
\echo '═══════════════════════════════════════════════════'

