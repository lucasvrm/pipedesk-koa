import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface PreferencesContextType {
  compactMode: boolean
  setCompactMode: (compact: boolean) => void
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [compactMode, setCompactModeState] = useState(() => {
    const saved = localStorage.getItem('preferences:compactMode')
    return saved === 'true'
  })

  useEffect(() => {
    if (compactMode) {
      document.body.classList.add('compact')
    } else {
      document.body.classList.remove('compact')
    }
    localStorage.setItem('preferences:compactMode', String(compactMode))
  }, [compactMode])

  const setCompactMode = (compact: boolean) => {
    setCompactModeState(compact)
  }

  return (
    <PreferencesContext.Provider value={{ compactMode, setCompactMode }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}
