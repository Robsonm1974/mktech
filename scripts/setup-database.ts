#!/usr/bin/env tsx

/* eslint-disable no-console */
import { config } from 'dotenv'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Carregar variáveis do .env.local
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  console.error('Certifique-se de que .env.local existe com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

async function executeSQL(sql: string, description: string) {
  console.log(`📝 ${description}...`)
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY!
      },
      body: JSON.stringify({ sql })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HTTP ${response.status}: ${error}`)
    }

    console.log(`✅ ${description} - Concluído`)
    return true
  } catch (error) {
    console.error(`❌ ${description} - Erro:`, error instanceof Error ? error.message : error)
    return false
  }
}

async function setupDatabase() {
  console.log('🚀 Configurando banco de dados MKTECH...\n')

  // Verificar se o Supabase está acessível
  try {
    const healthCheck = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY!
      }
    })
    
    if (!healthCheck.ok) {
      throw new Error(`Supabase não acessível: ${healthCheck.status}`)
    }
    
    console.log('✅ Conexão com Supabase estabelecida')
  } catch (error) {
    console.error('❌ Erro ao conectar com Supabase:', error instanceof Error ? error.message : error)
    process.exit(1)
  }

  // Executar migrations
  const migrations = [
    {
      file: 'supabase/migrations/20241215_init_schema.sql',
      description: 'Criando schema inicial'
    },
    {
      file: 'supabase/migrations/20241215_setup_rls.sql', 
      description: 'Configurando RLS (Row Level Security)'
    },
    {
      file: 'supabase/seed.sql',
      description: 'Inserindo dados de exemplo'
    }
  ]

  let success = true
  for (const migration of migrations) {
    try {
      const sqlPath = join(process.cwd(), migration.file)
      const sql = readFileSync(sqlPath, 'utf-8')
      
      const result = await executeSQL(sql, migration.description)
      if (!result) {
        success = false
      }
    } catch (error) {
      console.error(`❌ Erro ao ler arquivo ${migration.file}:`, error instanceof Error ? error.message : error)
      success = false
    }
  }

  if (success) {
    console.log('\n🎉 Banco de dados configurado com sucesso!')
    console.log('\n📋 Próximos passos:')
    console.log('1. Teste a aplicação: pnpm dev')
    console.log('2. Acesse: http://localhost:3000/app/escola-exemplo/join?code=ABC123')
    console.log('3. Use os dados de exemplo:')
    console.log('   - ID do Aluno: STU001, STU002 ou STU003')
    console.log('   - PIN: 1234, 5678 ou 9012')
  } else {
    console.log('\n❌ Alguns erros ocorreram durante a configuração')
    console.log('Verifique os logs acima e tente novamente')
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })
}
