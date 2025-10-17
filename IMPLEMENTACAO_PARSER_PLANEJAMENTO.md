# Implementação Completa: Parser de Planejamento e CRUD

## 📋 Resumo

Implementamos um sistema completo de importação automática de planejamentos a partir de documentos Markdown estruturados, com as seguintes funcionalidades:

## ✅ Funcionalidades Implementadas

### 1. **Parser de Documentos Markdown**
📁 `src/lib/admin/planejamento-parser.ts`

**O que faz:**
- Extrai metadados do cabeçalho (título, disciplina, turma, código base, pontos, etc.)
- Parseia blocos individuais usando regex para detectar `## Bloco X —`
- Extrai conteúdo de cada bloco (seção `### 📚 Conteúdo:`)
- Extrai quizzes completos (pergunta + opções A/B/C/D + resposta correta)
- Valida estrutura do documento antes de processar

**Exemplo de uso:**
```typescript
const parsed = parsearDocumentoPlanejamento(documentoMD)
// Retorna: { metadados, blocos[] }
```

---

### 2. **Formulário de Importação Aprimorado**
📁 `src/app/admin/blocos/importar/page.tsx`

**Melhorias:**
- ✅ Botão "Parsear Documento" que processa o MD automaticamente
- ✅ Preview dos dados extraídos antes de importar
- ✅ Preenchimento automático dos campos do formulário
- ✅ Detecção automática da disciplina por nome
- ✅ Criação automática de quizzes a partir dos dados parseados
- ✅ Feedback visual com contador de blocos detectados

**Fluxo:**
1. Cole o documento MD no textarea
2. Clique em "Parsear Documento"
3. Visualize os dados extraídos
4. Confirme e importe (cria blocos + quizzes automaticamente)

---

### 3. **Edição de Blocos**

#### 3.1 Modal de Edição Rápida
📁 `src/components/admin/blocos/EditarBlocoModal.tsx`

- Modal overlay para edição rápida
- Campos editáveis: título, conteúdo, pontos, tipo de mídia, URL
- Salva e atualiza sem sair da página

#### 3.2 Página de Edição Completa
📁 `src/app/admin/blocos/[id]/editar/page.tsx`

- Página dedicada para edição detalhada
- Mesmos campos do modal, com mais espaço
- Breadcrumb para navegação

#### 3.3 Lista de Blocos Atualizada
📁 `src/components/admin/blocos/BlocosGroupedList.tsx`

- Botão "Editar" abre modal em overlay
- Links para criar mídia e quiz
- Agrupamento por disciplina e turma

---

### 4. **CRUD Completo de Disciplinas**

#### 4.1 Listagem
📁 `src/app/admin/disciplinas/page.tsx`

- Grid de cards com disciplinas
- Ícone, nome, código, cor
- Status (ativa/inativa)
- Botão para criar nova

#### 4.2 Criar Disciplina
📁 `src/app/admin/disciplinas/nova/page.tsx`

- Campos: código, nome, descrição, ícone (emoji), cor (HEX + color picker)
- Checkbox para ativar/desativar
- Validação de campos obrigatórios

#### 4.3 Editar Disciplina
📁 `src/app/admin/disciplinas/[id]/editar/page.tsx`

- Mesmos campos da criação
- Carrega dados existentes
- Atualiza no banco ao salvar

---

### 5. **RPC Function para Quizzes**
📁 `supabase/migrations/RPC_INSERT_QUIZZES.sql`

**O que faz:**
- Cria tabelas `quizzes` e `quiz_questions` (se não existirem)
- Função `insert_quiz_with_questions`: cria 1 quiz + 1 pergunta
- Função `insert_quizzes_batch`: cria múltiplos quizzes de uma vez
- Atualiza `blocos_templates.quiz_id` automaticamente
- Atualiza status do bloco para `com_quiz` ou `completo`

**Uso:**
```sql
SELECT insert_quiz_with_questions(
  bloco_id, 
  'Quiz - Título', 
  'Pergunta?', 
  '["A", "B", "C", "D"]'::JSONB, 
  2,  -- índice correto (C = 2)
  10  -- pontos
);
```

---

## 🗂️ Estrutura do Documento Markdown Esperado

```markdown
# Planejamento MKSMART — Nome da Disciplina
**Título do Planejamento:** Raciocínio Lógico 1º ano
**Disciplina:** Raciocínio Lógico
**Turma:** EF1 
**Código Base:** ALG-1
**Total de Blocos:** 30  
**Pontos Totais:** 300 
**Pontos por Quiz:** 10 
**Objetivo Geral:** Desenvolver o pensamento lógico...

---

## Bloco 1 — O Despertar do Pensamento!
### 📚 Conteúdo:
Você sabia que o raciocínio lógico é como um superpoder do cérebro?...

### 🎯 Quiz:
**Pergunta:** O que é usar o raciocínio lógico?  
A) Adivinhar sem pensar.  
B) Resolver problemas seguindo pistas e passos.  
C) Copiar as respostas dos colegas.  
D) Fechar os olhos e escolher uma resposta.  
✅ **Resposta correta:** B  

---

## Bloco 2 — A Missão do Detetive da Lógica
### 📚 Conteúdo:
...
```

---

## 🔧 Configuração Necessária no Supabase

### Execute as seguintes migrations (na ordem):

1. ✅ **Já executado:** `20241017_admin_extensions.sql` - Cria tabelas disciplinas, planejamentos, blocos_templates
2. ✅ **Já executado:** `20241017_rls_disciplinas.sql` - Configura RLS
3. ✅ **Já executado:** `RPC_BYPASS_RLS_DISCIPLINAS.sql` - Funções RPC para bypass RLS
4. ⚠️ **NOVO - PRECISA EXECUTAR:** `RPC_INSERT_QUIZZES.sql` - Funções para criação de quizzes

### Como executar:

```bash
# No Supabase Dashboard > SQL Editor, execute:
supabase/migrations/RPC_INSERT_QUIZZES.sql
```

Ou se estiver usando CLI local:
```bash
supabase db push
```

---

## 🚀 Como Usar

### Importar um Planejamento Completo:

1. Acesse `/admin/blocos/importar`
2. Cole o documento markdown no textarea
3. Clique em "Parsear Documento"
4. Verifique os dados extraídos no preview azul
5. Ajuste campos se necessário (disciplina, turma, etc.)
6. Clique em "Importar e Gerar Blocos"
7. ✅ Blocos criados automaticamente
8. ✅ Quizzes criados automaticamente para blocos que têm quiz

### Editar um Bloco:

**Opção 1 - Modal Rápido:**
1. Acesse `/admin/blocos`
2. Clique no ícone de lápis (Edit) na linha do bloco
3. Modal abre, edite e salve

**Opção 2 - Página Completa:**
1. Acesse `/admin/blocos/[id]/editar` diretamente
2. Edite e salve

### Gerenciar Disciplinas:

1. Acesse `/admin/disciplinas`
2. Veja todas as disciplinas em grid
3. Clique "+ Nova Disciplina" para criar
4. Clique no ícone de lápis para editar

---

## 📊 Dados que o Sistema Extrai Automaticamente

### Do Cabeçalho:
- Título do planejamento
- Disciplina
- Turma
- Código base
- Total de blocos
- Pontos totais
- Pontos por quiz
- Objetivo geral

### De Cada Bloco:
- Número do bloco
- Título do bloco
- Conteúdo completo
- Quiz (se houver):
  - Pergunta
  - Opções (A, B, C, D, etc.)
  - Resposta correta (letra)
  - Índice da resposta correta (número)

---

## 🎯 Próximos Passos (Futuro)

- [ ] Importar múltiplas perguntas por quiz (atualmente 1 pergunta por bloco)
- [ ] Suporte a diferentes tipos de quiz (verdadeiro/falso, múltipla escolha, etc.)
- [ ] Upload de arquivo .md ao invés de colar texto
- [ ] Preview dos blocos antes de importar (com scroll)
- [ ] Edição de quizzes via interface
- [ ] IA para gerar conteúdo de mídia automaticamente

---

## ⚠️ Observações Importantes

1. **Mídia ainda é manual:** Após importar, você precisa adicionar mídia manualmente clicando em "Mídia" em cada bloco
2. **RLS precisa estar configurado:** Execute todas as migrations listadas acima
3. **Disciplina precisa existir:** Crie a disciplina antes de importar, ou o parser não vai encontrá-la
4. **Formato rigoroso:** O documento MD precisa seguir exatamente o formato especificado

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
- `src/lib/admin/planejamento-parser.ts` - Parser principal
- `src/components/admin/blocos/EditarBlocoModal.tsx` - Modal de edição
- `src/app/admin/blocos/[id]/editar/page.tsx` - Página de edição
- `src/app/admin/disciplinas/page.tsx` - Listagem disciplinas
- `src/app/admin/disciplinas/nova/page.tsx` - Criar disciplina
- `src/app/admin/disciplinas/[id]/editar/page.tsx` - Editar disciplina
- `supabase/migrations/RPC_INSERT_QUIZZES.sql` - SQL para quizzes

### Modificados:
- `src/app/admin/blocos/importar/page.tsx` - Integração com parser
- `src/components/admin/blocos/BlocosGroupedList.tsx` - Botão editar com modal

---

## 🎉 Conclusão

O sistema agora permite:
✅ Importação automática de planejamentos MD
✅ Criação automática de blocos
✅ Criação automática de quizzes
✅ Edição fácil de blocos (modal + página)
✅ CRUD completo de disciplinas
✅ Validação de estrutura de documentos
✅ Preview antes de importar

**Próximo passo:** Execute a migration `RPC_INSERT_QUIZZES.sql` no Supabase!

