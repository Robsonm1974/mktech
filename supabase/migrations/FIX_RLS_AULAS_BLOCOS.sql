-- ============================================================================
-- FIX: RLS para aulas_blocos (permitir leitura pública)
-- Data: 2025-10-20
-- ============================================================================

-- Habilitar RLS se não estiver habilitado
ALTER TABLE aulas_blocos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública de blocos de aulas
DROP POLICY IF EXISTS "Permitir leitura pública de blocos de aulas" ON aulas_blocos;

CREATE POLICY "Permitir leitura pública de blocos de aulas"
ON aulas_blocos
FOR SELECT
USING (true);

-- Habilitar RLS em blocos_templates também
ALTER TABLE blocos_templates ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública de blocos templates
DROP POLICY IF EXISTS "Permitir leitura pública de blocos templates" ON blocos_templates;

CREATE POLICY "Permitir leitura pública de blocos templates"
ON blocos_templates
FOR SELECT
USING (true);

-- Habilitar RLS em quizzes
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública de quizzes
DROP POLICY IF EXISTS "Permitir leitura pública de quizzes" ON quizzes;

CREATE POLICY "Permitir leitura pública de quizzes"
ON quizzes
FOR SELECT
USING (true);

-- Habilitar RLS em aulas
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública de aulas
DROP POLICY IF EXISTS "Permitir leitura pública de aulas" ON aulas;

CREATE POLICY "Permitir leitura pública de aulas"
ON aulas
FOR SELECT
USING (true);

-- Confirmar políticas criadas
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS criadas com sucesso!';
  RAISE NOTICE 'Tabelas: aulas, aulas_blocos, blocos_templates, quizzes';
END $$;





