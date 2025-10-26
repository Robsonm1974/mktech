# 🔍 Análise da Estrutura do Banco - Sistema de Quizzes

## 📊 Estrutura Atual (Baseada nas Imagens)

### **1. Tabela `blocos_templates`**

**Função**: Armazena todos os blocos de conteúdo criados a partir dos planejamentos

```sql
CREATE TABLE blocos_templates (
  id UUID PRIMARY KEY,
  planejamento_id UUID REFERENCES planejamentos(id),
  disciplina_id UUID REFERENCES disciplinas(id),
  codigo_bloco VARCHAR(20) UNIQUE NOT NULL,  -- Ex: "ALG-1-1", "ING-2-3"
  numero_sequencia INTEGER,
  titulo VARCHAR(255) NOT NULL,
  conteudo_texto TEXT,                       -- Conteúdo parseado do planejamento
  tipo_midia VARCHAR(50),                     -- 'video', 'lottie', 'phaser', 'h5p', null
  midia_url VARCHAR(512),
  midia_metadata JSONB,
  quiz_id UUID,                               -- ⬅️ Referência ao quiz (se houver)
  pontos_bloco INTEGER,
  status VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  ano_escolar_id UUID                         -- ⬅️ Adicionado recentemente
)
```

**Observações**:
- ✅ Todos os blocos são criados aqui via importação de planejamento
- ✅ Campo `quiz_id` já existe e aponta para a tabela `quizzes`
- ✅ Campo `ano_escolar_id` foi adicionado para filtrar por ano

---

### **2. Tabela `quizzes`**

**Função**: Armazena os quizzes associados aos blocos

```sql
CREATE TABLE quizzes (
  id UUID PRIMARY KEY,
  bloco_id UUID REFERENCES blocos(id),        -- ⚠️ PROBLEMA: referencia "blocos" errado
  bloco_template_id UUID REFERENCES blocos_templates(id),  -- ✅ CORRETO (em algumas migrations)
  titulo VARCHAR(255),
  tipo VARCHAR(50),                           -- 'mcq', 'verdadeiro_falso'
  perguntas JSONB,                            -- ⬅️ Array de perguntas
  tentativas_permitidas INTEGER DEFAULT 2,
  tempo_limite_seg INTEGER DEFAULT 300,
  pontos_max INTEGER,
  created_at TIMESTAMP
)
```

**Observações**:
- ⚠️ **INCONSISTÊNCIA CRÍTICA**: Algumas migrations usam `bloco_id` (tabela `blocos` que não existe mais)
- ✅ Migrations mais recentes usam `bloco_template_id` (correto!)
- ✅ Campo `perguntas` (JSONB) armazena array de objetos

---

### **3. Tabela `aulas_blocos`** (Junção)

**Função**: Relaciona aulas com blocos_templates em uma ordem específica

```sql
CREATE TABLE aulas_blocos (
  id UUID PRIMARY KEY,
  aula_id UUID REFERENCES aulas(id),
  bloco_template_id UUID REFERENCES blocos_templates(id),  -- ✅ Correto
  ordem_na_aula INTEGER NOT NULL
)
```

**Observações**:
- ✅ Permite que o mesmo bloco seja usado em várias aulas
- ✅ Define a ordem dos blocos em cada aula
- ✅ Relação many-to-many

---

### **4. Tabela `aulas`**

**Função**: Agrupa blocos em aulas completas

```sql
CREATE TABLE aulas (
  id UUID PRIMARY KEY,
  trilha_id UUID,
  titulo VARCHAR(255),
  descricao TEXT,
  ordem INTEGER,
  duracao_minutos INTEGER,
  pontos_totais INTEGER,
  badges_desbloqueaveis JSONB,
  disciplina_id UUID,
  ano_escolar_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

### **5. Tabela `respostas_quizzes`** (Log de respostas)

**Função**: Registra cada resposta do aluno

```sql
CREATE TABLE respostas_quizzes (
  id UUID PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id),
  aluno_id UUID REFERENCES alunos(id),
  session_id UUID REFERENCES sessions(id),
  participacao_id UUID REFERENCES participacoes_sessao(id),
  pergunta_index INTEGER NOT NULL,            -- Índice no array perguntas[]
  resposta_escolhida INTEGER,                 -- Índice da opção escolhida
  correto BOOLEAN,
  pontos_ganhos INTEGER,
  tentativa_numero INTEGER,
  tempo_resposta_seg INTEGER,
  resposta_data JSONB,                        -- Dados adicionais
  created_at TIMESTAMP
)
```

---

## 🔄 Fluxo de Dados

### **1. Importação de Planejamento**

```
Documento MD
     ↓
Parse (planejamento-parser.ts)
     ↓
insert_planejamento_admin()  →  planejamentos
     ↓
insert_blocos_templates_admin()  →  blocos_templates
     ↓
insert_quizzes_admin()  →  quizzes
     ↓
Atualizar blocos_templates.quiz_id
```

### **2. Criação de Aula**

```
Professor seleciona blocos
     ↓
INSERT INTO aulas (titulo, disciplina_id, ano_escolar_id, ...)
     ↓
INSERT INTO aulas_blocos (aula_id, bloco_template_id, ordem_na_aula)
     ↓
Aula pronta para ser iniciada em sessão
```

### **3. Sessão de Aluno**

```
Professor inicia sessão  →  sessions
     ↓
Aluno entra na sessão  →  participacoes_sessao
     ↓
Aluno assiste bloco  →  progresso_blocos
     ↓
Aluno responde quiz  →  respostas_quizzes
     ↓
Sistema calcula pontos  →  participacoes_sessao.pontos_ganhos_sessao
```

---

## ⚠️ PROBLEMA IDENTIFICADO

### **Inconsistência na Tabela `quizzes`**

#### **Migrations Antigas** (ERRADO):
```sql
-- 20241015_complete_schema.sql
-- init_schema.sql
-- recreate_all_tables_no_rls.sql
CREATE TABLE quizzes (
  bloco_id UUID REFERENCES blocos(id)  -- ❌ ERRADO! Tabela "blocos" não existe
)
```

#### **Migrations Recentes** (CORRETO):
```sql
-- RPC_INSERT_QUIZZES.sql
CREATE TABLE quizzes (
  bloco_template_id UUID REFERENCES blocos_templates(id)  -- ✅ CORRETO!
)
```

#### **Problema**:
- A tabela `blocos` foi descontinuada em favor de `blocos_templates`
- Quizzes criados via admin usam `bloco_template_id`
- Mas o player e algumas migrations ainda esperam `bloco_id`

---

## ✅ SOLUÇÃO

### **Opção 1: Migration de Correção (RECOMENDADO)**

```sql
-- 1. Verificar estrutura atual
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'quizzes'
ORDER BY ordinal_position;

-- 2. Se existir bloco_id, renomear para bloco_template_id
ALTER TABLE quizzes
RENAME COLUMN bloco_id TO bloco_template_id;

-- 3. Atualizar foreign key
ALTER TABLE quizzes
DROP CONSTRAINT IF EXISTS quizzes_bloco_id_fkey;

ALTER TABLE quizzes
ADD CONSTRAINT quizzes_bloco_template_id_fkey
FOREIGN KEY (bloco_template_id)
REFERENCES blocos_templates(id)
ON DELETE CASCADE;

-- 4. Atualizar índice
CREATE INDEX IF NOT EXISTS idx_quizzes_bloco_template_id
ON quizzes(bloco_template_id);
```

### **Opção 2: Manter Ambos (Compatibilidade)**

Se houver dados legados que ainda usam `bloco_id`:

```sql
-- Adicionar bloco_template_id sem remover bloco_id
ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS bloco_template_id UUID REFERENCES blocos_templates(id);

-- Migrar dados existentes
UPDATE quizzes
SET bloco_template_id = bloco_id
WHERE bloco_template_id IS NULL AND bloco_id IS NOT NULL;
```

---

## 🎯 COMO O QUIZANIMADO DEVE BUSCAR DADOS

### **Caminho Correto** (Player do Aluno):

```typescript
// src/app/sessao/[sessionId]/page.tsx

// 1. Buscar blocos da sessão
const { data: blocos } = await supabase
  .rpc('get_blocos_sessao', { p_session_id: sessionId })

// Retorna algo como:
[
  {
    id: 'bloco-template-uuid-1',
    codigo_bloco: 'ALG-1-1',
    titulo: 'Introdução a Loops',
    conteudo_texto: '...',
    tipo_midia: 'video',
    midia_url: 'https://...',
    pontos_bloco: 15,
    quiz_id: 'quiz-uuid-1',  // ⬅️ Usar este ID
    ordem: 1
  },
  // ...
]

// 2. Buscar quiz específico
const { data: quiz } = await supabase
  .from('quizzes')
  .select('*')
  .eq('id', blocoAtual.quiz_id)  // ⬅️ Buscar por ID direto
  .single()

// Retorna:
{
  id: 'quiz-uuid-1',
  bloco_template_id: 'bloco-template-uuid-1',  // ⬅️ Campo correto
  titulo: 'Quiz de Loops',
  tipo: 'mcq',
  perguntas: [
    {
      id: 'q1',
      prompt: 'O que é um loop?',
      choices: ['A', 'B', 'C', 'D'],
      correctIndex: 1,
      pontos: 10
    }
  ],
  tentativas_permitidas: 2,
  tempo_limite_seg: 300
}

// 3. Usar no QuizAnimado
<QuizAnimado
  quiz={quiz}
  onResposta={handleResposta}
  onQuizCompleto={handleQuizCompleto}
/>
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### **Antes de Integrar o QuizAnimado**:

- [ ] 1. Verificar estrutura atual da tabela `quizzes` no Supabase
- [ ] 2. Confirmar se usa `bloco_id` ou `bloco_template_id`
- [ ] 3. Se usa `bloco_id`, executar migration de correção
- [ ] 4. Verificar que `blocos_templates.quiz_id` está populado
- [ ] 5. Testar RPC `get_blocos_sessao` e confirmar que retorna `quiz_id`
- [ ] 6. Atualizar player para buscar quiz por `blocos_templates.quiz_id`
- [ ] 7. Integrar `QuizAnimado` no player
- [ ] 8. Testar fluxo completo: importar planejamento → criar aula → iniciar sessão → responder quiz

---

## 🔧 RPCs Necessários

### **RPC: `get_blocos_sessao`** (já existe, verificar)

```sql
CREATE OR REPLACE FUNCTION get_blocos_sessao(p_session_id uuid)
RETURNS TABLE (
  id uuid,
  codigo_bloco varchar,
  titulo varchar,
  conteudo_texto text,
  tipo_midia varchar,
  midia_url varchar,
  pontos_bloco integer,
  quiz_id uuid,  -- ⬅️ CRÍTICO: retornar este campo
  ordem integer
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bt.id,
    bt.codigo_bloco,
    bt.titulo,
    bt.conteudo_texto,
    bt.tipo_midia,
    bt.midia_url,
    bt.pontos_bloco,
    bt.quiz_id,  -- ⬅️ Retornar quiz_id
    ab.ordem_na_aula as ordem
  FROM sessions s
  INNER JOIN aulas a ON a.id = s.aula_id
  INNER JOIN aulas_blocos ab ON ab.aula_id = a.id
  INNER JOIN blocos_templates bt ON bt.id = ab.bloco_template_id
  WHERE s.id = p_session_id
  ORDER BY ab.ordem_na_aula ASC;
END;
$$;
```

---

## 🚨 AVISOS IMPORTANTES

1. **NÃO DELETAR DADOS EXISTENTES**: Verificar antes de qualquer ALTER TABLE
2. **TESTAR EM DEV PRIMEIRO**: Executar migrations no ambiente de desenvolvimento
3. **BACKUP**: Fazer backup antes de modificar estrutura
4. **PLAYER JÁ FUNCIONA**: Não quebrar o que está funcionando
5. **COMPATIBILIDADE**: Garantir que importação de planejamento continue funcionando

---

## ✅ RESUMO PARA IMPLEMENTAÇÃO

### **O Que o QuizAnimado Precisa**:

```typescript
// Interface esperada (já implementada no componente)
interface Quiz {
  id: string
  titulo: string
  tipo: string
  perguntas: Array<{
    id: string
    prompt: string
    choices: string[]
    correctIndex: number
    pontos: number
  }>
}
```

### **Como Buscar**:

```typescript
// 1. Bloco já tem quiz_id
const blocoAtual = blocos[indiceBlocoAtual]

// 2. Buscar quiz
if (blocoAtual.quiz_id) {
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', blocoAtual.quiz_id)
    .single()

  // 3. Usar no QuizAnimado
  if (quiz) {
    return <QuizAnimado quiz={quiz} {...props} />
  }
}
```

### **Não É Necessário**:

- ❌ JOIN complexo entre blocos_templates e quizzes
- ❌ Buscar por `bloco_template_id`
- ❌ Conversão de dados

### **É Necessário**:

- ✅ Garantir que `blocos_templates.quiz_id` está populado
- ✅ Garantir que tabela `quizzes` usa `bloco_template_id` (ou migrar)
- ✅ RPC `get_blocos_sessao` retorna `quiz_id`

---

📅 **Data**: 25 Outubro 2025  
✅ **Status**: Análise completa - Pronto para implementação  
🎯 **Próximo**: Verificar estrutura atual no Supabase e executar correções se necessário


