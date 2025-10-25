-- ============================================================================
-- FIX: Corrigir TODAS as referências a ab.ordem → ab.ordem_na_aula
-- Data: 2025-10-20
-- ============================================================================

-- Verificar RPCs que podem estar usando ab.ordem
SELECT 
  p.proname AS function_name,
  'Possui ab.ordem' AS status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%ab.ordem%'
ORDER BY p.proname;

