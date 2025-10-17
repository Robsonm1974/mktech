# Instalação do Painel Administrativo MKTECH

Este documento contém as instruções para configurar o painel administrativo.

## 1. Executar Migrations no Supabase

### 1.1 Migration Principal (Tabelas e Seed)

Execute o arquivo `supabase/migrations/20241017_admin_extensions.sql` no SQL Editor do Supabase.

```sql
-- O arquivo já está criado em: supabase/migrations/20241017_admin_extensions.sql
-- Copie e cole o conteúdo inteiro no SQL Editor do Supabase
```

### 1.2 Migration RLS (Políticas de Segurança) ⚠️ OBRIGATÓRIO

**Sem esta migration, o select de disciplinas não vai funcionar!**

Execute o arquivo `supabase/migrations/20241017_rls_disciplinas.sql` no SQL Editor do Supabase.

```sql
-- O arquivo já está criado em: supabase/migrations/20241017_rls_disciplinas.sql
-- Esta migration cria as políticas RLS (Row Level Security) necessárias para:
-- - disciplinas (leitura pública de ativas + superadmin full access)
-- - planejamentos (superadmin full access)
-- - blocos_templates (superadmin full access)
-- - aulas_blocos (superadmin full access)
-- - config_global (leitura pública + superadmin edit)
```

## 2. Criar Usuário Superadmin

Execute o seguinte SQL no Supabase SQL Editor:

```sql
-- Passo 1: Criar usuário no auth.users
-- IMPORTANTE: Copie o ID retornado para usar no próximo passo
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'mk-admin@mktech.com',
  crypt('#1Salo4#2025', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  ''
) RETURNING id;
```

**IMPORTANTE:** Copie o UUID retornado (ex: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

```sql
-- Passo 2: Criar registro na tabela users
-- Substitua [ID_RETORNADO_ACIMA] pelo UUID copiado
INSERT INTO users (
  id, 
  tenant_id, 
  email, 
  full_name, 
  role, 
  auth_id, 
  active
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'mk-admin@mktech.com',
  'MKTECH Admin',
  'superadmin',
  'de3f0803-61cc-4c67-b6b2-3bdc5adafcda',  -- SUBSTITUIR AQUI
  true
);
```

## 3. Credenciais de Acesso

- **URL:** `http://localhost:3000/admin/login`
- **Email:** `mk-admin@mktech.com`
- **Senha:** `#1Salo4#2025`

## 4. Estrutura Criada

### Páginas Implementadas

#### ✅ FASE 1 - Completa
- `/admin/login` - Autenticação de superuser
- Middleware de proteção de rotas

#### ✅ FASE 2 - Completa
- `/admin/dashboard` - Dashboard principal com estatísticas
- `/admin/tenants` - Lista de escolas
- `/admin/tenants/novo` - Criar nova escola
- `/admin/tenants/[id]/editar` - Editar escola

#### ✅ FASE 3 - Completa
- `/admin/blocos` - Lista de blocos templates
- `/admin/blocos/importar` - Importar planejamento
- `/admin/blocos/[id]/editar` - Editar bloco

#### 🚧 FASE 4, 5, 6 - Placeholders Criados
- `/admin/midias/criar` - Criar mídias (placeholder)
- `/admin/quizzes/criar` - Criar quizzes (placeholder)
- `/admin/aulas` - Gerenciar aulas (placeholder)
- `/admin/usuarios` - Usuários admin (placeholder)
- `/admin/config` - Configurações globais (placeholder)

### Tabelas Criadas no Banco

1. **disciplinas** - Disciplinas (Algoritmos, Inglês, etc)
2. **planejamentos** - Documentos de planejamento importados
3. **blocos_templates** - Blocos de conteúdo reutilizáveis
4. **aulas_blocos** - Relacionamento N-N entre aulas e blocos
5. **config_global** - Configurações de SEO e branding

### Componentes Criados

- `AdminSidebar` - Barra lateral com navegação
- `AdminHeader` - Cabeçalho com logout
- `TenantsList` - Lista de tenants
- `BlocosGroupedList` - Lista de blocos agrupada por disciplina

### Types e Validações

- `src/types/admin.ts` - Interfaces TypeScript
- `src/lib/admin/validations.ts` - Schemas Zod

## 5. Funcionalidades Implementadas

### Gestão de Tenants (Escolas)
- ✅ Listar escolas com status
- ✅ Criar nova escola com validação
- ✅ Editar escola existente
- ✅ Visualizar seats usados/totais
- ⏳ Deletar escola (TODO)

### Fábrica de Blocos
- ✅ Importar documento de planejamento
- ✅ Parser automático de blocos (separação por --- ou \n\n)
- ✅ Lista agrupada por disciplina e turma
- ✅ Editar bloco individual
- ✅ Códigos automáticos (ALG-1-1, ALG-1-2, etc)
- ✅ Status tracking (incompleto, com_midia, com_quiz, completo)
- ⏳ Criar mídia para bloco (placeholder)
- ⏳ Criar quiz para bloco (placeholder)

### Dashboard
- ✅ Estatísticas em tempo real:
  - Total de tenants
  - Total de alunos
  - Aulas publicadas
  - Blocos criados
  - Sessões ativas
- ✅ Ações rápidas
- ⏳ Atividades recentes (TODO)

## 6. Guardrails Implementados

### TypeScript Strict
- ✅ `noImplicitAny: true`
- ✅ `noUncheckedIndexedAccess: true`
- ✅ ESLint rule `@typescript-eslint/no-explicit-any: "error"`
- ✅ Tipagem completa em todos os componentes
- ✅ Nenhum uso de `any`

### Validação
- ✅ Schemas Zod para todos os formulários
- ✅ Validação client-side e server-side
- ✅ Mensagens de erro específicas por campo

### UX/Performance
- ✅ Loading states em todos os formulários
- ✅ Skeleton loaders onde apropriado
- ✅ Error boundaries preparadas
- ✅ Suspense boundaries onde necessário
- ✅ Feedback visual de ações (botões disabled, spinners)

## 7. Próximos Passos (Fases 4, 5, 6)

### FASE 4 - Mídias & Quizzes
- [ ] Wizard de criação de mídias (vídeo, lottie, phaser, h5p)
- [ ] Form builder de quizzes (MCQ, V/F)
- [ ] Upload de arquivos para Supabase Storage
- [ ] Preview de mídias

### FASE 5 - Montagem de Aulas
- [ ] Grade semanal interativa
- [ ] Drag-and-drop de blocos
- [ ] CRUD completo de aulas
- [ ] Preview integrado de aula

### FASE 6 - Usuários & Config
- [ ] CRUD de usuários administrativos
- [ ] Diferentes roles (superadmin, admin_mktech, content_manager, support)
- [ ] Upload de logo e favicon
- [ ] Editor de configurações SEO
- [ ] Theme customization

## 8. Testando a Implementação

1. Execute a migration no Supabase
2. Crie o usuário superadmin
3. Inicie o servidor de desenvolvimento:
   ```bash
   pnpm dev
   ```
4. Acesse: `http://localhost:3000/admin/login`
5. Faça login com as credenciais acima
6. Teste o fluxo:
   - Dashboard → visualizar estatísticas
   - Tenants → criar uma nova escola
   - Blocos → importar um planejamento de teste
   - Editar blocos criados

## 9. Exemplo de Documento de Planejamento

Cole este exemplo na página de importação para testar:

```markdown
# Introdução a Algoritmos
Nesta aula, vamos aprender o que são algoritmos e como eles funcionam.

---

# Sequência de Passos
Um algoritmo é uma sequência de passos para resolver um problema.

---

# Exemplo Prático
Vamos ver um exemplo de algoritmo: fazer um suco.
1. Pegar a fruta
2. Cortar a fruta
3. Bater no liquidificador

---

# Exercício
Crie um algoritmo para escovar os dentes.
```

Configuração sugerida:
- Disciplina: Algoritmos
- Turma: EF2-5
- Código Base: ALG-1
- Número de Blocos: 4
- Pontos Totais: 40
- Pontos por Quiz: 10

## 10. Estrutura de Arquivos Criada

```
src/
├── app/
│   └── admin/
│       ├── layout.tsx
│       ├── login/page.tsx
│       ├── dashboard/page.tsx
│       ├── tenants/
│       │   ├── page.tsx
│       │   ├── novo/page.tsx
│       │   └── [id]/editar/page.tsx
│       ├── blocos/
│       │   ├── page.tsx
│       │   ├── importar/page.tsx
│       │   └── [id]/editar/page.tsx
│       ├── midias/criar/page.tsx
│       ├── quizzes/criar/page.tsx
│       ├── aulas/page.tsx
│       ├── usuarios/page.tsx
│       └── config/page.tsx
├── components/
│   └── admin/
│       ├── AdminSidebar.tsx
│       ├── AdminHeader.tsx
│       ├── tenants/TenantsList.tsx
│       └── blocos/BlocosGroupedList.tsx
├── types/
│   └── admin.ts
├── lib/
│   └── admin/
│       └── validations.ts
├── middleware.ts
└── supabase/
    └── migrations/
        └── 20241017_admin_extensions.sql
```

## 11. Troubleshooting

### Erro: "Failed to fetch"
- Verifique se o Supabase está configurado corretamente (.env.local)
- Verifique se as migrations foram executadas

### Erro: "Role not found" após login
- Certifique-se de que executou o Passo 2 (criar registro em users)
- Verifique se o auth_id corresponde ao ID do auth.users

### Página em branco após login
- Verifique o console do navegador
- Verifique se o middleware está funcionando
- Limpe o cache e cookies

## 12. Segurança

- ✅ Middleware protege todas as rotas /admin/*
- ✅ Validação de role em cada request
- ✅ Senhas hasheadas com bcrypt
- ✅ Validação Zod em todos os formulários
- ✅ Prepared statements (Supabase)
- ⚠️ TODO: Rate limiting
- ⚠️ TODO: Audit logs

