#!/usr/bin/env node

// Script para testar conexão com Supabase usando service_role
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kcvlauuzwnrfdgwlxcnw.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdmxhdXV6d25yZmRnd2x4Y253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ5OTA2NSwiZXhwIjoyMDc2MDc1MDY1fQ.jdJwVHrGPT2TGj7uDcsUd3DwFVB2t9elpB3Fgdst6Hg'

// Criar cliente com service_role (bypassa RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...')
  
  try {
    // Teste 1: Verificar se consegue acessar tabela users
    console.log('\n📊 Teste 1: Acessando tabela users...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5)
    
    if (usersError) {
      console.error('❌ Erro ao acessar users:', usersError)
    } else {
      console.log('✅ Sucesso! Usuários encontrados:', users.length)
      console.log('👤 Primeiro usuário:', users[0])
    }

    // Teste 2: Verificar políticas RLS
    console.log('\n🔒 Teste 2: Verificando políticas RLS...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_rls_policies')
      .catch(() => {
        // Se a função não existir, vamos criar uma consulta direta
        return supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'users')
      })
    
    if (policiesError) {
      console.log('ℹ️ Função RLS não disponível, usando consulta direta')
    } else {
      console.log('✅ Políticas RLS:', policies)
    }

    // Teste 3: Verificar usuário específico
    console.log('\n👤 Teste 3: Buscando usuário robsonm1974@gmail.com...')
    const { data: specificUser, error: specificError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'robsonm1974@gmail.com')
      .single()
    
    if (specificError) {
      console.error('❌ Erro ao buscar usuário específico:', specificError)
    } else {
      console.log('✅ Usuário encontrado:', specificUser)
    }

    // Teste 4: Verificar auth.users
    console.log('\n🔐 Teste 4: Verificando auth.users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Erro ao acessar auth.users:', authError)
    } else {
      console.log('✅ Usuários auth encontrados:', authUsers.users.length)
      const robUser = authUsers.users.find(u => u.email === 'robsonm1974@gmail.com')
      if (robUser) {
        console.log('👤 Usuário Robson no auth:', robUser)
      }
    }

  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

testSupabaseConnection()

