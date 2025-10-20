-- ===================================================
-- ADICIONAR ano_escolar_id À TABELA AULAS
-- ===================================================

-- Adicionar coluna ano_escolar_id
ALTER TABLE aulas 
ADD COLUMN IF NOT EXISTS ano_escolar_id VARCHAR(10) REFERENCES anos_escolares(id);

-- Adicionar coluna disciplina_id
ALTER TABLE aulas 
ADD COLUMN IF NOT EXISTS disciplina_id UUID REFERENCES disciplinas(id);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_aulas_ano_escolar ON aulas(ano_escolar_id);
CREATE INDEX IF NOT EXISTS idx_aulas_disciplina ON aulas(disciplina_id);

-- Comentário
COMMENT ON COLUMN aulas.ano_escolar_id IS 'Referência ao ano escolar (EF1-EF9)';
COMMENT ON COLUMN aulas.disciplina_id IS 'Referência à disciplina';

DO $$
BEGIN
  RAISE NOTICE '✅ Colunas ano_escolar_id e disciplina_id adicionadas à tabela aulas!';
END $$;

