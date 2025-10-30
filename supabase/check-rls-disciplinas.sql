-- Verificar políticas RLS na tabela disciplinas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'disciplinas';

-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'disciplinas';

-- Se RLS estiver bloqueando, execute este comando para permitir leitura pública:
-- ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Permitir leitura de disciplinas ativas"
--   ON disciplinas
--   FOR SELECT
--   USING (ativa = true);
-- 
-- CREATE POLICY "Permitir tudo para superadmin"
--   ON disciplinas
--   FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE users.auth_id = auth.uid() 
--       AND users.role = 'superadmin'
--     )
--   );














