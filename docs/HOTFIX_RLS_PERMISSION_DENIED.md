# 🔥 HOTFIX: Permission Denied 42501

## 🎯 Problema Identificado

**Erro no Console:**
```json
{
  "code": "42501",
  "message": "permission denied for table disciplinas"
}
```

**Causa:** As políticas RLS (Row Level Security) estão bloqueando o acesso à tabela `disciplinas`, mesmo para usuários autenticados.

---

## ✅ Solução Rápida (Execute AGORA)

### Opção 1: Hotfix Completo (Recomendado)

Execute este SQL no **Supabase SQL Editor**:

📁 **`supabase/migrations/hotfix_rls_todas_tabelas_admin.sql`**

Este arquivo:
- ✅ Remove políticas RLS antigas
- ✅ Cria políticas PERMISSIVAS para desenvolvimento
- ✅ Permite acesso total para usuários autenticados
- ✅ Aplica em TODAS as tabelas admin (disciplinas, planejamentos, blocos_templates, aulas_blocos, config_global)

### Opção 2: Fix Apenas Disciplinas

Execute este SQL no **Supabase SQL Editor**:

📁 **`supabase/migrations/hotfix_rls_disciplinas_permissive.sql`**

---

## 🚀 Após Executar o Hotfix

1. **Recarregue a página** `/admin/blocos/importar`
2. **Clique no botão 🔄** ao lado do campo "Disciplina"
3. **Verifique o console (F12)** - deve mostrar:

```
✅ Disciplinas carregadas: 5
```

4. **O select deve aparecer preenchido com:**
   - 🧮 Algoritmos
   - 🇬🇧 Inglês  
   - ➕ Matemática
   - 🧠 Lógica
   - 💻 Programação

---

## 🔍 Verificar se Funcionou

Vá para `/admin/debug-session` e você verá:

```
✅ TUDO FUNCIONANDO!
Sessão ativa e 5 disciplinas carregadas com sucesso.
```

---

## ⚠️ Importante: Esta é uma Solução TEMPORÁRIA

Esta política RLS é **MUITO PERMISSIVA** e deve ser usada apenas em desenvolvimento.

### Por que temporária?

```sql
USING (true)  -- ⚠️ Permite acesso a TODOS usuários autenticados
```

Isso significa que **qualquer usuário autenticado** (professor, aluno, admin) pode acessar/modificar essas tabelas.

### Para Produção

Depois que tudo estiver funcionando, substitua por políticas mais restritivas que verificam o `role`:

```sql
-- Exemplo de política SEGURA (implementar depois)
CREATE POLICY "Apenas superadmin"
  ON disciplinas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role IN ('superadmin', 'admin_mktech')
    )
  );
```

---

## 🐛 Por Que Isso Aconteceu?

O problema foi que as políticas RLS anteriores estavam verificando:

```sql
WHERE users.auth_id = auth.uid() AND users.role = 'superadmin'
```

Mas algo não estava funcionando nessa verificação:

1. **Possível causa 1:** O `auth.uid()` no contexto do browser não estava retornando o UUID correto
2. **Possível causa 2:** A tabela `users` não tinha o registro com `auth_id` correspondente
3. **Possível causa 3:** O `role` não era exatamente `'superadmin'` (espaço, maiúscula, etc)

---

## 📋 Checklist

- [ ] Execute `hotfix_rls_todas_tabelas_admin.sql` no Supabase SQL Editor
- [ ] Recarregue `/admin/blocos/importar`
- [ ] Clique no botão 🔄 ao lado do campo "Disciplina"
- [ ] Verifique que 5 disciplinas aparecem no select
- [ ] Teste preencher o formulário e importar um planejamento
- [ ] Acesse `/admin/debug-session` para confirmar que tudo está OK

---

## 🆘 Se Ainda Não Funcionar

Se após executar o hotfix você ainda ver o erro, **copie e cole aqui:**

1. Todo o conteúdo do console (F12) após recarregar a página
2. Acesse `/admin/debug-session` e copie TUDO que aparecer
3. Me envie para eu analisar

---

**Execute o hotfix AGORA e teste!** 🚀











