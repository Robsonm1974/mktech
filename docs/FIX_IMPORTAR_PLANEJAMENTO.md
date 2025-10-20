# 🔧 FIX: Botão "Importar Planejamento" não funcionava

**Data:** 18 de Outubro de 2025  
**Status:** ✅ Resolvido

---

## 🐛 PROBLEMA

O botão "Importar e Gerar Blocos" na página `/admin/blocos/importar` não estava criando planejamentos nem blocos no Supabase.

### Sintomas
- Botão não respondia
- Nenhum erro visível na UI
- Nenhum dado inserido no banco de dados

---

## 🔍 CAUSA RAIZ

**Dois problemas principais:**

### 1. Incompatibilidade entre o tipo de retorno do RPC e o código frontend

### O que estava acontecendo:

1. **RPC `insert_planejamento_admin` retornava:**
   ```json
   {
     "success": true,
     "planejamento_id": "uuid-aqui",
     "message": "Planejamento inserido com sucesso"
   }
   ```

2. **Código frontend esperava:**
   ```typescript
   // ❌ ERRADO - esperava um array
   const { data: planejamento } = await supabase.rpc(...)
   if (!planejamento || planejamento.length === 0) { // Falha aqui!
   ```

3. **Resultado:**
   - A condição `planejamento.length === 0` falhava porque `rpcResult` é um **objeto JSONB**, não um array
   - O código entrava no bloco de erro e não continuava a execução

### 2. Schema de validação Zod desatualizado

O schema `importPlanejamentoSchema` ainda esperava o campo `turma`, mas o formulário estava enviando `ano_escolar_id`. Isso causava falha na validação antes mesmo de tentar chamar o RPC.

```typescript
// ❌ ERRADO - validação antiga
turma: z.string().min(1, 'Turma é obrigatória').regex(/^EF[12]-[1-9]$/, ...)

// Formulário enviava:
{ ano_escolar_id: 'EF1', ... } // Não passava na validação!
```

---

## ✅ SOLUÇÃO IMPLEMENTADA

### Arquivos modificados:
1. `src/app/admin/blocos/importar/page.tsx`
2. `src/lib/admin/validations.ts`

### Mudanças:

#### 1. Corrigido schema de validação Zod (`validations.ts`)

```typescript
// ✅ CORRETO - Atualizado para usar ano_escolar_id
export const importPlanejamentoSchema = z.object({
  disciplina_id: z.string().uuid('ID de disciplina inválido'),
  ano_escolar_id: z.string().min(1, 'Ano Escolar é obrigatório')
    .regex(/^EF[1-9]$/, 'Formato inválido (ex: EF1, EF2, ... EF9)'),
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(255),
  documento_md: z.string().min(10, 'Documento deve ter pelo menos 10 caracteres'),
  num_blocos: z.number().int().min(1).max(100),
  pontos_totais: z.number().int().min(1),
  pontos_por_quiz: z.number().int().min(1),
  codigo_base: z.string().min(1, 'Código base é obrigatório').max(20),
  substituir_existentes: z.boolean().optional()
})
```

#### 2. Adicionada interface TypeScript (`importar/page.tsx`)
```typescript
interface RpcPlanejamentoResult {
  success: boolean
  planejamento_id: string
  message: string
}
```

#### 3. Corrigida a chamada do RPC (`importar/page.tsx`)
```typescript
// ✅ CORRETO
const { data: rpcResult, error: planError } = await supabase.rpc('insert_planejamento_admin', {
  p_disciplina_id: form.disciplina_id,
  p_ano_escolar_id: form.ano_escolar_id,
  p_titulo: form.titulo,
  p_documento_md: form.documento_md,
  p_num_blocos: form.num_blocos,
  p_pontos_totais: form.pontos_totais,
  p_pontos_por_quiz: form.pontos_por_quiz,
  p_codigo_base: form.codigo_base,
  p_status: 'processado'
}) as { data: RpcPlanejamentoResult | null, error: Error | null }
```

#### 4. Corrigida a validação da resposta (`importar/page.tsx`)
```typescript
// ✅ Verifica o objeto JSONB corretamente
if (!rpcResult || !rpcResult.success || !rpcResult.planejamento_id) {
  const errorMsg = rpcResult?.message || 'Erro ao criar planejamento: resposta inválida'
  console.error('❌ Resposta inválida do RPC:', rpcResult)
  setErrors({ submit: errorMsg })
  setLoading(false)
  return
}

const planejamentoId = rpcResult.planejamento_id
console.log('✅ Planejamento criado:', planejamentoId)
```

---

## 📋 ARQUIVOS MODIFICADOS

1. **`src/app/admin/blocos/importar/page.tsx`**
   - Adicionada interface `RpcPlanejamentoResult`
   - Corrigida chamada do RPC para esperar objeto JSONB
   - Corrigida validação da resposta

2. **`src/lib/admin/validations.ts`**
   - Atualizado `importPlanejamentoSchema` de `turma` para `ano_escolar_id`
   - Ajustado regex de validação para aceitar EF1-EF9
   - Adicionado campo opcional `substituir_existentes`

3. **`supabase/migrations/FIX_RPC_INSERT_PLANEJAMENTO_ANO.sql`**
   - RPC atualizado para aceitar `p_ano_escolar_id`
   - Retorna JSONB com `success`, `planejamento_id`, `message`

4. **`src/lib/admin/planejamento-parser.ts`**
   - Parser já atualizado para extrair `ano_escolar_id` do Markdown

---

## ✅ VALIDAÇÃO

### Teste realizado:
1. ✅ Acessar `/admin/blocos`
2. ✅ Clicar no card "1º Ano"
3. ✅ Clicar em "Importar Planejamento"
4. ✅ Colar documento Markdown
5. ✅ Clicar em "Parsear Documento"
6. ✅ Verificar preview dos dados extraídos
7. ✅ Clicar em "Importar e Gerar Blocos"
8. ✅ Verificar inserção no Supabase:
   - Tabela `planejamentos`: 1 registro novo
   - Tabela `blocos_templates`: N registros (conforme documento)
   - Tabela `quizzes`: N registros (para blocos com quiz)

---

## 🎯 RESULTADO

**Importação agora funciona corretamente!** 🎉

O sistema agora:
- ✅ Parseia corretamente documentos Markdown
- ✅ Cria planejamentos usando o RPC
- ✅ Cria blocos automaticamente
- ✅ Cria quizzes vinculados aos blocos
- ✅ Usa `ano_escolar_id` corretamente (não mais `turma`)
- ✅ Exibe mensagens de sucesso/erro apropriadas

---

## 📝 LIÇÕES APRENDIDAS

1. **Sempre verificar o tipo de retorno dos RPCs** - Não assumir que são arrays
2. **Usar interfaces TypeScript** - Ajuda a detectar incompatibilidades
3. **Adicionar logs detalhados** - Facilita debug de chamadas assíncronas
4. **Testar end-to-end** - Validar todo o fluxo, não apenas partes isoladas

