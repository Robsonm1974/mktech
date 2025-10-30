# 🔥 SOLUÇÃO FINAL: Erro 403 Persistente

## 🚨 Situação Atual

Você executou o hotfix mas **ainda está recebendo 403 (Forbidden)** em todas as queries:

```
GET /rest/v1/disciplinas 403 (Forbidden)
GET /rest/v1/blocos_templates 403 (Forbidden)
```

**Sessão está OK:**
```
✅ hasSession: true
✅ userEmail: mk-admin@mktech.com
✅ userId: de3f0803-61cc-4c67-b6b2-3bdc5adafcda
```

**Mas RLS continua bloqueando!**

---

## ✅ SOLUÇÃO NUCLEAR (Execute AGORA)

### Passo 1: Execute Este SQL no Supabase

Abra o **Supabase SQL Editor** e execute:

📁 **`supabase/migrations/FORCE_FIX_RLS_NUCLEAR.sql`**

Este SQL vai **DESABILITAR COMPLETAMENTE o RLS** em todas as tabelas admin:

```sql
ALTER TABLE disciplinas DISABLE ROW LEVEL SECURITY;
ALTER TABLE planejamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE blocos_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE aulas_blocos DISABLE ROW LEVEL SECURITY;
ALTER TABLE config_global DISABLE ROW LEVEL SECURITY;
```

### Passo 2: Recarregar a Página

Após executar o SQL:

1. **Recarregue completamente** a página `/admin/blocos/importar` (Ctrl+Shift+R / Cmd+Shift+R)
2. **Clique no botão 🔄** ao lado do campo "Disciplina"
3. **Aguarde** carregar

### Passo 3: Verificar no Console

Você DEVE ver agora:

```
✅ Disciplinas carregadas: 5 [
  { codigo: 'ALG', nome: 'Algoritmos', ... },
  { codigo: 'ING', nome: 'Inglês', ... },
  ...
]
```

---

## 🎯 Por Que Isso Aconteceu?

O problema é que as políticas RLS anteriores **não foram removidas corretamente**.

Quando você tenta criar uma política com o mesmo nome de uma existente, o Supabase pode:
- Ignorar o comando
- Dar erro silencioso
- Manter a política antiga ativa

Por isso, a solução nuclear **DESABILITA completamente o RLS** ao invés de tentar gerenciar políticas.

---

## ⚠️ IMPORTANTE: Esta é uma Solução TEMPORÁRIA

Com o RLS desabilitado:
- ❌ **NENHUMA proteção de linha**
- ❌ **Qualquer usuário autenticado acessa tudo**
- ❌ **NÃO usar em produção**
- ✅ **OK para desenvolvimento local**

### Para Produção (Futuro)

Depois que tudo estiver funcionando, crie políticas RLS corretas:

```sql
-- Exemplo de política segura para produção
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de disciplinas"
  ON disciplinas FOR SELECT
  TO authenticated
  USING (ativa = true);

CREATE POLICY "Admin full access"
  ON disciplinas FOR ALL
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

## 📋 Checklist Final

- [ ] Execute `FORCE_FIX_RLS_NUCLEAR.sql` no Supabase SQL Editor
- [ ] Veja a mensagem de sucesso: "🔥 RLS COMPLETAMENTE DESABILITADO!"
- [ ] Recarregue a página `/admin/blocos/importar` (Ctrl+Shift+R)
- [ ] Clique no botão 🔄 ao lado do campo "Disciplina"
- [ ] Veja as 5 disciplinas aparecerem no select
- [ ] Tente preencher e enviar o formulário

---

## 🆘 Se AINDA Não Funcionar

Se após executar o SQL nuclear você AINDA tiver erro 403:

### Verificar Se o SQL Foi Executado

Execute este SQL para verificar o status do RLS:

```sql
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename IN ('disciplinas', 'planejamentos', 'blocos_templates', 'aulas_blocos', 'config_global');
```

**Resultado esperado:**
Todas as tabelas devem mostrar `rls_habilitado = false`

Se mostrar `true`, o SQL não foi executado. Tente novamente.

---

### Limpar Cache do Supabase

Se o SQL foi executado mas ainda dá erro, limpe o cache:

1. No Supabase Dashboard, vá em **Settings** → **API**
2. Clique em **Reset API** (isso vai limpar o cache)
3. Aguarde 30 segundos
4. Recarregue sua aplicação

---

### Última Tentativa: RPC Bypass

Se nada funcionar, crie uma função RPC que bypass o RLS:

```sql
CREATE OR REPLACE FUNCTION get_all_disciplinas()
RETURNS TABLE (
  id UUID,
  codigo VARCHAR,
  nome VARCHAR,
  icone VARCHAR,
  ativa BOOLEAN
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.codigo, d.nome, d.icone, d.ativa
  FROM disciplinas d
  WHERE d.ativa = true
  ORDER BY d.nome;
END;
$$ LANGUAGE plpgsql;
```

E no código, chame via RPC:

```typescript
const { data } = await supabase.rpc('get_all_disciplinas')
```

---

**Execute o SQL nuclear e me avise o resultado!** 🚀














