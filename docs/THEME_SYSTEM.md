# Theme System - Usage Guide

This document explains how to use the theme system (ThemeProvider and ThemeToggle) in the application.

## Overview

The theme system provides:
- **Light, Dark, and System** theme options
- **localStorage persistence** - theme preference is saved
- **Automatic system theme detection** - follows OS dark mode setting
- **Three toggle variants** - dropdown, buttons, icon-only
- **Type-safe** - full TypeScript support

---

## Quick Start

### 1. The ThemeProvider is already configured in `main.tsx`

```tsx
import { ThemeProvider } from '@/contexts/ThemeContext'

<ThemeProvider defaultTheme="system">
  <App />
</ThemeProvider>
```

### 2. Use the `useTheme` hook in any component

```tsx
import { useTheme } from '@/contexts/ThemeContext'

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      <button onClick={() => setTheme('dark')}>Dark</button>
    </div>
  )
}
```

---

## ThemeToggle Component

### Variant 1: Dropdown (Default)

Perfect for sidebars, navigation menus, or user settings.

```tsx
import { ThemeToggle } from '@/components/ThemeToggle'

<ThemeToggle variant="dropdown" />
```

Features:
- Shows Sun/Moon icon based on current theme
- Clicking opens dropdown with all 3 options
- Shows checkmark next to active theme

### Variant 2: Buttons

Perfect for settings pages or preference panels.

```tsx
<ThemeToggle variant="buttons" />
```

Features:
- Shows all 3 options side by side
- Active button is highlighted
- Icons: Sun (light), Moon (dark), Monitor (system)

### Variant 3: Icon Only

Perfect for compact spaces or quick toggle.

```tsx
<ThemeToggle variant="icon-only" />
```

Features:
- Single button toggles between light and dark
- Does NOT include system option
- Best for minimalist UIs

---

## Props

### ThemeToggle Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'dropdown' \| 'buttons' \| 'icon-only'` | `'dropdown'` | Toggle style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Icon and button size |
| `className` | `string` | `undefined` | Additional CSS classes |

### ThemeProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | App content |
| `defaultTheme` | `'light' \| 'dark' \| 'system'` | `'system'` | Initial theme if none stored |

---

## useTheme Hook

Returns an object with:

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `'light' \| 'dark' \| 'system'` | Current theme setting |
| `setTheme` | `(theme: Theme) => void` | Function to change theme |
| `resolvedTheme` | `'light' \| 'dark'` | Actual theme applied (resolves 'system') |

---

## Examples

### Example 1: Add to Sidebar

```tsx
import { ThemeToggle } from '@/components/ThemeToggle'

function Sidebar() {
  return (
    <aside className="flex flex-col gap-4 p-4">
      <nav>{/* Navigation items */}</nav>
      
      {/* Add at bottom of sidebar */}
      <div className="mt-auto">
        <ThemeToggle variant="dropdown" />
      </div>
    </aside>
  )
}
```

### Example 2: Settings Page

```tsx
import { ThemeToggle } from '@/components/ThemeToggle'

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2>Aparência</h2>
        <p className="text-muted-foreground">
          Escolha o tema da aplicação
        </p>
      </div>
      
      <ThemeToggle variant="buttons" />
    </div>
  )
}
```

### Example 3: Custom Theme-Aware Component

```tsx
import { useTheme } from '@/contexts/ThemeContext'

function Logo() {
  const { resolvedTheme } = useTheme()
  
  return (
    <img 
      src={resolvedTheme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'} 
      alt="Logo" 
    />
  )
}
```

### Example 4: Conditional Styling

```tsx
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

function Card({ children }) {
  const { resolvedTheme } = useTheme()
  
  return (
    <div className={cn(
      "p-4 rounded-lg border",
      resolvedTheme === 'dark' ? 'bg-neutral-900' : 'bg-white'
    )}>
      {children}
    </div>
  )
}
```

---

## How It Works

### 1. Theme Storage

Themes are stored in `localStorage` with key `pipedesk-theme`:

```typescript
localStorage.setItem('pipedesk-theme', 'dark')
```

### 2. System Theme Detection

When theme is set to `'system'`, the app detects OS preference:

```typescript
window.matchMedia('(prefers-color-scheme: dark)').matches
```

### 3. CSS Class Application

The theme is applied via CSS class on `<html>`:

```html
<html class="dark">
  <!-- Your app -->
</html>
```

Tailwind CSS uses this to apply dark mode styles:

```tsx
<div className="bg-white dark:bg-gray-900">
  Content
</div>
```

---

## Tailwind Configuration

The `tailwind.config.js` is configured with:

```javascript
module.exports = {
  darkMode: 'class', // Uses class-based dark mode
  // ... rest of config
}
```

This means you can use `dark:` prefix in any Tailwind class:

```tsx
<Button className="bg-blue-500 dark:bg-blue-700">
  Click me
</Button>
```

---

## Best Practices

### ✅ Do:

- Use `resolvedTheme` when you need the actual active theme (light or dark)
- Use `theme` when you need to know if system mode is active
- Let the ThemeProvider handle localStorage and DOM updates
- Use Tailwind's `dark:` prefix for styling
- Test your components in both light and dark modes

### ❌ Don't:

- Don't manually add/remove 'dark' class from HTML element
- Don't store theme in component state - use the context
- Don't assume 'system' means light or dark - use `resolvedTheme`
- Don't forget to test theme switching behavior

---

## Edge Cases Handled

The implementation handles:

- ✅ SSR (Server-Side Rendering) - defaults to 'light' on server
- ✅ Missing localStorage - falls back to defaultTheme
- ✅ Invalid stored values - validates and falls back
- ✅ System preference changes - listens and updates automatically
- ✅ Multiple theme updates - batches DOM changes
- ✅ Component unmounting - cleans up event listeners

---

## Testing

Tests are provided in:
- `tests/unit/contexts/ThemeContext.test.tsx`
- `tests/unit/components/ThemeToggle.test.tsx`

Run tests with:

```bash
npm run test
```

---

## Integration Checklist

When integrating the theme toggle:

- [ ] Choose appropriate variant for your use case
- [ ] Place toggle in accessible location (sidebar, settings, etc.)
- [ ] Test all three theme options (light, dark, system)
- [ ] Verify persistence after page reload
- [ ] Check that system theme changes are detected
- [ ] Test responsive behavior at different screen sizes
- [ ] Verify keyboard accessibility (Tab, Enter, Escape)
- [ ] Check ARIA labels for screen readers

---

## Troubleshooting

### Theme not persisting?

Check that localStorage is not blocked by browser privacy settings.

### System theme not detected?

Verify browser supports `prefers-color-scheme` media query (all modern browsers do).

### Dark mode styles not applying?

Ensure `tailwind.config.js` has `darkMode: 'class'` configured.

### useTheme throws error?

Make sure component is inside `<ThemeProvider>` in the component tree.

---

## Related Files

| File | Purpose |
|------|---------|
| `src/contexts/ThemeContext.tsx` | Context provider and hook |
| `src/components/ThemeToggle.tsx` | Toggle component with 3 variants |
| `src/main.tsx` | ThemeProvider integration |
| `tailwind.config.js` | Dark mode configuration |
| `tests/unit/contexts/ThemeContext.test.tsx` | Context tests |
| `tests/unit/components/ThemeToggle.test.tsx` | Component tests |
