-- ============================================================================
-- HOTFIX: RLS Permissivo para Disciplinas
-- Este é um fix temporário para permitir acesso às disciplinas
-- ============================================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Permitir leitura de disciplinas ativas" ON disciplinas;
DROP POLICY IF EXISTS "Superadmin tem acesso total às disciplinas" ON disciplinas;

-- Criar política SUPER PERMISSIVA para debug (TEMPORÁRIA)
CREATE POLICY "Acesso total autenticado TEMP"
  ON disciplinas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '⚠️ ATENÇÃO: Política RLS PERMISSIVA aplicada em disciplinas!';
  RAISE NOTICE '📋 Todos usuários autenticados têm acesso total agora.';
  RAISE NOTICE '🔒 Substitua por políticas mais restritivas em produção!';
END $$;














