-- ============================================
-- Limpar perguntas de teste
-- ============================================

DELETE FROM banco_perguntas WHERE codigo LIKE 'TEST-%';

SELECT COUNT(*) as perguntas_restantes FROM banco_perguntas;

