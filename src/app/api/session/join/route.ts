import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/client-server'
import { z } from 'zod'

// Schema de validação para o request
const JoinSessionSchema = z.object({
  tenant: z.string().min(1, 'Tenant é obrigatório'),
  sessionId: z.string().optional(),
  code: z.string().optional(),
  studentId: z.string().min(1, 'ID do aluno é obrigatório'),
  pin: z.string().min(4, 'PIN deve ter pelo menos 4 dígitos').max(6, 'PIN deve ter no máximo 6 dígitos')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados de entrada
    const validation = JoinSessionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { tenant, sessionId, code, studentId, pin } = validation.data

    // Criar cliente Supabase
    const supabase = await createSupabaseServerClient()

    // Buscar tenant pelo slug
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenant)
      .single()

    if (tenantError || !tenantData) {
      return NextResponse.json(
        { error: 'Escola não encontrada' },
        { status: 404 }
      )
    }

    // Buscar aluno
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, name, pin, tenant_id')
      .eq('tenant_id', tenantData.id)
      .eq('student_id', studentId)
      .single()

    if (studentError || !studentData) {
      return NextResponse.json(
        { error: 'Aluno não encontrado' },
        { status: 404 }
      )
    }

    // Verificar PIN
    if (studentData.pin !== pin) {
      return NextResponse.json(
        { error: 'PIN incorreto' },
        { status: 401 }
      )
    }

    // Buscar sessão ativa
    let sessionData = null
    if (sessionId) {
      // Buscar por ID da sessão
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          title,
          status,
          started_at,
          lesson_id,
          lessons (
            id,
            title,
            collection_id,
            collections (
              id,
              name
            )
          )
        `)
        .eq('id', sessionId)
        .eq('tenant_id', tenantData.id)
        .eq('status', 'active')
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: 'Sessão não encontrada ou inativa' },
          { status: 404 }
        )
      }
      sessionData = data
    } else if (code) {
      // Buscar por código da sessão
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          title,
          status,
          started_at,
          lesson_id,
          lessons (
            id,
            title,
            collection_id,
            collections (
              id,
              name
            )
          )
        `)
        .eq('code', code)
        .eq('tenant_id', tenantData.id)
        .eq('status', 'active')
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: 'Código da sessão inválido ou sessão inativa' },
          { status: 404 }
        )
      }
      sessionData = data
    } else {
      return NextResponse.json(
        { error: 'ID da sessão ou código é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o aluno já respondeu algum quiz nesta sessão
    const { data: existingAnswers, error: answersError } = await supabase
      .from('answers')
      .select('id')
      .eq('session_id', sessionData.id)
      .eq('student_id', studentData.id)
      .limit(1)

    if (answersError) {
      console.error('Erro ao verificar respostas:', answersError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    const hasAnswered = existingAnswers && existingAnswers.length > 0

    // Buscar quizzes da aula
    const { data: quizzesData, error: quizzesError } = await supabase
      .from('quizzes')
      .select(`
        id,
        title,
        description,
        settings
      `)
      .eq('lesson_id', sessionData.lesson_id)
      .eq('tenant_id', tenantData.id)

    if (quizzesError) {
      console.error('Erro ao buscar quizzes:', quizzesError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Resposta de sucesso
    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: studentData.id,
          name: studentData.name,
          studentId: studentId
        },
        session: {
          id: sessionData.id,
          title: sessionData.title,
          startedAt: sessionData.started_at,
          lesson: {
            id: sessionData.lessons[0]?.id || '',
            title: sessionData.lessons[0]?.title || '',
            collection: sessionData.lessons[0]?.collections || null
          }
        },
        quizzes: quizzesData || [],
        hasAnswered,
        joinedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro no endpoint /api/session/join:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Método GET para verificar status da sessão
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant')
    const sessionId = searchParams.get('sessionId')
    const code = searchParams.get('code')

    if (!tenant || (!sessionId && !code)) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: tenant e (sessionId ou code)' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Buscar tenant
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenant)
      .single()

    if (tenantError || !tenantData) {
      return NextResponse.json(
        { error: 'Escola não encontrada' },
        { status: 404 }
      )
    }

    // Buscar sessão
    let query = supabase
      .from('sessions')
      .select(`
        id,
        title,
        status,
        started_at,
        ended_at,
        settings
      `)
      .eq('tenant_id', tenantData.id)
      .eq('status', 'active')

    if (sessionId) {
      query = query.eq('id', sessionId)
    } else if (code) {
      query = query.eq('code', code)
    }

    const { data: sessionData, error: sessionError } = await query.single()

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Sessão não encontrada ou inativa' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        session: sessionData,
        isActive: sessionData.status === 'active'
      }
    })

  } catch (error) {
    console.error('Erro no GET /api/session/join:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
