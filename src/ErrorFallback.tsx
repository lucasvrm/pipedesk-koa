import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert"
import { Button } from "./components/ui/button"
import { WarningCircle } from "@phosphor-icons/react"

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export default function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <WarningCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            {import.meta.env.DEV ? error.message : "An unexpected error occurred. Please try again."}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={resetErrorBoundary}
          className="w-full"
        >
          Try Again
        </Button>
      </div>
    </div>
  )
}
