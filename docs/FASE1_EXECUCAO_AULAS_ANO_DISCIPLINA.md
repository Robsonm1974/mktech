# 🎯 FASE 1: Adicionar Ano e Disciplina em Aulas - Guia de Execução

## 📋 Resumo

Esta fase adiciona os campos `ano_escolar_id` e `disciplina_id` à tabela `aulas`, atualiza as aulas existentes detectando automaticamente esses valores dos blocos vinculados, e modifica os RPCs para suportar a nova estrutura.

---

## 🚀 Ordem de Execução

### **Script Único (RECOMENDADO)**

Execute apenas este script consolidado que faz tudo:

```sql
-- Arquivo: supabase/migrations/FASE1_COMPLETA_ANO_DISCIPLINA_AULAS.sql
```

Este script executa automaticamente:
1. ✅ Adiciona colunas `ano_escolar_id` e `disciplina_id` à tabela `aulas`
2. ✅ Cria índices para performance
3. ✅ Atualiza aulas existentes detectando ano/disciplina dos blocos
4. ✅ Atualiza RPC `get_aulas_with_relations_admin` com novos campos
5. ✅ Atualiza RPC `insert_aula_with_blocos_admin` com detecção automática
6. ✅ Executa verificações finais
7. ✅ Testa os RPCs

---

### **Scripts Individuais (Alternativa)**

Se preferir executar passo a passo:

1. **Atualizar estrutura da tabela:**
   ```
   supabase/migrations/ADD_ANO_ESCOLAR_TO_AULAS.sql
   ```

2. **Atualizar RPC de listagem:**
   ```
   supabase/migrations/UPDATE_RPC_GET_AULAS_ANO_DISCIPLINA.sql
   ```

3. **Atualizar RPC de inserção:**
   ```
   supabase/migrations/UPDATE_RPC_INSERT_AULA_ANO_DISCIPLINA.sql
   ```

---

## 🔍 Verificação Pós-Execução

Após executar, rode o diagnóstico:

```sql
-- Arquivo: supabase/migrations/DIAGNOSTICO_AULAS_ANO_DISCIPLINA.sql
```

### **O que o diagnóstico verifica:**

1. ✅ Estrutura da tabela `aulas` (novas colunas)
2. ✅ Aulas cadastradas com ano e disciplina
3. ✅ Teste do RPC `get_aulas_with_relations_admin`
4. ✅ Estatísticas por ano e disciplina
5. ✅ Aulas com dados incompletos (problemas)
6. ✅ RPCs disponíveis
7. ✅ Resumo geral

---

## 📊 Resultados Esperados

### **Estrutura da Tabela `aulas`**

Novas colunas adicionadas:
```
ano_escolar_id   VARCHAR(20)
disciplina_id    UUID (FK para disciplinas)
```

### **RPC `get_aulas_with_relations_admin`**

Retorno atualizado inclui:
```typescript
{
  id: UUID,
  trilha_id: UUID,
  titulo: string,
  descricao: string,
  ordem: number,
  created_at: Date,
  total_blocos: number,
  blocos_ids: UUID[],
  ano_escolar_id: string,      // ✨ NOVO
  disciplina_id: UUID,          // ✨ NOVO
  ano_nome: string,             // ✨ NOVO (join com anos_escolares)
  disciplina_codigo: string,    // ✨ NOVO (join com disciplinas)
  disciplina_nome: string       // ✨ NOVO (join com disciplinas)
}
```

### **RPC `insert_aula_with_blocos_admin`**

Comportamento atualizado:
- Detecta automaticamente `ano_escolar_id` e `disciplina_id` do **primeiro bloco** da lista
- Retorna as informações detectadas no resultado:
```json
{
  "success": true,
  "aula_id": "uuid-da-aula",
  "ano_escolar_id": "EF1",
  "disciplina_id": "uuid-da-disciplina",
  "total_blocos": 5,
  "pontos_totais": 50,
  "message": "Aula criada com 5 blocos"
}
```

---

## ⚠️ Tratamento de Erros

### **Erro: "cannot change return type of existing function"**

**Solução:** O script consolidado já inclui `DROP FUNCTION IF EXISTS ... CASCADE` antes de recriar as funções. Se executar scripts individuais, certifique-se de dropar as funções antigas primeiro.

### **Aulas sem blocos vinculados**

Aulas sem blocos **não terão** `ano_escolar_id` e `disciplina_id` preenchidos automaticamente. O diagnóstico identifica esses casos na seção "AULAS COM DADOS INCOMPLETOS".

**Solução:** Vincule blocos à aula ou preencha manualmente:
```sql
UPDATE aulas 
SET ano_escolar_id = 'EF1', disciplina_id = 'uuid-da-disciplina'
WHERE id = 'uuid-da-aula';
```

---

## 🎨 Próximos Passos (Fase 2 - Frontend)

Após confirmar que a Fase 1 foi executada com sucesso, a Fase 2 atualizará o frontend para:

1. **Página `/admin/aulas`:**
   - Cards separados por ano
   - Filtros independentes (Ano + Disciplina)
   - Badges visuais (ano + disciplina)

2. **Página `/admin/aulas/criar`:**
   - Preview automático do ano/disciplina detectado
   - Filtro de blocos por ano + disciplina

3. **Página `/admin/aulas/editar/[id]`:**
   - Exibir ano e disciplina da aula
   - Permitir mudança (ao trocar blocos)

---

## 📝 Checklist de Execução

- [ ] Executar `FASE1_COMPLETA_ANO_DISCIPLINA_AULAS.sql`
- [ ] Verificar mensagens de sucesso no output
- [ ] Executar `DIAGNOSTICO_AULAS_ANO_DISCIPLINA.sql`
- [ ] Conferir se todas as aulas têm `ano_escolar_id` preenchido
- [ ] Testar criação de nova aula no frontend
- [ ] Verificar se o ano/disciplina são detectados automaticamente
- [ ] Confirmar que o RPC retorna os novos campos
- [ ] Avisar quando estiver pronto para a Fase 2 (Frontend)

---

## 🆘 Troubleshooting

### **Output esperado do script consolidado:**

```
✅ ETAPA 1.1: Colunas adicionadas à tabela aulas
✅ ETAPA 1.2: X aulas atualizadas
✅ ETAPA 1.3: RPC get_aulas_with_relations_admin atualizado
✅ ETAPA 1.4: RPC insert_aula_with_blocos_admin atualizado
═══════════════════════════════════════════════════
📊 VERIFICAÇÃO FINAL - FASE 1
═══════════════════════════════════════════════════
✅ Colunas adicionadas: OK
✅ RPCs atualizados: OK
🎉 FASE 1 CONCLUÍDA COM SUCESSO!
```

### **Se algo falhar:**

1. Copie a mensagem de erro completa
2. Execute o diagnóstico para ver o estado atual
3. Me avise o erro e o resultado do diagnóstico

---

**Status:** 📝 Aguardando execução
**Última atualização:** 2025-10-18

