-- MKTECH Seed Data - Baseado no mktech_project_rules.md
-- Dados iniciais para desenvolvimento

-- Inserir tenant de exemplo (Escola Piloto)
INSERT INTO tenants (id, name, slug, email_admin, phone, plan_type, seats_total, seats_used, status) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Escola Piloto',
  'escola-piloto',
  'admin@escolapiloto.com.br',
  '+55 11 99999-9999',
  'starter',
  50,
  0,
  'active'
);

-- Inserir trilhas globais (gerenciadas por MKTECH)
INSERT INTO trilhas (id, name, descricao, disciplinas, grade_levels, sequencia, ativa) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Programação Básica', 'Introdução à programação para iniciantes', ARRAY['Programação', 'Lógica'], ARRAY['EF2-5', 'EF2-6'], 1, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Matemática Interativa', 'Conceitos matemáticos através de jogos', ARRAY['Matemática', 'Lógica'], ARRAY['EF1-3', 'EF1-4', 'EF2-5'], 2, true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Ciências Experimentais', 'Aprendizado prático de ciências', ARRAY['Ciências', 'Experimentos'], ARRAY['EF2-6', 'EF2-7'], 3, true);

-- Inserir aulas de exemplo
INSERT INTO aulas (id, trilha_id, titulo, descricao, numero_sequencia, duracao_minutos, objetivos_aprendizado, disciplinas, grade_level, pontos_totais, badges_desbloqueaveis, publicada) VALUES 
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Introdução aos Algoritmos', 'Aprenda o que são algoritmos e como criar os seus primeiros', 1, 45, 'Compreender conceitos básicos de algoritmos e lógica de programação', ARRAY['Programação', 'Lógica'], 'EF2-5', 50, '[{"id": "algoritmo_basico", "titulo": "Primeiro Algoritmo", "icone": "brain", "condicao": "completar_aula"}]'::jsonb, true),
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Adição e Subtração', 'Operações básicas através de jogos interativos', 1, 30, 'Dominar operações de adição e subtração', ARRAY['Matemática'], 'EF1-3', 30, '[{"id": "matematica_basica", "titulo": "Calculadora", "icone": "calculator", "condicao": "acertos_100"}]'::jsonb, true);

-- Inserir blocos de conteúdo
INSERT INTO blocos (id, aula_id, numero_sequencia, titulo, tipo, descricao, duracao_minutos, conteudo_url, pontos_por_bloco) VALUES 
  ('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440004', 1, 'O que são Algoritmos?', 'video', 'Vídeo explicativo sobre algoritmos', 10, '/videos/algoritmos-intro.mp4', 10),
  ('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440004', 2, 'Exemplo Prático', 'animacao_lottie', 'Animação interativa mostrando algoritmo em ação', 5, '/animations/algoritmo-exemplo.json', 5),
  ('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440005', 1, 'Introdução às Operações', 'video', 'Vídeo sobre adição e subtração', 8, '/videos/matematica-basica.mp4', 8);

-- Inserir quizzes
INSERT INTO quizzes (id, bloco_id, titulo, tipo, descricao, perguntas, tentativas_permitidas, tempo_limite_seg, pontos_max, hints) VALUES 
  ('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440006', 'Quiz: Algoritmos', 'mcq', 'Teste seus conhecimentos sobre algoritmos', '{"perguntas": [{"id": "q1", "pergunta": "O que é um algoritmo?", "opcoes": ["Uma linguagem de programação", "Uma sequência de passos para resolver um problema", "Um tipo de computador"], "correta": 1}, {"id": "q2", "pergunta": "Qual é a característica principal de um algoritmo?", "opcoes": ["Ser rápido", "Ser claro e bem definido", "Usar computador"], "correta": 1}]}'::jsonb, 2, 300, 20, '{"hints": ["Pense em receitas de bolo", "Lembre-se de instruções passo a passo"]}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440008', 'Quiz: Matemática Básica', 'mcq', 'Teste suas habilidades em adição e subtração', '{"perguntas": [{"id": "q1", "pergunta": "Quanto é 5 + 3?", "opcoes": ["7", "8", "9"], "correta": 1}, {"id": "q2", "pergunta": "Quanto é 10 - 4?", "opcoes": ["5", "6", "7"], "correta": 1}]}'::jsonb, 3, 180, 15, '{"hints": ["Use os dedos para contar", "Pense em objetos reais"]}'::jsonb);

-- Inserir badges globais
INSERT INTO badges (id, titulo, descricao, tipo, condicao_tipo, condicao_valor, icon_url) VALUES 
  ('550e8400-e29b-41d4-a716-446655440011', 'Primeiro Passo', 'Complete sua primeira aula', 'marco', 'x_aulas_completadas', 1, '/badges/primeiro-passo.png'),
  ('550e8400-e29b-41d4-a716-446655440012', 'Perfeccionista', 'Acerte 100% das questões em uma aula', 'disciplina', 'x_acertos_100', 1, '/badges/perfeccionista.png'),
  ('550e8400-e29b-41d4-a716-446655440013', 'Persistente', 'Complete 5 aulas', 'marco', 'x_aulas_completadas', 5, '/badges/persistente.png'),
  ('550e8400-e29b-41d4-a716-446655440014', 'Programador', 'Complete a trilha de Programação', 'disciplina', 'trilha_completada', 1, '/badges/programador.png');

-- Inserir H5P contents de exemplo
INSERT INTO h5p_contents (id, titulo, library, json_data, max_score, storage_path) VALUES 
  ('550e8400-e29b-41d4-a716-446655440015', 'Quiz Interativo: Algoritmos', 'H5P.MultiChoice', '{"question": "Qual é a melhor definição de algoritmo?", "choices": ["Um programa de computador", "Uma sequência de passos para resolver um problema", "Uma linguagem de programação"], "correct": 1}'::jsonb, 10, '/h5p/quiz-algoritmos.json');

-- Atualizar referência do quiz no bloco
UPDATE blocos SET quiz_id = '550e8400-e29b-41d4-a716-446655440009' WHERE id = '550e8400-e29b-41d4-a716-446655440006';
UPDATE blocos SET quiz_id = '550e8400-e29b-41d4-a716-446655440010' WHERE id = '550e8400-e29b-41d4-a716-446655440008';
