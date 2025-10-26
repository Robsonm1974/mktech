-- ============================================
-- GRANT COMPLETO: Dar todas as permissões
-- ============================================

-- Garantir que a tabela seja acessível
GRANT ALL ON TABLE banco_perguntas TO authenticated;
GRANT ALL ON TABLE banco_perguntas TO anon;
GRANT ALL ON TABLE banco_perguntas TO service_role;
GRANT ALL ON TABLE banco_perguntas TO postgres;

-- Verificar se funcionou
SELECT 
  grantee,
  string_agg(privilege_type, ', ') as privileges
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'banco_perguntas'
GROUP BY grantee
ORDER BY grantee;

