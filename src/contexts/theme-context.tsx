'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type AppTheme = 'student' | 'admin'

interface ThemeContextValue {
  theme: AppTheme
  setTheme: (t: AppTheme) => void
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'admin', setTheme: () => {} })

export function ThemeProvider({ initialTheme = 'admin', children }: { initialTheme?: AppTheme; children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(initialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}


