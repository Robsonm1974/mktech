#!/usr/bin/env node

/**
 * DIAGNÓSTICO COMPLETO DO PROJETO MKTECH
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kcvlauuzwnrfdgwlxcnw.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdmxhdXV6d25yZmRnd2x4Y253Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0OTkwNjUsImV4cCI6MjA3NjA3NTA2NX0.j_8sAw28MpoEHzV6pKF6RNfVvVwVN1MQEkXEtrQDTH4'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdmxhdXV6d25yZmRnd2x4Y253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ5OTA2NSwiZXhwIjoyMDc2MDc1MDY1fQ.jdJwVHrGPT2TGj7uDcsUd3DwFVB2t9elpB3Fgdst6Hg'

console.log('═══════════════════════════════════════════════════════')
console.log('🔍 DIAGNÓSTICO COMPLETO - MKTECH PROJECT')
console.log('═══════════════════════════════════════════════════════\n')

async function fullDiagnosis() {
  // TESTE 1: Verificar conexão básica
  console.log('📡 TESTE 1: Verificando conexão básica...')
  console.log('URL:', supabaseUrl)
  console.log('Anon Key:', anonKey.substring(0, 30) + '...')
  
  const supabaseAnon = createClient(supabaseUrl, anonKey)
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  // TESTE 2: Verificar tabelas públicas (sem auth)
  console.log('\n📊 TESTE 2: Acessando tabelas públicas (sem autenticação)...')
  try {
    const { data, error } = await supabaseAnon.from('tenants').select('count').limit(1)
    if (error) {
      console.error('❌ Erro ao acessar tenants:', error.message)
    } else {
      console.log('✅ Tabela tenants acessível')
    }
  } catch (err) {
    console.error('💥 Erro inesperado:', err.message)
  }

  // TESTE 3: Login e verificar auth
  console.log('\n🔐 TESTE 3: Testando autenticação...')
  try {
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: 'robsonm1974@gmail.com',
      password: '123456'
    })

    if (authError) {
      console.error('❌ Erro no login:', authError.message)
      return
    }

    console.log('✅ Login bem-sucedido!')
    console.log('📧 Email:', authData.user.email)
    console.log('🆔 Auth ID:', authData.user.id)
    console.log('🔑 Token:', authData.session.access_token.substring(0, 50) + '...')

    // TESTE 4: Acessar users com usuário autenticado
    console.log('\n👤 TESTE 4: Buscando dados na tabela users (autenticado)...')
    const { data: userData, error: userError } = await supabaseAnon
      .from('users')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar na tabela users:', userError.message)
      console.error('❌ Código do erro:', userError.code)
      console.error('❌ Detalhes:', userError.details)
    } else {
      console.log('✅ Dados do usuário encontrados:', userData)
    }

    // TESTE 5: Usar service_role para verificar dados
    console.log('\n🔧 TESTE 5: Verificando dados com service_role...')
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('users')
      .select('*')

    if (adminError) {
      console.error('❌ Erro com service_role:', adminError.message)
    } else {
      console.log('✅ Total de usuários no banco:', adminUsers.length)
      console.log('👥 Usuários encontrados:')
      adminUsers.forEach(user => {
        console.log(`  - ${user.email} | auth_id: ${user.auth_id || 'NULL'}`)
      })
    }

    // TESTE 6: Verificar se auth_id existe
    console.log('\n🔍 TESTE 6: Verificando correspondência auth_id...')
    const userWithAuthId = adminUsers.find(u => u.auth_id === authData.user.id)
    if (userWithAuthId) {
      console.log('✅ Usuário encontrado com auth_id correspondente:')
      console.log(userWithAuthId)
    } else {
      console.error('❌ PROBLEMA: Nenhum usuário com auth_id:', authData.user.id)
      console.log('\n🔧 SOLUÇÃO: Execute este SQL no Supabase Dashboard:')
      console.log(`
UPDATE users 
SET auth_id = '${authData.user.id}'
WHERE email = 'robsonm1974@gmail.com';
      `)
    }

  } catch (err) {
    console.error('💥 Erro geral:', err.message)
  }

  // TESTE 7: Verificar RLS
  console.log('\n🔒 TESTE 7: Verificando status RLS...')
  try {
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', ['users', 'tenants', 'turmas', 'alunos'])

    if (rlsError) {
      console.log('ℹ️  Não foi possível verificar RLS via API')
    } else {
      console.log('📊 Status RLS das tabelas:')
      rlsStatus.forEach(table => {
        const status = table.rowsecurity ? '🔒 ATIVO' : '🔓 DESATIVADO'
        console.log(`  - ${table.tablename}: ${status}`)
      })
    }
  } catch (err) {
    console.log('ℹ️  RLS check via API não disponível')
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('✅ DIAGNÓSTICO COMPLETO')
  console.log('═══════════════════════════════════════════════════════')
}

fullDiagnosis().catch(console.error)




