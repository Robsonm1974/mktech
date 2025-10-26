-- ============================================================================
-- 🔧 RENOMEAR COLUNA: quizzes.bloco_id → quizzes.bloco_template_id
-- ============================================================================
-- Data: 25 Outubro 2025
-- Motivo: Clareza e consistência (FK já aponta para blocos_templates)
-- ============================================================================

-- 1. Renomear coluna
ALTER TABLE quizzes 
RENAME COLUMN bloco_id TO bloco_template_id;

-- 2. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Coluna renomeada: bloco_id → bloco_template_id';
  RAISE NOTICE '✅ Foreign key mantido: quizzes_bloco_template_fk';
  RAISE NOTICE '✅ Dados preservados: 100%%';
END $$;

