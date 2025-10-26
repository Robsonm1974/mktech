-- ============================================
-- FÁBRICA DE JOGOS - Sistema Completo
-- Data: 26/10/2025
-- ============================================

-- ============================================
-- 1. BANCO DE PERGUNTAS (já existe, mas vamos garantir)
-- ============================================
CREATE TABLE IF NOT EXISTS banco_perguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(50) UNIQUE NOT NULL,
  pergunta text NOT NULL,
  opcoes jsonb NOT NULL, -- [{ "id": "a", "texto": "...", "correta": true }]
  explicacao text NOT NULL,
  
  -- Classificação
  ano_escolar_id varchar(20) REFERENCES anos_escolares(id),
  disciplina_id uuid REFERENCES disciplinas(id),
  dificuldade varchar(20) NOT NULL CHECK (dificuldade IN ('facil', 'medio', 'dificil')),
  tags varchar[] DEFAULT '{}',
  
  -- Metadata
  ativa boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Disable RLS (admin-only table)
ALTER TABLE banco_perguntas DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE banco_perguntas TO postgres, authenticated, anon, service_role;

-- ============================================
-- 2. GAME TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS game_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(50) UNIQUE NOT NULL,
  nome varchar(255) NOT NULL,
  descricao text,
  tipo_gameplay varchar(50) NOT NULL, -- 'adventure_runner'
  configuracao_padrao jsonb,
  preview_thumbnail varchar(500),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_templates DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE game_templates TO postgres, authenticated, anon, service_role;

-- Template padrão: Adventure Runner
INSERT INTO game_templates (codigo, nome, descricao, tipo_gameplay, configuracao_padrao)
VALUES ('ADVENTURE_RUNNER', 'Adventure Runner', 'Personagem corre por cenário coletando itens e respondendo perguntas', 'adventure_runner', '{
  "velocidade_personagem": 200,
  "quantidade_itens": 10,
  "pontos_por_acerto": 10,
  "mostrar_explicacao_erro": true,
  "tempo_mensagem_final": 5
}'::jsonb)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- 3. GAMES (Jogos Criados)
-- ============================================
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES game_templates(id),
  codigo varchar(50) UNIQUE NOT NULL,
  titulo varchar(255) NOT NULL,
  descricao text,
  
  -- Público-alvo
  idade_minima int DEFAULT 6,
  idade_maxima int DEFAULT 12,
  ano_escolar_id varchar(20) REFERENCES anos_escolares(id),
  disciplina_id uuid REFERENCES disciplinas(id),
  
  -- Duração
  duracao_segundos int NOT NULL, -- 60, 120, 180
  
  -- Configurações
  configuracao jsonb NOT NULL,
  
  -- Filtro de Perguntas (sorteio dinâmico)
  filtro_perguntas jsonb NOT NULL,
  /* Exemplo:
  {
    "ano_escolar_id": "EF2",
    "disciplina_id": "uuid", // opcional
    "dificuldades": ["facil", "medio"], // opcional
    "quantidade": 3, // quantas perguntas sortear
    "tags": ["algoritmo"] // opcional
  }
  */
  
  -- Publicação
  status varchar(20) DEFAULT 'rascunho',
  publicado boolean DEFAULT false,
  preview_thumbnail varchar(500),
  
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

ALTER TABLE games DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE games TO postgres, authenticated, anon, service_role;

-- ============================================
-- 4. GAME SESSIONS (Sessões de Jogo)
-- ============================================
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid REFERENCES alunos(id),
  session_id uuid REFERENCES sessions(id),
  game_id uuid REFERENCES games(id),
  
  -- Perguntas sorteadas para esta sessão
  perguntas_ids uuid[] DEFAULT '{}',
  
  -- Progresso
  moedas_coletadas int DEFAULT 0,
  respostas jsonb DEFAULT '[]',
  /* Exemplo:
  [
    { "pergunta_id": "uuid", "correta": true, "tempo_resposta": 5 },
    { "pergunta_id": "uuid", "correta": false, "tempo_resposta": 8 }
  ]
  */
  
  tempo_jogado_segundos int DEFAULT 0,
  completado boolean DEFAULT false,
  score_final int DEFAULT 0,
  
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  game_state jsonb
);

ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE game_sessions TO postgres, authenticated, anon, service_role;

-- ============================================
-- 5. AULAS_JOGOS (Relacionamento)
-- ============================================
CREATE TABLE IF NOT EXISTS aulas_jogos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id uuid REFERENCES aulas(id) ON DELETE CASCADE,
  game_id uuid REFERENCES games(id),
  ordem_na_aula int NOT NULL,
  obrigatorio boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(aula_id, ordem_na_aula)
);

ALTER TABLE aulas_jogos DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE aulas_jogos TO postgres, authenticated, anon, service_role;

-- ============================================
-- 6. ALUNO_MOEDAS (Sistema de Moedas)
-- ============================================
CREATE TABLE IF NOT EXISTS aluno_moedas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid REFERENCES alunos(id) UNIQUE,
  moedas_totais int DEFAULT 0,
  moedas_gastas int DEFAULT 0,
  moedas_disponiveis int DEFAULT 0,
  historico jsonb DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aluno_moedas DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE aluno_moedas TO postgres, authenticated, anon, service_role;

-- ============================================
-- 7. ALUNO_PROGRESSO_PERGUNTAS
-- ============================================
CREATE TABLE IF NOT EXISTS aluno_progresso_perguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid REFERENCES alunos(id),
  pergunta_id uuid REFERENCES banco_perguntas(id),
  
  -- Estatísticas
  total_tentativas int DEFAULT 0,
  total_acertos int DEFAULT 0,
  total_erros int DEFAULT 0,
  ultima_resposta_correta boolean,
  ultima_tentativa_em timestamptz,
  
  -- Estado
  dominada boolean DEFAULT false, -- Acertou 3+ vezes seguidas
  
  UNIQUE(aluno_id, pergunta_id)
);

ALTER TABLE aluno_progresso_perguntas DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE aluno_progresso_perguntas TO postgres, authenticated, anon, service_role;

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_banco_perguntas_ano ON banco_perguntas(ano_escolar_id);
CREATE INDEX IF NOT EXISTS idx_banco_perguntas_disciplina ON banco_perguntas(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_banco_perguntas_dificuldade ON banco_perguntas(dificuldade);
CREATE INDEX IF NOT EXISTS idx_aluno_progresso_aluno ON aluno_progresso_perguntas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_aluno_progresso_pergunta ON aluno_progresso_perguntas(pergunta_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_aluno ON game_sessions(aluno_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game ON game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_games_ano ON games(ano_escolar_id);
CREATE INDEX IF NOT EXISTS idx_games_disciplina ON games(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_games_publicado ON games(publicado);

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE games IS 'Jogos educacionais criados pela Fábrica de Jogos';
COMMENT ON TABLE game_sessions IS 'Sessões de jogo dos alunos com progresso e pontuação';
COMMENT ON TABLE aluno_moedas IS 'Sistema de moedas exclusivo dos jogos';
COMMENT ON TABLE banco_perguntas IS 'Banco central de perguntas para sorteio dinâmico nos jogos';
COMMENT ON TABLE aluno_progresso_perguntas IS 'Tracking de perguntas dominadas/erradas por aluno';

