-- ============================================================================
-- LIMPAR: Participação de teste criada
-- Data: 2025-10-20
-- ============================================================================

-- Deletar progresso primeiro (FK constraint)
DELETE FROM progresso_blocos
WHERE participacao_id = '227840a6-57a5-4cd5-a1ed-5295bb2a9b2d';

-- Deletar participação
DELETE FROM participacoes_sessao
WHERE id = '227840a6-57a5-4cd5-a1ed-5295bb2a9b2d';

-- Confirmar limpeza
SELECT 
  'APÓS LIMPEZA:' AS info,
  (SELECT COUNT(*) FROM participacoes_sessao) AS participacoes,
  (SELECT COUNT(*) FROM progresso_blocos) AS progressos;





