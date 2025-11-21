import { useState, useEffect } from 'react'
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'

const tourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h2 className="text-lg font-bold mb-2">Bem-vindo ao PipeDesk! 🎉</h2>
        <p className="text-sm">
          Vamos fazer um tour rápido pelas funcionalidades principais para você começar.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="new-deal-button"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Crie seu Primeiro Negócio</h3>
        <p className="text-sm">
          Clique aqui para criar um novo negócio. Você pode adicionar informações como cliente, valor e prazo.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="deals-nav"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Visualize seus Negócios</h3>
        <p className="text-sm">
          Acesse a área de negócios para ver todos os deals em andamento.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="kanban-nav"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Kanban Interativo</h3>
        <p className="text-sm">
          Organize seus negócios visualmente em um quadro Kanban. Arraste e solte cards entre as colunas.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="dashboard-nav"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Dashboard Analítico</h3>
        <p className="text-sm">
          Acompanhe métricas importantes e visualize o desempenho dos seus negócios.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Central de Notificações</h3>
        <p className="text-sm">
          Fique por dentro de todas as atualizações importantes aqui.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
]

export function OnboardingTour() {
  const { profile } = useAuth()
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    // Check if user has completed onboarding
    if (profile && !profile.has_completed_onboarding) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setRun(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [profile])

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, index, type } = data

    if (type === 'step:after') {
      setStepIndex(index + 1)
    }

    // Tour finished or skipped
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false)
      
      if (profile?.id) {
        try {
          const { error } = await supabase
            .from('users')
            .update({ has_completed_onboarding: true })
            .eq('id', profile.id)

          if (error) throw error
          
          if (status === STATUS.FINISHED) {
            toast.success('Tour concluído! Você está pronto para começar.')
          }
        } catch (error) {
          console.error('Error updating onboarding status:', error)
        }
      }
    }
  }

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--background))',
          arrowColor: 'hsl(var(--background))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: 6,
          color: 'hsl(var(--primary-foreground))',
          padding: '8px 16px',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: 10,
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        skip: 'Pular',
      }}
    />
  )
}
