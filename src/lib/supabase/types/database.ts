// Este arquivo será gerado automaticamente pelo Supabase CLI
// pnpm dlx supabase gen types typescript --project-id <SEU_PROJECT_REF> --schema public > src/lib/supabase/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: Record<string, never>
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
