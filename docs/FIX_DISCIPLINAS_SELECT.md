# Fix: Campo Disciplina Vazio em /admin/blocos/importar

## 🔍 Diagnóstico

O problema é **Row Level Security (RLS)** no Supabase. As disciplinas existem no banco, mas o RLS está bloqueando o acesso.

## ✅ Solução

Execute a migration RLS no Supabase SQL Editor:

### Passo 1: Copiar o SQL

Abra o arquivo: `supabase/migrations/20241017_rls_disciplinas.sql`

### Passo 2: Executar no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo completo do arquivo `20241017_rls_disciplinas.sql`
4. Clique em **Run**

### Passo 3: Recarregar a Página

Após executar a migration, recarregue a página `/admin/blocos/importar` e o select de disciplinas deve aparecer populado.

## 🔧 O que a Migration Faz

1. **Habilita RLS** nas tabelas: `disciplinas`, `planejamentos`, `blocos_templates`, `aulas_blocos`, `config_global`

2. **Cria políticas de acesso:**
   - **Disciplinas:** Leitura pública para disciplinas ativas + acesso total para superadmin
   - **Planejamentos:** Acesso total para superadmin
   - **Blocos Templates:** Acesso total para superadmin
   - **Aulas Blocos:** Acesso total para superadmin
   - **Config Global:** Leitura pública + edição para superadmin

## 🐛 Debug Adicional

Adicionei logs no console do navegador. Abra o **DevTools (F12)** e veja:

- `🔍 Carregando disciplinas...` - Início da query
- `📊 Resultado da query: { data, error }` - Resultado completo
- `✅ Disciplinas carregadas: N` - Sucesso (mostra quantidade)
- `❌ Erro ao carregar disciplinas: ...` - Erro (mostra mensagem)

## 📋 Verificação Rápida

Execute no Supabase SQL Editor para verificar as disciplinas:

```sql
SELECT * FROM disciplinas;
```

Deve retornar 5 disciplinas:
- ALG - Algoritmos
- ING - Inglês
- MAT - Matemática
- LOG - Lógica
- PRG - Programação

## 🆘 Solução Temporária (Implementada)

O código agora tenta carregar as disciplinas de duas formas:
1. Primeiro com filtro `ativa = true`
2. Se falhar, tenta sem filtro

Isso permite diagnosticar se o problema é RLS ou dados ausentes.

---

**Próximos Passos:** Execute a migration RLS e teste novamente!











