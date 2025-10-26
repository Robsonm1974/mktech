# 🎮 PLANO FINAL: FÁBRICA DE JOGOS MK-SMART

## 📋 **DECISÕES CONFIRMADAS**

### ✅ **1. Sistema de Moedas**
- **EXCLUSIVAS dos jogos** (não ganhas em quizzes)
- Separadas dos pontos de quiz
- Serão exibidas no perfil do aluno
- Podem ser trocadas por incentivos futuros

### ✅ **2. Personagem Único (Mascote)**
- **UM personagem mascote** da plataforma
- **Evolui com o nível do aluno** baseado em acertos
- Níveis de evolução:
  - Nível 1: Roupa simples
  - Nível 2: Com armadura
  - Nível 3: Com escudo
  - Nível 4+: Evoluções adicionais
- Sistema de progressão baseado em **quantidade de respostas corretas**

### ✅ **3. Sistema de Perguntas (Looping)**
- Perguntas organizadas em **Banco de Perguntas** por ano/disciplina
- Exemplo: **300 perguntas para 1º ano** (todas disciplinas)
- Perguntas **tocadas aleatoriamente** nos jogos
- Perguntas **erradas retornam em jogos futuros**
- **Explicação sempre exibida** ao errar
- **Classificação por dificuldade**: Fácil, Médio, Difícil
- Progresso do aluno **persistido** (quais acertou/errou)

### ✅ **4. Template Inicial**
- **Adventure Runner** (prioridade)

### ✅ **5. Assets Iniciais**
- Usar **links de assets gratuitos** para acelerar
- Lista detalhada de requisitos será fornecida

---

## 🗄️ **ESTRUTURA DE DADOS ATUALIZADA**

### **NOVAS TABELAS**

```sql
-- ============================================
-- 1. BANCO DE PERGUNTAS
-- ============================================
CREATE TABLE banco_perguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(50) UNIQUE NOT NULL,
  pergunta text NOT NULL,
  opcoes jsonb NOT NULL, -- [{ "id": "a", "texto": "...", "correta": true }]
  explicacao text NOT NULL, -- Sempre exibida ao errar
  
  -- Classificação
  ano_escolar_id uuid REFERENCES anos_escolares(id),
  disciplina_id uuid REFERENCES disciplinas(id),
  dificuldade varchar(20) NOT NULL, -- 'facil', 'medio', 'dificil'
  tags varchar[] DEFAULT '{}', -- ['algoritmo', 'sequencia', ...]
  
  -- Metadata
  ativa boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. MASCOTE (Personagem da Plataforma)
-- ============================================
CREATE TABLE mascote_niveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel int UNIQUE NOT NULL,
  nome varchar(100) NOT NULL, -- "Iniciante", "Guerreiro", "Cavaleiro"
  descricao text,
  acertos_necessarios int NOT NULL, -- Ex: Nível 1 = 0, Nível 2 = 50, Nível 3 = 150
  sprite_url varchar(500) NOT NULL,
  sprite_config jsonb,
  created_at timestamptz DEFAULT now()
);

-- Inserir níveis padrão
INSERT INTO mascote_niveis (nivel, nome, descricao, acertos_necessarios, sprite_url) VALUES
(1, 'Aprendiz', 'Mascote com roupa simples', 0, '/games/sprites/mascote/nivel-1.png'),
(2, 'Estudante', 'Mascote com armadura', 50, '/games/sprites/mascote/nivel-2.png'),
(3, 'Mestre', 'Mascote com escudo', 150, '/games/sprites/mascote/nivel-3.png'),
(4, 'Sábio', 'Mascote evoluído', 300, '/games/sprites/mascote/nivel-4.png'),
(5, 'Lenda', 'Mascote máximo', 500, '/games/sprites/mascote/nivel-5.png');

-- ============================================
-- 3. PROGRESSO DO ALUNO EM PERGUNTAS
-- ============================================
CREATE TABLE aluno_progresso_perguntas (
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

-- ============================================
-- 4. NÍVEL DO MASCOTE DO ALUNO
-- ============================================
CREATE TABLE aluno_mascote (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid REFERENCES alunos(id) UNIQUE,
  nivel_atual int DEFAULT 1,
  total_acertos_jogos int DEFAULT 0,
  historico_niveis jsonb DEFAULT '[]',
  /* Exemplo:
  [
    { "nivel": 1, "data": "2025-10-25", "acertos": 0 },
    { "nivel": 2, "data": "2025-11-01", "acertos": 50 }
  ]
  */
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 5. GAME TEMPLATES (Esqueletos)
-- ============================================
CREATE TABLE game_templates (
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

-- Template padrão: Adventure Runner
INSERT INTO game_templates (codigo, nome, descricao, tipo_gameplay, configuracao_padrao) VALUES
('ADVENTURE_RUNNER', 'Adventure Runner', 'Personagem corre por cenário coletando itens e respondendo perguntas', 'adventure_runner', '{
  "velocidade_personagem": 200,
  "quantidade_itens": 10,
  "pontos_por_acerto": 10,
  "mostrar_explicacao_erro": true,
  "tempo_mensagem_final": 5
}'::jsonb);

-- ============================================
-- 6. GAME ASSETS (Componentes Visuais)
-- ============================================
CREATE TABLE game_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(50) UNIQUE NOT NULL,
  nome varchar(255) NOT NULL,
  tipo varchar(50) NOT NULL, -- 'background', 'item', 'sound', 'music'
  asset_url varchar(500) NOT NULL,
  dimensoes jsonb, -- { "width": 1920, "height": 1080 }
  propriedades jsonb,
  tags varchar[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 7. GAMES (Jogos Criados)
-- ============================================
CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES game_templates(id),
  codigo varchar(50) UNIQUE NOT NULL,
  titulo varchar(255) NOT NULL,
  descricao text,
  
  -- Público-alvo
  idade_minima int DEFAULT 6,
  idade_maxima int DEFAULT 12,
  ano_escolar_id uuid REFERENCES anos_escolares(id),
  disciplina_id uuid REFERENCES disciplinas(id),
  
  -- Duração
  duracao_segundos int NOT NULL, -- 60, 120, 180
  
  -- Assets escolhidos
  cenario_id uuid REFERENCES game_assets(id),
  item_coletavel_id uuid REFERENCES game_assets(id),
  musica_fundo_id uuid REFERENCES game_assets(id),
  som_acerto_id uuid REFERENCES game_assets(id),
  som_erro_id uuid REFERENCES game_assets(id),
  
  -- Configurações
  configuracao jsonb NOT NULL,
  
  -- Fonte de Perguntas (NÃO mais perguntas fixas)
  filtro_perguntas jsonb NOT NULL,
  /* Exemplo:
  {
    "ano_escolar_id": "uuid",
    "disciplina_id": "uuid", // opcional
    "dificuldades": ["facil", "medio"], // opcional
    "quantidade": 10, // quantas perguntas sortear
    "tags": ["algoritmo"] // opcional
  }
  */
  
  -- Publicação
  status varchar(20) DEFAULT 'rascunho',
  publicado boolean DEFAULT false,
  preview_thumbnail varchar(500),
  
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

-- ============================================
-- 8. GAME SESSIONS (Sessões de Jogo)
-- ============================================
CREATE TABLE game_sessions (
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
  
  -- Mascote usado
  mascote_nivel int DEFAULT 1,
  
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  game_state jsonb
);

-- ============================================
-- 9. AULAS_JOGOS (Relacionamento)
-- ============================================
CREATE TABLE aulas_jogos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id uuid REFERENCES aulas(id) ON DELETE CASCADE,
  game_id uuid REFERENCES games(id),
  ordem_na_aula int NOT NULL,
  obrigatorio boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(aula_id, ordem_na_aula)
);

-- ============================================
-- 10. ALUNO_MOEDAS (Atualizado no Perfil)
-- ============================================
CREATE TABLE aluno_moedas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid REFERENCES alunos(id) UNIQUE,
  moedas_totais int DEFAULT 0,
  moedas_gastas int DEFAULT 0,
  moedas_disponiveis int DEFAULT 0,
  historico jsonb DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_banco_perguntas_ano ON banco_perguntas(ano_escolar_id);
CREATE INDEX idx_banco_perguntas_disciplina ON banco_perguntas(disciplina_id);
CREATE INDEX idx_banco_perguntas_dificuldade ON banco_perguntas(dificuldade);
CREATE INDEX idx_aluno_progresso_aluno ON aluno_progresso_perguntas(aluno_id);
CREATE INDEX idx_aluno_progresso_pergunta ON aluno_progresso_perguntas(pergunta_id);
CREATE INDEX idx_game_sessions_aluno ON game_sessions(aluno_id);
CREATE INDEX idx_game_sessions_game ON game_sessions(game_id);
```

---

## 🔄 **RPCs NECESSÁRIOS**

```sql
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
AS $$
BEGIN
  -- Prioriza perguntas que o aluno errou
  -- Depois sorteia aleatoriamente
  RETURN QUERY
  WITH perguntas_erradas AS (
    SELECT bp.id, bp.pergunta, bp.opcoes, bp.explicacao, bp.dificuldade
    FROM banco_perguntas bp
    LEFT JOIN aluno_progresso_perguntas app ON app.pergunta_id = bp.id AND app.aluno_id = p_aluno_id
    WHERE bp.ano_escolar_id = (p_filtro->>'ano_escolar_id')::uuid
      AND bp.ativa = true
      AND (app.dominada IS NULL OR app.dominada = false)
    ORDER BY app.total_erros DESC NULLS LAST, RANDOM()
    LIMIT (p_filtro->>'quantidade')::int
  )
  SELECT * FROM perguntas_erradas;
END;
$$;

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
AS $$
DECLARE
  v_novo_nivel int;
  v_total_acertos int;
BEGIN
  -- Atualizar progresso da pergunta
  INSERT INTO aluno_progresso_perguntas (aluno_id, pergunta_id, total_tentativas, total_acertos, total_erros, ultima_resposta_correta, ultima_tentativa_em)
  VALUES (p_aluno_id, p_pergunta_id, 1, CASE WHEN p_correta THEN 1 ELSE 0 END, CASE WHEN p_correta THEN 0 ELSE 1 END, p_correta, now())
  ON CONFLICT (aluno_id, pergunta_id)
  DO UPDATE SET
    total_tentativas = aluno_progresso_perguntas.total_tentativas + 1,
    total_acertos = aluno_progresso_perguntas.total_acertos + CASE WHEN p_correta THEN 1 ELSE 0 END,
    total_erros = aluno_progresso_perguntas.total_erros + CASE WHEN p_correta THEN 0 ELSE 1 END,
    ultima_resposta_correta = p_correta,
    ultima_tentativa_em = now();

  -- Se acertou, atualizar mascote
  IF p_correta THEN
    INSERT INTO aluno_mascote (aluno_id, total_acertos_jogos)
    VALUES (p_aluno_id, 1)
    ON CONFLICT (aluno_id)
    DO UPDATE SET
      total_acertos_jogos = aluno_mascote.total_acertos_jogos + 1;

    -- Verificar se subiu de nível
    SELECT 
      COALESCE(MAX(nivel), 1)
    INTO v_novo_nivel
    FROM mascote_niveis
    WHERE acertos_necessarios <= (SELECT total_acertos_jogos FROM aluno_mascote WHERE aluno_id = p_aluno_id);

    UPDATE aluno_mascote
    SET nivel_atual = v_novo_nivel
    WHERE aluno_id = p_aluno_id;

    SELECT total_acertos_jogos INTO v_total_acertos FROM aluno_mascote WHERE aluno_id = p_aluno_id;
  END IF;

  RETURN jsonb_build_object(
    'sucesso', true,
    'nivel_mascote', v_novo_nivel,
    'total_acertos', v_total_acertos
  );
END;
$$;

-- ============================================
-- 3. COMPLETAR JOGO E DISTRIBUIR MOEDAS
-- ============================================
CREATE OR REPLACE FUNCTION completar_game_session(
  p_game_session_id uuid,
  p_moedas_ganhas int
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_aluno_id uuid;
  v_moedas_totais int;
BEGIN
  -- Marcar jogo como completo
  UPDATE game_sessions
  SET completado = true, completed_at = now(), moedas_coletadas = p_moedas_ganhas
  WHERE id = p_game_session_id
  RETURNING aluno_id INTO v_aluno_id;

  -- Adicionar moedas ao aluno
  INSERT INTO aluno_moedas (aluno_id, moedas_totais, moedas_disponiveis)
  VALUES (v_aluno_id, p_moedas_ganhas, p_moedas_ganhas)
  ON CONFLICT (aluno_id)
  DO UPDATE SET
    moedas_totais = aluno_moedas.moedas_totais + p_moedas_ganhas,
    moedas_disponiveis = aluno_moedas.moedas_disponiveis + p_moedas_ganhas;

  SELECT moedas_totais INTO v_moedas_totais FROM aluno_moedas WHERE aluno_id = v_aluno_id;

  RETURN jsonb_build_object(
    'sucesso', true,
    'moedas_ganhas', p_moedas_ganhas,
    'moedas_totais', v_moedas_totais
  );
END;
$$;
```

---

## 📦 **REQUISITOS DE ASSETS**

### **Mascote (Personagem Principal)**

#### **Sprite Sheet**:
- **Formato**: PNG com transparência
- **Dimensões por frame**: 64x64 pixels
- **Total de frames**: 12 (4 idle + 4 run + 2 jump + 2 collect)
- **Layout**: Horizontal sprite sheet (768x64px)

#### **5 Níveis de Evolução**:
1. **Nível 1 - Aprendiz**: Roupa simples
2. **Nível 2 - Estudante**: Com armadura leve
3. **Nível 3 - Mestre**: Com escudo
4. **Nível 4 - Sábio**: Com capa/acessórios
5. **Nível 5 - Lenda**: Totalmente evoluído

### **Cenário (Background)**:
- **Formato**: PNG
- **Dimensões**: 1920x1080px (HD)
- **Estilo**: Parallax (3 camadas: fundo, meio, frente)
- **Tema**: Floresta/Tecnológico

### **Itens Coletáveis (Baú/Moeda)**:
- **Baú Fechado**: 32x32px
- **Baú Aberto**: 32x32px (animação 2 frames)
- **Moeda**: 16x16px (animação 4 frames)

### **Sons**:
- **Música de Fundo**: MP3, ~1-2min loop, 128kbps
- **Som Acerto**: MP3, <1seg, efeito positivo
- **Som Erro**: MP3, <1seg, efeito negativo
- **Som Coletar**: MP3, <0.5seg, efeito de moeda

### **UI Elements**:
- **Botões**: 128x64px (normal, hover, pressed)
- **HUD Icons**: 32x32px (moeda, tempo, coração)

---

## 🚀 **SEQUÊNCIA DE IMPLEMENTAÇÃO**

### **FASE 1: DATABASE** (2h)
1. ✅ Criar migration SQL
2. ✅ Executar no Supabase
3. ✅ Testar RPCs

### **FASE 2: BANCO DE PERGUNTAS** (2h)
4. ✅ Criar interface admin para adicionar perguntas
5. ✅ Importar 50 perguntas iniciais (teste)

### **FASE 3: ASSETS** (1h)
6. ✅ Baixar assets gratuitos (links)
7. ✅ Upload para `/public/games/`
8. ✅ Registrar no banco

### **FASE 4: GAME ENGINE** (3h)
9. ✅ Setup Phaser.js
10. ✅ Criar GameEngine base
11. ✅ Testar rendering

### **FASE 5: ADVENTURE RUNNER** (4h)
12. ✅ Implementar template
13. ✅ Player + movimento
14. ✅ Baús + colisão
15. ✅ Quiz overlay

### **FASE 6: EDITOR DE JOGOS** (3h)
16. ✅ UI do editor
17. ✅ Criação de jogo
18. ✅ Preview

### **FASE 7: INTEGRAÇÃO AULAS** (2h)
19. ✅ Modificar criar aula
20. ✅ Adicionar jogos à sequência

### **FASE 8: PLAYER ALUNO** (2h)
21. ✅ Integrar jogo no player
22. ✅ Sistema de moedas
23. ✅ Atualizar perfil

### **FASE 9: TESTES** (2h)
24. ✅ Testar fluxo completo
25. ✅ Ajustes finais

---

## 📋 **LINKS DE ASSETS GRATUITOS**

### **Mascote/Personagens**:
- https://kenney.nl/assets/platformer-characters-1
- https://opengameart.org/content/character-sprites

### **Cenários**:
- https://kenney.nl/assets/background-elements-redux
- https://opengameart.org/content/forest-background

### **Itens**:
- https://kenney.nl/assets/game-icons
- https://opengameart.org/content/treasure-chest

### **Sons**:
- https://kenney.nl/assets/interface-sounds
- https://opengameart.org/content/512-sound-effects-8-bit-style

---

**TOTAL ESTIMADO: ~21 horas**

Vamos começar? 🚀

