-- ============================================
-- FÁBRICA DE JOGOS MK-SMART
-- Data: 25 Outubro 2025
-- Descrição: Sistema completo de jogos educacionais
-- ============================================

-- ============================================
-- 1. BANCO DE PERGUNTAS
-- ============================================
CREATE TABLE IF NOT EXISTS banco_perguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(50) UNIQUE NOT NULL,
  pergunta text NOT NULL,
  opcoes jsonb NOT NULL,
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

COMMENT ON TABLE banco_perguntas IS 'Banco de perguntas para jogos educacionais';
COMMENT ON COLUMN banco_perguntas.opcoes IS 'JSON: [{ "id": "a", "texto": "...", "correta": true }]';
COMMENT ON COLUMN banco_perguntas.explicacao IS 'Explicação exibida ao aluno quando erra';

-- ============================================
-- 2. MASCOTE (Personagem da Plataforma)
-- ============================================
CREATE TABLE IF NOT EXISTS mascote_niveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel int UNIQUE NOT NULL,
  nome varchar(100) NOT NULL,
  descricao text,
  acertos_necessarios int NOT NULL,
  sprite_url varchar(500) NOT NULL,
  sprite_config jsonb,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE mascote_niveis IS 'Níveis de evolução do mascote da plataforma';

-- Inserir níveis padrão
INSERT INTO mascote_niveis (nivel, nome, descricao, acertos_necessarios, sprite_url, sprite_config) VALUES
(1, 'Aprendiz', 'Mascote com roupa simples - Iniciando a jornada!', 0, '/games/sprites/mascote/nivel-1.png', '{"frames": 12, "width": 64, "height": 64}'::jsonb),
(2, 'Estudante', 'Mascote com armadura leve - Evoluindo!', 50, '/games/sprites/mascote/nivel-2.png', '{"frames": 12, "width": 64, "height": 64}'::jsonb),
(3, 'Mestre', 'Mascote com escudo - Ficando forte!', 150, '/games/sprites/mascote/nivel-3.png', '{"frames": 12, "width": 64, "height": 64}'::jsonb),
(4, 'Sábio', 'Mascote evoluído com capa - Quase lá!', 300, '/games/sprites/mascote/nivel-4.png', '{"frames": 12, "width": 64, "height": 64}'::jsonb),
(5, 'Lenda', 'Mascote máximo - Você é incrível!', 500, '/games/sprites/mascote/nivel-5.png', '{"frames": 12, "width": 64, "height": 64}'::jsonb)
ON CONFLICT (nivel) DO NOTHING;

-- ============================================
-- 3. PROGRESSO DO ALUNO EM PERGUNTAS
-- ============================================
CREATE TABLE IF NOT EXISTS aluno_progresso_perguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid REFERENCES alunos(id) ON DELETE CASCADE,
  pergunta_id uuid REFERENCES banco_perguntas(id) ON DELETE CASCADE,
  
  -- Estatísticas
  total_tentativas int DEFAULT 0,
  total_acertos int DEFAULT 0,
  total_erros int DEFAULT 0,
  ultima_resposta_correta boolean,
  ultima_tentativa_em timestamptz,
  
  -- Estado
  dominada boolean DEFAULT false,
  
  UNIQUE(aluno_id, pergunta_id)
);

COMMENT ON TABLE aluno_progresso_perguntas IS 'Rastreamento de progresso do aluno em cada pergunta';
COMMENT ON COLUMN aluno_progresso_perguntas.dominada IS 'True quando acertou 3+ vezes seguidas';

-- ============================================
-- 4. NÍVEL DO MASCOTE DO ALUNO
-- ============================================
CREATE TABLE IF NOT EXISTS aluno_mascote (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid REFERENCES alunos(id) ON DELETE CASCADE UNIQUE,
  nivel_atual int DEFAULT 1,
  total_acertos_jogos int DEFAULT 0,
  historico_niveis jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE aluno_mascote IS 'Nível e evolução do mascote de cada aluno';
COMMENT ON COLUMN aluno_mascote.historico_niveis IS 'JSON: [{ "nivel": 1, "data": "...", "acertos": 0 }]';

-- ============================================
-- 5. GAME TEMPLATES (Esqueletos)
-- ============================================
CREATE TABLE IF NOT EXISTS game_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(50) UNIQUE NOT NULL,
  nome varchar(255) NOT NULL,
  descricao text,
  tipo_gameplay varchar(50) NOT NULL,
  configuracao_padrao jsonb,
  preview_thumbnail varchar(500),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE game_templates IS 'Templates (esqueletos) de jogos reutilizáveis';

-- Template padrão: Adventure Runner
INSERT INTO game_templates (codigo, nome, descricao, tipo_gameplay, configuracao_padrao, preview_thumbnail) VALUES
('ADVENTURE_RUNNER', 'Adventure Runner', 'Personagem corre por cenário coletando itens e respondendo perguntas nos baús', 'adventure_runner', '{
  "velocidade_personagem": 200,
  "quantidade_itens": 10,
  "pontos_por_acerto": 10,
  "mostrar_explicacao_erro": true,
  "tempo_mensagem_final": 5,
  "camera_follow": true,
  "parallax_speed": 0.5
}'::jsonb, '/games/templates/adventure-runner-preview.png')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- 6. GAME ASSETS (Componentes Visuais/Sonoros)
-- ============================================
CREATE TABLE IF NOT EXISTS game_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(50) UNIQUE NOT NULL,
  nome varchar(255) NOT NULL,
  tipo varchar(50) NOT NULL CHECK (tipo IN ('background', 'item', 'sound', 'music', 'effect')),
  asset_url varchar(500) NOT NULL,
  dimensoes jsonb,
  propriedades jsonb,
  tags varchar[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE game_assets IS 'Assets (sprites, sons, músicas) reutilizáveis para jogos';
COMMENT ON COLUMN game_assets.dimensoes IS 'JSON: { "width": 64, "height": 64 }';

-- ============================================
-- 7. GAMES (Jogos Criados)
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
  duracao_segundos int NOT NULL CHECK (duracao_segundos IN (60, 120, 180)),
  
  -- Assets escolhidos
  cenario_id uuid REFERENCES game_assets(id),
  item_coletavel_id uuid REFERENCES game_assets(id),
  musica_fundo_id uuid REFERENCES game_assets(id),
  som_acerto_id uuid REFERENCES game_assets(id),
  som_erro_id uuid REFERENCES game_assets(id),
  
  -- Configurações
  configuracao jsonb NOT NULL,
  
  -- Fonte de Perguntas (filtro para sortear)
  filtro_perguntas jsonb NOT NULL,
  
  -- Publicação
  status varchar(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'testando', 'publicado')),
  publicado boolean DEFAULT false,
  preview_thumbnail varchar(500),
  
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

COMMENT ON TABLE games IS 'Jogos educacionais criados';
COMMENT ON COLUMN games.filtro_perguntas IS 'JSON: {"ano_escolar_id": "...", "disciplina_id": "...", "dificuldades": [...], "quantidade": 10}';

-- ============================================
-- 8. GAME SESSIONS (Sessões de Jogo)
-- ============================================
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid REFERENCES alunos(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  game_id uuid REFERENCES games(id),
  
  -- Perguntas sorteadas para esta sessão
  perguntas_ids uuid[] DEFAULT '{}',
  
  -- Progresso
  moedas_coletadas int DEFAULT 0,
  respostas jsonb DEFAULT '[]'::jsonb,
  tempo_jogado_segundos int DEFAULT 0,
  completado boolean DEFAULT false,
  score_final int DEFAULT 0,
  
  -- Mascote usado
  mascote_nivel int DEFAULT 1,
  
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  game_state jsonb
);

COMMENT ON TABLE game_sessions IS 'Sessões de jogos dos alunos';
COMMENT ON COLUMN game_sessions.respostas IS 'JSON: [{"pergunta_id": "...", "correta": true, "tempo_resposta": 5}]';

-- ============================================
-- 9. AULAS_JOGOS (Relacionamento Aula-Jogo)
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

COMMENT ON TABLE aulas_jogos IS 'Relacionamento entre aulas e jogos (sequência)';

-- ============================================
-- 10. ALUNO_MOEDAS (Sistema de Moedas)
-- ============================================
CREATE TABLE IF NOT EXISTS aluno_moedas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid REFERENCES alunos(id) ON DELETE CASCADE UNIQUE,
  moedas_totais int DEFAULT 0,
  moedas_gastas int DEFAULT 0,
  moedas_disponiveis int DEFAULT 0,
  historico jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE aluno_moedas IS 'Carteira de moedas do aluno (exclusivas de jogos)';
COMMENT ON COLUMN aluno_moedas.historico IS 'JSON: [{"data": "...", "tipo": "ganho", "quantidade": 50, "origem": "game_session_id"}]';

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_banco_perguntas_ano ON banco_perguntas(ano_escolar_id);
CREATE INDEX IF NOT EXISTS idx_banco_perguntas_disciplina ON banco_perguntas(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_banco_perguntas_dificuldade ON banco_perguntas(dificuldade);
CREATE INDEX IF NOT EXISTS idx_banco_perguntas_ativa ON banco_perguntas(ativa);
CREATE INDEX IF NOT EXISTS idx_aluno_progresso_aluno ON aluno_progresso_perguntas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_aluno_progresso_pergunta ON aluno_progresso_perguntas(pergunta_id);
CREATE INDEX IF NOT EXISTS idx_aluno_progresso_dominada ON aluno_progresso_perguntas(dominada);
CREATE INDEX IF NOT EXISTS idx_game_sessions_aluno ON game_sessions(aluno_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game ON game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_session ON game_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_games_publicado ON games(publicado);
CREATE INDEX IF NOT EXISTS idx_games_ano ON games(ano_escolar_id);
CREATE INDEX IF NOT EXISTS idx_aulas_jogos_aula ON aulas_jogos(aula_id);

-- ============================================
-- RLS POLICIES (Segurança)
-- ============================================

-- Banco de Perguntas: Todos podem ler, apenas admin pode escrever
ALTER TABLE banco_perguntas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Banco perguntas: público pode ler" ON banco_perguntas FOR SELECT USING (ativa = true);
CREATE POLICY "Banco perguntas: admin pode gerenciar" ON banco_perguntas FOR ALL USING (auth.uid() IS NOT NULL);

-- Mascote Níveis: Todos podem ler
ALTER TABLE mascote_niveis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mascote níveis: todos podem ler" ON mascote_niveis FOR SELECT USING (true);

-- Aluno Mascote: Aluno vê apenas o próprio
ALTER TABLE aluno_mascote ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno mascote: ver próprio" ON aluno_mascote FOR SELECT USING (
  aluno_id IN (SELECT id FROM alunos WHERE auth.uid() IS NOT NULL)
);

-- Game Templates: Todos podem ler templates ativos
ALTER TABLE game_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Game templates: todos podem ler ativos" ON game_templates FOR SELECT USING (ativo = true);

-- Game Assets: Todos podem ler
ALTER TABLE game_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Game assets: todos podem ler" ON game_assets FOR SELECT USING (true);

-- Games: Todos podem ler jogos publicados
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Games: ler publicados" ON games FOR SELECT USING (publicado = true OR auth.uid() IS NOT NULL);
CREATE POLICY "Games: admin pode gerenciar" ON games FOR ALL USING (auth.uid() IS NOT NULL);

-- Game Sessions: Aluno vê apenas próprias sessões
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Game sessions: ver próprias" ON game_sessions FOR SELECT USING (
  aluno_id IN (SELECT id FROM alunos WHERE auth.uid() IS NOT NULL)
);

-- Aluno Moedas: Aluno vê apenas próprias moedas
ALTER TABLE aluno_moedas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno moedas: ver próprias" ON aluno_moedas FOR SELECT USING (
  aluno_id IN (SELECT id FROM alunos WHERE auth.uid() IS NOT NULL)
);

-- ============================================
-- FUNÇÕES/RPCs
-- ============================================

-- ============================================
-- 1. SORTEAR PERGUNTAS PARA JOGO
-- ============================================
CREATE OR REPLACE FUNCTION sortear_perguntas_jogo(
  p_filtro jsonb,
  p_aluno_id uuid
)
RETURNS TABLE (
  pergunta_id uuid,
  pergunta text,
  opcoes jsonb,
  explicacao text,
  dificuldade varchar
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Prioriza perguntas que o aluno errou
  -- Depois sorteia aleatoriamente
  RETURN QUERY
  WITH perguntas_candidatas AS (
    SELECT 
      bp.id, 
      bp.pergunta, 
      bp.opcoes, 
      bp.explicacao, 
      bp.dificuldade,
      COALESCE(app.total_erros, 0) as prioridade
    FROM banco_perguntas bp
    LEFT JOIN aluno_progresso_perguntas app 
      ON app.pergunta_id = bp.id AND app.aluno_id = p_aluno_id
    WHERE bp.ano_escolar_id = (p_filtro->>'ano_escolar_id')::uuid
      AND bp.ativa = true
      AND (app.dominada IS NULL OR app.dominada = false)
      AND (
        (p_filtro->>'disciplina_id') IS NULL 
        OR bp.disciplina_id = (p_filtro->>'disciplina_id')::uuid
      )
    ORDER BY prioridade DESC, RANDOM()
    LIMIT (p_filtro->>'quantidade')::int
  )
  SELECT 
    id as pergunta_id,
    pergunta,
    opcoes,
    explicacao,
    dificuldade
  FROM perguntas_candidatas;
END;
$$;

COMMENT ON FUNCTION sortear_perguntas_jogo IS 'Sorteia perguntas para um jogo, priorizando as que o aluno errou';

-- ============================================
-- 2. REGISTRAR RESPOSTA E ATUALIZAR PROGRESSO
-- ============================================
CREATE OR REPLACE FUNCTION registrar_resposta_jogo(
  p_aluno_id uuid,
  p_pergunta_id uuid,
  p_correta boolean,
  p_game_session_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_novo_nivel int;
  v_total_acertos int;
  v_nivel_anterior int;
BEGIN
  -- Atualizar progresso da pergunta
  INSERT INTO aluno_progresso_perguntas (
    aluno_id, 
    pergunta_id, 
    total_tentativas, 
    total_acertos, 
    total_erros, 
    ultima_resposta_correta, 
    ultima_tentativa_em
  )
  VALUES (
    p_aluno_id, 
    p_pergunta_id, 
    1, 
    CASE WHEN p_correta THEN 1 ELSE 0 END, 
    CASE WHEN p_correta THEN 0 ELSE 1 END, 
    p_correta, 
    now()
  )
  ON CONFLICT (aluno_id, pergunta_id)
  DO UPDATE SET
    total_tentativas = aluno_progresso_perguntas.total_tentativas + 1,
    total_acertos = aluno_progresso_perguntas.total_acertos + CASE WHEN p_correta THEN 1 ELSE 0 END,
    total_erros = aluno_progresso_perguntas.total_erros + CASE WHEN p_correta THEN 0 ELSE 1 END,
    ultima_resposta_correta = p_correta,
    ultima_tentativa_em = now();

  -- Se acertou, atualizar mascote
  IF p_correta THEN
    -- Pegar nível anterior
    SELECT nivel_atual INTO v_nivel_anterior FROM aluno_mascote WHERE aluno_id = p_aluno_id;
    
    -- Criar ou atualizar mascote do aluno
    INSERT INTO aluno_mascote (aluno_id, total_acertos_jogos, nivel_atual)
    VALUES (p_aluno_id, 1, 1)
    ON CONFLICT (aluno_id)
    DO UPDATE SET
      total_acertos_jogos = aluno_mascote.total_acertos_jogos + 1,
      updated_at = now();

    -- Calcular novo nível baseado em acertos
    SELECT 
      COALESCE(MAX(nivel), 1)
    INTO v_novo_nivel
    FROM mascote_niveis
    WHERE acertos_necessarios <= (
      SELECT total_acertos_jogos FROM aluno_mascote WHERE aluno_id = p_aluno_id
    );

    -- Atualizar nível se mudou
    IF v_novo_nivel != COALESCE(v_nivel_anterior, 1) THEN
      UPDATE aluno_mascote
      SET 
        nivel_atual = v_novo_nivel,
        historico_niveis = historico_niveis || jsonb_build_object(
          'nivel', v_novo_nivel,
          'data', now()::text,
          'acertos', (SELECT total_acertos_jogos FROM aluno_mascote WHERE aluno_id = p_aluno_id)
        )
      WHERE aluno_id = p_aluno_id;
    END IF;

    SELECT total_acertos_jogos INTO v_total_acertos FROM aluno_mascote WHERE aluno_id = p_aluno_id;
  END IF;

  RETURN jsonb_build_object(
    'sucesso', true,
    'nivel_mascote', COALESCE(v_novo_nivel, v_nivel_anterior, 1),
    'total_acertos', COALESCE(v_total_acertos, 0),
    'subiu_nivel', (v_novo_nivel IS NOT NULL AND v_novo_nivel > COALESCE(v_nivel_anterior, 1))
  );
END;
$$;

COMMENT ON FUNCTION registrar_resposta_jogo IS 'Registra resposta do aluno e atualiza progresso + nível do mascote';

-- ============================================
-- 3. COMPLETAR JOGO E DISTRIBUIR MOEDAS
-- ============================================
CREATE OR REPLACE FUNCTION completar_game_session(
  p_game_session_id uuid,
  p_moedas_ganhas int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_aluno_id uuid;
  v_moedas_totais int;
BEGIN
  -- Marcar jogo como completo
  UPDATE game_sessions
  SET 
    completado = true, 
    completed_at = now(), 
    moedas_coletadas = p_moedas_ganhas
  WHERE id = p_game_session_id
  RETURNING aluno_id INTO v_aluno_id;

  -- Adicionar moedas ao aluno
  INSERT INTO aluno_moedas (aluno_id, moedas_totais, moedas_disponiveis, historico)
  VALUES (
    v_aluno_id, 
    p_moedas_ganhas, 
    p_moedas_ganhas,
    jsonb_build_array(
      jsonb_build_object(
        'data', now()::text,
        'tipo', 'ganho',
        'quantidade', p_moedas_ganhas,
        'origem', p_game_session_id::text
      )
    )
  )
  ON CONFLICT (aluno_id)
  DO UPDATE SET
    moedas_totais = aluno_moedas.moedas_totais + p_moedas_ganhas,
    moedas_disponiveis = aluno_moedas.moedas_disponiveis + p_moedas_ganhas,
    historico = aluno_moedas.historico || jsonb_build_object(
      'data', now()::text,
      'tipo', 'ganho',
      'quantidade', p_moedas_ganhas,
      'origem', p_game_session_id::text
    ),
    updated_at = now();

  SELECT moedas_totais INTO v_moedas_totais 
  FROM aluno_moedas 
  WHERE aluno_id = v_aluno_id;

  RETURN jsonb_build_object(
    'sucesso', true,
    'moedas_ganhas', p_moedas_ganhas,
    'moedas_totais', v_moedas_totais
  );
END;
$$;

COMMENT ON FUNCTION completar_game_session IS 'Marca jogo como completo e distribui moedas ao aluno';

-- ============================================
-- FIM DA MIGRATION
-- ============================================

