# 🗑️ Deletar Turmas Hardcoded

**Data:** 2025-10-20  
**Status:** ✅ Pronto para executar

---

## 🎯 PROBLEMA

Existem 3 turmas no banco de dados que foram criadas com **IDs fixos** (hardcoded) durante testes anteriores:

| ID | Nome | Motivo do Problema |
|----|------|--------------------|
| `55555555-5555-5555-5555-555555555551` | 5º Ano A | ID hardcoded |
| `55555555-5555-5555-5555-555555555552` | 6º Ano B | ID hardcoded |
| `55555555-5555-5555-5555-555555555553` | 7º Ano C | ID hardcoded |

**Sintomas:**
- ✅ Turmas aparecem na lista do frontend
- ✅ Turmas existem no banco de dados (Supabase)
- ❌ **Botão "Deletar" não funciona no frontend**
- ❌ Causa: Possível problema com RPC ou validação

---

## ✅ SOLUÇÃO

Deletar as turmas **diretamente no banco de dados** usando SQL.

---

## 🚀 COMO EXECUTAR

### **PASSO 1: Abrir Supabase SQL Editor**
1. Acessar: https://supabase.com/dashboard/project/[seu-projeto]/sql
2. Clicar em "+ New query"

### **PASSO 2: Copiar e Colar o Script**
Arquivo: `supabase/migrations/DELETE_TURMAS_HARDCODED.sql`

Ou copie direto:
```sql
-- Deletar as 3 turmas com IDs hardcoded
DELETE FROM turmas WHERE id = '55555555-5555-5555-5555-555555555551';
DELETE FROM turmas WHERE id = '55555555-5555-5555-5555-555555555552';
DELETE FROM turmas WHERE id = '55555555-5555-5555-5555-555555555553';
```

### **PASSO 3: Executar**
- Clicar em "Run" ou `Ctrl+Enter`

### **PASSO 4: Verificar Resultado**
Você deve ver:
```
✅ LIMPEZA DE TURMAS DE TESTE CONCLUÍDA!
🗑️  Turmas deletadas: 3
   • 5º Ano A (55555555-...-551)
   • 6º Ano B (55555555-...-552)
   • 7º Ano C (55555555-...-553)
✅ Turmas restantes: 2
   • Apenas turmas criadas por você
```

---

## 🧪 VERIFICAR NO FRONTEND

### **PASSO 1: Recarregar Página**
1. Acessar: http://localhost:3001/dashboard/admin-escola/turmas
2. Pressionar `Ctrl+Shift+R` (hard reload)

### **PASSO 2: Verificar Lista**
Devem aparecer **APENAS 2 turmas**:
- ✅ 1º Ano (ou 1º Ano Especial) - Criada por você
- ✅ 3º Ano A - Criada por você

### **PASSO 3: Verificar Estatísticas**
- **Total de Turmas:** 2 ✅

---

## 📊 ANTES vs DEPOIS

### **ANTES (5 turmas):**
```
1. 3º Ano A          ← Sua (OK)
2. 1º Ano Especial   ← Sua (OK)
3. 5º Ano A          ← Hardcoded ❌
4. 6º Ano B          ← Hardcoded ❌
5. 7º Ano C          ← Hardcoded ❌
```

### **DEPOIS (2 turmas):**
```
1. 3º Ano A          ← Sua ✅
2. 1º Ano Especial   ← Sua ✅
```

---

## 🔍 POR QUE ACONTECEU?

Durante o desenvolvimento inicial do sistema, algumas turmas foram criadas com **IDs fixos** para facilitar testes. Exemplo:

```sql
-- ❌ NÃO FAZER (ID fixo)
INSERT INTO turmas (id, ...) VALUES 
  ('55555555-5555-5555-5555-555555555551', ...);

-- ✅ CORRETO (UUID gerado automaticamente)
INSERT INTO turmas (tenant_id, name, ...) VALUES 
  ('550e8400-...', '1º Ano A', ...);
```

---

## ✅ SOLUÇÃO PERMANENTE

**Para evitar no futuro:**
1. ✅ **NUNCA** usar IDs hardcoded em produção
2. ✅ Sempre deixar o banco gerar UUIDs automaticamente
3. ✅ Usar seeds com `gen_random_uuid()` ou `uuid_generate_v4()`
4. ✅ Em testes, criar dados via RPC/API (não INSERT direto)

---

## 🐛 SE AINDA HOUVER PROBLEMAS

### **Se as turmas ainda aparecem após executar o SQL:**

1. **Limpar cache do navegador:**
   - `Ctrl+Shift+Del` → Limpar cache
   - Ou abrir aba anônima

2. **Verificar no Supabase:**
   ```sql
   SELECT * FROM turmas 
   WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440000';
   ```

3. **Forçar refresh no frontend:**
   - Clicar em "Atualizar" na página de turmas
   - Ou fazer logout e login novamente

---

## 📞 SUPORTE

Se após executar o script as turmas ainda aparecerem:
1. Enviar screenshot da lista de turmas
2. Executar no Supabase:
   ```sql
   SELECT id, name FROM turmas 
   WHERE id LIKE '55555555%';
   ```
3. Me enviar o resultado

---

## 🎯 RESULTADO ESPERADO

Após executar o script:
- ✅ **5º Ano A** deletado
- ✅ **6º Ano B** deletado
- ✅ **7º Ano C** deletado
- ✅ **Sistema limpo e funcional**
- ✅ Apenas suas turmas na lista

---

**Status:** ✅ **PRONTO PARA EXECUTAR**  
**Arquivo SQL:** `supabase/migrations/DELETE_TURMAS_HARDCODED.sql`  
**Ação:** Execute no Supabase e recarregue a página! 🚀

