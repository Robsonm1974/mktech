-- ============================================================================
-- VERIFICAR: Estrutura da tabela aulas_blocos
-- Data: 2025-10-20
-- ============================================================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'aulas_blocos'
ORDER BY ordinal_position;





