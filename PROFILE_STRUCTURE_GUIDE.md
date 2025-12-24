# Profile Directory Structure - Implementation Guide

## Objective
Prepare the directory structure for the Profile page refactoring (Prompt 18-PREP).

## Current State
- ✅ Profile.tsx exists at `src/pages/Profile.tsx`
- ✅ Imported in App.tsx as: `import Profile from '@/pages/Profile'`
- ✅ Script created at `scripts/prep-profile-structure.js`

## Implementation Options

### Option A: Automated (Recommended)

Run the provided Node.js script:

```bash
node scripts/prep-profile-structure.js
```

This script will:
1. Create `src/pages/Profile/` directory
2. Create `src/pages/Profile/components/` directory
3. Create `src/pages/Profile/components/tabs/` directory
4. Copy `Profile.tsx` to `Profile/index.tsx`

### Option B: Manual Commands

If you prefer manual execution:

```bash
# Navigate to project root
cd /home/runner/work/pipedesk-koa/pipedesk-koa

# Create directory structure
mkdir -p src/pages/Profile/components/tabs

# Move/copy Profile.tsx to the new location
cp src/pages/Profile.tsx src/pages/Profile/index.tsx

# Verify the structure
ls -la src/pages/Profile/
ls -la src/pages/Profile/components/
ls -la src/pages/Profile/components/tabs/
```

## Verification Steps

### 1. Check Directory Structure

Expected structure:
```
src/pages/Profile/
├── index.tsx                    (copied from Profile.tsx)
├── components/                  (empty, ready for 18A-18E)
│   └── tabs/                    (empty, ready for 18C-18D)
```

### 2. Verify Imports Still Work

The import in `src/App.tsx` should still resolve correctly:
```typescript
import Profile from '@/pages/Profile'  // ✅ Resolves to Profile/index.tsx
```

TypeScript/Node automatically resolves `index.tsx` when importing a directory.

### 3. Run TypeScript Check

```bash
npm run typecheck
```

Expected: No new errors (Profile import should resolve correctly)

### 4. Run Lint

```bash
npm run lint
```

Expected: No new linting errors

### 5. Test Build

```bash
npm run build
```

Expected: Build succeeds without errors

## Post-Verification Cleanup

Once verified that everything works:

```bash
# Remove the original Profile.tsx (now redundant)
rm src/pages/Profile.tsx

# Remove temporary files
rm src/pages/Profile_new.tsx
rm src/pages/Profile_README.md
rm src/pages/Profile_components_README.md
```

## Next Steps

After successful structure preparation, proceed with component extraction:

1. **Prompt 18A**: Create ProfileHeader component
2. **Prompt 18B**: Create ProfileSidebarInfo, ProfileTabs, EditableField
3. **Prompt 18C**: Create tab components (Overview, Documents, Financial)
4. **Prompt 18D**: Create Security and Activity tabs
5. **Prompt 18E**: Create custom hooks

## Troubleshooting

### Import Resolution Issues

If imports don't resolve after moving the file:

1. Check `tsconfig.json` paths configuration
2. Restart TypeScript server in your IDE
3. Clear Vite cache: `rm -rf node_modules/.vite`

### Build Errors

If build fails with module resolution errors:

1. Ensure `index.tsx` exists in `Profile/` directory
2. Check that the export is `export default` (not named export)
3. Verify no circular dependencies

## rollback Instructions

If you need to revert:

```bash
# If you created Profile/index.tsx but want to go back
rm -rf src/pages/Profile/

# The original Profile.tsx should still exist if you used 'cp' instead of 'mv'
# If you used 'mv', restore from git:
git checkout HEAD -- src/pages/Profile.tsx
```

## Success Criteria

- [ ] Directory structure created: `Profile/components/tabs/`
- [ ] `Profile/index.tsx` exists with same content as original
- [ ] Import in App.tsx still works: `import Profile from '@/pages/Profile'`
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes  
- [ ] `npm run build` succeeds
- [ ] Original `Profile.tsx` removed (after verification)

---

**Status**: Ready for execution
**Last Updated**: 2024-12-24
**Related Prompts**: 18A, 18B, 18C, 18D, 18E
