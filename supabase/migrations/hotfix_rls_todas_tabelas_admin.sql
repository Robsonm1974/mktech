-- ============================================================================
-- HOTFIX: RLS Permissivo para TODAS as tabelas admin
-- Este é um fix temporário para desenvolvimento
-- ============================================================================

-- DISCIPLINAS
DROP POLICY IF EXISTS "Permitir leitura de disciplinas ativas" ON disciplinas;
DROP POLICY IF EXISTS "Superadmin tem acesso total às disciplinas" ON disciplinas;
DROP POLICY IF EXISTS "Acesso total autenticado TEMP" ON disciplinas;

CREATE POLICY "Admin dev access disciplinas"
  ON disciplinas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- PLANEJAMENTOS
DROP POLICY IF EXISTS "Superadmin tem acesso total aos planejamentos" ON planejamentos;
DROP POLICY IF EXISTS "Admin dev access planejamentos" ON planejamentos;

CREATE POLICY "Admin dev access planejamentos"
  ON planejamentos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- BLOCOS_TEMPLATES
DROP POLICY IF EXISTS "Superadmin tem acesso total aos blocos" ON blocos_templates;
DROP POLICY IF EXISTS "Admin dev access blocos_templates" ON blocos_templates;

CREATE POLICY "Admin dev access blocos_templates"
  ON blocos_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- AULAS_BLOCOS
DROP POLICY IF EXISTS "Superadmin tem acesso total aos aulas_blocos" ON aulas_blocos;
DROP POLICY IF EXISTS "Admin dev access aulas_blocos" ON aulas_blocos;

CREATE POLICY "Admin dev access aulas_blocos"
  ON aulas_blocos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- CONFIG_GLOBAL
DROP POLICY IF EXISTS "Leitura pública de config_global" ON config_global;
DROP POLICY IF EXISTS "Superadmin pode editar config_global" ON config_global;
DROP POLICY IF EXISTS "Admin dev access config_global" ON config_global;

CREATE POLICY "Admin dev access config_global"
  ON config_global
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- SUCESSO
DO $$
BEGIN
  RAISE NOTICE '✅ HOTFIX: RLS permissivo aplicado em TODAS as tabelas admin!';
  RAISE NOTICE '📋 Tabelas afetadas: disciplinas, planejamentos, blocos_templates, aulas_blocos, config_global';
  RAISE NOTICE '⚠️ Todos usuários autenticados têm acesso total (DEV ONLY)';
  RAISE NOTICE '🔒 Substitua por políticas restritivas em produção!';
END $$;














