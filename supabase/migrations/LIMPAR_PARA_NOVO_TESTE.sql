-- ============================================================================
-- LIMPAR: Participações para novo teste completo
-- Data: 2025-10-20
-- ============================================================================

-- Deletar respostas de quizzes
DELETE FROM respostas_quizzes WHERE TRUE;

-- Deletar progressos
DELETE FROM progresso_blocos WHERE TRUE;

-- Deletar participações
DELETE FROM participacoes_sessao WHERE TRUE;

-- Confirmar
SELECT 
  'Limpeza completa!' AS status,
  (SELECT COUNT(*) FROM participacoes_sessao) AS participacoes,
  (SELECT COUNT(*) FROM progresso_blocos) AS progressos,
  (SELECT COUNT(*) FROM respostas_quizzes) AS respostas;





