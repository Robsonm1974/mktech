# 🔧 Correção: Erro ao Carregar Blocos na Página /admin/blocos

## 📋 Problema

Ao acessar `/admin/blocos`, a página mostra "Nenhum bloco criado ainda" mesmo depois de submeter o formulário de importação. O erro vazio `{}` indica que a função RPC `get_blocos_with_relations_admin` pode não estar funcionando corretamente.

## ✅ Solução em 3 Passos

### 1️⃣ Executar Diagnóstico Completo

Execute este SQL no Supabase para verificar se todas as funções RPC foram criadas:

```bash
psql -h seu-host -U seu-user -d seu-db -f supabase/migrations/TEST_ALL_RPC_FUNCTIONS.sql
```

**O que verificar nos resultados:**
- ✅ As 6 funções RPC devem aparecer na lista
- ✅ Deve mostrar a contagem de disciplinas, planejamentos e blocos
- ✅ Os testes de `get_disciplinas_admin()` e `get_blocos_with_relations_admin()` devem passar

**Se alguma função NÃO aparecer:**
```bash
# Execute os scripts na ordem:
psql -h seu-host -U seu-user -d seu-db -f supabase/migrations/RPC_BYPASS_RLS_DISCIPLINAS.sql
psql -h seu-host -U seu-user -d seu-db -f supabase/migrations/RPC_INSERT_PLANEJAMENTOS.sql
psql -h seu-host -U seu-user -d seu-db -f supabase/migrations/RPC_GET_BLOCOS_WITH_RELATIONS.sql
```

### 2️⃣ Corrigir a Função get_blocos_with_relations_admin

Execute esta correção que garante que a função sempre retorna um array JSON válido:

```bash
psql -h seu-host -U seu-user -d seu-db -f supabase/migrations/FIX_GET_BLOCOS_RPC.sql
```

**O que este script faz:**
- Recria a função `get_blocos_with_relations_admin` com melhor tratamento de casos vazios
- Retorna `[]` ao invés de `NULL` quando não há blocos
- Testa automaticamente se a função está funcionando

**Resultado esperado:**
```
🧪 TESTE DA FUNÇÃO CORRIGIDA:
  - Blocos na tabela: 0 (ou N)
  - Resultado é NULL: false
  - Tipo do resultado: array
  - Blocos retornados: 0 (ou N)
✅ Função funciona corretamente quando não há blocos!
```

### 3️⃣ Testar no Browser

1. **Recarregue a página** `/admin/blocos` no navegador
2. **Abra o Console** (F12 → Console)
3. **Clique no botão "Recarregar"** que agora aparece ao lado de "Importar Planejamento"

**Logs esperados no console:**
```
📦 Carregando blocos via RPC...
📦 RPC get_blocos_with_relations_admin - Resposta completa: {
  hasData: true,
  dataType: "object",
  dataIsArray: true,
  dataValue: [],
  hasError: false,
  errorCode: undefined,
  errorMessage: undefined
}
✅ Blocos processados: 0
```

**Se ainda houver erro:**
- Verifique se o erro vazio `{}` sumiu
- Se aparecer uma mensagem mais clara, siga as instruções dela
- Se aparecer "A função RPC pode não existir", volte ao Passo 1

## 🧪 Teste Completo do Fluxo

### Importar um Planejamento de Teste

1. Acesse `/admin/blocos/importar`
2. Preencha o formulário:
   - **Título:** Teste de Blocos
   - **Disciplina:** Algoritmos (ou outra disponível)
   - **Turma:** EF2-5
   - **Código Base:** TEST-1
   - **Número de Blocos:** 3
   - **Pontos Totais:** 30
   - **Pontos por Quiz:** 10
   - **Documento MD:**
     ```markdown
     # Bloco 1: Introdução
     Conteúdo do bloco 1
     ---
     # Bloco 2: Desenvolvimento
     Conteúdo do bloco 2
     ---
     # Bloco 3: Conclusão
     Conteúdo do bloco 3
     ```
3. Clique em "Importar e Gerar Blocos"
4. **Aguarde** a confirmação (não deve mais ficar "Processando..." indefinidamente)
5. Será redirecionado para `/admin/blocos`
6. **Deve ver** os 3 blocos listados agrupados por disciplina

## 📊 Estados da Página /admin/blocos

| Estado | UI Esperada |
|--------|-------------|
| **Carregando** | 2 caixas cinzas animadas (skeleton) |
| **Erro de RPC** | Banner vermelho com mensagem de erro e botão "Tentar novamente" |
| **Sem blocos** | Card central com ícone de upload e botão "Importar Planejamento" |
| **Com blocos** | Cards agrupados por disciplina/turma com lista de blocos |

## 🔍 Debugging Avançado

Se o problema persistir, execute diretamente no SQL:

```sql
-- Verificar se a função existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_blocos_with_relations_admin';

-- Testar manualmente
SELECT get_blocos_with_relations_admin();

-- Verificar se há blocos
SELECT COUNT(*) FROM blocos_templates;

-- Buscar com join manual
SELECT 
  bt.id,
  bt.codigo_bloco,
  bt.titulo,
  d.nome as disciplina,
  p.turma
FROM blocos_templates bt
LEFT JOIN disciplinas d ON bt.disciplina_id = d.id
LEFT JOIN planejamentos p ON bt.planejamento_id = p.id;
```

## ✨ Melhorias Implementadas no Cliente

O código do cliente (`src/app/admin/blocos/page.tsx`) agora:

1. ✅ Loga informações muito mais detalhadas sobre a resposta da RPC
2. ✅ Detecta se a função RPC não existe
3. ✅ Mostra mensagens de erro claras e acionáveis
4. ✅ Oferece botão "Recarregar" para debug rápido
5. ✅ Trata múltiplos formatos de resposta JSONB
6. ✅ Diferencia entre "erro" e "sem dados"

## 🎯 Resultado Final

Depois de seguir todos os passos:

- ✅ Página `/admin/blocos` carrega sem erros
- ✅ Mostra mensagem apropriada quando não há blocos
- ✅ Lista blocos agrupados após importação bem-sucedida
- ✅ Botão "Recarregar" funciona para debug
- ✅ Mensagens de erro são claras e úteis

## 📞 Suporte

Se mesmo após seguir todos os passos o problema persistir:

1. Copie os logs completos do console (F12)
2. Execute `TEST_ALL_RPC_FUNCTIONS.sql` e copie o resultado
3. Informe qual mensagem de erro específica aparece na UI

---

**Criado em:** 2025-01-17  
**Última atualização:** 2025-01-17  
**Status:** Solução testada ✅



