// ============================================================================
// MKTECH Admin Validations (Zod Schemas)
// ============================================================================

import { z } from 'zod'

// Planejamento Import Schema
export const importPlanejamentoSchema = z.object({
  disciplina_id: z.string().uuid('ID de disciplina inválido'),
  ano_escolar_id: z.string().min(1, 'Ano Escolar é obrigatório').regex(/^EF[1-9]$/, 'Formato inválido (ex: EF1, EF2, ... EF9)'),
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(255),
  documento_md: z.string().min(10, 'Documento deve ter pelo menos 10 caracteres'),
  num_blocos: z.number().int().min(1).max(100),
  pontos_totais: z.number().int().min(1),
  pontos_por_quiz: z.number().int().min(1),
  codigo_base: z.string().min(1, 'Código base é obrigatório').max(20),
  substituir_existentes: z.boolean().optional()
})

export type ImportPlanejamentoInput = z.infer<typeof importPlanejamentoSchema>

// Tenant Creation Schema
export const createTenantSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255),
  slug: z.string()
    .min(3, 'Slug deve ter pelo menos 3 caracteres')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  email_admin: z.string().email('Email inválido'),
  phone: z.string().optional(),
  plan_type: z.enum(['starter', 'pro', 'enterprise']),
  seats_total: z.number().int().min(1, 'Deve ter pelo menos 1 seat')
})

export type CreateTenantInput = z.infer<typeof createTenantSchema>

// Bloco Template Schema
export const createBlocoTemplateSchema = z.object({
  planejamento_id: z.string().uuid(),
  disciplina_id: z.string().uuid().optional(),
  codigo_bloco: z.string().min(1).max(20),
  numero_sequencia: z.number().int().min(1).optional(),
  titulo: z.string().min(1).max(255),
  conteudo_texto: z.string().optional(),
  pontos_bloco: z.number().int().min(0).default(10)
})

export type CreateBlocoTemplateInput = z.infer<typeof createBlocoTemplateSchema>

// Quiz Schema
export const quizQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string().min(3, 'Pergunta deve ter pelo menos 3 caracteres'),
  choices: z.array(z.string()).min(2, 'Deve ter pelo menos 2 opções').max(6),
  correctIndex: z.number().int().min(0),
  pontos: z.number().int().min(1).default(10)
})

export const createQuizSchema = z.object({
  bloco_template_id: z.string().uuid(),
  titulo: z.string().min(1).max(255),
  tipo: z.enum(['mcq', 'verdadeiro_falso']),
  perguntas: z.array(quizQuestionSchema).min(1, 'Deve ter pelo menos 1 pergunta'),
  pontos_max: z.number().int().min(1),
  tentativas_permitidas: z.number().int().min(1).max(5).default(2),
  tempo_limite_seg: z.number().int().min(30).default(300)
})

export type CreateQuizInput = z.infer<typeof createQuizSchema>

// Mídia Schema
export const createMidiaSchema = z.object({
  bloco_template_id: z.string().uuid(),
  tipo_midia: z.enum(['video', 'lottie', 'phaser', 'h5p']),
  midia_url: z.string().url('URL inválida'),
  midia_metadata: z.record(z.string(), z.unknown()).optional()
})

export type CreateMidiaInput = z.infer<typeof createMidiaSchema>

// Config Global Schema
export const updateConfigSchema = z.object({
  chave: z.string().min(1),
  valor: z.string(),
  tipo: z.enum(['text', 'json', 'url', 'boolean']).default('text'),
  categoria: z.enum(['seo', 'branding', 'features']),
  descricao: z.string().optional()
})

export type UpdateConfigInput = z.infer<typeof updateConfigSchema>

// Admin User Schema
export const createAdminUserSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  role: z.enum(['superadmin', 'admin_mktech', 'content_manager', 'support']),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres')
})

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>

// Aula Creation Schema
export const createAulaSchema = z.object({
  trilha_id: z.string().uuid(),
  titulo: z.string().min(3).max(255),
  descricao: z.string().optional(),
  numero_sequencia: z.number().int().min(1).optional(),
  duracao_minutos: z.number().int().min(5).default(30),
  objetivos_aprendizado: z.string().optional(),
  disciplinas: z.array(z.string()).min(1, 'Selecione pelo menos uma disciplina'),
  grade_level: z.string().regex(/^EF[12]-[1-9]$/),
  blocos_template_ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um bloco')
})

export type CreateAulaInput = z.infer<typeof createAulaSchema>

