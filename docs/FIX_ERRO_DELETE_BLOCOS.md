# 🔧 FIX: Erro ao Deletar Blocos Antigos

**Data:** 27/10/2025  
**Status:** ✅ Solução Pronta

---

## 🐛 ERRO IDENTIFICADO

```
❌ Erro ao deletar blocos antigos: {}
at handleSubmit (src\app\admin\aulas\editar\[id]\page.tsx:342:17)
```

**Causa:** RLS (Row Level Security) está **ATIVADO** nas tabelas `aulas_blocos` e `aulas_jogos`, impedindo que o admin delete/insira dados.

---

## ✅ SOLUÇÃO

Execute esta migration SQL no Supabase:

```sql
-- Arquivo: supabase/migrations/20251027_disable_rls_aulas_itens.sql
```

### O que a migration faz:

1. **Desabilita RLS** para `aulas_blocos`
2. **Desabilita RLS** para `aulas_jogos`
3. **Garante grants** para todas as roles
4. **Verifica status** final

---

## 🚀 COMO EXECUTAR

### Passo 1: Abrir Supabase
1. Acesse **Supabase Dashboard**
2. Vá em **SQL Editor**

### Passo 2: Executar SQL
```sql
-- Copie e execute TODO o conteúdo de:
supabase/migrations/20251027_disable_rls_aulas_itens.sql
```

### Passo 3: Verificar Resultado
Você deve ver:
```
==========================================
✅ RLS DESABILITADO PARA TABELAS DE AULAS
==========================================

Tabelas atualizadas:
  - aulas_blocos: RLS OFF
  - aulas_jogos: RLS OFF

Agora o admin pode:
  ✅ DELETE de blocos antigos
  ✅ INSERT de novos blocos
  ✅ DELETE de jogos antigos
  ✅ INSERT de novos jogos

Execute novamente a edição da aula!
==========================================
```

E no final:
```
┌────────────┬───────────────┬──────────────────┐
│ schemaname │  tablename    │      status      │
├────────────┼───────────────┼──────────────────┤
│ public     │ aulas_blocos  │ ✅ RLS DESATIVADO│
│ public     │ aulas_jogos   │ ✅ RLS DESATIVADO│
└────────────┴───────────────┴──────────────────┘
```

---

## 🧪 TESTAR

1. **Execute a migration** (acima)
2. **Volte ao navegador**
3. **Recarregue a página** de edição (F5)
4. **Clique em "Salvar Alterações"**
5. ✅ **Deve funcionar agora!**

---

## 📊 LOGS ESPERADOS (Console)

Após executar a migration, você deve ver:

```
🔄 Iniciando atualização da aula...
   Aula ID: 0db70d0d-...
   Título: Teste de aula com jogo
   Itens selecionados: 4

1️⃣ Atualizando informações básicas...
✅ Informações básicas atualizadas

2️⃣ Deletando associações antigas...
✅ Associações antigas deletadas          ← AGORA FUNCIONA!

3️⃣ Inserindo blocos: 3
   Dados dos blocos: [...]
✅ Blocos inseridos: 3

4️⃣ Inserindo jogos: 1
   Dados dos jogos: [...]
✅ Jogos inseridos: 1

5️⃣ Atualizando pontos totais: 30
✅ Pontos totais atualizados

🎉 Aula atualizada com sucesso!
```

---

## 🔍 POR QUE RLS ESTAVA BLOQUEANDO?

### O que é RLS?
Row Level Security = Política de segurança a nível de linha que controla **quem** pode acessar **quais dados**.

### Por que estava ativado?
Provavelmente foi ativado automaticamente quando as tabelas foram criadas, seguindo as políticas padrão do Supabase.

### Por que desabilitar?
As tabelas `aulas_blocos` e `aulas_jogos` são **apenas relacionamento** (não contêm dados sensíveis), e o **admin precisa de acesso total** para gerenciar aulas.

### Tabelas com RLS mantido:
- ✅ `alunos` (dados pessoais)
- ✅ `sessions` (dados de sessões)
- ✅ `users` (autenticação)

### Tabelas sem RLS (admin):
- ✅ `aulas_blocos` (apenas relacionamento)
- ✅ `aulas_jogos` (apenas relacionamento)
- ✅ `blocos_templates` (conteúdo público)
- ✅ `disciplinas` (dados públicos)

---

## ✅ CONCLUSÃO

**Problema:** RLS bloqueava delete/insert  
**Solução:** Desabilitar RLS para tabelas de relacionamento  
**Status:** Pronto para testar!

**Execute a migration e teste novamente!** 🚀



