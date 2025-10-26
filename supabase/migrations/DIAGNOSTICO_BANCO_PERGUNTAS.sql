-- ============================================
-- DIAGNÓSTICO: Verificar tabela banco_perguntas
-- ============================================

-- 1. Verificar se tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'banco_perguntas'
) as tabela_existe;

-- 2. Listar colunas da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'banco_perguntas'
ORDER BY ordinal_position;

-- 3. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'banco_perguntas';

-- 4. Verificar se RLS está habilitado
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'banco_perguntas';

-- 5. Contar registros
SELECT COUNT(*) as total_perguntas FROM banco_perguntas;

-- 6. Testar query simples
SELECT id, codigo, pergunta 
FROM banco_perguntas 
LIMIT 1;

