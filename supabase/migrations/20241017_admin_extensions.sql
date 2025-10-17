-- ============================================================================
-- MKTECH - Admin Extensions Migration
-- Versão: 1.0
-- Data: Outubro 2025
-- Descrição: Extensões para sistema administrativo (disciplinas, planejamentos, blocos_templates, config_global)
-- ============================================================================

-- ============================================================================
-- DISCIPLINAS (normalizar)
-- ============================================================================
CREATE TABLE IF NOT EXISTS disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(10) UNIQUE NOT NULL,  -- ALG, ING, MAT, LOG
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  cor_hex VARCHAR(7) DEFAULT '#3B82F6',
  icone VARCHAR(50),
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- PLANEJAMENTOS BASE (documentos importados)
-- ============================================================================
CREATE TABLE IF NOT EXISTS planejamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id UUID REFERENCES disciplinas(id) ON DELETE CASCADE,
  turma VARCHAR(20) NOT NULL,  -- EF1-1, EF2-5
  titulo VARCHAR(255) NOT NULL,
  documento_md TEXT,  -- conteúdo original
  num_blocos INTEGER,
  pontos_totais INTEGER,
  pontos_por_quiz INTEGER,
  codigo_base VARCHAR(20),  -- ALG-1, ING-2
  status VARCHAR(50) DEFAULT 'rascunho',  -- rascunho, processado, publicado
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- BLOCOS TEMPLATES (independentes, reutilizáveis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS blocos_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planejamento_id UUID REFERENCES planejamentos(id) ON DELETE CASCADE,
  disciplina_id UUID REFERENCES disciplinas(id),
  codigo_bloco VARCHAR(20) UNIQUE NOT NULL,  -- ALG-1-1, ING-2-3
  numero_sequencia INTEGER,
  titulo VARCHAR(255) NOT NULL,
  conteudo_texto TEXT,  -- conteúdo parseado do planejamento
  tipo_midia VARCHAR(50),  -- video, lottie, phaser, h5p, null
  midia_url VARCHAR(512),
  midia_metadata JSONB,
  quiz_id UUID,
  pontos_bloco INTEGER DEFAULT 10,
  status VARCHAR(50) DEFAULT 'incompleto',  -- incompleto, com_midia, com_quiz, completo
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- RELACIONAMENTO AULAS <-> BLOCOS TEMPLATES (N-N)
-- ============================================================================
CREATE TABLE IF NOT EXISTS aulas_blocos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID REFERENCES aulas(id) ON DELETE CASCADE,
  bloco_template_id UUID REFERENCES blocos_templates(id) ON DELETE CASCADE,
  ordem_na_aula INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(aula_id, bloco_template_id)
);

-- ============================================================================
-- CONFIG GLOBAL (SEO, branding)
-- ============================================================================
CREATE TABLE IF NOT EXISTS config_global (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  tipo VARCHAR(50) DEFAULT 'text',  -- text, json, url, boolean
  categoria VARCHAR(50),  -- seo, branding, features
  descricao TEXT,
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- INDEXES (Performance optimization)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_disciplinas_codigo ON disciplinas(codigo);
CREATE INDEX IF NOT EXISTS idx_blocos_templates_disciplina ON blocos_templates(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_blocos_templates_planejamento ON blocos_templates(planejamento_id);
CREATE INDEX IF NOT EXISTS idx_blocos_templates_codigo ON blocos_templates(codigo_bloco);
CREATE INDEX IF NOT EXISTS idx_blocos_templates_status ON blocos_templates(status);
CREATE INDEX IF NOT EXISTS idx_aulas_blocos_aula ON aulas_blocos(aula_id);
CREATE INDEX IF NOT EXISTS idx_aulas_blocos_bloco_template ON aulas_blocos(bloco_template_id);
CREATE INDEX IF NOT EXISTS idx_planejamentos_disciplina ON planejamentos(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_planejamentos_status ON planejamentos(status);
CREATE INDEX IF NOT EXISTS idx_config_global_chave ON config_global(chave);
CREATE INDEX IF NOT EXISTS idx_config_global_categoria ON config_global(categoria);

-- ============================================================================
-- TRIGGERS (Auto-update timestamps)
-- ============================================================================
CREATE TRIGGER update_planejamentos_updated_at BEFORE UPDATE ON planejamentos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocos_templates_updated_at BEFORE UPDATE ON blocos_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_config_global_updated_at BEFORE UPDATE ON config_global 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DISCIPLINAS BÁSICAS
-- ============================================================================
INSERT INTO disciplinas (codigo, nome, cor_hex, icone, descricao) VALUES
  ('ALG', 'Algoritmos', '#3B82F6', '🧮', 'Introdução a algoritmos e pensamento computacional'),
  ('ING', 'Inglês', '#10B981', '🇬🇧', 'Inglês aplicado à tecnologia'),
  ('MAT', 'Matemática', '#F59E0B', '➕', 'Matemática aplicada'),
  ('LOG', 'Lógica', '#8B5CF6', '🧠', 'Lógica de programação'),
  ('PRG', 'Programação', '#EF4444', '💻', 'Fundamentos de programação')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- SEED CONFIG GLOBAL
-- ============================================================================
INSERT INTO config_global (chave, valor, tipo, categoria, descricao) VALUES
  ('site_title', 'MKTECH - Plataforma Educacional', 'text', 'seo', 'Título do site'),
  ('site_description', 'Plataforma de aulas gamificadas de tecnologia para escolas', 'text', 'seo', 'Meta description'),
  ('site_keywords', 'educação, tecnologia, programação, gamificação', 'text', 'seo', 'Meta keywords'),
  ('logo_url', '/logo-mktech.png', 'url', 'branding', 'URL do logo principal'),
  ('favicon_url', '/favicon.ico', 'url', 'branding', 'URL do favicon'),
  ('primary_color', '#3B82F6', 'text', 'branding', 'Cor primária do tema'),
  ('secondary_color', '#10B981', 'text', 'branding', 'Cor secundária do tema')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================
COMMENT ON TABLE disciplinas IS 'Master list of subject areas (Algoritmos, Inglês, etc)';
COMMENT ON TABLE planejamentos IS 'Imported planning documents that generate blocos_templates';
COMMENT ON TABLE blocos_templates IS 'Reusable content blocks that can be used in multiple aulas';
COMMENT ON TABLE aulas_blocos IS 'Many-to-many relationship between aulas and blocos_templates';
COMMENT ON TABLE config_global IS 'Global configuration for SEO, branding, and feature flags';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ MKTECH Admin Extensions created successfully!';
  RAISE NOTICE '📋 Tables created: disciplinas, planejamentos, blocos_templates, aulas_blocos, config_global';
  RAISE NOTICE '🔍 Indexes created for performance optimization';
  RAISE NOTICE '⏰ Auto-update triggers configured';
  RAISE NOTICE '🌱 Seed data inserted';
END $$;


