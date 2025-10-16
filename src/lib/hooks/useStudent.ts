import { useEffect, useState } from 'react'

export interface StudentSession {
  alunoId: string
  sessionId: string
  tenantSlug: string
  authenticated: boolean
  timestamp: number
}

export function useStudent() {
  const [studentSession, setStudentSession] = useState<StudentSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStudentSession = () => {
      try {
        const session = localStorage.getItem('studentSession')
        if (session) {
          const parsedSession = JSON.parse(session)
          // Verificar se a sessão não expirou (24 horas)
          const isExpired = Date.now() - parsedSession.timestamp > 24 * 60 * 60 * 1000
          
          if (isExpired) {
            localStorage.removeItem('studentSession')
            setStudentSession(null)
          } else {
            setStudentSession(parsedSession)
          }
        } else {
          setStudentSession(null)
        }
      } catch (error) {
        console.error('Erro ao carregar sessão do aluno:', error)
        setStudentSession(null)
      } finally {
        setLoading(false)
      }
    }

    loadStudentSession()

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'studentSession') {
        loadStudentSession()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const setStudentSessionData = (session: StudentSession) => {
    localStorage.setItem('studentSession', JSON.stringify(session))
    setStudentSession(session)
  }

  const clearStudentSession = () => {
    localStorage.removeItem('studentSession')
    setStudentSession(null)
  }

  const isAuthenticated = () => {
    return studentSession?.authenticated === true
  }

  return {
    studentSession,
    loading,
    setStudentSessionData,
    clearStudentSession,
    isAuthenticated
  }
}

