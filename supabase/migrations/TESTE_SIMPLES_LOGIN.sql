-- ============================================================================
-- TESTE SIMPLES: Fluxo de Login do Aluno
-- Data: 2025-10-20
-- ============================================================================

-- 1. Buscar dados de uma sessão ativa
SELECT 
  'SESSÃO ATIVA:' AS info,
  id AS session_id,
  session_code,
  turma_id,
  aula_id
FROM sessions
WHERE status = 'active'
ORDER BY iniciada_em DESC
LIMIT 1;

-- 2. Buscar alunos da turma (usando turma_id da primeira sessão ativa)
SELECT 
  'ALUNOS DA TURMA:' AS info,
  id AS aluno_id,
  full_name,
  pin_code,
  icone_afinidade
FROM alunos
WHERE turma_id = (
  SELECT turma_id 
  FROM sessions 
  WHERE status = 'active' 
  ORDER BY iniciada_em DESC 
  LIMIT 1
)
AND active = true;

-- 3. Contar blocos da aula
SELECT 
  'BLOCOS DA AULA:' AS info,
  COUNT(*) AS total_blocos
FROM aulas_blocos
WHERE aula_id = (
  SELECT aula_id 
  FROM sessions 
  WHERE status = 'active' 
  ORDER BY iniciada_em DESC 
  LIMIT 1
);

-- 4. Testar RPC aluno_entrar_sessao
SELECT aluno_entrar_sessao(
  (SELECT id FROM sessions WHERE status = 'active' ORDER BY iniciada_em DESC LIMIT 1),
  (SELECT id FROM alunos WHERE active = true LIMIT 1)
) AS resultado_rpc;

-- 5. Verificar se participação foi criada
SELECT 
  'PARTICIPAÇÕES CRIADAS:' AS info,
  COUNT(*) AS total
FROM participacoes_sessao;

-- 6. Verificar se progresso foi criado
SELECT 
  'PROGRESSO CRIADO:' AS info,
  COUNT(*) AS total
FROM progresso_blocos;





