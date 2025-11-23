import { useState, useEffect } from 'react'
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'

const tourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h2 className="text-2xl font-bold">Bem-vindo ao PipeDesk! 🎉</h2>
        <p className="text-base leading-relaxed">
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
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Crie seu Primeiro Negócio</h3>
        <p className="text-sm leading-relaxed">
          Clique aqui para criar um novo negócio. Você pode adicionar informações como cliente, valor e prazo.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="deals-nav"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Visualize seus Negócios</h3>
        <p className="text-sm leading-relaxed">
          Acesse a área de negócios para ver todos os deals em andamento.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="kanban-nav"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Kanban Interativo</h3>
        <p className="text-sm leading-relaxed">
          Organize seus negócios visualmente em um quadro Kanban. Arraste e solte cards entre as colunas.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="dashboard-nav"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Dashboard Analítico</h3>
        <p className="text-sm leading-relaxed">
          Acompanhe métricas importantes e visualize o desempenho dos seus negócios.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    content: (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Central de Notificações</h3>
        <p className="text-sm leading-relaxed">
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
            .from('profiles')
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
          primaryColor: '#dc2626', // Red-600 for primary actions
          textColor: '#1f2937', // Gray-800 for text
          backgroundColor: '#ffffff', // White background
          arrowColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 24,
          fontSize: 15,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        tooltipContent: {
          padding: '8px 0',
        },
        buttonNext: {
          backgroundColor: '#dc2626',
          borderRadius: 8,
          color: '#ffffff',
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 600,
          border: 'none',
          outline: 'none',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: 12,
          fontSize: 14,
          fontWeight: 500,
        },
        buttonSkip: {
          color: '#6b7280',
          fontSize: 14,
          fontWeight: 500,
        },
        buttonClose: {
          display: 'none',
        },
        spotlight: {
          borderRadius: 8,
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
