-- ============================================
-- TEMPORÁRIO: Desabilitar RLS para testar
-- ============================================

-- Desabilitar RLS temporariamente para debug
ALTER TABLE banco_perguntas DISABLE ROW LEVEL SECURITY;

-- Comentário
COMMENT ON TABLE banco_perguntas IS 'RLS DESABILITADO TEMPORARIAMENTE PARA DEBUG';

