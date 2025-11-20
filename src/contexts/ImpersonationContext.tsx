import { createContext, useContext, useState, ReactNode } from 'react'

interface ImpersonationContextType {
  isImpersonating: boolean
  setIsImpersonating: (value: boolean) => void
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined)

interface ImpersonationProviderProps {
  children: ReactNode
}

export function ImpersonationProvider({ children }: ImpersonationProviderProps) {
  const [isImpersonating, setIsImpersonating] = useState(false)

  const value: ImpersonationContextType = {
    isImpersonating,
    setIsImpersonating,
  }

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  )
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext)
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider')
  }
  return context
}
