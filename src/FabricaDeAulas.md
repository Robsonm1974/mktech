# PRD - Fábrica de Aulas MKTECH

## 1. Visão Geral do Sistema

A **Fábrica de Aulas** é uma ferramenta administrativa exclusiva da MKTECH para criar, organizar e distribuir conteúdo pedagógico de tecnologia para escolas parceiras (tenants).

### Princípios Fundamentais

- ✅ **Criação Centralizada**: Apenas admins MKTECH criam aulas
- ✅ **Distribuição Seletiva**: Cada tenant/escola recebe apenas as turmas ativadas para ela
- ✅ **Conteúdo Modular**: Blocos reutilizáveis que compõem aulas
- ✅ **Automação**: IA gera planejamento → sistema converte em blocos → blocos viram aulas

### Contexto Técnico

- **Stack**: A ser decidido (sugestão: Next.js + Supabase)
- **Banco de Dados**: Supabase já configurado
- **Acesso**: Área administrativa restrita (login separado)
- **Usuários**: Apenas administradores MKTECH

---

## 2. Fluxo Macro do Sistema
```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN MKTECH                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  1. PLANEJAMENTO PEDAGÓGICO (IA + Importação)               │
│     - IA cria planejamento dividido em "bloquinhos"         │
│     - Cada bloquinho = 1 semana de conteúdo                 │
│     - Define: Disciplina, Turma, Pontos (300), Semanas (30) │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. FÁBRICA DE AULAS (Materialização)                       │
│     - Importa planejamento                                   │
│     - Gera 1 BLOCO por bloquinho (título + texto)          │
│     - Gera 1 QUIZ por bloco (10 pontos cada)               │
│     - Admin adiciona MÍDIA aos blocos (vídeo/jogo/etc)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. ORGANIZAÇÃO EM AULAS                                     │
│     - Lista de blocos disponíveis                            │
│     - Admin atribui códigos (ALG1-1, ALG1-2, etc)          │
│     - Agrupa blocos em aulas                                 │
│     - Edita ordem dos blocos dentro da aula                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. ATIVAÇÃO PARA TENANTS                                    │
│     - Cadastra escola/tenant                                 │
│     - Ativa turmas específicas para esse tenant             │
│     - Aulas ficam visíveis apenas para turmas ativas        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              ESCOLA/TENANT (VÊ APENAS SEU CONTEÚDO)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Glossário de Conceitos

### Objetos Principais

- **Disciplina**: Matéria de tecnologia (ex: Algoritmos, Lógica, Robótica, Pensamento Computacional)
- **Turma/Ano**: Ano escolar (1º ao 9º ano do Ensino Fundamental)
- **Planejamento**: Documento mestre gerado pela IA contendo:
  - Nome da disciplina
  - Turma alvo
  - Total de pontos (padrão: 300)
  - Número de semanas (padrão: 30)
  - Lista de "bloquinhos" (divisões semanais)
- **Bloquinho**: Divisão semanal do planejamento com título + texto base
- **Bloco**: Unidade instrucional completa que contém:
  - Título (do bloquinho)
  - Texto base (do bloquinho)
  - Mídia (vídeo, animação, jogo, HTML, link)
  - Quiz associado (10 pontos)
- **Quiz**: Avaliação com perguntas e pontuação (padrão: 10 pontos por quiz)
- **Aula**: Container que agrupa múltiplos blocos
  - Tem código único (ex: ALG1-1, ALG1-2)
  - Pode ter blocos de diferentes disciplinas
  - Blocos têm ordem/posição definida
- **Tenant/Escola**: Cliente MKTECH que recebe acesso ao conteúdo
- **Ativação de Turma**: Processo de liberar aulas específicas para um tenant

---

## 4. Estrutura de Dados (Conceitual)

### Entidades Principais

#### 1. Disciplinas (subjects)
```
- id
- name (ex: "Algoritmos")
- slug (ex: "algoritmos")
- description
- color (para UI)
- created_at
```

#### 2. Turmas/Anos (grades)
```
- id
- name (ex: "1º Ano", "5º Ano")
- code (ex: "1", "5")
- description
- created_at
```

#### 3. Planejamentos (plans)
```
- id
- subject_id (FK → subjects)
- grade_id (FK → grades)
- title (ex: "Algoritmos - 1º Ano - 2025")
- total_points (ex: 300)
- total_weeks (ex: 30)
- raw_content (texto do planejamento da IA)
- created_by (admin MKTECH)
- created_at
```

#### 4. Bloquinhos/Itens de Planejamento (plan_items)
```
- id
- plan_id (FK → plans)
- week_number (1 a 30)
- title (ex: "Introdução a Algoritmos")
- content (texto base)
- suggested_points (ex: 10)
- created_at
```

#### 5. Blocos (blocks)
```
- id
- plan_item_id (FK → plan_items, nullable)
- subject_id (FK → subjects)
- grade_id (FK → grades)
- title
- content (texto base)
- media_type (video | animation | game | html | link | null)
- media_url
- media_metadata (JSON: duração, dimensões, etc)
- created_at
- updated_at
```

#### 6. Quizzes (quizzes)
```
- id
- block_id (FK → blocks)
- title
- max_points (padrão: 10)
- created_at
```

#### 7. Questões (quiz_questions)
```
- id
- quiz_id (FK → quizzes)
- question_type (single | multiple | truefalse | short)
- question_text
- explanation (feedback)
- position (ordem)
- created_at
```

#### 8. Opções de Resposta (quiz_options)
```
- id
- question_id (FK → quiz_questions)
- option_text
- is_correct (boolean)
- position
```

#### 9. Aulas (lessons)
```
- id
- code (ex: "ALG1-1", "LOG2-5")
- title (ex: "Algoritmos - Aula 1")
- subject_id (FK → subjects, principal)
- grade_id (FK → grades)
- week_number (opcional)
- description
- created_at
- updated_at
```

#### 10. Blocos em Aulas (lesson_blocks)
```
- lesson_id (FK → lessons)
- block_id (FK → blocks)
- position (ordem dentro da aula)
- PRIMARY KEY (lesson_id, block_id)
```

#### 11. Tenants/Escolas (tenants)
```
- id
- name (nome da escola)
- slug
- contact_email
- active (boolean)
- created_at
```

#### 12. Ativação de Turmas (tenant_grade_activations)
```
- id
- tenant_id (FK → tenants)
- grade_id (FK → grades)
- subject_id (FK → subjects, opcional)
- activated_at
- activated_by (admin MKTECH)
- UNIQUE (tenant_id, grade_id, subject_id)
```

### Relacionamentos Chave
```
Planejamento → tem N Bloquinhos
Bloquinho → gera 1 Bloco
Bloco → tem 1 Quiz
Quiz → tem N Questões
Questão → tem N Opções
Aula → tem N Blocos (com ordem)
Tenant → tem N Turmas Ativadas
Turma Ativada → libera Aulas específicas
```

---

## 5. Fluxos Detalhados

### 5.1. Acesso Administrativo

**Objetivo**: Apenas admins MKTECH acessam a Fábrica

**Fluxo**:
1. Landing page tem link discreto "Área Administrativa" (ex: no footer)
2. Redireciona para `/admin/login`
3. Formulário de login:
   - Email
   - Password
   - Validação: usuário deve ter flag `is_mktech_admin = true`
4. Após autenticação, redireciona para `/admin/fabrica`

**Segurança**:
- Supabase Auth com perfil específico
- RLS: apenas `is_mktech_admin = true` acessa tabelas da fábrica
- Sessão separada da área de tenants

---

### 5.2. Planejamento Pedagógico

**Objetivo**: Importar planejamento gerado pela IA e estruturá-lo

#### 5.2.1. Formato do Planejamento (Entrada)

A IA gera um documento estruturado em formato Markdown:
```markdown
# Planejamento: Algoritmos - 1º Ano
## Disciplina: Algoritmos
## Turma: 1º Ano
## Total de Pontos: 300
## Semanas: 30

---

### Semana 1: Introdução a Algoritmos
**Conteúdo:**
Nesta primeira semana, os alunos serão introduzidos ao conceito de algoritmo através de exemplos do cotidiano. Vamos explorar sequências de ações simples como escovar os dentes, fazer um sanduíche, etc.

**Objetivos:**
- Compreender o que é um algoritmo
- Identificar sequências de passos no dia a dia
- Reconhecer a importância da ordem

---

### Semana 2: Sequência e Ordem
**Conteúdo:**
Aprofundamento no conceito de sequência. Atividades práticas de ordenar passos, jogos de seguir instruções, receitas culinárias simples.

**Objetivos:**
- Praticar criação de sequências
- Identificar erros em ordem de passos
- Desenvolver pensamento sequencial

---

[... continua até Semana 30 ...]

### Semana 30: Projeto Final e Revisão
**Conteúdo:**
Revisão geral dos conceitos aprendidos. Projeto final onde alunos criam um algoritmo completo para resolver um problema do cotidiano.

**Objetivos:**
- Consolidar aprendizados
- Aplicar conceitos em projeto prático
- Apresentar soluções
```

#### 5.2.2. Importação do Planejamento

**Tela**: `/admin/fabrica/planejamentos/novo`

**Fluxo**:
1. Admin cola o texto do planejamento gerado pela IA
2. Sistema faz parsing automático identificando:
   - Disciplina
   - Turma
   - Total de Pontos
   - Número de Semanas
   - Cada "Semana N: Título" com seu conteúdo
3. Preview estruturado mostrando:
```
   📚 Algoritmos → 1º Ano → 300 pontos → 30 semanas
   
   ✓ Semana 1: Introdução a Algoritmos
   ✓ Semana 2: Sequência e Ordem
   ✓ Semana 3: ...
   [...]
   ✓ Semana 30: Projeto Final e Revisão
```
4. Admin confirma importação
5. Sistema cria:
   - 1 registro de `plan`
   - 30 registros de `plan_items` (um por semana)

**Validações**:
- ✅ Número de semanas identificado = número declarado
- ✅ Todas as semanas têm título e conteúdo
- ✅ Disciplina e Turma existem no sistema (ou criar automaticamente)
- ✅ Não há semanas duplicadas
- ✅ Total de pontos é divisível pelo número de semanas (ou ajustar)

**Regras de Parsing**:
```
Identificar:
- "## Disciplina: XXXXX" → extrair nome
- "## Turma: XXXXX" → extrair nome
- "## Total de Pontos: NNN" → extrair número
- "## Semanas: NN" → extrair número
- "### Semana N: Título" → início de bloquinho
- Tudo até próxima "### Semana" ou fim → conteúdo do bloquinho
```

**Cálculo Automático**:
```
points_per_quiz = total_points / total_weeks
300 / 30 = 10 pontos por quiz
```

---

### 5.3. Fábrica de Aulas (Materialização)

**Objetivo**: Converter planejamento em blocos e quizzes editáveis

**Tela**: `/admin/fabrica/blocos`

#### 5.3.1. Gerar Blocos em Lote

**Fluxo**:
1. Admin acessa lista de planejamentos importados
2. Seleciona um planejamento (ex: "Algoritmos - 1º Ano")
3. Clica em "Gerar Blocos & Quizzes"
4. Sistema cria automaticamente:
   - **30 Blocos** (1 por plan_item)
     - `title` ← plan_item.title
     - `content` ← plan_item.content
     - `media_type` = null (a ser preenchido)
     - `media_url` = null
   - **30 Quizzes** (1 por bloco)
     - `max_points` = 10
     - Sem perguntas inicialmente (admin adiciona depois)
5. Mensagem de sucesso: "30 blocos e 30 quizzes criados!"

**Resultado**:
- Lista de 30 blocos disponíveis para edição
- Cada bloco tem estrutura básica, faltando apenas mídia e questões

---

#### 5.3.2. Editar Bloco Individual

**Tela**: `/admin/fabrica/blocos/{id}/editar`

**Layout**:
```
┌───────────────────────────────────────────────────────────┐
│ Editar Bloco: "Introdução a Algoritmos"                   │
├───────────────────────────────────────────────────────────┤
│ [Aba: Conteúdo] [Aba: Mídia] [Aba: Quiz]                 │
├───────────────────────────────────────────────────────────┤
│ ABA: CONTEÚDO                                              │
│                                                            │
│ Título: [Introdução a Algoritmos___________________]      │
│                                                            │
│ Conteúdo (Markdown):                                       │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Nesta primeira semana, os alunos serão...          │   │
│ │                                                     │   │
│ │ **Objetivos:**                                      │   │
│ │ - Compreender o que é um algoritmo                 │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ [Salvar Conteúdo]                                         │
└───────────────────────────────────────────────────────────┘
```

**Aba: Mídia**
```
┌───────────────────────────────────────────────────────────┐
│ Tipo de Mídia:                                             │
│ ⚪ Vídeo  ⚪ Animação  ⚪ Jogo  ⚪ HTML  ⚪ Link Externo   │
│                                                            │
│ [Se Vídeo selecionado]                                     │
│ URL do Vídeo: [https://youtube.com/watch?v=...____]       │
│ Ou Upload: [Escolher arquivo MP4]                         │
│                                                            │
│ [Se Jogo selecionado]                                      │
│ URL do Jogo: [https://jogos.mktech.com/algoritmo1___]     │
│ Iframe: [✓] Permitir embed                                │
│                                                            │
│ [Preview da Mídia]                                         │
│ ┌──────────────────────────────────┐                      │
│ │                                   │                      │
│ │      [Player de Vídeo]           │                      │
│ │                                   │                      │
│ └──────────────────────────────────┘                      │
│                                                            │
│ [Salvar Mídia]                                            │
└───────────────────────────────────────────────────────────┘
```

**Aba: Quiz**
```
┌───────────────────────────────────────────────────────────┐
│ Quiz: "Quiz 1 - Introdução a Algoritmos"                  │
│ Pontuação Máxima: [10] pontos                             │
├───────────────────────────────────────────────────────────┤
│ Questões:                                                  │
│                                                            │
│ 1. [≡] Múltipla Escolha (Única)                          │
│    Pergunta: [O que é um algoritmo?______________]        │
│    ⚪ Uma receita de bolo                                 │
│    ⚫ Uma sequência de passos para resolver problema      │
│    ⚪ Um tipo de computador                               │
│    ⚪ Um jogo de videogame                                │
│    [Editar] [Excluir]                                     │
│                                                            │
│ 2. [≡] Verdadeiro ou Falso                                │
│    Pergunta: [Algoritmos só existem em computadores?]     │
│    ⚫ Verdadeiro  ⚪ Falso                                 │
│    Explicação: [Algoritmos existem no cotidiano...]       │
│    [Editar] [Excluir]                                     │
│                                                            │
│ [+ Adicionar Questão]                                     │
│                                                            │
│ [Salvar Quiz]                                             │
└───────────────────────────────────────────────────────────┘
```

**Tipos de Mídia Suportados**:
1. **Vídeo**: 
   - YouTube/Vimeo (URL)
   - Upload de MP4
   - Player integrado
2. **Animação**: 
   - Lottie (JSON)
   - GIF/MP4 animado
3. **Jogo**: 
   - URL externa (iframe)
   - Minijogos hospedados
4. **HTML**: 
   - Conteúdo HTML sanitizado
   - Interações simples
5. **Link Externo**: 
   - Recurso educacional externo
   - Abre em nova aba

**Tipos de Questão**:
1. **Múltipla Escolha (Única)**: 1 resposta correta
2. **Múltipla Escolha (Múltiplas)**: N respostas corretas
3. **Verdadeiro ou Falso**
4. **Resposta Curta**: Dissertativa (correção manual futura)

---

### 5.4. Organização em Aulas

**Objetivo**: Agrupar blocos em aulas com códigos de referência

**Tela**: `/admin/fabrica/aulas`

#### 5.4.1. Lista de Blocos com Atribuição Rápida
```
┌────────────────────────────────────────────────────────────────┐
│ Blocos Disponíveis                                              │
├────────────────────────────────────────────────────────────────┤
│ Filtros: [Disciplina: Algoritmos ▼] [Turma: 1º Ano ▼]         │
│          [🔍 Buscar por título...]                             │
├────────────────────────────────────────────────────────────────┤
│ ☐ Semana 1: Introdução a Algoritmos                           │
│    📚 Algoritmos | 🎓 1º Ano | 📹 Vídeo | ✅ Quiz (10pts)     │
│    Atribuir à aula: [ALG1-1_] [→ Criar/Adicionar]             │
│                                                                 │
│ ☐ Semana 2: Sequência e Ordem                                 │
│    📚 Algoritmos | 🎓 1º Ano | 🎮 Jogo | ✅ Quiz (10pts)      │
│    Atribuir à aula: [ALG1-2_] [→ Criar/Adicionar]             │
│                                                                 │
│ ☐ Semana 3: Condicionais Simples                              │
│    📚 Algoritmos | 🎓 1º Ano | ⚠️ Sem mídia | ✅ Quiz (10pts) │
│    Atribuir à aula: [ALG1-3_] [→ Criar/Adicionar]             │
│                                                                 │
│ [... mais 27 blocos ...]                                       │
│                                                                 │
│ [Ações em Massa ▼]                                             │
└────────────────────────────────────────────────────────────────┘
```

**Funcionalidades**:

1. **Atribuição Individual**:
   - Digite código da aula (ex: ALG1-1)
   - Se aula não existe: cria nova aula
   - Se existe: adiciona bloco na próxima posição

2. **Auto-geração de Código**:
   - Padrão: `{DISC}{ANO}-{NUM}`
   - Algoritmos + 1º Ano = ALG1-
   - Sistema sugere próximo número disponível

3. **Indicadores Visuais**:
   - ✅ Bloco completo (tem mídia + quiz)
   - ⚠️ Falta mídia
   - ❌ Falta quiz
   - 📌 Já atribuído a aula (mostra código)

4. **Ações em Massa**:
   - Selecionar múltiplos blocos
   - Atribuir sequencialmente (ALG1-1, ALG1-2, ALG1-3...)

---

#### 5.4.2. Editar Aula

**Tela**: `/admin/fabrica/aulas/{code}/editar`
```
┌────────────────────────────────────────────────────────────┐
│ Aula: ALG1-1 - Algoritmos - Aula 1                         │
├────────────────────────────────────────────────────────────┤
│ Código: [ALG1-1___]  Semana: [1__]                        │
│ Título: [Introdução a Algoritmos________________]          │
│ Disciplina: Algoritmos | Turma: 1º Ano                     │
├────────────────────────────────────────────────────────────┤
│ Blocos da Aula (Arraste para Reordenar)                    │
│                                                             │
│ 1. [≡≡] Introdução a Algoritmos                            │
│         📹 Vídeo (5min) | ✅ Quiz (10pts)                  │
│         [👁️ Preview] [✏️ Editar] [🗑️ Remover]              │
│                                                             │
│ 2. [≡≡] História da Computação                             │
│         📄 Texto | ✅ Quiz (10pts)                         │
│         [👁️ Preview] [✏️ Editar] [🗑️ Remover]              │
│                                                             │
│ 3. [≡≡] Atividade Prática                                  │
│         🎮 Jogo | ✅ Quiz (10pts)                          │
│         [👁️ Preview] [✏️ Editar] [🗑️ Remover]              │
│                                                             │
│ [+ Adicionar Bloco Existente]                              │
│                                                             │
│ Total de Pontos: 30 pontos                                 │
│ Duração Estimada: ~25 minutos                              │
│                                                             │
│ [Salvar Alterações] [Preview da Aula]                      │
└────────────────────────────────────────────────────────────┘
```

**Funcionalidades**:

1. **Drag & Drop**: Reordenar blocos arrastando
2. **Adicionar Bloco**: Buscar blocos disponíveis e adicionar
3. **Remover**: Remove da aula (não exclui bloco)
4. **Editar**: Abre edição do bloco em modal/nova aba
5. **Preview**: Visualiza aula como aluno veria
6. **Cálculos Automáticos**:
   - Total de pontos = soma dos quizzes
   - Duração = soma das durações das mídias

---

### 5.5. Gerenciamento de Tenants e Ativação

**Objetivo**: Controlar quais aulas ficam visíveis para cada escola

**Tela**: `/admin/tenants`

#### 5.5.1. Cadastrar Tenant
```
┌─────────────────────────────────────────────────────────┐
│ Cadastrar Nova Escola                                    │
├─────────────────────────────────────────────────────────┤
│ Nome da Escola: [Colégio Exemplo______________]         │
│ Slug: [colegio-exemplo] (gerado automaticamente)        │
│ Email de Contato: [contato@colegio.com.br___]          │
│                                                          │
│ [Cadastrar Escola]                                      │
└─────────────────────────────────────────────────────────┘
```

#### 5.5.2. Ativar Turmas para Tenant
```
┌──────────────────────────────────────────────────────────────┐
│ Colégio Exemplo - Ativar Turmas                              │
├──────────────────────────────────────────────────────────────┤
│ Selecione as turmas que esta escola terá acesso:            │
│                                                               │
│ Algoritmos:                                                   │
│ ☑️ 1º Ano (30 aulas disponíveis)                             │
│ ☑️ 2º Ano (30 aulas disponíveis)                             │
│ ☐ 3º Ano (0 aulas - não criadas ainda)                      │
│ ☐ 4º Ano                                                     │
│ ☐ 5º Ano                                                     │
│                                                               │
│ Lógica:                                                       │
│ ☐ 1º Ano                                                     │
│ ☑️ 2º Ano (25 aulas disponíveis)                             │
│                                                               │
│ Robótica:                                                     │
│ ☐ 3º Ano                                                     │
│ ☐ 4º Ano                                                     │
│                                                               │
│ [Salvar Ativações]                                           │
│                                                               │
│ ℹ️ Apenas aulas das turmas marcadas ficarão visíveis        │
│    para professores e alunos desta escola.                   │
└──────────────────────────────────────────────────────────────┘
```

**Lógica de Ativação**:
```sql
-- Quando admin ativa "Algoritmos - 1º Ano" para Tenant X
INSERT INTO tenant_grade_activations (tenant_id, grade_id, subject_id)
VALUES ('tenant-x-id', '1ano-id', 'algoritmos-id');

-- Tenant X agora vê:
SELECT lessons.*
FROM lessons
WHERE grade_id = '1ano-id'
  AND subject_id = 'algoritmos-id'
  AND EXISTS (
    SELECT 1 FROM tenant_grade_activations
    WHERE tenant_id = 'tenant-x-id'
      AND grade_id = lessons.grade_id
      AND subject_id = lessons.subject_id
  );
```

**Resultado**:
- Tenant X vê apenas aulas ALG1-1 até ALG1-30
- Outros tenants não veem essas aulas (a menos que também ativem)
- Admin MKTECH vê tudo sempre

---

## 6. Convenção de Códigos de Aulas

### Formato Padrão