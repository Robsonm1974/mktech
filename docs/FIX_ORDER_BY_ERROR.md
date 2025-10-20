# 🔧 Correção: Erro ORDER BY na Função get_blocos_with_relations_admin

## ❌ Erro Original

```
ERROR: 42803: column "bt.codigo_bloco" must appear in the GROUP BY clause or be used in an aggregate function
```

### 🔍 Causa Raiz

O PostgreSQL estava interpretando incorretamente o `ORDER BY` dentro do `jsonb_agg()`. A sintaxe original:

```sql
SELECT jsonb_agg(
  jsonb_build_object(...)
)
FROM blocos_templates bt
LEFT JOIN disciplinas d ON bt.disciplina_id = d.id
LEFT JOIN planejamentos p ON bt.planejamento_id = p.id
ORDER BY bt.codigo_bloco ASC  -- ❌ ERRO: Isso parece um GROUP BY implícito
```

O problema é que o `ORDER BY` estava **fora** do `jsonb_agg()`, fazendo o PostgreSQL pensar que precisava agrupar os resultados.

## ✅ Solução

### Abordagem 1: ORDER BY dentro do jsonb_agg (tentativa inicial)
```sql
SELECT jsonb_agg(
  jsonb_build_object(...) ORDER BY bt.codigo_bloco ASC  -- Ainda causa erro
)
FROM blocos_templates bt
```

**Problema:** Referenciar `bt.codigo_bloco` diretamente dentro do `jsonb_agg()` ainda causa conflito.

### Abordagem 2: Subquery (SOLUÇÃO DEFINITIVA) ✅

```sql
SELECT jsonb_agg(
  jsonb_build_object(
    'codigo_bloco', bloco_data.codigo_bloco,
    ...
  ) ORDER BY bloco_data.codigo_bloco ASC
) 
FROM (
  SELECT 
    bt.id,
    bt.codigo_bloco,
    bt.titulo,
    ...
  FROM blocos_templates bt
  LEFT JOIN disciplinas d ON bt.disciplina_id = d.id
  LEFT JOIN planejamentos p ON bt.planejamento_id = p.id
) AS bloco_data
```

**Por que funciona:**
1. A subquery materializa todos os dados primeiro
2. O `jsonb_agg()` opera sobre um resultado já processado
3. O `ORDER BY` dentro do `jsonb_agg()` agora referencia colunas da subquery, não das tabelas originais
4. Não há ambiguidade sobre agregação vs. ordenação

## 🚀 Aplicando a Correção

### Via SQL Editor do Supabase (RECOMENDADO)

1. Abra o **SQL Editor** no Supabase Dashboard
2. Cole o conteúdo de `supabase/migrations/HOTFIX_GET_BLOCOS_ORDER_BY.sql`
3. Execute (Run)

### Via psql (Linha de Comando)

```powershell
psql -h kcvlauuzwnrfdgwlxcnw.supabase.co -U postgres -d postgres -f supabase/migrations/HOTFIX_GET_BLOCOS_ORDER_BY.sql
```

## 🧪 Validação

Após executar o hotfix, você deve ver no output:

```
🧪 TESTE DA FUNÇÃO CORRIGIDA:
  📊 Blocos na tabela: 30 (ou outro número)
  ✅ Função executou sem erros!
  📦 Resultado é NULL: false
  📦 Tipo do resultado: array
  📦 Blocos retornados: 30
  ✅ Retornou todos os blocos corretamente!
  
  📄 Exemplo do primeiro bloco:
     {"id":"...", "codigo_bloco":"ALG-1-1", ...}

🔍 TESTE MANUAL DA QUERY:
(Lista dos primeiros 5 blocos)

🎉 HOTFIX APLICADO COM SUCESSO!
```

## 🌐 Testando no Browser

1. **Abra** `/admin/blocos` no navegador
2. **Pressione F12** para abrir o Console
3. **Clique** no botão "🔄 Recarregar"
4. **Verifique os logs:**

```javascript
📦 Carregando blocos via RPC...
📦 RPC get_blocos_with_relations_admin - Resposta completa: {
  hasData: true,
  dataType: "object",
  dataIsArray: true,
  dataValue: [
    {id: "...", codigo_bloco: "ALG-1-1", titulo: "...", ...},
    {id: "...", codigo_bloco: "ALG-1-2", titulo: "...", ...},
    ...
  ],
  hasError: false
}
✅ Blocos processados: 30
```

5. **Resultado esperado na UI:**
   - ✅ Cards agrupados por Disciplina e Turma
   - ✅ Lista de blocos ordenados por código
   - ✅ Badges de status (incompleto/completo/publicado)
   - ✅ Botões para editar, criar mídia, criar quiz

## 📊 Dados de Referência

Com base na sua imagem, você tem:

| Tabela | Registros |
|--------|-----------|
| `blocos` | 3 |
| `blocos_templates` | 30 |
| `config_global` | 7 |
| `disciplinas` | 5 |

Portanto, a função deve retornar **30 blocos** agrupados em cards por disciplina/turma.

## 🔄 Próximos Passos

Depois de aplicar o hotfix:

1. ✅ A função `get_blocos_with_relations_admin()` funcionará corretamente
2. ✅ A página `/admin/blocos` mostrará os 30 blocos criados
3. ✅ Você poderá clicar em cada bloco para editá-lo
4. ✅ Os ícones "Criar Mídia" e "Criar Quiz" aparecerão em cada linha
5. ✅ Poderá importar novos planejamentos sem erros

## 🛡️ Prevenção

Para evitar este erro no futuro:

1. **Sempre use subqueries** quando precisar ordenar agregações complexas
2. **Teste funções RPC** manualmente antes de usar no cliente
3. **Use `SECURITY DEFINER`** com cuidado (bypass RLS)
4. **Mantenha logs detalhados** no cliente para debug rápido

---

**Criado em:** 2025-01-17  
**Issue:** ORDER BY dentro de jsonb_agg causando erro de GROUP BY  
**Status:** Resolvido ✅



