-- ===================================================
-- SEED: Trilha Padrão para Aulas Genéricas
-- ===================================================

-- Inserir trilha padrão se não existir
INSERT INTO trilhas (
  id,
  titulo,
  descricao,
  grade_level,
  ordem,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- ID fixo para referência
  'Aulas MKTECH',
  'Trilha padrão para todas as aulas do sistema MKTECH',
  'TODOS',
  1,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao = EXCLUDED.descricao,
  grade_level = EXCLUDED.grade_level,
  ordem = EXCLUDED.ordem;

DO $$
BEGIN
  RAISE NOTICE '✅ Trilha padrão criada/atualizada com sucesso!';
  RAISE NOTICE '🎯 ID da trilha: 00000000-0000-0000-0000-000000000001';
END $$;

