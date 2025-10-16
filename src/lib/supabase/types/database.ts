// Generated Supabase types - MKTECH Schema
// Baseado no mktech_project_rules.md

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          email_admin: string | null
          phone: string | null
          plan_type: string
          seats_total: number
          seats_used: number
          status: string
          trial_ends_at: string | null
          billing_cycle_start: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          email_admin?: string | null
          phone?: string | null
          plan_type?: string
          seats_total?: number
          seats_used?: number
          status?: string
          trial_ends_at?: string | null
          billing_cycle_start?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          email_admin?: string | null
          phone?: string | null
          plan_type?: string
          seats_total?: number
          seats_used?: number
          status?: string
          trial_ends_at?: string | null
          billing_cycle_start?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          full_name: string | null
          role: string
          auth_id: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          email: string
          full_name?: string | null
          role: string
          auth_id: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          full_name?: string | null
          role?: string
          auth_id?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      turmas: {
        Row: {
          id: string
          tenant_id: string
          name: string
          grade_level: string
          professor_id: string | null
          descricao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          grade_level: string
          professor_id?: string | null
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          grade_level?: string
          professor_id?: string | null
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_professor_id_fkey"
            columns: ["professor_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      alunos: {
        Row: {
          id: string
          tenant_id: string
          turma_id: string
          full_name: string
          email_pais: string | null
          numero_matricula: string | null
          data_nascimento: string | null
          sexo: string | null
          icone_afinidade: string | null
          pin_code: string | null
          ativo: boolean
          auth_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          turma_id: string
          full_name: string
          email_pais?: string | null
          numero_matricula?: string | null
          data_nascimento?: string | null
          sexo?: string | null
          icone_afinidade?: string | null
          pin_code?: string | null
          ativo?: boolean
          auth_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          turma_id?: string
          full_name?: string
          email_pais?: string | null
          numero_matricula?: string | null
          data_nascimento?: string | null
          sexo?: string | null
          icone_afinidade?: string | null
          pin_code?: string | null
          ativo?: boolean
          auth_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alunos_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_turma_id_fkey"
            columns: ["turma_id"]
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          }
        ]
      }
      trilhas: {
        Row: {
          id: string
          name: string
          descricao: string | null
          disciplinas: string[] | null
          grade_levels: string[] | null
          sequencia: number
          ativa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          descricao?: string | null
          disciplinas?: string[] | null
          grade_levels?: string[] | null
          sequencia?: number
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          descricao?: string | null
          disciplinas?: string[] | null
          grade_levels?: string[] | null
          sequencia?: number
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      aulas: {
        Row: {
          id: string
          trilha_id: string
          titulo: string
          descricao: string | null
          numero_sequencia: number | null
          duracao_minutos: number
          objetivos_aprendizado: string | null
          disciplinas: string[] | null
          grade_level: string | null
          pontos_totais: number
          badges_desbloqueaveis: Json | null
          publicada: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trilha_id: string
          titulo: string
          descricao?: string | null
          numero_sequencia?: number | null
          duracao_minutos?: number
          objetivos_aprendizado?: string | null
          disciplinas?: string[] | null
          grade_level?: string | null
          pontos_totais?: number
          badges_desbloqueaveis?: Json | null
          publicada?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trilha_id?: string
          titulo?: string
          descricao?: string | null
          numero_sequencia?: number | null
          duracao_minutos?: number
          objetivos_aprendizado?: string | null
          disciplinas?: string[] | null
          grade_level?: string | null
          pontos_totais?: number
          badges_desbloqueaveis?: Json | null
          publicada?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aulas_trilha_id_fkey"
            columns: ["trilha_id"]
            referencedRelation: "trilhas"
            referencedColumns: ["id"]
          }
        ]
      }
      blocos: {
        Row: {
          id: string
          aula_id: string
          numero_sequencia: number
          titulo: string
          tipo: string
          descricao: string | null
          duracao_minutos: number
          conteudo_url: string | null
          pontos_por_bloco: number
          quiz_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          aula_id: string
          numero_sequencia: number
          titulo: string
          tipo: string
          descricao?: string | null
          duracao_minutos?: number
          conteudo_url?: string | null
          pontos_por_bloco?: number
          quiz_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          aula_id?: string
          numero_sequencia?: number
          titulo?: string
          tipo?: string
          descricao?: string | null
          duracao_minutos?: number
          conteudo_url?: string | null
          pontos_por_bloco?: number
          quiz_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocos_aula_id_fkey"
            columns: ["aula_id"]
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          }
        ]
      }
      quizzes: {
        Row: {
          id: string
          bloco_id: string
          titulo: string | null
          tipo: string
          descricao: string | null
          perguntas: Json | null
          tentativas_permitidas: number
          tempo_limite_seg: number
          pontos_max: number
          hints: Json | null
          phaser_level_json: Json | null
          h5p_content_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bloco_id: string
          titulo?: string | null
          tipo: string
          descricao?: string | null
          perguntas?: Json | null
          tentativas_permitidas?: number
          tempo_limite_seg?: number
          pontos_max?: number
          hints?: Json | null
          phaser_level_json?: Json | null
          h5p_content_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bloco_id?: string
          titulo?: string | null
          tipo?: string
          descricao?: string | null
          perguntas?: Json | null
          tentativas_permitidas?: number
          tempo_limite_seg?: number
          pontos_max?: number
          hints?: Json | null
          phaser_level_json?: Json | null
          h5p_content_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_bloco_id_fkey"
            columns: ["bloco_id"]
            referencedRelation: "blocos"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          id: string
          tenant_id: string
          aula_id: string
          turma_id: string
          professor_id: string
          session_code: string | null
          session_qr_data: Json | null
          bloco_ativo_numero: number
          status: string
          data_inicio: string
          data_fim: string | null
          alunos_participantes: number
          criada_em: string
          atualizada_em: string
        }
        Insert: {
          id?: string
          tenant_id: string
          aula_id: string
          turma_id: string
          professor_id: string
          session_code?: string | null
          session_qr_data?: Json | null
          bloco_ativo_numero?: number
          status?: string
          data_inicio?: string
          data_fim?: string | null
          alunos_participantes?: number
          criada_em?: string
          atualizada_em?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          aula_id?: string
          turma_id?: string
          professor_id?: string
          session_code?: string | null
          session_qr_data?: Json | null
          bloco_ativo_numero?: number
          status?: string
          data_inicio?: string
          data_fim?: string | null
          alunos_participantes?: number
          criada_em?: string
          atualizada_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_aula_id_fkey"
            columns: ["aula_id"]
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_turma_id_fkey"
            columns: ["turma_id"]
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_professor_id_fkey"
            columns: ["professor_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_responses: {
        Row: {
          id: string
          session_id: string
          aluno_id: string
          quiz_id: string
          pergunta_id: string | null
          resposta_selecionada: string | null
          correta: boolean | null
          pontos_ganhos: number
          tempo_resposta_seg: number | null
          tentativa_numero: number
          criada_em: string
        }
        Insert: {
          id?: string
          session_id: string
          aluno_id: string
          quiz_id: string
          pergunta_id?: string | null
          resposta_selecionada?: string | null
          correta?: boolean | null
          pontos_ganhos?: number
          tempo_resposta_seg?: number | null
          tentativa_numero?: number
          criada_em?: string
        }
        Update: {
          id?: string
          session_id?: string
          aluno_id?: string
          quiz_id?: string
          pergunta_id?: string | null
          resposta_selecionada?: string | null
          correta?: boolean | null
          pontos_ganhos?: number
          tempo_resposta_seg?: number | null
          tentativa_numero?: number
          criada_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_aluno_id_fkey"
            columns: ["aluno_id"]
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_quiz_id_fkey"
            columns: ["quiz_id"]
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          }
        ]
      }
      game_scores: {
        Row: {
          id: string
          session_id: string
          aluno_id: string
          quiz_id: string
          moedas_coletadas: number
          acertos: number
          tempo_total_seg: number
          pontos_finais: number
          criada_em: string
        }
        Insert: {
          id?: string
          session_id: string
          aluno_id: string
          quiz_id: string
          moedas_coletadas?: number
          acertos?: number
          tempo_total_seg?: number
          pontos_finais?: number
          criada_em?: string
        }
        Update: {
          id?: string
          session_id?: string
          aluno_id?: string
          quiz_id?: string
          moedas_coletadas?: number
          acertos?: number
          tempo_total_seg?: number
          pontos_finais?: number
          criada_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_scores_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_scores_aluno_id_fkey"
            columns: ["aluno_id"]
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_scores_quiz_id_fkey"
            columns: ["quiz_id"]
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          }
        ]
      }
      h5p_xapi_events: {
        Row: {
          id: string
          session_id: string
          aluno_id: string
          quiz_id: string
          event_type: string | null
          event_data: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          session_id: string
          aluno_id: string
          quiz_id: string
          event_type?: string | null
          event_data?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          session_id?: string
          aluno_id?: string
          quiz_id?: string
          event_type?: string | null
          event_data?: Json | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "h5p_xapi_events_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "h5p_xapi_events_aluno_id_fkey"
            columns: ["aluno_id"]
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "h5p_xapi_events_quiz_id_fkey"
            columns: ["quiz_id"]
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          }
        ]
      }
      user_progress: {
        Row: {
          id: string
          aluno_id: string
          pontos_totais: number
          badges_conquistadas: Json | null
          ultima_aula_id: string | null
          ultima_aula_data: string | null
          aulas_completadas: number
          atualizada_em: string
        }
        Insert: {
          id?: string
          aluno_id: string
          pontos_totais?: number
          badges_conquistadas?: Json | null
          ultima_aula_id?: string | null
          ultima_aula_data?: string | null
          aulas_completadas?: number
          atualizada_em?: string
        }
        Update: {
          id?: string
          aluno_id?: string
          pontos_totais?: number
          badges_conquistadas?: Json | null
          ultima_aula_id?: string | null
          ultima_aula_data?: string | null
          aulas_completadas?: number
          atualizada_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_aluno_id_fkey"
            columns: ["aluno_id"]
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_ultima_aula_id_fkey"
            columns: ["ultima_aula_id"]
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          }
        ]
      }
      badges: {
        Row: {
          id: string
          titulo: string
          descricao: string | null
          tipo: string | null
          condicao_tipo: string | null
          condicao_valor: number | null
          icon_url: string | null
          criada_em: string
        }
        Insert: {
          id?: string
          titulo: string
          descricao?: string | null
          tipo?: string | null
          condicao_tipo?: string | null
          condicao_valor?: number | null
          icon_url?: string | null
          criada_em?: string
        }
        Update: {
          id?: string
          titulo?: string
          descricao?: string | null
          tipo?: string | null
          condicao_tipo?: string | null
          condicao_valor?: number | null
          icon_url?: string | null
          criada_em?: string
        }
        Relationships: []
      }
      session_logs: {
        Row: {
          id: string
          tenant_id: string
          session_id: string | null
          action: string | null
          user_id: string | null
          aluno_id: string | null
          metadata: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          tenant_id: string
          session_id?: string | null
          action?: string | null
          user_id?: string | null
          aluno_id?: string | null
          metadata?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          session_id?: string | null
          action?: string | null
          user_id?: string | null
          aluno_id?: string | null
          metadata?: Json | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_logs_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_logs_aluno_id_fkey"
            columns: ["aluno_id"]
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          }
        ]
      }
      h5p_contents: {
        Row: {
          id: string
          titulo: string | null
          library: string | null
          json_data: Json | null
          max_score: number
          storage_path: string | null
          criada_em: string
        }
        Insert: {
          id?: string
          titulo?: string | null
          library?: string | null
          json_data?: Json | null
          max_score?: number
          storage_path?: string | null
          criada_em?: string
        }
        Update: {
          id?: string
          titulo?: string | null
          library?: string | null
          json_data?: Json | null
          max_score?: number
          storage_path?: string | null
          criada_em?: string
        }
        Relationships: []
      }
    }
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