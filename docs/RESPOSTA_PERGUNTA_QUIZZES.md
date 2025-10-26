# ✅ Resposta: Quizzes Baseados no Planejamento

## 🎯 Sua Pergunta

> "Quando planejamos as aulas, criamos os blocos com quizzes e também a pontuação prevista. Isso tudo está sendo considerado para criar os quizzes baseado no planejamento?"

## 💡 Resposta Curta

**SIM!** O componente `QuizAnimado` usa **EXATAMENTE** os dados do banco sem nenhuma conversão ou adaptação!

---

## 📊 Como Funciona

### **1. Estrutura no Banco de Dados**

Quando você cria uma aula no admin, os dados são salvos assim:

```sql
-- Tabela: blocos
CREATE TABLE blocos (
  id UUID,
  aula_id UUID,
  titulo VARCHAR(255),
  tipo VARCHAR(50),           -- 'video', 'apresentacao', 'animacao_lottie'
  duracao_minutos INTEGER,
  pontos_por_bloco INTEGER,   -- ⬅️ Pontos do BLOCO
  quiz_id UUID                 -- ⬅️ Referência ao quiz (se houver)
);

-- Tabela: quizzes
CREATE TABLE quizzes (
  id UUID,
  bloco_id UUID,
  titulo VARCHAR(255),
  tipo VARCHAR(50),                    -- 'mcq', 'verdadeiro_falso'
  perguntas JSONB,                     -- ⬅️ ARRAY DE PERGUNTAS
  tentativas_permitidas INTEGER,       -- ⬅️ Padrão: 2
  tempo_limite_seg INTEGER,            -- ⬅️ Padrão: 300 (5 min)
  pontos_max INTEGER                   -- ⬅️ Pontos TOTAIS do quiz
);
```

### **2. Estrutura JSONB `perguntas`**

O campo `perguntas` (JSONB) contém um **array de objetos**:

```json
{
  "perguntas": [
    {
      "id": "q1",
      "prompt": "Qual linguagem é usada para web?",
      "choices": ["Python", "HTML", "Java", "C++"],
      "correctIndex": 1,
      "pontos": 10    ⬅️ PONTOS DESTA PERGUNTA
    },
    {
      "id": "q2",
      "prompt": "O que significa CSS?",
      "choices": [
        "Computer Style Sheets",
        "Cascading Style Sheets",
        "Creative Style System",
        "Colorful Style Syntax"
      ],
      "correctIndex": 1,
      "pontos": 15    ⬅️ PONTOS DESTA PERGUNTA
    }
  ]
}
```

### **3. Como o QuizAnimado Usa**

```tsx
// O componente recebe exatamente esta estrutura:
<QuizAnimado
  quiz={{
    id: blocoAtual.quizzes.id,           // ⬅️ Do banco
    titulo: blocoAtual.quizzes.titulo,    // ⬅️ Do banco
    tipo: blocoAtual.quizzes.tipo,        // ⬅️ Do banco
    perguntas: blocoAtual.quizzes.perguntas  // ⬅️ Do banco (JSONB)
  }}
  tentativasPermitidas={blocoAtual.quizzes.tentativas_permitidas}  // ⬅️ Do banco
  tempoLimiteSeg={blocoAtual.quizzes.tempo_limite_seg}            // ⬅️ Do banco
  onResposta={handleResposta}
  onQuizCompleto={handleQuizCompleto}
/>
```

**Sem conversões. Sem adaptações. Direto do banco!** ✅

---

## 💰 Cálculo de Pontos

### **Sistema de Pontuação**

O QuizAnimado calcula pontos automaticamente baseado em:

1. **Pontos da pergunta** (`pergunta.pontos`)
2. **Tentativa atual** (1ª, 2ª, 3ª...)

```typescript
// Lógica interna do QuizAnimado
let pontosGanhos = 0

if (correto) {
  if (tentativaAtual === 1) {
    pontosGanhos = pergunta.pontos         // 100% dos pontos
  } else if (tentativaAtual === 2) {
    pontosGanhos = Math.floor(pergunta.pontos / 2)  // 50% dos pontos
  } else {
    pontosGanhos = 0                        // Sem pontos após 2 erros
  }
}
```

### **Exemplo Prático**

**Pergunta vale 20 pontos**:

| Tentativa | Resultado | Pontos Ganhos |
|-----------|-----------|---------------|
| 1ª        | ✅ Acertou | 20 (100%) |
| 1ª        | ❌ Errou   | 0 |
| 2ª        | ✅ Acertou | 10 (50%) |
| 2ª        | ❌ Errou   | 0 |
| 3ª+       | -          | 0 (sem mais tentativas) |

---

## 🔄 Fluxo Completo

### **1. Admin Cria a Aula**

```
Admin → Criar Aula → Adicionar Blocos
                    ↓
              Bloco 1: Vídeo (15 min, 0 pontos, sem quiz)
              Bloco 2: Quiz  (5 min, 25 pontos, com quiz)
                    ↓
              Criar Quiz → Adicionar Perguntas:
                ├─ Pergunta 1: 10 pontos
                ├─ Pergunta 2: 10 pontos
                └─ Pergunta 3: 5 pontos
                    ↓
              Total: 25 pontos (soma automática)
```

### **2. Dados Salvos no Banco**

```sql
-- blocos
INSERT INTO blocos (titulo, tipo, pontos_por_bloco, quiz_id)
VALUES ('Quiz de HTML', 'quiz', 25, 'quiz-uuid-123');

-- quizzes
INSERT INTO quizzes (bloco_id, titulo, tipo, perguntas, pontos_max)
VALUES (
  'bloco-uuid-456',
  'Quiz de HTML',
  'mcq',
  '[
    {"id":"q1", "prompt":"...", "choices":[...], "correctIndex":1, "pontos":10},
    {"id":"q2", "prompt":"...", "choices":[...], "correctIndex":2, "pontos":10},
    {"id":"q3", "prompt":"...", "choices":[...], "correctIndex":0, "pontos":5}
  ]',
  25
);
```

### **3. Aluno Faz o Quiz**

```
Player carrega quiz → QuizAnimado renderiza
                    ↓
              Pergunta 1: 10 pontos
              Aluno responde (1ª tentativa) → ✅ Correto
              Ganha: 10 pontos (100%)
                    ↓
              Pergunta 2: 10 pontos
              Aluno responde (1ª tentativa) → ❌ Errado
              Aluno responde (2ª tentativa) → ✅ Correto
              Ganha: 5 pontos (50%)
                    ↓
              Pergunta 3: 5 pontos
              Aluno responde (1ª tentativa) → ✅ Correto
              Ganha: 5 pontos (100%)
                    ↓
              Total: 20 / 25 pontos (80%)
```

### **4. Dados Registrados**

```sql
-- respostas_quizzes (tabela de log)
INSERT INTO respostas_quizzes (session_id, aluno_id, quiz_id, pergunta_index, correto, pontos_ganhos, tentativa)
VALUES
  ('session-1', 'aluno-1', 'quiz-123', 0, true, 10, 1),  -- P1: acertou na 1ª
  ('session-1', 'aluno-1', 'quiz-123', 1, false, 0, 1),  -- P2: errou na 1ª
  ('session-1', 'aluno-1', 'quiz-123', 1, true, 5, 2),   -- P2: acertou na 2ª
  ('session-1', 'aluno-1', 'quiz-123', 2, true, 5, 1);   -- P3: acertou na 1ª

-- progresso_blocos (resumo)
UPDATE progresso_blocos
SET 
  status = 'completed',
  pontos_total = 20,
  completado_em = NOW()
WHERE 
  participacao_id = 'part-1' 
  AND bloco_template_id = 'bloco-456';

-- participacoes_sessao (total geral)
UPDATE participacoes_sessao
SET 
  pontos_ganhos_sessao = pontos_ganhos_sessao + 20,
  blocos_completados = blocos_completados + 1,
  bloco_atual_numero = bloco_atual_numero + 1
WHERE id = 'part-1';
```

---

## ✅ Conclusão

### **Tudo Está Conectado!**

```
Admin cria aula
      ↓
Define pontos por pergunta
      ↓
Salva no banco (JSONB)
      ↓
QuizAnimado lê diretamente
      ↓
Calcula pontos automaticamente
      ↓
Registra no banco (log + progresso)
      ↓
Professor vê estatísticas
      ↓
Aluno vê perfil com badges
```

### **Nenhuma Configuração Extra Necessária!**

- ✅ Pontos definidos no admin
- ✅ Lidos automaticamente pelo player
- ✅ Calculados corretamente
- ✅ Salvos no banco
- ✅ Exibidos nas estatísticas

---

## 🎯 Exemplo Real

### **No Admin: Criar Quiz**

```
Título: Quiz de HTML Básico
Tipo: Múltipla Escolha (mcq)
Tentativas Permitidas: 2
Tempo Limite: 5 minutos

Perguntas:
┌──────────────────────────────────────────┐
│ Pergunta 1: O que é HTML?                │
│ Pontos: 10                                │
│ Opções:                                   │
│   A) Uma linguagem de programação        │
│   B) Uma linguagem de marcação ✓         │
│   C) Um banco de dados                    │
│   D) Um framework                         │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Pergunta 2: Qual tag cria um link?       │
│ Pontos: 15                                │
│ Opções:                                   │
│   A) <link>                               │
│   B) <a> ✓                                │
│   C) <url>                                │
│   D) <href>                               │
└──────────────────────────────────────────┘

Total do Quiz: 25 pontos
```

### **No Player: Aluno Responde**

```
╔════════════════════════════════════════╗
║ Pergunta 1 de 2       ⏱️ 04:32        ║
║ ━━━━━━━━━━━━━━━━━━━━━━ 50%           ║
║                                        ║
║ O que é HTML?                          ║
║                                        ║
║ [ ] A) Uma linguagem de programação    ║
║ [✓] B) Uma linguagem de marcação       ║  ← Selecionada
║ [ ] C) Um banco de dados               ║
║ [ ] D) Um framework                    ║
║                                        ║
║ [        RESPONDER        ]            ║
╚════════════════════════════════════════╝

↓ Clica em RESPONDER

╔════════════════════════════════════════╗
║ ✅ Correto! +10 pontos                 ║  ← Feedback
╚════════════════════════════════════════╝

      +10 pts ↗️                           ← FloatingPoints

↓ Próxima pergunta automaticamente
```

---

## 📝 Resumo Final

### ✅ **SIM, tudo está conectado!**

1. **Você cria** os quizzes no admin com pontos por pergunta
2. **O banco salva** exatamente como você definiu
3. **O QuizAnimado lê** direto do banco (sem conversão)
4. **O sistema calcula** pontos baseado nas tentativas
5. **O progresso é salvo** automaticamente
6. **As estatísticas refletem** os dados reais

### 🎯 **Você não precisa fazer nada especial!**

O sistema está **100% integrado** do início ao fim.

Basta:
1. Criar as aulas no admin
2. Definir os pontos de cada pergunta
3. O resto é automático! 🎉

---

**Tem alguma dúvida sobre alguma parte específica?** 🤔

Se quiser, posso mostrar:
- Como criar um quiz de teste no admin
- Como verificar os dados no Supabase
- Como o QuizAnimado processa cada pergunta
- Como os pontos são salvos no banco

É só falar! 🚀

