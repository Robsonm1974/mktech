-- ============================================================================
-- AJUSTAR TABELA TURMAS - Adicionar campos conforme planejamento
-- Data: 2025-10-18
-- Descrição: Adiciona ano_escolar_id, designacao, sala, turno à tabela turmas
-- ============================================================================

-- 1. Adicionar novas colunas se não existirem
DO $$ 
BEGIN
  -- ano_escolar_id (vínculo com planejamentos MKTECH)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'turmas' AND column_name = 'ano_escolar_id'
  ) THEN
    ALTER TABLE turmas ADD COLUMN ano_escolar_id VARCHAR(20);
    RAISE NOTICE '✅ Coluna ano_escolar_id adicionada';
  END IF;

  -- designacao (A, B, Manhã, Especial, etc)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'turmas' AND column_name = 'designacao'
  ) THEN
    ALTER TABLE turmas ADD COLUMN designacao VARCHAR(50);
    RAISE NOTICE '✅ Coluna designacao adicionada';
  END IF;

  -- sala (Sala 201, Laboratório 3, etc)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'turmas' AND column_name = 'sala'
  ) THEN
    ALTER TABLE turmas ADD COLUMN sala VARCHAR(50);
    RAISE NOTICE '✅ Coluna sala adicionada';
  END IF;

  -- turno (Manhã, Tarde, Integral)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'turmas' AND column_name = 'turno'
  ) THEN
    ALTER TABLE turmas ADD COLUMN turno VARCHAR(20);
    RAISE NOTICE '✅ Coluna turno adicionada';
  END IF;
END $$;

-- 2. Migrar dados existentes: extrair ano_escolar_id de grade_level
-- grade_level pode ser: "EF1-3", "EF2-5", etc.
-- ano_escolar_id deve ser: "EF1", "EF2", "EF3", ..., "EF9"
UPDATE turmas
SET ano_escolar_id = CASE
  WHEN grade_level LIKE 'EF1-%' THEN 'EF1'
  WHEN grade_level LIKE 'EF2-%' THEN 'EF2'
  WHEN grade_level LIKE 'EF3-%' THEN 'EF3'
  WHEN grade_level LIKE 'EF4-%' THEN 'EF4'
  WHEN grade_level LIKE 'EF5-%' THEN 'EF5'
  WHEN grade_level LIKE 'EF6-%' THEN 'EF6'
  WHEN grade_level LIKE 'EF7-%' THEN 'EF7'
  WHEN grade_level LIKE 'EF8-%' THEN 'EF8'
  WHEN grade_level LIKE 'EF9-%' THEN 'EF9'
  ELSE SUBSTRING(grade_level, 1, 3)  -- Fallback para outros formatos
END
WHERE ano_escolar_id IS NULL;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_turmas_ano_escolar ON turmas(ano_escolar_id);
CREATE INDEX IF NOT EXISTS idx_turmas_professor ON turmas(professor_id);
CREATE INDEX IF NOT EXISTS idx_turmas_tenant ON turmas(tenant_id);

-- 4. Adicionar constraint de nome único por tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_turma_tenant'
  ) THEN
    ALTER TABLE turmas ADD CONSTRAINT unique_turma_tenant UNIQUE (tenant_id, name);
    RAISE NOTICE '✅ Constraint unique_turma_tenant adicionada';
  END IF;
END $$;

-- 5. Verificação final
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM turmas;
  RAISE NOTICE '✅ Tabela turmas ajustada. Total de registros: %', v_count;
  
  -- Verificar estrutura
  RAISE NOTICE '📋 Colunas da tabela turmas:';
  FOR rec IN (
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'turmas'
    ORDER BY ordinal_position
  ) LOOP
    RAISE NOTICE '  - %: % (%)', rec.column_name, rec.data_type, 
      CASE WHEN rec.is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END;
  END LOOP;
END $$;

-- 6. Garantir que RLS está desabilitado (para desenvolvimento)
ALTER TABLE turmas DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE turmas TO postgres, authenticated, anon, service_role;

-- 7. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migration AJUSTAR_TABELA_TURMAS concluída com sucesso!';
END $$;

