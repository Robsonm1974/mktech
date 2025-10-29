# 🎯 FASE 7 - COMECE AQUI!

## ⚡ AÇÃO RÁPIDA (10 minutos)

### **PASSO 1: Abrir Supabase**
1. Acesse: https://supabase.com
2. Clique no seu projeto
3. Menu lateral → **SQL Editor**
4. Botão **+ New Query**

### **PASSO 2: Executar Migration**
1. Abra o arquivo: `supabase/migrations/20251026_rpc_insert_aula_com_jogos.sql`
2. **Copie TODO o conteúdo**
3. **Cole** no SQL Editor do Supabase
4. Clique em **Run** (ou `Ctrl+Enter`)
5. Deve aparecer: ✅ **"Success. No rows returned"**

### **PASSO 3: Testar**

Cole e execute este SQL (um de cada vez):

```sql
-- A) Buscar um bloco qualquer
SELECT id, titulo FROM blocos_templates LIMIT 1;
```

**Anote o ID** que aparecer. Exemplo: `abc123-def456-...`

```sql
-- B) Criar aula de teste (SUBSTITUA o ID abaixo pelo ID que você anotou)
SELECT insert_aula_with_itens_admin(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Teste FASE 7',
  'Testando novo RPC',
  '[{"tipo": "bloco", "id": "COLE_O_ID_AQUI", "ordem": 1}]'::jsonb
);
```

**Deve retornar**:
```json
{"success": true, "aula_id": "...", "message": "Aula criada com sucesso"}
```

```sql
-- C) Verificar se funcionou
SELECT titulo, pontos_totais FROM aulas WHERE titulo = 'Teste FASE 7';
```

**Deve mostrar**: 1 linha com a aula criada

```sql
-- D) Limpar teste
DELETE FROM aulas WHERE titulo = 'Teste FASE 7';
```

---

## ✅ SE TUDO FUNCIONOU

**Me avise dizendo:**
> "SQL testado! Funcionou!"

**Aí eu atualizo o frontend para você poder usar jogos nas aulas!**

---

## ❌ SE DEU ERRO

**Me envie:**
- A mensagem de erro completa
- Screenshot do Supabase

**Vou corrigir na hora!**

---

## 📖 DOCUMENTAÇÃO COMPLETA

Se quiser entender em detalhes:
- `docs/FASE7_TESTE_SQL_PASSO_A_PASSO.md` - Guia completo
- `docs/FASE7_RESUMO_EXECUTIVO.md` - Visão geral
- `docs/FASE7_INSTRUCOES_IMPLEMENTACAO.md` - Detalhes técnicos

---

## 🎯 RESUMO

```
1. Abrir Supabase SQL Editor
2. Colar migration SQL
3. Run
4. Testar com os comandos acima
5. Me avisar se funcionou
```

**Tempo**: 10 minutos  
**Dificuldade**: ⭐☆☆☆☆ (Muito Fácil)  
**Risco**: Zero (não quebra nada)

---

**COMECE AGORA!** ⚡

Abra o Supabase e execute o PASSO 1!



