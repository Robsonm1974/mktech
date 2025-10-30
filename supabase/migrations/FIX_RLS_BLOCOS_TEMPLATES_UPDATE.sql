-- ============================================================================
-- FIX: Garantir que UPDATE funcione em blocos_templates
-- Problema: RLS permite SELECT mas bloqueia UPDATE silenciosamente
-- ============================================================================

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Admin dev access blocos_templates" ON blocos_templates;
DROP POLICY IF EXISTS "Superadmin tem acesso total aos blocos" ON blocos_templates;
DROP POLICY IF EXISTS "Permitir leitura de blocos" ON blocos_templates;
DROP POLICY IF EXISTS "Permitir insert de blocos" ON blocos_templates;
DROP POLICY IF EXISTS "Permitir update de blocos" ON blocos_templates;

-- 2. Criar política única e permissiva para DEV
CREATE POLICY "blocos_templates_all_dev"
  ON blocos_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Confirmar que RLS está habilitado
ALTER TABLE blocos_templates ENABLE ROW LEVEL SECURITY;

-- 4. Verificação
DO $$
BEGIN
  RAISE NOTICE '✅ RLS de blocos_templates corrigido!';
  RAISE NOTICE '📋 Política: blocos_templates_all_dev (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '🔓 USING: true | WITH CHECK: true';
  RAISE NOTICE '👤 Role: authenticated';
END $$;

