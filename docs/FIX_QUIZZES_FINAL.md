# 🔧 Correção Final: Sistema de Quizzes

## 🎯 Problema Identificado

A tabela `quizzes` estava configurada com uma **foreign key** para a tabela `blocos` (que armazena instâncias de blocos de alunos), mas deveria referenciar `blocos_templates` (que armazena os templates/modelos de blocos).

**Estrutura atual (ERRADA):**
```
quizzes.bloco_id → blocos.id ❌
```

**Estrutura correta (que vamos aplicar):**
```
quizzes.bloco_id → blocos_templates.id ✅
```

---

## 📋 Scripts SQL para Executar no Supabase

### 1️⃣ **Primeiro: Corrigir a Relação da Tabela**

Execute no SQL Editor do Supabase:

```sql
supabase/migrations/FIX_QUIZZES_TO_BLOCOS_TEMPLATES.sql
```

Este script vai:
- ✅ Remover a foreign key antiga
- ✅ Criar nova foreign key para `blocos_templates`
- ✅ Desabilitar RLS
- ✅ Conceder permissões

### 2️⃣ **Segundo: Atualizar as Funções RPC**

Execute no SQL Editor do Supabase:

```sql
supabase/migrations/FINAL_FIX_QUIZ_RPC.sql
```

Este script vai:
- ✅ Recriar funções RPC com logs detalhados
- ✅ Garantir permissões corretas
- ✅ Preparar sistema para criar quizzes

### 3️⃣ **Terceiro: Verificar o Setup**

Execute para confirmar que tudo está OK:

```sql
supabase/migrations/VERIFY_QUIZ_SETUP.sql
```

---

## 🧪 Como Testar

### ✅ **Teste 1: Criação Manual de Quiz**

1. Acesse: `http://localhost:3001/admin/blocos`
2. Clique no botão **"Quiz"** em qualquer bloco
3. Preencha o formulário:
   - Título do Quiz
   - Pergunta
   - 4 opções de resposta
   - Marque a resposta correta
4. Clique em **"Salvar Quiz"**
5. ✅ Verifique se aparece mensagem de sucesso
6. ✅ Volte para a lista de blocos e veja se aparece o badge "Quiz"

### ✅ **Teste 2: Importação Automática**

1. Acesse: `http://localhost:3001/admin/blocos/importar`
2. Cole o conteúdo do arquivo: `src/planejamentos/Planejamento_MKSMART_Raciocinio_Logico_1ano_COMPLETO.md`
3. Clique em **"Parsear Documento"**
4. Verifique a pré-visualização
5. Clique em **"Importar Planejamento"**
6. ✅ Abra o Console do navegador (F12) e verifique os logs detalhados
7. ✅ Verifique se todos os blocos E quizzes foram criados

---

## 🔍 Logs Esperados no Console

### Quando tudo funciona:

```
📊 Parsed Data: {totalBlocos: 30, primeiroBloco: {...}}
🎯 Encontrados 30 blocos com quiz
📊 Blocos criados no DB: [{id: "...", codigo_bloco: "ALG-1-1"}, ...]
🔍 Procurando bloco com código: ALG-1-1
✅ Bloco ALG-1-1 encontrado: {id: "...", quiz: {...}}
🎯 Inserindo 30 quizzes...
✅ Quizzes criados com sucesso: {inserted_count: 30, error_count: 0}
```

### Se houver erro:

Os logs vão mostrar exatamente onde falhou:
- ❌ parsedData não disponível
- ❌ Bloco X não encontrado no DB
- ❌ Erro ao criar quiz: [mensagem detalhada]

---

## 📊 Verificar Resultados no Supabase

Execute esta query no SQL Editor:

```sql
-- Ver blocos com quizzes
SELECT 
  bt.codigo_bloco,
  bt.titulo,
  bt.status,
  bt.quiz_id,
  q.titulo as quiz_titulo,
  jsonb_array_length(q.perguntas) as num_perguntas
FROM blocos_templates bt
LEFT JOIN quizzes q ON q.id = bt.quiz_id
WHERE bt.codigo_bloco LIKE 'ALG-%'
ORDER BY bt.codigo_bloco;
```

**Resultado esperado:**
- Todos os blocos devem ter um `quiz_id`
- Coluna `quiz_titulo` deve estar preenchida
- `num_perguntas` deve ser >= 1

---

## 🚨 Troubleshooting

### Erro: "foreign key constraint"

**Solução:** Execute novamente o script `FIX_QUIZZES_TO_BLOCOS_TEMPLATES.sql`

### Erro: "function does not exist"

**Solução:** Execute novamente o script `FINAL_FIX_QUIZ_RPC.sql`

### Quizzes não são criados automaticamente

1. Abra o Console do navegador (F12)
2. Veja os logs detalhados
3. Copie a mensagem de erro e compartilhe

### Criação manual não funciona

1. Abra o Console do navegador (F12)
2. Veja o erro detalhado
3. Verifique se executou o script `FIX_QUIZZES_TO_BLOCOS_TEMPLATES.sql`

---

## ✅ Checklist de Verificação

- [ ] Executei `FIX_QUIZZES_TO_BLOCOS_TEMPLATES.sql`
- [ ] Executei `FINAL_FIX_QUIZ_RPC.sql`
- [ ] Executei `VERIFY_QUIZ_SETUP.sql`
- [ ] Testei criação manual de quiz
- [ ] Testei importação automática
- [ ] Verifiquei os dados no Supabase
- [ ] Todos os blocos têm `quiz_id` preenchido

---

## 📝 Alterações no Código

### Arquivos Modificados:

1. **`src/app/admin/blocos/importar/page.tsx`**
   - ✅ Adicionados logs detalhados
   - ✅ Melhor tratamento de erros

2. **`src/app/admin/quizzes/criar/page.tsx`**
   - ✅ Criada página de criação manual
   - ✅ Adicionados logs detalhados
   - ✅ Melhor tratamento de erros

3. **`src/components/admin/blocos/BlocosGroupedList.tsx`**
   - ✅ Adicionado botão "Quiz" em cada bloco
   - ✅ Ordenação correta por `codigo_bloco`

### Arquivos SQL Criados:

- `FIX_QUIZZES_TO_BLOCOS_TEMPLATES.sql` → Corrige foreign key
- `FINAL_FIX_QUIZ_RPC.sql` → Atualiza funções RPC
- `VERIFY_QUIZ_SETUP.sql` → Verifica configuração
- `CHECK_QUIZ_TABLE_RELATIONS.sql` → Debug de relações

---

## 🎉 Próximos Passos Após Correção

1. ✅ Testar fluxo completo de importação
2. ✅ Testar criação manual de quizzes
3. ✅ Implementar edição de quizzes
4. ✅ Implementar exclusão de quizzes
5. 🔜 Implementar visualização de quizzes para alunos
6. 🔜 Implementar sistema de pontuação

---

**Última atualização:** 2025-01-17

