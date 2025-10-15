-- MKTECH Seed Data
-- Dados iniciais para desenvolvimento

-- Inserir tenant de exemplo
INSERT INTO tenants (id, slug, name, settings) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'escola-exemplo',
  'Escola Exemplo',
  '{"theme": "default", "language": "pt-BR", "features": ["quizzes", "analytics"]}'::jsonb
);

-- Inserir usuário admin de exemplo
INSERT INTO users (id, email, tenant_id, role, profile) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'admin@escola-exemplo.com',
  '550e8400-e29b-41d4-a716-446655440000',
  'admin',
  '{"name": "Administrador", "avatar": null}'::jsonb
);

-- Inserir professor de exemplo
INSERT INTO users (id, email, tenant_id, role, profile) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'professor@escola-exemplo.com',
  '550e8400-e29b-41d4-a716-446655440000',
  'teacher',
  '{"name": "Professor Silva", "avatar": null}'::jsonb
);

-- Inserir classe de exemplo
INSERT INTO classes (id, tenant_id, name, grade, year, settings) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  '5º Ano A',
  '5',
  2025,
  '{"capacity": 30, "schedule": "matutino"}'::jsonb
);

-- Inserir alunos de exemplo
INSERT INTO students (id, tenant_id, student_id, pin, name, class_id, profile) VALUES 
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'STU001', '1234', 'João Silva', '550e8400-e29b-41d4-a716-446655440003', '{"avatar": null}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'STU002', '5678', 'Maria Santos', '550e8400-e29b-41d4-a716-446655440003', '{"avatar": null}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', 'STU003', '9012', 'Pedro Costa', '550e8400-e29b-41d4-a716-446655440003', '{"avatar": null}'::jsonb);

-- Inserir matrículas
INSERT INTO enrollments (tenant_id, student_id, class_id, status) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'active'),
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'active'),
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'active');

-- Inserir coleção de exemplo
INSERT INTO collections (id, tenant_id, name, description, status, published_at, settings) VALUES (
  '550e8400-e29b-41d4-a716-446655440007',
  '550e8400-e29b-41d4-a716-446655440000',
  'Matemática Básica',
  'Trilha de aprendizado para conceitos básicos de matemática',
  'published',
  NOW(),
  '{"color": "#3B82F6", "icon": "calculator"}'::jsonb
);

-- Inserir aula de exemplo
INSERT INTO lessons (id, tenant_id, collection_id, title, description, order_index, status, published_at, settings) VALUES (
  '550e8400-e29b-41d4-a716-446655440008',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440007',
  'Adição e Subtração',
  'Aprenda os conceitos básicos de adição e subtração',
  1,
  'published',
  NOW(),
  '{"duration": 45, "difficulty": "beginner"}'::jsonb
);

-- Inserir blocos de conteúdo
INSERT INTO blocks (id, tenant_id, lesson_id, type, content, order_index, settings) VALUES 
  ('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440008', 'text', '{"title": "Introdução", "text": "Vamos aprender sobre adição e subtração!"}'::jsonb, 1, '{}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440008', 'image', '{"url": "https://example.com/math-image.jpg", "alt": "Exemplo de adição"}'::jsonb, 2, '{}'::jsonb);

-- Inserir quiz de exemplo
INSERT INTO quizzes (id, tenant_id, lesson_id, title, description, settings) VALUES (
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440008',
  'Quiz de Adição',
  'Teste seus conhecimentos sobre adição',
  '{"time_limit": 300, "attempts": 3}'::jsonb
);

-- Inserir perguntas de exemplo
INSERT INTO questions (id, tenant_id, quiz_id, question_text, question_type, correct_answer, points, order_index, settings) VALUES 
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440011', 'Quanto é 5 + 3?', 'multiple_choice', '{"answer": "8"}'::jsonb, 1, 1, '{}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440011', 'Quanto é 10 - 4?', 'multiple_choice', '{"answer": "6"}'::jsonb, 1, 2, '{}'::jsonb);

-- Inserir opções de resposta
INSERT INTO options (id, tenant_id, question_id, option_text, is_correct, order_index) VALUES 
  ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440012', '7', false, 1),
  ('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440012', '8', true, 2),
  ('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440012', '9', false, 3),
  ('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440013', '5', false, 1),
  ('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440013', '6', true, 2),
  ('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440013', '7', false, 3);

-- Inserir sessão de exemplo
INSERT INTO sessions (id, tenant_id, lesson_id, code, title, status, started_at, settings) VALUES (
  '550e8400-e29b-41d4-a716-446655440020',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440008',
  'ABC123',
  'Aula de Matemática - 5º Ano A',
  'active',
  NOW(),
  '{"qr_code": "ABC123", "allow_late_join": true}'::jsonb
);

-- Inserir assinatura de exemplo
INSERT INTO subscriptions (id, tenant_id, plan, status, started_at, ends_at, settings) VALUES (
  '550e8400-e29b-41d4-a716-446655440021',
  '550e8400-e29b-41d4-a716-446655440000',
  'premium',
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  '{"students_limit": 100, "storage_gb": 10}'::jsonb
);
