#!/usr/bin/env node

// Script simplificado para diagnosticar Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kcvlauuzwnrfdgwlxcnw.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdmxhdXV6d25yZmRnd2x4Y253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ5OTA2NSwiZXhwIjoyMDc2MDc1MDY1fQ.jdJwVHrGPT2TGj7uDcsUd3DwFVB2t9elpB3Fgdst6Hg'

// Criar cliente com service_role
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function diagnoseSupabase() {
  console.log('🔍 Diagnóstico Supabase com Service Role...')
  console.log('URL:', supabaseUrl)
  console.log('Key (primeiros 20 chars):', serviceRoleKey.substring(0, 20) + '...')
  
  try {
    // Teste 1: Verificar se consegue fazer qualquer consulta
    console.log('\n📊 Teste 1: Consulta básica...')
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro na consulta básica:', error)
    } else {
      console.log('✅ Consulta básica funcionou:', data)
    }

    // Teste 2: Tentar acessar users especificamente
    console.log('\n👤 Teste 2: Acessando tabela users...')
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count')
    
    if (usersError) {
      console.error('❌ Erro específico na tabela users:', usersError)
    } else {
      console.log('✅ Acesso à tabela users funcionou:', usersData)
    }

    // Teste 3: Verificar se RLS está realmente habilitado
    console.log('\n🔒 Teste 3: Verificando RLS...')
    const { data: rlsData, error: rlsError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('tablename', 'users')
    
    if (rlsError) {
      console.error('❌ Erro ao verificar RLS:', rlsError)
    } else {
      console.log('✅ Status RLS:', rlsData)
    }

    // Teste 4: Tentar desabilitar RLS temporariamente
    console.log('\n🔧 Teste 4: Tentando desabilitar RLS...')
    const { error: disableError } = await supabase
      .rpc('exec_sql', { sql: 'ALTER TABLE users DISABLE ROW LEVEL SECURITY;' })
    
    if (disableError) {
      console.error('❌ Erro ao desabilitar RLS:', disableError)
    } else {
      console.log('✅ RLS desabilitado com sucesso!')
      
      // Testar acesso após desabilitar RLS
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('*')
        .limit(1)
      
      if (testError) {
        console.error('❌ Ainda erro após desabilitar RLS:', testError)
      } else {
        console.log('✅ Acesso funcionou após desabilitar RLS:', testData)
      }
    }

  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

diagnoseSupabase()



