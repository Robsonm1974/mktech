import { ReactNode } from 'react'
import { ThemeProvider } from '@/contexts/theme-context'

export default function ProfessorLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider initialTheme="student">
      {children}
    </ThemeProvider>
  )
}


