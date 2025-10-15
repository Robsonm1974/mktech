/* eslint-disable no-console */
import { config } from 'dotenv'
import { execSync } from 'node:child_process'

// Carregar variáveis do .env.local
config({ path: '.env.local' })

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

const miss = required.filter(k => !process.env[k])
if (miss.length) {
  console.error('Variáveis ausentes:', miss.join(', '))
  process.exit(1)
}

try {
  const node = execSync('node -v').toString().trim()
  const pnpm = execSync('pnpm -v').toString().trim()
  console.log('Node:', node, '| PNPM:', pnpm)
} catch {
  console.error('Falha ao verificar Node/PNPM')
  process.exit(1)
}

console.log('Preflight OK')
