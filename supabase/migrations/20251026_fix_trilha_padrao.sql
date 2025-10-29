-- ============================================
-- FIX: Criar trilha padrão se não existir
-- ============================================

-- Verificar se a trilha padrão existe, se não, criar
DO $$
BEGIN
  -- Inserir trilha padrão apenas se não existir
  IF NOT EXISTS (SELECT 1 FROM trilhas WHERE id = '00000000-0000-0000-0000-000000000001'::uuid) THEN
    INSERT INTO trilhas (
      id,
      titulo,
      descricao,
      ativa,
      ordem,
      created_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000001'::uuid,
      'Trilha Padrão',
      'Trilha padrão do sistema',
      true,
      1,
      now()
    );
    
    RAISE NOTICE '✅ Trilha padrão criada com ID: 00000000-0000-0000-0000-000000000001';
  ELSE
    RAISE NOTICE '✅ Trilha padrão já existe';
  END IF;
END $$;

-- Verificar resultado
SELECT id, titulo, descricao FROM trilhas WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

