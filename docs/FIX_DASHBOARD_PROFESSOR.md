# 🔧 Correções: Dashboard do Professor

**Data:** 24/10/2024  
**Status:** 🟡 EM IMPLEMENTAÇÃO  
**Prioridade:** 🔥 ALTA  

---

## 📋 Problemas Identificados

### **1. Card "Alunos na Sessão" - Trava em "Carregando..."**
- **Arquivo:** `src/app/dashboard/professor/sessao/[sessionId]/page.tsx`
- **Linha:** 194
- **Problema:** RPC `get_alunos_sessao` não retorna dados
- **Causa:** Possível erro na definição do RPC ou RLS bloqueando acesso

### **2. Card "Sessões Recentes" - Não mostra dados reais**
- **Arquivo:** `src/app/dashboard/professor/page.tsx`
- **Linha:** 260-279
- **Problema:** Mostra apenas mensagem estática
- **Causa:** RPC `get_sessoes_professor` não existe

### **3. Botão "Pausar" - Desnecessário**
- **Arquivo:** `src/app/dashboard/professor/sessao/[sessionId]/page.tsx`
- **Linha:** 329-332
- **Problema:** Funcionalidade de pausar não é necessária
- **Ação:** Remover botão

### **4. Botão "Encerrar Sessão" - Pode ter problemas**
- **Arquivo:** `src/app/dashboard/professor/sessao/[sessionId]/page.tsx`
- **Linha:** 252-275
- **Problema:** Query direto pode não atualizar participações
- **Ação:** Criar RPC dedicado

---

## ✅ Soluções Implementadas

### **Passo 1: Executar SQL no Supabase**

1. **Acesse o Supabase:**
   - Vá para: https://supabase.com
   - Acesse seu projeto
   - Vá para **SQL Editor**

2. **Execute o script:**
   - Abra o arquivo: `supabase/migrations/FIX_RPC_SESSOES_PROFESSOR.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor
   - Clique em **RUN**

3. **Verifique:**
   - Deve retornar: `✅ RPCs de sessões do professor criados/atualizados com sucesso!`
   - Se houver erro, copie a mensagem e me envie

---

### **Passo 2: Atualizar Dashboard do Professor**

**Arquivo:** `src/app/dashboard/professor/page.tsx`

#### **A. Adicionar Estados para Sessões Recentes**

```typescript
// Adicionar após linha 25
const [sessoesRecentes, setSessoesRecentes] = useState<any[]>([])
const [loadingSessoes, setLoadingSessoes] = useState(true)
const [estatisticas, setEstatisticas] = useState({
  sessoes_realizadas: 0,
  sessoes_ativas: 0
})
```

#### **B. Adicionar useEffect para carregar sessões**

```typescript
// Adicionar após useEffect das turmas (linha 74)
useEffect(() => {
  const loadSessoes = async () => {
    if (!user) return

    try {
      // Buscar sessões recentes
      const { data: sessoesData, error: sessoesError } = await supabase.rpc(
        'get_sessoes_professor',
        { p_professor_id: user.id }
      )

      if (sessoesError) {
        console.error('Erro ao carregar sessões:', sessoesError)
      } else {
        setSessoesRecentes(sessoesData || [])
      }

      // Buscar estatísticas
      const { data: statsData, error: statsError } = await supabase.rpc(
        'get_estatisticas_professor',
        { p_professor_id: user.id }
      )

      if (statsError) {
        console.error('Erro ao carregar estatísticas:', statsError)
      } else {
        setEstatisticas(statsData || {
          sessoes_realizadas: 0,
          sessoes_ativas: 0
        })
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoadingSessoes(false)
    }
  }

  loadSessoes()
}, [user, supabase])
```

#### **C. Substituir Card "Sessões Recentes" (linhas 260-279)**

```typescript
{/* Sessões Recentes */}
<Card className="mb-8">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Play className="h-5 w-5" />
      Sessões Recentes
    </CardTitle>
    <CardDescription>
      Suas últimas aulas realizadas
    </CardDescription>
  </CardHeader>
  <CardContent>
    {loadingSessoes ? (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Carregando sessões...</p>
      </div>
    ) : sessoesRecentes.length === 0 ? (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground mb-4">
          Nenhuma sessão realizada ainda
        </p>
        <Button asChild size="sm">
          <Link href="/dashboard/professor/iniciar-sessao">
            Iniciar Primeira Sessão
          </Link>
        </Button>
      </div>
    ) : (
      <div className="space-y-3">
        {sessoesRecentes.slice(0, 10).map((sessao) => (
          <div
            key={sessao.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-semibold">{sessao.aula_titulo}</h4>
                <Badge variant={sessao.status === 'active' ? 'default' : 'secondary'}>
                  {sessao.status === 'active' ? '🟢 Ativa' : '⚪ Encerrada'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {sessao.turma_nome} · {sessao.total_alunos} alunos participaram
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(sessao.data_inicio).toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {sessao.status === 'active' && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/professor/sessao/${sessao.id}`}>
                    Ver Sessão
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
```

#### **D. Atualizar Card "Sessões Realizadas" (linha 303-310)**

```typescript
<Card>
  <CardHeader>
    <CardTitle className="text-sm font-medium text-gray-600">
      Sessões Realizadas
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-purple-600">
      {estatisticas.sessoes_realizadas}
    </div>
    {estatisticas.sessoes_ativas > 0 && (
      <p className="text-xs text-green-600 mt-1">
        {estatisticas.sessoes_ativas} ativa(s) agora
      </p>
    )}
  </CardContent>
</Card>
```

---

### **Passo 3: Atualizar Página da Sessão**

**Arquivo:** `src/app/dashboard/professor/sessao/[sessionId]/page.tsx`

#### **A. Remover Botão "Pausar" (linhas 329-332)**

```typescript
// ANTES:
<div className="flex gap-3">
  <Button variant="outline" size="sm">
    <Play className="h-4 w-4 mr-2" />
    Pausar
  </Button>
  <Button variant="destructive" size="sm" onClick={handleEncerrarSessao}>
    <XCircle className="h-4 w-4 mr-2" />
    Encerrar Sessão
  </Button>
</div>

// DEPOIS:
<Button variant="destructive" size="sm" onClick={handleEncerrarSessao}>
  <XCircle className="h-4 w-4 mr-2" />
  Encerrar Sessão
</Button>
```

#### **B. Atualizar função handleEncerrarSessao (linhas 252-275)**

```typescript
const handleEncerrarSessao = async () => {
  if (!confirm('Deseja realmente encerrar esta sessão?\n\nIsso encerrará a sessão para todos os alunos.')) return

  try {
    // Usar RPC dedicado
    const { data, error } = await supabase.rpc('encerrar_sessao', {
      p_session_id: sessionId
    })

    if (error) {
      console.error('Erro ao encerrar sessão:', error)
      alert('Erro ao encerrar sessão: ' + error.message)
      return
    }

    if (!data.success) {
      alert('Erro: ' + data.message)
      return
    }

    alert(`Sessão encerrada com sucesso!\n${data.total_participacoes} aluno(s) participaram.`)
    router.push('/dashboard/professor')
    
  } catch (error) {
    console.error('Erro:', error)
    alert('Erro ao encerrar sessão')
  }
}
```

---

## 🧪 Como Testar

### **1. Dashboard do Professor**

1. **Acesse:** `http://localhost:3001/dashboard/professor`
2. **Verifique:**
   - [ ] Card "Sessões Recentes" mostra lista de sessões
   - [ ] Cada sessão mostra status (Ativa/Encerrada)
   - [ ] Botão "Ver Sessão" aparece para sessões ativas
   - [ ] Card "Sessões Realizadas" mostra número correto

### **2. Página da Sessão**

1. **Inicie uma nova sessão**
2. **Acesse a sessão**
3. **Verifique:**
   - [ ] Card "Alunos na Sessão" carrega sem travar
   - [ ] Botão "Pausar" foi removido
   - [ ] Botão "Encerrar Sessão" funciona
   - [ ] Após encerrar, volta para dashboard
   - [ ] Sessão aparece como "Encerrada" em sessões recentes

### **3. Teste com Aluno**

1. **Abra aba anônima**
2. **Acesse:** `http://localhost:3001/entrar`
3. **Entre na sessão com PIN de aluno**
4. **Volte para o dashboard do professor**
5. **Verifique:**
   - [ ] Card "Alunos Conectados" atualiza
   - [ ] Card "Alunos na Sessão" mostra o aluno
   - [ ] Progresso do aluno atualiza a cada 5 segundos

---

## 📊 Checklist de Implementação

- [ ] **Executar SQL** `FIX_RPC_SESSOES_PROFESSOR.sql`
- [ ] **Atualizar** `dashboard/professor/page.tsx`
  - [ ] Adicionar estados para sessões
  - [ ] Adicionar useEffect para carregar sessões
  - [ ] Substituir card "Sessões Recentes"
  - [ ] Atualizar card "Sessões Realizadas"
- [ ] **Atualizar** `dashboard/professor/sessao/[sessionId]/page.tsx`
  - [ ] Remover botão "Pausar"
  - [ ] Atualizar função handleEncerrarSessao
- [ ] **Testar:**
  - [ ] Dashboard carrega sessões
  - [ ] Página da sessão carrega alunos
  - [ ] Encerrar sessão funciona
  - [ ] Sessão aparece como encerrada

---

## 🐛 Problemas Conhecidos

Se o card "Alunos na Sessão" ainda travar:
1. Verifique se o SQL foi executado corretamente
2. Teste o RPC manualmente no SQL Editor:
```sql
SELECT * FROM get_alunos_sessao('session-id-aqui'::uuid);
```
3. Verifique os logs do console do navegador
4. Me envie os erros que aparecerem

---

## 📝 Próximos Passos

Após essas correções funcionarem:
1. Implementar links nos cards ("Ver Turmas", "Ver Conteúdos", "Ver Relatórios")
2. Adicionar filtros em "Sessões Recentes"
3. Melhorar design lúdico do dashboard
4. Adicionar gráficos de progresso

---

**Pronto para implementar?** Execute o Passo 1 primeiro! 🚀

