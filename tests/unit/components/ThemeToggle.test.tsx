import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ThemeProvider } from '@/contexts/ThemeContext'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('light', 'dark')
  })

  const renderWithThemeProvider = (ui: React.ReactElement) => {
    return render(
      <ThemeProvider defaultTheme="light">
        {ui}
      </ThemeProvider>
    )
  }

  describe('dropdown variant', () => {
    it('renders theme toggle button', () => {
      renderWithThemeProvider(<ThemeToggle variant="dropdown" />)
      
      const button = screen.getByRole('button', { name: /alternar tema/i })
      expect(button).toBeInTheDocument()
    })

    it('opens dropdown menu when clicked', async () => {
      const user = userEvent.setup()
      renderWithThemeProvider(<ThemeToggle variant="dropdown" />)
      
      const button = screen.getByRole('button', { name: /alternar tema/i })
      await user.click(button)
      
      expect(screen.getByText('Claro')).toBeInTheDocument()
      expect(screen.getByText('Escuro')).toBeInTheDocument()
      expect(screen.getByText('Sistema')).toBeInTheDocument()
    })

    it('changes theme to dark when dark option is clicked', async () => {
      const user = userEvent.setup()
      renderWithThemeProvider(<ThemeToggle variant="dropdown" />)
      
      const button = screen.getByRole('button', { name: /alternar tema/i })
      await user.click(button)
      
      const darkOption = screen.getByText('Escuro')
      await user.click(darkOption)
      
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('buttons variant', () => {
    it('renders all three theme buttons', () => {
      renderWithThemeProvider(<ThemeToggle variant="buttons" />)
      
      expect(screen.getByTitle('Tema claro')).toBeInTheDocument()
      expect(screen.getByTitle('Tema escuro')).toBeInTheDocument()
      expect(screen.getByTitle('Seguir sistema')).toBeInTheDocument()
    })

    it('changes theme when button is clicked', async () => {
      const user = userEvent.setup()
      renderWithThemeProvider(<ThemeToggle variant="buttons" />)
      
      const darkButton = screen.getByTitle('Tema escuro')
      await user.click(darkButton)
      
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('icon-only variant', () => {
    it('renders single toggle button', () => {
      renderWithThemeProvider(<ThemeToggle variant="icon-only" />)
      
      const button = screen.getByRole('button', { name: /alternar tema/i })
      expect(button).toBeInTheDocument()
    })

    it('toggles between light and dark when clicked', async () => {
      const user = userEvent.setup()
      renderWithThemeProvider(<ThemeToggle variant="icon-only" />)
      
      const button = screen.getByRole('button', { name: /alternar tema/i })
      
      // Initially light, click should switch to dark
      await user.click(button)
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      
      // Click again should switch back to light
      await user.click(button)
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })
  })

  describe('size prop', () => {
    it('applies small size class', () => {
      renderWithThemeProvider(<ThemeToggle variant="dropdown" size="sm" />)
      
      const button = screen.getByRole('button', { name: /alternar tema/i })
      expect(button).toHaveClass('h-8', 'w-8')
    })

    it('applies large size class', () => {
      renderWithThemeProvider(<ThemeToggle variant="dropdown" size="lg" />)
      
      const button = screen.getByRole('button', { name: /alternar tema/i })
      expect(button).toHaveClass('h-12', 'w-12')
    })
  })

  describe('className prop', () => {
    it('applies custom className', () => {
      renderWithThemeProvider(<ThemeToggle variant="dropdown" className="custom-class" />)
      
      const button = screen.getByRole('button', { name: /alternar tema/i })
      expect(button).toHaveClass('custom-class')
    })
  })
})
