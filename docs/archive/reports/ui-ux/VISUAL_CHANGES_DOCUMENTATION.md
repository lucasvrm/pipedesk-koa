# Visual Changes Documentation

## 1. BrandMark Component - Logo Display Fix

### Problem Fixed
SVG logos with `width="auto" height="auto"` could render at 0 height due to `max-h-*` classes.

### Technical Change
```tsx
// BEFORE (unreliable)
className="max-h-8 w-auto object-contain"  // Header
className="max-h-12"                        // Login (additional)

// AFTER (reliable)
className="h-8 w-auto object-contain"                      // Header
className="h-12 w-auto object-contain mx-auto block"       // Login
```

### Visual Impact
- **Header:** Logo now consistently displays at 32px height (h-8)
- **Login:** Logo now consistently displays at 48px height (h-12) and is centered

---

## 2. Login View - Cleaner Design

- Removed lock icon badge
- Centered and cleaner logo display
- Updated subtitle text

---

**Date:** 2025-12-27  
**Author:** GitHub Copilot Agent
