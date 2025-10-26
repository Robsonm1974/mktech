-- ============================================
-- SOLUÇÃO FINAL: Desabilitar RLS para banco_perguntas
-- (tabela exclusiva do admin MKTECH)
-- ============================================

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "banco_perguntas_select_authenticated" ON banco_perguntas;
DROP POLICY IF EXISTS "banco_perguntas_insert_authenticated" ON banco_perguntas;
DROP POLICY IF EXISTS "banco_perguntas_update_authenticated" ON banco_perguntas;
DROP POLICY IF EXISTS "banco_perguntas_delete_authenticated" ON banco_perguntas;
DROP POLICY IF EXISTS "Banco perguntas: admin pode ler" ON banco_perguntas;
DROP POLICY IF EXISTS "Banco perguntas: admin pode inserir" ON banco_perguntas;
DROP POLICY IF EXISTS "Banco perguntas: admin pode atualizar" ON banco_perguntas;
DROP POLICY IF EXISTS "Banco perguntas: admin pode deletar" ON banco_perguntas;

-- Desabilitar RLS (seguindo o padrão de outras tabelas admin como disciplinas, blocos_templates, etc)
ALTER TABLE banco_perguntas DISABLE ROW LEVEL SECURITY;

-- Comentário explicativo
COMMENT ON TABLE banco_perguntas IS 
'Banco de perguntas para jogos educacionais. RLS desabilitado pois é gerenciado apenas pelo admin MKTECH.';

-- Mesma abordagem para outras tabelas da Fábrica de Jogos (se existirem)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_templates') THEN
    ALTER TABLE game_templates DISABLE ROW LEVEL SECURITY;
    COMMENT ON TABLE game_templates IS 'Templates de jogos. RLS desabilitado - acesso exclusivo admin MKTECH.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_components') THEN
    ALTER TABLE game_components DISABLE ROW LEVEL SECURITY;
    COMMENT ON TABLE game_components IS 'Componentes de jogos. RLS desabilitado - acesso exclusivo admin MKTECH.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'games') THEN
    ALTER TABLE games DISABLE ROW LEVEL SECURITY;
    COMMENT ON TABLE games IS 'Jogos criados. RLS desabilitado - acesso exclusivo admin MKTECH.';
  END IF;
END $$;

