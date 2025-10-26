# 🎯 Plano de Integração do QuizAnimado

## ✅ O Que Já Entendi

### **1. Arquitetura Atual**

```
Planejamento (MD)
      ↓
Parser (planejamento-parser.ts)
      ↓
blocos_templates (todos os blocos criados)
      ↓
aulas (agrupa blocos em aulas)
      ↓
aulas_blocos (relação many-to-many com ordem)
      ↓
sessions (professor inicia sessão com uma aula)
      ↓
participacoes_sessao (alunos entram na sessão)
      ↓
progresso_blocos + respostas_quizzes (log de atividades)
```

### **2. Tabelas Críticas**

- `blocos_templates`: Onde TODOS os blocos são criados
- `quizzes`: Armazena quizzes (pode ter inconsistência bloco_id vs bloco_template_id)
- `blocos_templates.quiz_id`: Aponta para o quiz do bloco (se houver)
- `aulas_blocos`: Liga aulas com blocos_templates em uma ordem específica

### **3. QuizAnimado Já Criado**

- ✅ Componente completo (`src/components/gamification/QuizAnimado.tsx`)
- ✅ Usa EXATAMENTE a estrutura do banco (JSONB perguntas)
- ✅ Timer, tentativas, cálculo de pontos, animações, sons
- ✅ Callbacks para salvar respostas e navegar

---

## 🚨 PROBLEMA POTENCIAL IDENTIFICADO

### **Inconsistência no nome da coluna de relação**

**Migrations antigas**:
```sql
CREATE TABLE quizzes (
  bloco_id UUID  -- ❌ ERRADO! Tabela "blocos" não existe mais
)
```

**Migrations recentes**:
```sql
CREATE TABLE quizzes (
  bloco_template_id UUID  -- ✅ CORRETO!
)
```

---

## 📋 PLANO DE EXECUÇÃO

### **FASE 1: DIAGNÓSTICO** (5-10 min)

✅ **Criado**: `supabase/migrations/DIAGNOSTICO_QUIZZES_STRUCTURE.sql`

**Você precisa executar este script no Supabase para verificar**:
1. Nome correto da coluna de relação (`bloco_id` ou `bloco_template_id`)
2. Se `blocos_templates.quiz_id` está populado
3. Se RPC `get_blocos_sessao` retorna `quiz_id`
4. Exemplos de dados em `quizzes.perguntas` (JSONB)

**Como executar**:
```sql
-- Copie todo o conteúdo de DIAGNOSTICO_QUIZZES_STRUCTURE.sql
-- Cole no SQL Editor do Supabase
-- Execute
-- Copie os resultados e me envie
```

---

### **FASE 2: CORREÇÃO (Se necessário)** (10-15 min)

**Cenário A**: Se o diagnóstico mostrar `bloco_id` (ERRADO)

Vou criar: `supabase/migrations/FIX_QUIZZES_COLUMN_NAME.sql`

```sql
-- Renomear coluna
ALTER TABLE quizzes RENAME COLUMN bloco_id TO bloco_template_id;

-- Atualizar foreign key
ALTER TABLE quizzes DROP CONSTRAINT quizzes_bloco_id_fkey;
ALTER TABLE quizzes ADD CONSTRAINT quizzes_bloco_template_id_fkey
  FOREIGN KEY (bloco_template_id) REFERENCES blocos_templates(id) ON DELETE CASCADE;
```

**Cenário B**: Se já usar `bloco_template_id` (CORRETO)

✅ Pular para Fase 3!

---

### **FASE 3: INTEGRAÇÃO NO PLAYER** (30-45 min)

**Arquivo**: `src/app/sessao/[sessionId]/page.tsx`

#### **Modificações**:

1. **Importar QuizAnimado e FloatingPoints**
```typescript
import { QuizAnimado, FloatingPoints } from '@/components/gamification'
import { useSound } from '@/hooks/useSound'
```

2. **Adicionar estados**
```typescript
const { playSound } = useSound()
const [floatingPoints, setFloatingPoints] = useState({
  show: false,
  points: 0,
  position: { x: 0, y: 0 }
})
```

3. **Substituir renderização do quiz**
```typescript
{blocoAtual?.quiz_id && quizAtivo && (
  <QuizAnimado
    quiz={{
      id: blocoAtual.quizzes.id,
      titulo: blocoAtual.quizzes.titulo,
      tipo: blocoAtual.quizzes.tipo,
      perguntas: blocoAtual.quizzes.perguntas
    }}
    tentativasPermitidas={2}
    tempoLimiteSeg={300}
    onResposta={handleRespostaQuiz}
    onQuizCompleto={() => {
      setQuizzesCompletados(prev => new Set(prev).add(blocoAtual.quizzes.id))
      setTimeout(() => handleCompletarBloco(), 1500)
    }}
  />
)}
```

4. **Implementar `handleRespostaQuiz`**
```typescript
const handleRespostaQuiz = async (params: {
  perguntaIndex: number
  respostaSelecionada: number
  correto: boolean
  pontosGanhos: number
  tentativaAtual: number
}) => {
  const { correto, pontosGanhos } = params

  // Mostrar pontos flutuantes
  if (correto) {
    setFloatingPoints({
      show: true,
      points: pontosGanhos,
      position: { x: window.innerWidth / 2, y: window.innerHeight / 3 }
    })
  }

  // Registrar no banco
  const { error } = await supabase.rpc('registrar_resposta_quiz', {
    p_quiz_id: blocoAtual.quizzes.id,
    p_aluno_id: studentSession.alunoId,
    p_session_id: sessionId,
    p_participacao_id: participacaoId,
    p_pergunta_index: params.perguntaIndex,
    p_resposta_escolhida: params.respostaSelecionada,
    p_correto: params.correto,
    p_pontos_ganhos: params.pontosGanhos,
    p_tentativa_numero: params.tentativaAtual
  })

  if (error) {
    console.error('Erro ao registrar resposta:', error)
    toast.error('Erro ao salvar resposta')
  }
}
```

5. **Adicionar FloatingPoints ao JSX**
```typescript
{floatingPoints.show && (
  <FloatingPoints
    points={floatingPoints.points}
    position={floatingPoints.position}
    onComplete={() => setFloatingPoints(prev => ({ ...prev, show: false }))}
  />
)}
```

---

### **FASE 4: TESTES** (20-30 min)

#### **Checklist de Testes**:

- [ ] 1. Login como professor
- [ ] 2. Criar/importar planejamento com quizzes
- [ ] 3. Criar aula com blocos que têm quizzes
- [ ] 4. Iniciar sessão
- [ ] 5. Login como aluno
- [ ] 6. Entrar na sessão
- [ ] 7. Assistir bloco de conteúdo
- [ ] 8. Responder quiz:
  - [ ] Ver animações de transição
  - [ ] Ver timer funcionando
  - [ ] Ver mudança de cor do timer
  - [ ] Responder errado → ver feedback vermelho
  - [ ] Responder certo → ver feedback verde + pontos flutuantes
  - [ ] Ver som de acerto/erro
- [ ] 9. Completar quiz
- [ ] 10. Ver dados salvos no banco (`respostas_quizzes`)
- [ ] 11. Ver progresso atualizado (`participacoes_sessao`)

---

## ⚠️ CUIDADOS

### **O Que NÃO Fazer**:

- ❌ NÃO deletar dados existentes
- ❌ NÃO modificar tabela `blocos_templates` (já está correta)
- ❌ NÃO alterar RPC de importação de planejamento
- ❌ NÃO quebrar o player existente

### **O Que Fazer**:

- ✅ Executar diagnóstico primeiro
- ✅ Criar migration de correção SE necessário
- ✅ Testar em dev antes de produção
- ✅ Manter compatibilidade com código existente
- ✅ Adicionar logs de debug

---

## 📁 Arquivos que Vamos Modificar

### **Novos** (Criados):
- ✅ `docs/ANALISE_ESTRUTURA_BANCO_QUIZZES.md`
- ✅ `supabase/migrations/DIAGNOSTICO_QUIZZES_STRUCTURE.sql`
- ⏳ `supabase/migrations/FIX_QUIZZES_COLUMN_NAME.sql` (se necessário)
- ✅ `docs/PLANO_INTEGRACAO_QUIZ_ANIMADO.md` (este arquivo)

### **Modificados**:
- ⏳ `src/app/sessao/[sessionId]/page.tsx` (integração QuizAnimado)

### **Já Existem** (Não vamos tocar):
- ✅ `src/components/gamification/QuizAnimado.tsx`
- ✅ `src/components/gamification/FloatingPoints.tsx`
- ✅ `src/hooks/useSound.ts`
- ✅ `src/lib/gamification/soundManager.ts`
- ✅ `src/lib/admin/planejamento-parser.ts`
- ✅ `src/app/admin/blocos/importar/page.tsx`

---

## 🚦 PRÓXIMO PASSO

### **AGUARDANDO SUA APROVAÇÃO**:

**Opção 1**: Você executa o diagnóstico

```
1. Abra Supabase Dashboard
2. Vá em SQL Editor
3. Cole o conteúdo de: supabase/migrations/DIAGNOSTICO_QUIZZES_STRUCTURE.sql
4. Execute
5. Copie os resultados e me envie
```

**Opção 2**: Eu continuo implementando

```
1. Assumo que a estrutura está correta
2. Crio migration de correção (preventiva)
3. Integro QuizAnimado no player
4. Você testa
```

---

## 📊 Tempo Estimado Total

- ⏱️ Diagnóstico: 5-10 min
- ⏱️ Correção (se necessário): 10-15 min
- ⏱️ Integração: 30-45 min
- ⏱️ Testes: 20-30 min

**Total**: 1h - 1h40min

---

## ✅ O Que Você Precisa Me Dizer

1. **Executou o diagnóstico?** Se sim, cole os resultados aqui.
2. **Quer que eu continue direto?** Vou assumir estrutura correta e implementar.
3. **Tem alguma dúvida sobre o plano?** Posso explicar qualquer parte.

**Aguardando seu feedback para prosseguir!** 🚀


