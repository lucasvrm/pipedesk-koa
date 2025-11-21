# Testing Guide

This document explains how to write and run tests for the PipeDesk application.

## Testing Stack

- **Test Runner**: [Vitest](https://vitest.dev/) v4.0.12
- **Testing Library**: [@testing-library/react](https://testing-library.com/react) v16.3.0
- **DOM Environment**: jsdom v27.2.0
- **Additional Tools**: @testing-library/jest-dom, @testing-library/user-event

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm run test:run

# Run tests in watch mode (re-runs on file changes)
npm run test

# Run tests with interactive UI
npm run test:ui
```

### Vitest Configuration

Tests are configured in `vitest.config.ts`:
- Environment: `jsdom` (simulates browser environment)
- Setup file: `src/test/setup.ts`
- Globals enabled for Jest-like API

## Test File Structure

### Location
Place test files next to the components/modules they test:
```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx       # Component test
├── lib/
│   ├── helpers.ts
│   └── helpers.test.ts       # Utility test
└── test/
    ├── setup.ts              # Test setup/configuration
    └── shared/               # Shared test utilities
```

### Naming Convention
- **Component tests**: `ComponentName.test.tsx`
- **Utility tests**: `utilityName.test.ts`
- Use `.test.` suffix (not `.spec.`)

## Writing Tests

### Basic Component Test

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await userEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Testing Components with Hooks

When testing components that use React hooks (useState, useEffect, etc.), wrap state updates in `act()`:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'

it('updates state correctly', async () => {
  render(<MyComponent />)
  
  await act(async () => {
    // Trigger state updates
    await userEvent.click(screen.getByRole('button'))
  })
  
  await waitFor(() => {
    expect(screen.getByText('Updated')).toBeInTheDocument()
  })
})
```

### Testing Components with Context

Wrap components in their required context providers:

```typescript
import { AuthProvider } from '@/contexts/AuthContext'

it('uses auth context', () => {
  render(
    <AuthProvider>
      <MyComponent />
    </AuthProvider>
  )
  
  expect(screen.getByText('Logged in')).toBeInTheDocument()
})
```

### Testing with KV Store

For components using `useKV` from Spark, you'll need to mock the hook:

```typescript
import { vi } from 'vitest'

vi.mock('@github/spark/hooks', () => ({
  useKV: vi.fn((key, defaultValue) => [defaultValue, vi.fn()])
}))

it('renders data from KV', () => {
  const mockData = [{ id: '1', name: 'Test' }]
  vi.mocked(useKV).mockReturnValue([mockData, vi.fn()])
  
  render(<MyComponent />)
  expect(screen.getByText('Test')).toBeInTheDocument()
})
```

## Coverage Guidelines

### Current Coverage
- **Overall**: ~5%
- **Test files**: 2
- **Total tests**: 5

### Target Coverage
- **Overall target**: 30%+
- **Critical features**: 60%+

### Priority for Testing

1. **High Priority** (Target: 60%+ coverage)
   - RBAC/Permissions (`src/lib/permissions.ts`)
   - Master Deal CRUD (`src/features/deals/`)
   - Player Track logic (`src/features/deals/components/`)
   - Task dependencies (`src/features/tasks/`)
   - Analytics calculations (`src/features/analytics/`)

2. **Medium Priority** (Target: 40%+ coverage)
   - UI components (`src/components/ui/`)
   - Shared components (`src/components/`)
   - Utility functions (`src/lib/helpers.ts`)

3. **Low Priority** (Target: 20%+ coverage)
   - Integration components
   - One-off utilities

## Test Categories

### Unit Tests
Test individual functions and components in isolation.

**Example**: Testing a utility function
```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency } from './helpers'

describe('formatCurrency', () => {
  it('formats BRL currency correctly', () => {
    expect(formatCurrency(1000000)).toBe('R$ 1.000.000,00')
  })
  
  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })
})
```

### Integration Tests
Test how multiple components work together.

**Example**: Testing a form submission flow
```typescript
it('creates a new deal', async () => {
  const mockOnSubmit = vi.fn()
  render(<CreateDealForm onSubmit={mockOnSubmit} />)
  
  await userEvent.type(screen.getByLabelText('Client Name'), 'Test Client')
  await userEvent.type(screen.getByLabelText('Volume'), '1000000')
  await userEvent.click(screen.getByRole('button', { name: 'Create' }))
  
  expect(mockOnSubmit).toHaveBeenCalledWith({
    clientName: 'Test Client',
    volume: 1000000,
  })
})
```

### Component Tests
Test that components render correctly and respond to user interactions.

See examples in existing test files:
- `src/test/EmptyState.test.tsx`
- `src/test/AuthContext.test.tsx`

## Best Practices

### ✅ DO

1. **Use Testing Library queries in this order**:
   - `getByRole` (preferred - accessible)
   - `getByLabelText` (forms)
   - `getByPlaceholderText` (inputs)
   - `getByText` (content)
   - `getByTestId` (last resort)

2. **Test user behavior, not implementation**:
   ```typescript
   // ✅ Good - tests what user sees
   expect(screen.getByText('Welcome')).toBeInTheDocument()
   
   // ❌ Bad - tests implementation
   expect(component.state.message).toBe('Welcome')
   ```

3. **Use async utilities for async operations**:
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument()
   })
   ```

4. **Clean up after tests**:
   ```typescript
   afterEach(() => {
     vi.clearAllMocks()
   })
   ```

5. **Write descriptive test names**:
   ```typescript
   it('shows error message when form validation fails', () => {
     // ...
   })
   ```

### ❌ DON'T

1. **Don't test third-party libraries**
2. **Don't test implementation details**
3. **Don't use `any` in tests**
4. **Don't make tests depend on each other**
5. **Don't use snapshots excessively**

## Common Patterns

### Testing Async Operations

```typescript
it('loads data on mount', async () => {
  render(<DataComponent />)
  
  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })
  
  // Check data is displayed
  expect(screen.getByText('Data loaded')).toBeInTheDocument()
})
```

### Testing Error States

```typescript
it('shows error message on failure', async () => {
  // Mock a failed API call
  vi.mocked(fetchData).mockRejectedValue(new Error('Failed'))
  
  render(<MyComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Error: Failed')).toBeInTheDocument()
  })
})
```

### Testing Forms

```typescript
it('validates required fields', async () => {
  render(<ContactForm />)
  
  // Submit without filling
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
  
  // Check validation errors
  expect(screen.getByText('Email is required')).toBeInTheDocument()
  expect(screen.getByText('Name is required')).toBeInTheDocument()
})
```

## Debugging Tests

### View Rendered Output

```typescript
import { render, screen } from '@testing-library/react'

it('debugs component', () => {
  const { debug } = render(<MyComponent />)
  
  // Print entire DOM
  debug()
  
  // Print specific element
  debug(screen.getByRole('button'))
})
```

### Check Available Queries

```typescript
it('finds elements', () => {
  render(<MyComponent />)
  
  // See all available queries
  screen.logTestingPlaygroundURL()
})
```

## Running Specific Tests

### Run Single File
```bash
npx vitest src/components/Button.test.tsx
```

### Run Tests Matching Pattern
```bash
npx vitest -t "renders correctly"
```

### Run in UI Mode
```bash
npm run test:ui
```

## CI/CD Integration

Tests run automatically in CI on:
- Pull requests
- Push to main branch

Ensure all tests pass before merging:
```bash
npm run test:run
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library Docs](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Getting Help

1. Check existing test files for examples
2. Refer to Testing Library documentation
3. Ask in team chat or create an issue

---

Last updated: November 2025
