import { createBrowserClient } from '@supabase/ssr'

export const createSupabaseBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  console.log('🔧 Supabase Client Config:')
  console.log('URL:', supabaseUrl)
  console.log('Key (primeiros 20 chars):', supabaseAnonKey.substring(0, 20) + '...')

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
