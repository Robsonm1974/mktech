# MKTECH Project Rules - Technical Guidelines & Architecture

**Versão:** 1.0  
**Para:** Cursor AI, Desenvolvedores, Tech Lead  
**Data:** Outubro 2025

---

## 1. TECH STACK & AMBIENTE

### 1.1 Frontend
```
Next.js 14+ (App Router)
├── React 18+
├── TypeScript (strict mode)
├── Tailwind CSS 3.4+
├── Shadcn/ui (latest)
├── Phaser 3.85+ (WebGL)
├── H5P (embedded, self-hosted)
├── Lottie Web (react-lottie-player ou similar)
└── SWR / React Query (optional, para caching)
```

### 1.2 Backend
```
Supabase (PostgreSQL 15+)
├── PostgREST (auto-API)
├── Supabase Auth (Postgres.Auth)
├── Supabase Realtime (websockets)
├── Storage (para assets: vídeos, sprites, áudio)
└── Vector Search (future: embeddings IA)
```

### 1.3 Deployment
```
Frontend:  Vercel (auto-deploy via Git)
Backend:   Supabase Cloud (managed)
Assets:    Supabase Storage (CDN via S3)
Domain:    (a definir — ex.: app.mktech.com.br)
```

### 1.4 Desenvolvimento Local
```bash
# Setup
git clone <repo>
npm install
cp .env.local.example .env.local  # Supabase keys
npm run dev

# Teste
npm run test          # Jest + React Testing Library
npm run lint          # ESLint + Prettier
npm run type-check    # TypeScript check

# Phaser Game Local
npm run dev:phaser    # Hot reload para /public/games
```

**Variáveis de Ambiente (.env.local):**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxxx  # Server-only
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 2. DATABASE SCHEMA & RLS

### 2.1 Estrutura Multi-Tenant

**Principio:** Todos os dados têm `tenant_id` (escola). RLS policies garantem isolamento.

```sql
-- Tenants (Escolas)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  email_admin VARCHAR(255),
  phone VARCHAR(20),
  plan_type VARCHAR(50) DEFAULT 'starter',  -- starter, pro, enterprise
  seats_total INTEGER DEFAULT 30,
  seats_used INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',  -- active, trial, suspended, cancelled
  trial_ends_at TIMESTAMP,
  billing_cycle_start DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Users (Professores, Admins Escola)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL,  -- admin_escola, professor, admin_mktech, superadmin
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- Turmas (Classes)
CREATE TABLE turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,  -- ex.: "5º Ano A"
  grade_level VARCHAR(20) NOT NULL,  -- EF1-3, EF1-4, EF2-5, etc.
  professor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Alunos (Students)
CREATE TABLE alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email_pais VARCHAR(255),  -- email do responsável
  numero_matricula VARCHAR(50),
  data_nascimento DATE,
  sexo VARCHAR(10),
  icone_afinidade VARCHAR(50),  -- dog, cat, fruit, flower
  pin_code VARCHAR(4),  -- 4 dígitos, hash em produção
  ativo BOOLEAN DEFAULT true,
  auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- opcional, para login próprio
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Trilhas (Learning Paths)
CREATE TABLE trilhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  descricao TEXT,
  disciplinas TEXT[],  -- ex.: ["Programação", "Lógica"]
  grade_levels TEXT[],  -- ex.: ["EF2-5", "EF2-6"]
  sequencia INTEGER DEFAULT 1,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Aulas (Classes/Lessons)
CREATE TABLE aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id UUID NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  numero_sequencia INTEGER,
  duracao_minutos INTEGER DEFAULT 30,
  objetivos_aprendizado TEXT,
  disciplinas TEXT[],  -- ex.: ["Lógica", "Programação"]
  grade_level VARCHAR(20),
  pontos_totais INTEGER DEFAULT 0,
  badges_desbloqueaveis JSONB,  -- [ { id, titulo, icone, condicao } ]
  publicada BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Blocos (Content Blocks)
CREATE TABLE blocos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  numero_sequencia INTEGER NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL,  -- video, apresentacao, animacao_lottie
  descricao TEXT,
  duracao_minutos INTEGER DEFAULT 5,
  conteudo_url VARCHAR(512),  -- path to video, lottie JSON, etc.
  pontos_por_bloco INTEGER DEFAULT 0,
  quiz_id UUID,  -- ref to quiz (will add later)
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Quizzes
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bloco_id UUID NOT NULL REFERENCES blocos(id) ON DELETE CASCADE,
  titulo VARCHAR(255),
  tipo VARCHAR(50) NOT NULL,  -- mcq, verdadeiro_falso, phaser_game, h5p_interativo
  descricao TEXT,
  perguntas JSONB,  -- estrutura varia por tipo
  tentativas_permitidas INTEGER DEFAULT 2,
  tempo_limite_seg INTEGER DEFAULT 300,
  pontos_max INTEGER DEFAULT 10,
  hints JSONB,  -- future: array de hints
  phaser_level_json JSONB,  -- se tipo = phaser_game
  h5p_content_id VARCHAR(100),  -- se tipo = h5p_interativo
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Sessions (Instâncias de Aula)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_code VARCHAR(20) UNIQUE,  -- ex.: AB-94
  session_qr_data JSONB,  -- QR payload (ex.: { sessionId, aula_id, turma_id })
  bloco_ativo_numero INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'active',  -- active, paused, completed
  data_inicio TIMESTAMP DEFAULT now(),
  data_fim TIMESTAMP,
  alunos_participantes INTEGER DEFAULT 0,
  criada_em TIMESTAMP DEFAULT now(),
  atualizada_em TIMESTAMP DEFAULT now()
);

-- Quiz Responses (Respostas de Quiz)
CREATE TABLE quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  pergunta_id VARCHAR(100),  -- ex.: "q1"
  resposta_selecionada VARCHAR(500),
  correta BOOLEAN,
  pontos_ganhos INTEGER DEFAULT 0,
  tempo_resposta_seg INTEGER,
  tentativa_numero INTEGER DEFAULT 1,
  criada_em TIMESTAMP DEFAULT now()
);

-- Game Scores (Pontuação Phaser Games)
CREATE TABLE game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  moedas_coletadas INTEGER DEFAULT 0,
  acertos INTEGER DEFAULT 0,
  tempo_total_seg INTEGER DEFAULT 0,
  pontos_finais INTEGER DEFAULT 0,
  criada_em TIMESTAMP DEFAULT now()
);

-- xAPI Events (H5P Tracking)
CREATE TABLE h5p_xapi_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  event_type VARCHAR(100),  -- answered, completed, interacted
  event_data JSONB,  -- { score, maxScore, time, ... }
  timestamp TIMESTAMP DEFAULT now()
);

-- User Progress (Agregação)
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  pontos_totais INTEGER DEFAULT 0,
  badges_conquistadas JSONB,  -- [ { id, titulo, data_conquista } ]
  ultima_aula_id UUID REFERENCES aulas(id),
  ultima_aula_data TIMESTAMP,
  aulas_completadas INTEGER DEFAULT 0,
  atualizada_em TIMESTAMP DEFAULT now()
);

-- Badges (Recompensas)
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50),  -- marco, disciplina, serie
  condicao_tipo VARCHAR(50),  -- x_aulas_completadas, x_acertos_100, etc.
  condicao_valor INTEGER,  -- ex.: 5 (para 5 aulas)
  icon_url VARCHAR(512),
  criada_em TIMESTAMP DEFAULT now()
);

-- Session Logs (Auditoria básica)
CREATE TABLE session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  action VARCHAR(100),  -- session_started, session_ended, quiz_completed, etc.
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  aluno_id UUID REFERENCES alunos(id) ON DELETE SET NULL,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT now()
);

-- H5P Contents (Self-hosted)
CREATE TABLE h5p_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255),
  library VARCHAR(100),  -- ex.: H5P.MultiChoice
  json_data JSONB,  -- conteúdo H5P
  max_score INTEGER DEFAULT 10,
  storage_path VARCHAR(512),  -- path em Supabase Storage
  criada_em TIMESTAMP DEFAULT now()
);
```

### 2.2 RLS Policies

**Conceito:** Cada query é filtrada automaticamente por `tenant_id` e `role`.

```sql
-- Exemplo: Alunos veem apenas sua própria turma
CREATE POLICY alunos_veem_sua_turma ON alunos
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_id = auth.uid())
  );

-- Professores veem alunos de suas turmas
CREATE POLICY professores_veem_seus_alunos ON alunos
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_id = auth.uid())
    AND turma_id IN (
      SELECT id FROM turmas 
      WHERE professor_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Admins escola veem todos alunos do tenant
CREATE POLICY admin_escola_veem_todos ON alunos
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() AND u.role = 'admin_escola'
    )
  );

-- Admin MKTECH vê tudo (sem filtro de tenant_id)
CREATE POLICY mktech_admin_full_access ON alunos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() AND u.role = 'admin_mktech'
    )
  );
```

---

## 3. CODE PATTERNS & CONVENTIONS

### 3.1 Estrutura de Pastas

```
mktech/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── logout/page.tsx
│   │   └── callback/route.ts   # OAuth callback
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Sidebar + Nav
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # Home (role-based)
│   │   │   ├── professor/      # Professor routes
│   │   │   ├── admin-escola/   # Admin escola routes
│   │   │   ├── aluno/          # Aluno routes
│   │   │   └── admin-mktech/   # Admin MKTECH routes
│   │   └── perfil/page.tsx
│   ├── api/                    # API routes (optional, prefer Supabase)
│   └── error.tsx, not-found.tsx
├── components/
│   ├── ui/                     # Shadcn/ui components
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── common/                 # Reusable across app
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   └── Modal.tsx
│   ├── professor/              # Role-specific
│   ├── aluno/
│   ├── admin/
│   └── games/                  # Phaser, H5P wrappers
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Supabase client
│   │   ├── server.ts           # Server-side Supabase
│   │   └── types.ts            # Generated types (optional)
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSession.ts
│   │   └── useTenant.ts
│   ├── utils/
│   │   ├── validators.ts       # Zod schemas
│   │   ├── helpers.ts
│   │   └── constants.ts
│   └── contexts/
│       └── AuthContext.tsx
├── public/
│   ├── games/                  # Phaser games
│   │   └── treasure-run/
│   │       ├── index.html
│   │       ├── game.js
│   │       └── assets/
│   ├── animations/             # Lottie JSON
│   ├── icons/                  # SVGs
│   └── images/
├── styles/
│   ├── global.css              # OKLCH theme, Tailwind directives
│   └── animations.css
├── types/
│   ├── database.ts             # Generated Supabase types
│   ├── index.ts                # App-wide types
│   └── phaser.ts               # Phaser type extensions
├── .env.local.example
├── .eslintrc.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

### 3.2 TypeScript Patterns

**Always use TypeScript strict mode.**

```typescript
// lib/utils/validators.ts
import { z } from 'zod';

export const AlunoSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  turma_id: z.string().uuid(),
  full_name: z.string().min(2).max(255),
  email_pais: z.string().email(),
  icone_afinidade: z.enum(['dog', 'cat', 'fruit', 'flower']),
  pin_code: z.string().regex(/^\d{4}$/),
  ativo: z.boolean(),
  created_at: z.date(),
});

export type Aluno = z.infer<typeof AlunoSchema>;

// Usage in component
import { AlunoSchema } from '@/lib/utils/validators';

const createAluno = async (data: unknown) => {
  const aluno = AlunoSchema.parse(data);  // Throws ZodError if invalid
  // proceed
};
```

### 3.3 Supabase Client Usage

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// app/aluno/perfil/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Aluno } from '@/types/database';

export default function AlunoPerfil() {
  const [aluno, setAluno] = useState<Aluno | null>(null);

  useEffect(() => {
    const fetchAluno = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('alunos')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      setAluno(data);
    };

    fetchAluno();
  }, []);

  return <div>{aluno?.full_name}</div>;
}
```

### 3.4 Real-Time Subscriptions

```typescript
// Monitor sessão em tempo real (professor dashboard)
import { supabase } from '@/lib/supabase/client';

useEffect(() => {
  const channel = supabase
    .channel(`session:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        console.log('Session updated:', payload.new);
        setSession(payload.new);
      }
    )
    .subscribe();

  return () => channel.unsubscribe();
}, [sessionId]);
```

### 3.5 Component Best Practices

```typescript
// ✅ Good: Named export, TypeScript props, composition
interface CardProps {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
}

export function Card({ title, children, isLoading = false }: CardProps) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="font-semibold text-lg">{title}</h2>
      {isLoading ? <Skeleton /> : children}
    </div>
  );
}

// ✅ Good: Custom hooks for logic
export function useAluno(alunoId: string) {
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('alunos')
        .select('*')
        .eq('id', alunoId)
        .single();
      setAluno(data);
      setLoading(false);
    };

    fetch();
  }, [alunoId]);

  return { aluno, loading };
}

// ❌ Avoid: Inline styles, magic numbers, unnamed exports
export default () => (
  <div style={{ marginTop: '16px', color: '#333' }}>
    Content
  </div>
);
```

### 3.6 Styling (Tailwind + Shadcn)

```typescript
// ✅ Use Tailwind utility classes; no inline styles
<div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-6">
  <span className="text-sm font-medium text-muted-foreground">Pontos</span>
  <span className="text-2xl font-bold text-primary">150</span>
</div>

// ✅ Use CSS Variables for theme colors
// global.css
:root {
  --primary: oklch(0.646 0.222 41.116);
  --primary-foreground: oklch(0.98 0.016 73.684);
  /* ... resto das cores OKLCH */
}

// ✅ Dynamic classes with clsx/classnames
import { clsx } from 'clsx';

<button
  className={clsx(
    'px-4 py-2 rounded-md font-medium transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'bg-muted text-muted-foreground hover:bg-muted/80'
  )}
>
  Click me
</button>
```

---

## 4. AUTENTICAÇÃO & AUTORIZAÇÃO

### 4.1 Flow de Autenticação (Resumido)

```
Professor/Admin:
  1. Acessa /login
  2. Email + Senha
  3. Supabase Auth valida
  4. JWT armazenado em session (httpOnly cookie)
  5. Redirect para dashboard (role-based)

Aluno:
  1. Acessa /entrar
  2. Escaneia QR OU digita código
  3. Seleciona nome
  4. Ícone + PIN (validado contra alunos da turma/sessão)
  5. Session criada; JWT em localStorage (ou cookie)
  6. Redirect para /sessao/:sessionId
```

### 4.2 Middleware de Autorização

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin-mktech/:path*'],
};
```

### 4.3 Role-Based Access (RBAC)

```typescript
// lib/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState<'admin_escola' | 'professor' | 'admin_mktech' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', user.id)
          .single();
        setRole(data?.role);
      }
      setUser(user);
      setLoading(false);
    };

    fetchUser();
  }, []);

  return { user, role, loading };
}

// Usage
const { role } = useAuth();

if (!['admin_mktech', 'admin_escola'].includes(role!)) {
  return <Unauthorized />;
}
```

---

## 5. PHASER 3 INTEGRATION

### 5.1 Game Structure

```
/public/games/treasure-run/
├── index.html          # Iframe entry
├── game.js             # Main Phaser scene
├── config.js           # Game config (API keys, etc.)
├── assets/
│   ├── sprites/
│   ├── tilemaps/
│   ├── audio/
│   └── ui/
└── levels/
    └── level_001.json  # Level definition (tilemap, chests, rules)
```

### 5.2 Level JSON Format

```json
{
  "version": 1,
  "tilemap": {
    "tileset": "tileset_forest.png",
    "grid": { "cols": 20, "rows": 12, "tileSize": 48 }
  },
  "player": {
    "sprite": "hero.png",
    "start": { "x": 2, "y": 10 },
    "speed": 140,
    "animations": {
      "idle": { "frames": [0,1,2,3], "fps": 6 },
      "walk": { "frames": [8,9,10,11], "fps": 10 }
    }
  },
  "chests": [
    {
      "id": "c1",
      "pos": { "x": 5, "y": 10 },
      "questionRef": "Q1",
      "reward": 5,
      "sprite": "chest.png"
    }
  ],
  "audio": {
    "bgm": "bg_loop.mp3",
    "openChest": "open.mp3",
    "correct": "success.mp3",
    "wrong": "oops.mp3"
  },
  "rules": {
    "attemptsPerQuestion": 2,
    "timeLimitSec": 300,
    "endCondition": "all_chests"
  }
}
```

### 5.3 Question Pack JSON

```json
{
  "discipline": "programacao",
  "grade": "EF2-6",
  "topic": "algoritmos-basicos",
  "questions": [
    {
      "id": "Q1",
      "type": "mcq",
      "prompt": "Qual estrutura repete uma ação?",
      "choices": ["Se (if)", "Loop", "Função"],
      "correctIndex": 1,
      "hint": "Pense em repetir passos.",
      "points": 5
    }
  ]
}
```

### 5.4 Phaser Game Component (Wrapper)

```typescript
// components/games/PhaserGameWrapper.tsx
'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import TreasureRunScene from '@/public/games/treasure-run/game';

interface PhaserGameWrapperProps {
  levelJsonUrl: string;
  questionPackUrl: string;
  onComplete: (score: number, coins: number, acertos: number) => void;
}

export function PhaserGameWrapper({
  levelJsonUrl,
  questionPackUrl,
  onComplete,
}: PhaserGameWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config = {
      type: Phaser.AUTO,
      width: 960,
      height: 576,
      parent: containerRef.current,
      scene: TreasureRunScene,
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
    };

    const game = new Phaser.Game(config);

    // Pass callbacks to scene
    game.scene.scenes[0].events.on('game-complete', (data) => {
      onComplete(data.score, data.coins, data.acertos);
    });

    return () => {
      game.destroy(true);
    };
  }, [onComplete]);

  return <div ref={containerRef} className="w-full h-screen" />;
}
```

### 5.5 Phaser Scene (Pseudo-code)

```typescript
// /public/games/treasure-run/game.ts
import Phaser from 'phaser';

export default class TreasureRunScene extends Phaser.Scene {
  levelData: any;
  questionPack: any;
  playerScore = 0;
  coinsCollected = 0;
  acertos = 0;

  constructor() {
    super({ key: 'TreasureRun' });
  }

  async preload() {
    // Load assets from URLs
    // this.load.image('hero', '/games/treasure-run/assets/hero.png');
  }

  async create() {
    // Fetch level & questions
    const levelRes = await fetch(window.location.pathname);
    this.levelData = await levelRes.json();

    // Setup tilemap, player, chests
    this.setupMap();
    this.setupPlayer();
    this.setupChests();
    this.setupAudio();
    this.setupInput();
  }

  update() {
    // Player movement logic
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-this.levelData.player.speed);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(this.levelData.player.speed);
    } else {
      this.player.setVelocityX(0);
    }
  }

  private onChestOpen(chest: any) {
    // Show question modal
    const question = this.questionPack.questions.find((q: any) => q.id === chest.questionRef);
    this.showQuestionModal(question, (correct: boolean) => {
      if (correct) {
        this.playerScore += question.points;
        this.coinsCollected += chest.reward;
        this.acertos++;
        chest.destroy();
        this.sound.play('correct');
      } else {
        this.sound.play('wrong');
      }
    });
  }

  private completeGame() {
    this.events.emit('game-complete', {
      score: this.playerScore,
      coins: this.coinsCollected,
      acertos: this.acertos,
    });
  }
}
```

---

## 6. H5P INTEGRATION

### 6.1 Self-Hosted H5P Setup

```typescript
// components/games/H5PWrapper.tsx
'use client';

import { useEffect, useRef } from 'react';

interface H5PWrapperProps {
  contentId: string;
  onComplete: (score: number, maxScore: number) => void;
}

export function H5PWrapper({ contentId, onComplete }: H5PWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load H5P script (hosted locally or via CDN)
    const script = document.createElement('script');
    script.src = '/h5p/h5p-resizer.js';
    document.body.appendChild(script);

    // Initialize H5P content
    if (window.H5P) {
      window.H5P.instances[0]?.on('xAPI', (event: any) => {
        if (event.data.statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed') {
          const score = event.data.statement.result.score?.raw || 0;
          const maxScore = event.data.statement.result.score?.max || 100;
          onComplete(score, maxScore);
        }
      });
    }

    return () => {
      document.body.removeChild(script);
    };
  }, [onComplete]);

  return (
    <div ref={containerRef} className="w-full">
      <div className={`h5p-iframe`} data-content-id={contentId} />
    </div>
  );
}
```

### 6.2 xAPI Event Tracking

```typescript
// lib/hooks/useH5PTracking.ts
export function useH5PTracking(quizId: string, sessionId: string) {
  useEffect(() => {
    const handleXAPIEvent = async (event: any) => {
      const statement = event.data.statement;

      // Save to database
      await supabase
        .from('h5p_xapi_events')
        .insert({
          session_id: sessionId,
          aluno_id: currentAlunoId,
          quiz_id: quizId,
          event_type: statement.verb.id.split('/').pop(), // answered, completed
          event_data: statement.result,
          timestamp: new Date(),
        });
    };

    if (window.H5P) {
      window.H5P.externalDispatcher.on('xAPI', handleXAPIEvent);
    }

    return () => {
      if (window.H5P) {
        window.H5P.externalDispatcher.off('xAPI', handleXAPIEvent);
      }
    };
  }, [quizId, sessionId]);
}
```

---

## 7. LOTTIE ANIMATIONS

### 7.1 Lottie Component

```typescript
// components/common/LottieAnimation.tsx
'use client';

import { useLottie } from 'lottie-react';
import { useEffect, useRef } from 'react';

interface LottieAnimationProps {
  animationData: any;
  autoplay?: boolean;
  loop?: boolean;
  width?: number;
  height?: number;
  className?: string;
  onComplete?: () => void;
}

export function LottieAnimation({
  animationData,
  autoplay = true,
  loop = true,
  width = 200,
  height = 200,
  className = '',
  onComplete,
}: LottieAnimationProps) {
  const lottieRef = useRef<any>(null);

  const { View } = useLottie(
    {
      animationData,
      autoplay,
      loop,
    },
    { width, height }
  );

  useEffect(() => {
    if (lottieRef.current && onComplete && !loop) {
      lottieRef.current.addEventListener('complete', onComplete);
      return () => {
        lottieRef.current?.removeEventListener('complete', onComplete);
      };
    }
  }, [loop, onComplete]);

  return <div ref={lottieRef} className={className}>{View}</div>;
}
```

### 7.2 Usage in Blocos

```typescript
// components/aluno/BlocoPlayer.tsx
import { LottieAnimation } from '@/components/common/LottieAnimation';

export function BlocoPlayer({ bloco }: { bloco: Bloco }) {
  if (bloco.tipo === 'animacao_lottie') {
    return (
      <LottieAnimation
        animationData={bloco.conteudo_url}
        autoplay
        loop={false}
        width={400}
        height={300}
        className="mx-auto"
      />
    );
  }

  if (bloco.tipo === 'video') {
    return (
      <video
        src={bloco.conteudo_url}
        controls
        className="w-full max-w-2xl mx-auto rounded-lg"
      />
    );
  }

  return <div>Tipo de bloco não suportado</div>;
}
```

---

## 8. REAL-TIME & WEBSOCKETS

### 8.1 Session Sync (Professor & Alunos)

```typescript
// lib/hooks/useSessionSync.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useSessionSync(sessionId: string) {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          setSession(payload.new);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);

  return session;
}
```

### 8.2 Broadcast Channel (Quick Updates)

```typescript
// lib/hooks/useBroadcast.ts
export function useBroadcast(channel: string) {
  const [data, setData] = useState<any>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    broadcastRef.current = new BroadcastChannel(channel);

    broadcastRef.current.onmessage = (event) => {
      setData(event.data);
    };

    return () => {
      broadcastRef.current?.close();
    };
  }, [channel]);

  const send = (message: any) => {
    broadcastRef.current?.postMessage(message);
  };

  return { data, send };
}
```

---

## 9. TESTING & QA

### 9.1 Unit Tests (Jest + React Testing Library)

```typescript
// __tests__/lib/utils/validators.test.ts
import { AlunoSchema } from '@/lib/utils/validators';

describe('AlunoSchema', () => {
  it('should validate a correct aluno object', () => {
    const valid = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      tenant_id: '550e8400-e29b-41d4-a716-446655440001',
      turma_id: '550e8400-e29b-41d4-a716-446655440002',
      full_name: 'João Silva',
      email_pais: 'joao@parent.com',
      icone_afinidade: 'dog',
      pin_code: '1234',
      ativo: true,
      created_at: new Date(),
    };

    expect(() => AlunoSchema.parse(valid)).not.toThrow();
  });

  it('should reject invalid pin_code', () => {
    const invalid = { ...validAluno, pin_code: '12345' }; // 5 dígitos

    expect(() => AlunoSchema.parse(invalid)).toThrow();
  });
});
```

### 9.2 Component Tests

```typescript
// __tests__/components/BlocoPlayer.test.tsx
import { render, screen } from '@testing-library/react';
import { BlocoPlayer } from '@/components/aluno/BlocoPlayer';

describe('BlocoPlayer', () => {
  it('renders video bloco', () => {
    const bloco = {
      id: '1',
      tipo: 'video',
      conteudo_url: 'https://example.com/video.mp4',
      titulo: 'Intro to Loops',
    };

    render(<BlocoPlayer bloco={bloco} />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });
});
```

### 9.3 E2E Tests (Playwright)

```typescript
// e2e/aluno-login-flow.spec.ts
import { test, expect } from '@playwright/test';

test('aluno login com QR + icon + PIN', async ({ page }) => {
  await page.goto('/entrar');

  // Simulate QR scan
  await page.fill('input[name="session_code"]', 'AB-94');
  await page.press('input[name="session_code"]', 'Enter');

  // Selecionar aluno
  await page.click('button:has-text("João Silva")');

  // Selecionar ícone
  await page.click('button[data-icon="dog"]');

  // Digitar PIN
  await page.fill('input[type="password"]', '1234');
  await page.click('button:has-text("Entrar")');

  // Verificar redirecionamento
  await expect(page).toHaveURL('/sessao/');
});
```

---

## 10. DEPLOYMENT & CI/CD

### 10.1 GitHub Actions (Deploy to Vercel)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Test
        run: npm run test

      - name: Deploy to Vercel
        uses: vercel/action@v4
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 10.2 Environment Setup (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxxx
NEXT_PUBLIC_APP_URL=https://app.mktech.com.br
```

### 10.3 Monitoring & Alerts

- **Vercel Analytics:** CLS, FID, LCP.
- **Supabase Logs:** Error rate, query performance.
- **Uptime Monitor:** Healthcheck endpoint.

---

## 11. SEED DATA & FIXTURES

### 11.1 Seed Script

```typescript
// scripts/seed.ts
import { supabase } from '@/lib/supabase/server';

async function seedDatabase() {
  // Create test tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .insert({
      name: 'Escola Piloto',
      slug: 'escola-piloto',
      email_admin: 'admin@escolapiloto.com.br',
      seats_total: 50,
    })
    .select()
    .single();

  // Create test users
  const { data: professor } = await supabase
    .from('users')
    .insert({
      tenant_id: tenant.id,
      email: 'professor@escolapiloto.com.br',
      full_name: 'Prof. Maria',
      role: 'professor',
      auth_id: '...', // será criado via auth.signUp
    })
    .select()
    .single();

  // Create test class
  const { data: turma } = await supabase
    .from('turmas')
    .insert({
      tenant_id: tenant.id,
      name: '5º Ano A',
      grade_level: 'EF2-5',
      professor_id: professor.id,
    })
    .select()
    .single();

  // Create test students
  const alunos = [
    { full_name: 'João Silva', icone_afinidade: 'dog', pin_code: '1111' },
    { full_name: 'Maria Santos', icone_afinidade: 'cat', pin_code: '2222' },
    { full_name: 'Pedro Costa', icone_afinidade: 'fruit', pin_code: '3333' },
  ];

  for (const aluno of alunos) {
    await supabase
      .from('alunos')
      .insert({
        tenant_id: tenant.id,
        turma_id: turma.id,
        ...aluno,
        email_pais: `pai.${aluno.full_name.toLowerCase().replace(' ', '')}@email.com`,
      });
  }

  console.log('✅ Seed completed');
}

seedDatabase().catch(console.error);
```

### 11.2 Test Credentials

```
Tenant (Escola):
  Email: admin@escolapiloto.com.br
  Password: Test@1234!

Professor:
  Email: professor@escolapiloto.com.br
  Password: Prof@1234!

Aluno (no app):
  Nome: João Silva
  Ícone: dog
  PIN: 1111

Pais (acessa perfil de João):
  Email: pai.joaosilva@email.com
  Password: (será gerado e forçado trocar 1º acesso)
```

---

## 12. PERFORMANCE & OPTIMIZATION

### 12.1 Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/badges/expert.png"
  alt="Expert Badge"
  width={100}
  height={100}
  priority={false}
  loading="lazy"
/>
```

### 12.2 Code Splitting

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const PhaserGameWrapper = dynamic(() => import('@/components/games/PhaserGameWrapper'), {
  loading: () => <Skeleton className="w-full h-96" />,
  ssr: false,
});
```

### 12.3 Database Query Optimization

```typescript
// ✅ Use select() para limitar colunas
const { data } = await supabase
  .from('alunos')
  .select('id, full_name, pontos_totais')
  .eq('turma_id', turmaId);

// ❌ Avoid: SELECT * (traz todas as colunas)
const { data } = await supabase
  .from('alunos')
  .select('*')
  .eq('turma_id', turmaId);
```

### 12.4 Caching Strategy

```typescript
// Use SWR para auto-refetch
import useSWR from 'swr';

export function useAlunos(turmaId: string) {
  const { data, error, isLoading } = useSWR(
    `/api/turmas/${turmaId}/alunos`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 min
    }
  );

  return { data, error, isLoading };
}
```

---

## 13. ERROR HANDLING & LOGGING

### 13.1 Global Error Boundary

```typescript
// app/error.tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
    // TODO: Send to error tracking (Sentry, etc.)
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h2>Algo deu errado!</h2>
      <button onClick={() => reset()}>Tentar novamente</button>
    </div>
  );
}
```

### 13.2 Logging Utility

```typescript
// lib/logger.ts
export const logger = {
  debug: (msg: string, data?: any) => console.log(`[DEBUG] ${msg}`, data),
  info: (msg: string, data?: any) => console.info(`[INFO] ${msg}`, data),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data),
  error: (msg: string, err?: Error) => {
    console.error(`[ERROR] ${msg}`, err);
    // TODO: Send to external service
  },
};
```

---

## 14. SECURITY CHECKLIST

- [ ] Environment variables não expostas (`.env.local` em `.gitignore`).
- [ ] RLS policies testadas para cada role.
- [ ] Senhas hasheadas (Supabase Auth faz isso).
- [ ] CORS restrito a domínios conhecidos.
- [ ] Rate limiting em endpoints críticos.
- [ ] HTTPS enforced (Vercel + Supabase).
- [ ] XSS prevention (React sanitiza por padrão; usar `dangerouslySetInnerHTML` com cuidado).
- [ ] SQL injection prevention (Supabase parametriza queries).
- [ ] CSRF tokens em forms (Next.js helpers).
- [ ] Audit logs para ações sensíveis.

---

## 15. GIT WORKFLOW

```bash
# Feature branch
git checkout -b feature/aluno-login-qr

# Commit com conventional commits
git commit -m "feat: implement aluno QR login flow"
git commit -m "fix: handle missing PIN validation"

# Push
git push origin feature/aluno-login-qr

# Create PR → Review → Merge to main

# Deploy (automatic via GitHub Actions)
```

---

## 16. REFERENCES & DOCS

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Phaser 3 Docs](https://phaser.io/phaser3)
- [H5P Docs](https://h5p.org/documentation)
- [Shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

**Status:** ✅ Pronto para Desenvolvimento  
**Próximo:** User Rules (Regras de Negócio & Acesso)