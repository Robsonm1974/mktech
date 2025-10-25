-- ============================================================================
-- LIMPAR: Todas as participações e progressos (para testes)
-- Data: 2025-10-20
-- ============================================================================

-- Deletar todos os progressos primeiro (FK constraint)
DELETE FROM progresso_blocos;

-- Deletar todas as participações
DELETE FROM participacoes_sessao;

-- Deletar todas as respostas de quizzes (se existir)
DELETE FROM respostas_quizzes WHERE TRUE;

-- Confirmar limpeza
SELECT 
  'APÓS LIMPEZA COMPLETA:' AS info,
  (SELECT COUNT(*) FROM participacoes_sessao) AS participacoes,
  (SELECT COUNT(*) FROM progresso_blocos) AS progressos,
  (SELECT COUNT(*) FROM respostas_quizzes) AS respostas_quizzes;

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ Todas as participações e progressos foram limpos!';
  RAISE NOTICE 'Agora você pode testar novamente do zero.';
END $$;





