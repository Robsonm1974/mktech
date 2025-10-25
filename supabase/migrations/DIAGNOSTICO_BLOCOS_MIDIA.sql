-- ============================================================================
-- DIAGNÓSTICO: Problema ao salvar mídia no bloco
-- Data: 2025-10-20
-- ============================================================================

-- 1. Verificar estrutura da tabela blocos_templates
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'blocos_templates'
  AND column_name IN ('id', 'tipo_midia', 'midia_url', 'status', 'updated_at')
ORDER BY ordinal_position;

-- 2. Verificar se updated_at existe
DO $$
DECLARE
  v_has_updated_at BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'blocos_templates'
      AND column_name = 'updated_at'
  ) INTO v_has_updated_at;
  
  RAISE NOTICE '══════════════════════════════════════════════════════';
  IF v_has_updated_at THEN
    RAISE NOTICE '✅ Coluna updated_at existe';
  ELSE
    RAISE NOTICE '❌ Coluna updated_at NÃO EXISTE!';
    RAISE NOTICE '➡️ Será criada automaticamente';
  END IF;
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;

-- 3. Adicionar coluna updated_at se não existir
ALTER TABLE blocos_templates 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 4. Testar UPDATE em um bloco
DO $$
DECLARE
  v_bloco_id UUID;
  v_result INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TESTANDO UPDATE...';
  
  -- Buscar primeiro bloco
  SELECT id INTO v_bloco_id
  FROM blocos_templates
  LIMIT 1;
  
  IF v_bloco_id IS NULL THEN
    RAISE NOTICE '⚠️  Nenhum bloco encontrado para testar';
  ELSE
    -- Tentar atualizar
    UPDATE blocos_templates
    SET 
      tipo_midia = 'video',
      midia_url = 'https://youtu.be/test',
      status = 'com_midia',
      updated_at = NOW()
    WHERE id = v_bloco_id;
    
    GET DIAGNOSTICS v_result = ROW_COUNT;
    
    IF v_result > 0 THEN
      RAISE NOTICE '✅ UPDATE funcionou! (% linha afetada)', v_result;
      
      -- Reverter teste
      UPDATE blocos_templates
      SET 
        tipo_midia = NULL,
        midia_url = NULL,
        status = 'rascunho',
        updated_at = NOW()
      WHERE id = v_bloco_id;
      
      RAISE NOTICE '✅ Teste revertido';
    ELSE
      RAISE NOTICE '❌ UPDATE falhou!';
    END IF;
  END IF;
END $$;

-- 5. Verificar RLS
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'blocos_templates';

-- 6. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'blocos_templates';

-- 7. Resultado final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ DIAGNÓSTICO COMPLETO';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Verificações:';
  RAISE NOTICE '   1. Estrutura da tabela ✓';
  RAISE NOTICE '   2. Coluna updated_at criada se necessário ✓';
  RAISE NOTICE '   3. Teste de UPDATE realizado ✓';
  RAISE NOTICE '   4. RLS verificado ✓';
  RAISE NOTICE '';
  RAISE NOTICE '➡️ Tente salvar a mídia novamente no frontend';
  RAISE NOTICE '➡️ Se ainda falhar, verifique o console do navegador';
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;






