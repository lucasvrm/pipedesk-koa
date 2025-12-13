# Contributing to PipeDesk

Thank you for your interest in contributing to PipeDesk! This document provides guidelines and best practices for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Guidelines](#commit-guidelines)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report issues professionally

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/pipedesk-koa.git
   cd pipedesk-koa
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your values (use dummy values for local dev)
   ```

4. **Verify setup**
   ```bash
   npm run lint          # Should pass
   npx tsc --noEmit      # Should have 0 errors
   npm run test:run      # Should pass all tests
   npm run build         # Should build successfully
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features (e.g., `feature/add-export-pdf`)
- `fix/` - Bug fixes (e.g., `fix/task-dependency-loop`)
- `refactor/` - Code refactoring (e.g., `refactor/simplify-permissions`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `test/` - Adding or updating tests (e.g., `test/add-deal-tests`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run lint
   npx tsc --noEmit
   npm run test:run
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add PDF export functionality"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**

## Code Standards

### TypeScript

#### ✅ DO

```typescript
// Use explicit types
interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
}

// Use type-safe enums or union types
type UserRole = 'admin' | 'analyst' | 'client' | 'newbusiness'

// Null checks with optional chaining
const userName = user?.profile?.name ?? 'Unknown'

// Use const for immutable values
const MAX_RETRIES = 3
```

#### ❌ DON'T

```typescript
// Don't use 'any' without good reason
function processData(data: any) { } // ❌

// Don't ignore null/undefined
const userName = user.profile.name // ❌ Could crash

// Don't use 'var'
var count = 0 // ❌ Use const or let
```

### React Components

#### ✅ DO

```typescript
// Functional components with TypeScript
interface ButtonProps {
  label: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  )
}

// Use semantic HTML
<button type="button" aria-label="Close">...</button>

// Destructure props
const { user, onUpdate } = props
```

#### ❌ DON'T

```typescript
// Don't use default exports for components
export default function Button() { } // ❌

// Don't use inline styles (use Tailwind classes)
<div style={{ color: 'red' }}>...</div> // ❌

// Don't use any without types
export function Component(props: any) { } // ❌
```

### Hooks

#### ✅ DO

```typescript
// Follow Rules of Hooks
function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false))
  }, [userId]) // Include all dependencies

  return { user, loading }
}

// Use useCallback for functions passed as props
const handleClick = useCallback(() => {
  doSomething()
}, [dependency])
```

#### ❌ DON'T

```typescript
// Don't call hooks conditionally
if (condition) {
  useEffect(() => { }) // ❌
}

// Don't omit dependencies
useEffect(() => {
  doSomething(value)
}, []) // ❌ Missing 'value' dependency
```

### Data access layer

- Use the files in `src/services/` as the single source of truth for Supabase calls and React Query hooks.
- Each service should expose typed CRUD helpers (e.g., `getDeals`, `createDeal`) **and** their respective `useQuery`/`useMutation` wrappers in the same file to keep contracts aligned.
- Consumers must import hooks from the service (for example, `useDeals` from `@/services/dealService`, `usePlayers` from `@/services/playerService`, `useTasks` from `@/services/taskService`) instead of feature-level wrappers.
- Avoid duplicating fetching logic in feature folders—if a new query is needed, add it to the relevant service file and reuse it across the app.

### File Organization

```
src/
├── components/           # Shared UI components
│   ├── ui/              # Base UI components (Button, Input, etc.)
│   └── [Component].tsx  # Feature-specific shared components
├── features/            # Feature-based modules
│   ├── deals/
│   │   ├── components/  # Deal-specific components
│   │   ├── hooks/       # Deal-specific hooks
│   │   └── types.ts     # Deal-specific types
│   ├── tasks/
│   └── analytics/
├── lib/                 # Shared utilities
│   ├── types.ts         # Global type definitions
│   ├── helpers.ts       # Utility functions
│   └── permissions.ts   # RBAC logic
├── hooks/               # Shared custom hooks
├── contexts/            # React contexts
└── test/                # Test setup and utilities
```

### Naming Conventions

- **Files**: PascalCase for components (`Button.tsx`), camelCase for utilities (`helpers.ts`)
- **Components**: PascalCase (`UserProfile`, `DealCard`)
- **Functions/Variables**: camelCase (`getUserName`, `isActive`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `API_URL`)
- **Types/Interfaces**: PascalCase (`User`, `DealFormProps`)
- **Hooks**: camelCase with `use` prefix (`useUserData`, `usePermissions`)

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for TS/JS, double for JSX attributes
- **Semicolons**: Required (prevents ASI issues)
- **Line length**: Aim for 100 characters max
- **Trailing commas**: Use in multi-line objects/arrays

```typescript
// ✅ Good
const user = {
  name: 'John',
  email: 'john@example.com',
};

// ❌ Bad
const user = {
  name: "John",
  email: "john@example.com"
}
```

## Testing Requirements

### When to Write Tests

**Required for:**
- New features
- Bug fixes (add test that would have caught the bug)
- Critical business logic (deals, tasks, permissions)

**Optional for:**
- Minor UI tweaks
- Documentation changes
- Refactoring (if existing tests cover it)

### Test Coverage Goals

- **New features**: 60%+ coverage
- **Critical modules**: 60%+ coverage
- **Overall project**: 30%+ coverage

### Test Quality

```typescript
// ✅ Good - tests behavior
it('creates a new deal with valid data', async () => {
  render(<CreateDealForm />)
  
  await userEvent.type(screen.getByLabelText('Client Name'), 'Acme Corp')
  await userEvent.click(screen.getByRole('button', { name: 'Create' }))
  
  expect(screen.getByText('Deal created successfully')).toBeInTheDocument()
})

// ❌ Bad - tests implementation
it('sets state when button clicked', () => {
  const component = new CreateDealForm()
  component.handleClick()
  expect(component.state.clicked).toBe(true)
})
```

### Running Tests

Before submitting PR:
```bash
npm run test:run    # All tests must pass
npm run lint        # No errors
npx tsc --noEmit    # No type errors
```

## Pull Request Process

### Before Opening a PR

1. ✅ All tests pass
2. ✅ No linting errors
3. ✅ No TypeScript errors
4. ✅ Build succeeds
5. ✅ Documentation updated (if needed)
6. ✅ Changelog updated (for significant changes)

### PR Title Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add PDF export for deals
fix: resolve task circular dependency detection
docs: update RBAC guide with new roles
refactor: simplify permission checking logic
test: add tests for player track probability calculations
chore: update dependencies
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- List specific changes
- Made in this PR

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added that prove fix/feature works
- [ ] All tests pass locally
```

### Review Process

1. At least one approving review required
2. All CI checks must pass
3. No unresolved conversations
4. Merge conflicts resolved

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
feat(deals): add bulk export to Excel

Implemented Excel export for multiple deals at once.
Includes formatting and custom columns selection.

Closes #123

---

fix(tasks): prevent circular dependency creation

Added validation to detect circular dependencies before
allowing task dependency to be created.

Fixes #456

---

docs(readme): update setup instructions

Added troubleshooting section for common 403 errors
when running locally.
```

### Atomic Commits

Make small, focused commits:

```bash
# ✅ Good - one logical change per commit
git commit -m "feat(deals): add client name validation"
git commit -m "test(deals): add tests for client name validation"
git commit -m "docs(deals): document client name requirements"

# ❌ Bad - multiple unrelated changes
git commit -m "Add validation, fix bug, update docs"
```

## Additional Guidelines

### Accessibility

- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen reader if making UI changes

### Performance

- Avoid unnecessary re-renders (use `useMemo`, `useCallback`)
- Lazy load heavy components when possible
- Optimize images and assets
- Profile before optimizing

### Security

- Never commit secrets or credentials
- Sanitize user input
- Validate data on both client and server
- Follow RBAC permissions strictly

### Documentation

Update docs when you:
- Add new features
- Change APIs or interfaces
- Fix significant bugs
- Update dependencies

## Getting Help

- Check existing documentation in `/docs`
- Review similar code in the codebase
- Ask questions in issues or discussions
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to PipeDesk! 🚀
