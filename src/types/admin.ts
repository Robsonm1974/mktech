// ============================================================================
// MKTECH Admin Types
// ============================================================================

// Disciplinas
export interface Disciplina {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  cor_hex: string
  icone: string | null
  ativa: boolean
  created_at: string
}

// Planejamentos
export interface Planejamento {
  id: string
  disciplina_id: string
  turma: string
  titulo: string
  documento_md: string | null
  num_blocos: number | null
  pontos_totais: number | null
  pontos_por_quiz: number | null
  codigo_base: string | null
  status: 'rascunho' | 'processado' | 'publicado'
  created_at: string
  updated_at: string
  disciplinas?: Disciplina
}

// Blocos Templates
export interface BlocoTemplate {
  id: string
  planejamento_id: string
  disciplina_id: string | null
  codigo_bloco: string
  numero_sequencia: number | null
  titulo: string
  conteudo_texto: string | null
  tipo_midia: 'video' | 'lottie' | 'phaser' | 'h5p' | 'external_iframe' | 'html5' | null
  midia_url: string | null
  midia_metadata: Record<string, unknown> | null
  quiz_id: string | null
  pontos_bloco: number
  status: 'incompleto' | 'com_midia' | 'com_quiz' | 'completo'
  created_at: string
  updated_at: string
  disciplinas?: Disciplina
  planejamentos?: Planejamento
}

// Aulas Blocos (relacionamento N-N)
export interface AulaBloco {
  id: string
  aula_id: string
  bloco_template_id: string
  ordem_na_aula: number
  created_at: string
}

// Config Global
export interface ConfigGlobal {
  id: string
  chave: string
  valor: string | null
  tipo: 'text' | 'json' | 'url' | 'boolean'
  categoria: 'seo' | 'branding' | 'features'
  descricao: string | null
  updated_at: string
}

// Tenants (from existing schema)
export interface Tenant {
  id: string
  name: string
  slug: string
  email_admin: string | null
  phone: string | null
  plan_type: string
  seats_total: number
  seats_used: number
  status: 'active' | 'trial' | 'suspended' | 'cancelled'
  trial_ends_at: string | null
  billing_cycle_start: string | null
  created_at: string
  updated_at: string
}

// Users (admin roles)
export interface AdminUser {
  id: string
  tenant_id: string
  email: string
  full_name: string | null
  role: 'superadmin' | 'admin_mktech' | 'content_manager' | 'support' | 'professor' | 'admin_escola'
  auth_id: string
  active: boolean
  created_at: string
  updated_at: string
}

// Dashboard Stats
export interface DashboardStats {
  total_tenants: number
  total_students: number
  total_aulas: number
  total_blocos: number
  active_sessions: number
}

// Forms
export interface ImportPlanejamentoForm {
  disciplina_id: string
  turma: string
  titulo: string
  documento_md: string
  num_blocos: number
  pontos_totais: number
  pontos_por_quiz: number
  codigo_base: string
}

export interface CreateTenantForm {
  name: string
  slug: string
  email_admin: string
  phone?: string
  plan_type: string
  seats_total: number
}

export interface CreateBlocoForm {
  planejamento_id: string
  disciplina_id: string
  codigo_bloco: string
  titulo: string
  conteudo_texto: string
  pontos_bloco: number
}

export interface CreateQuizForm {
  bloco_template_id: string
  titulo: string
  tipo: 'mcq' | 'verdadeiro_falso'
  perguntas: QuizQuestion[]
  pontos_max: number
}

export interface QuizQuestion {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
  pontos: number
}

export interface CreateMidiaForm {
  bloco_template_id: string
  tipo_midia: 'video' | 'lottie' | 'phaser' | 'h5p'
  midia_url: string
  midia_metadata?: Record<string, unknown>
}


