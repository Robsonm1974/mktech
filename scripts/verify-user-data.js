#!/usr/bin/env node

// Verificar dados do usuário
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kcvlauuzwnrfdgwlxcnw.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdmxhdXV6d25yZmRnd2x4Y253Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0OTkwNjUsImV4cCI6MjA3NjA3NTA2NX0.j_8sAw28MpoEHzV6pKF6RNfVvVwVN1MQEkXEtrQDTH4'

const supabase = createClient(supabaseUrl, anonKey)

async function verifyUserData() {
  try {
    // Passo 1: Fazer login
    console.log('🔐 Fazendo login...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'robsonm1974@gmail.com',
      password: '123456'
    })

    if (authError) {
      console.error('❌ Erro no login:', authError)
      return
    }

    console.log('✅ Login bem-sucedido!')
    console.log('👤 Auth User ID:', authData.user.id)
    console.log('📧 Email:', authData.user.email)

    // Passo 2: Buscar na tabela users pelo auth_id
    console.log('\n📊 Buscando na tabela users...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
    } else if (!userData) {
      console.error('❌ Nenhum usuário encontrado com auth_id:', authData.user.id)
    } else {
      console.log('✅ Usuário encontrado:', userData)
    }

    // Passo 3: Listar TODOS os usuários na tabela
    console.log('\n👥 Listando TODOS os usuários na tabela users...')
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('*')

    if (allError) {
      console.error('❌ Erro ao listar usuários:', allError)
    } else {
      console.log('✅ Total de usuários:', allUsers?.length || 0)
      allUsers?.forEach(user => {
        console.log('  -', user.email, '| auth_id:', user.auth_id)
      })
    }

    // Passo 4: Verificar se auth_id está NULL
    console.log('\n🔍 Verificando usuários com auth_id NULL...')
    const { data: nullAuthUsers, error: nullError } = await supabase
      .from('users')
      .select('*')
      .is('auth_id', null)

    if (nullError) {
      console.error('❌ Erro ao verificar NULL:', nullError)
    } else {
      console.log('⚠️ Usuários com auth_id NULL:', nullAuthUsers?.length || 0)
      nullAuthUsers?.forEach(user => {
        console.log('  -', user.email, '| ID:', user.id)
      })
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error)
  }
}

verifyUserData()




