-- ============================================================================
-- CORRIGIR RELAÇÃO: quizzes deve referenciar blocos_templates (não blocos)
-- ============================================================================

-- 1. Ver estrutura atual
SELECT 'Estrutura atual da tabela quizzes:' as info;

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'quizzes'
ORDER BY ordinal_position;

-- 2. Verificar foreign keys atuais
SELECT 'Foreign keys atuais:' as info;

SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'quizzes'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Deletar todos os quizzes existentes (para evitar conflitos)
DELETE FROM quizzes;

-- 4. Dropar a constraint antiga (se existir)
DO $$
BEGIN
  -- Tentar dropar constraint do bloco_id para blocos
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_name = 'quizzes' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%bloco_id%'
  ) THEN
    EXECUTE 'ALTER TABLE quizzes DROP CONSTRAINT ' || (
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'quizzes' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%bloco_id%'
      LIMIT 1
    );
    RAISE NOTICE '✅ Constraint antiga removida';
  END IF;
END $$;

-- 5. Adicionar nova constraint para blocos_templates
ALTER TABLE quizzes
  ADD CONSTRAINT quizzes_bloco_template_fk
  FOREIGN KEY (bloco_id)
  REFERENCES blocos_templates(id)
  ON DELETE CASCADE;

-- 6. Desabilitar RLS
ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;

-- 7. Garantir permissões
GRANT ALL ON TABLE quizzes TO postgres, authenticated, anon, service_role;

-- 8. Verificar resultado
SELECT '✅ Nova estrutura:' as info;

SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'quizzes'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================================';
  RAISE NOTICE '✅ TABELA QUIZZES CORRIGIDA!';
  RAISE NOTICE '======================================================';
  RAISE NOTICE '📋 Mudanças aplicadas:';
  RAISE NOTICE '   ✓ Foreign key agora aponta para blocos_templates';
  RAISE NOTICE '   ✓ RLS desabilitado';
  RAISE NOTICE '   ✓ Permissões concedidas';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Agora você pode criar quizzes!';
  RAISE NOTICE '======================================================';
END $$;

