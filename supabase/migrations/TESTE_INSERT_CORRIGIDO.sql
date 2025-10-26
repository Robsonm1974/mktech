-- ============================================
-- TESTE INSERT com ID correto
-- ============================================

-- Limpar teste anterior se existir
DELETE FROM banco_perguntas WHERE codigo LIKE 'TEST-%';

-- Tentar INSERT com ID correto
INSERT INTO banco_perguntas (
  codigo,
  pergunta,
  ano_escolar_id,
  dificuldade,
  explicacao,
  opcoes,
  ativa
) VALUES (
  'TEST-001',
  'O que é um algoritmo?',
  'EF2',  -- ✅ ID CORRETO
  'facil',
  'Algoritmo é uma sequência de passos para resolver um problema.',
  '[
    {"id": "a", "texto": "Uma sequência de passos", "correta": true},
    {"id": "b", "texto": "Um tipo de computador", "correta": false},
    {"id": "c", "texto": "Uma linguagem de programação", "correta": false}
  ]'::jsonb,
  true
) RETURNING id, codigo, pergunta, ano_escolar_id;

-- Verificar se foi inserido
SELECT 
  bp.codigo,
  bp.pergunta,
  ae.nome as ano_nome,
  bp.dificuldade
FROM banco_perguntas bp
LEFT JOIN anos_escolares ae ON ae.id = bp.ano_escolar_id
WHERE bp.codigo = 'TEST-001';

