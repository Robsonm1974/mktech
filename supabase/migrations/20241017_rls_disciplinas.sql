-- ============================================================================
-- RLS Policies para tabela disciplinas
-- ============================================================================

-- Habilitar RLS
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;

-- Política 1: Permitir leitura de todas as disciplinas ativas (acesso público para usuários autenticados)
CREATE POLICY "Permitir leitura de disciplinas ativas"
  ON disciplinas
  FOR SELECT
  TO authenticated
  USING (ativa = true);

-- Política 2: Permitir TUDO para superadmin
CREATE POLICY "Superadmin tem acesso total às disciplinas"
  ON disciplinas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- ============================================================================
-- RLS Policies para tabelas relacionadas
-- ============================================================================

-- Planejamentos
ALTER TABLE planejamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin tem acesso total aos planejamentos"
  ON planejamentos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- Blocos Templates
ALTER TABLE blocos_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin tem acesso total aos blocos"
  ON blocos_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- Aulas Blocos
ALTER TABLE aulas_blocos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin tem acesso total aos aulas_blocos"
  ON aulas_blocos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- Config Global
ALTER TABLE config_global ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de config_global"
  ON config_global
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Superadmin pode editar config_global"
  ON config_global
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS Policies criadas com sucesso!';
  RAISE NOTICE '📋 Políticas criadas para: disciplinas, planejamentos, blocos_templates, aulas_blocos, config_global';
END $$;



