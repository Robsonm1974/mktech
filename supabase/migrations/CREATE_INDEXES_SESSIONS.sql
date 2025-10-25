-- ============================================================================
-- CRIAR ÍNDICES para melhorar performance de queries
-- Data: 2025-10-20
-- ============================================================================

-- Índice para busca rápida de sessões por código
CREATE INDEX IF NOT EXISTS idx_sessions_code_status 
ON sessions(session_code, status);

-- Índice para busca de alunos por turma
CREATE INDEX IF NOT EXISTS idx_alunos_turma_active 
ON alunos(turma_id, active);

-- Índice para aulas_blocos
CREATE INDEX IF NOT EXISTS idx_aulas_blocos_aula 
ON aulas_blocos(aula_id, ordem_na_aula);

-- Índice para participacoes_sessao
CREATE INDEX IF NOT EXISTS idx_participacoes_session_aluno 
ON participacoes_sessao(session_id, aluno_id);

-- Índice para progresso_blocos
CREATE INDEX IF NOT EXISTS idx_progresso_participacao 
ON progresso_blocos(participacao_id, status);

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ Índices criados com sucesso!';
  RAISE NOTICE 'Performance de queries deve melhorar significativamente.';
END $$;





