-- ============================================
-- FIX: RLS com USING authenticated role
-- ============================================

-- Remover todas as políticas da tabela banco_perguntas
DROP POLICY IF EXISTS "Banco perguntas: admin pode ler" ON banco_perguntas;
DROP POLICY IF EXISTS "Banco perguntas: admin pode inserir" ON banco_perguntas;
DROP POLICY IF EXISTS "Banco perguntas: admin pode atualizar" ON banco_perguntas;
DROP POLICY IF EXISTS "Banco perguntas: admin pode deletar" ON banco_perguntas;

-- Criar políticas corretas para authenticated users
CREATE POLICY "banco_perguntas_select_authenticated" 
ON banco_perguntas 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "banco_perguntas_insert_authenticated" 
ON banco_perguntas 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "banco_perguntas_update_authenticated" 
ON banco_perguntas 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "banco_perguntas_delete_authenticated" 
ON banco_perguntas 
FOR DELETE 
TO authenticated
USING (true);

-- Garantir que RLS está habilitado
ALTER TABLE banco_perguntas ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "banco_perguntas_select_authenticated" ON banco_perguntas 
IS 'Permite que usuários autenticados leiam todas as perguntas';

COMMENT ON POLICY "banco_perguntas_insert_authenticated" ON banco_perguntas 
IS 'Permite que usuários autenticados criem perguntas';

