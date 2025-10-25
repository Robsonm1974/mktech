#!/usr/bin/env node

// Teste simples de autenticação
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kcvlauuzwnrfdgwlxcnw.supabase.co'
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdmxhdXV6d25yZmRnd2x4Y253Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0OTkwNjUsImV4cCI6MjA3NjA3NTA2NX0.j_8sAw28MpoEHzV6pKF6RNfVvVwVN1MQEkXEtrQDTH4'

console.log('🔍 Teste de Autenticação Simples')
console.log('URL:', supabaseUrl)
console.log('Key:', anonKey.substring(0, 20) + '...')

const supabase = createClient(supabaseUrl, anonKey)

async function testAuth() {
  try {
    // Teste 1: Login com email/password
    console.log('\n🔐 Teste 1: Tentando login...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'robsonm1974@gmail.com',
      password: '123456'
    })

    if (error) {
      console.error('❌ Erro no login:', error)
      return
    }

    console.log('✅ Login bem-sucedido!')
    console.log('👤 Usuário:', data.user?.email)
    console.log('🔑 Token (primeiros 50 chars):', data.session?.access_token.substring(0, 50))

    // Teste 2: Tentar acessar tabela users com o token
    console.log('\n📊 Teste 2: Acessando tabela users...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'robsonm1974@gmail.com')
      .single()

    if (userError) {
      console.error('❌ Erro ao acessar users:', userError)
    } else {
      console.log('✅ Sucesso! Dados do usuário:', userData)
    }

    // Teste 3: Verificar sessão atual
    console.log('\n🔍 Teste 3: Verificando sessão...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError)
    } else {
      console.log('✅ Sessão ativa:', session ? 'Sim' : 'Não')
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error)
  }
}

testAuth()




