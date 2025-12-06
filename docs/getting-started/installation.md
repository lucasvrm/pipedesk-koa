# Installation & Setup

This guide will walk you through setting up PipeDesk on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm
- **Git**
- A modern browser (Chrome, Firefox, Safari, or Edge)
- *(Optional)* A Supabase account for production data

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/lucasvrm/pipedesk-koa.git
cd pipedesk-koa
```

### 2. Install Dependencies

PipeDesk uses React 19, which requires the `--legacy-peer-deps` flag due to some dependencies not yet officially supporting React 19:

```bash
npm install --legacy-peer-deps
```

**Why `--legacy-peer-deps`?**  
The onboarding tour library (`react-joyride`) currently lists React 15-18 as peer dependencies. However, it works correctly with React 19. This is a conscious decision while awaiting official React 19 support.

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For local development without Supabase
# VITE_SUPABASE_URL=https://dummy-project.supabase.co
# VITE_SUPABASE_ANON_KEY=dummy_anon_key_for_local_testing_only
```

> **Note**: For local development without Supabase, you can use dummy values. Some features will be limited, but the UI will work.

### 4. Database Setup (Supabase)

If you're using Supabase for production data:

1. **Create a Supabase Project**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Click "New Project"
   - Fill in project details
   - Wait for project creation (1-2 minutes)

2. **Get Your Credentials**
   - Go to Project Settings → API
   - Copy the "Project URL" and "anon public" key
   - Update your `.env` file

3. **Run Database Migrations**
   - In Supabase Dashboard, go to SQL Editor
   - Run migrations from `supabase/migrations/` in order
   - Or use Supabase CLI: `npx supabase db push`

See [Configuration Guide](configuration.md) for detailed Supabase setup.

### 5. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5000/`

### 6. Verify Installation

1. Open your browser to `http://localhost:5000/`
2. You should see the PipeDesk login page
3. If using Supabase, try logging in with magic link
4. If using local mode, you'll see 403 errors for KV endpoints (this is expected)

## Build for Production

To create a production build:

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

To preview the production build:

```bash
npm run preview
```

## Verify Type Safety

Run TypeScript type checking:

```bash
npm run typecheck
```

## Run Linter

Check code quality:

```bash
npm run lint
```

## Run Tests

Verify everything works:

```bash
# Run all tests
npm run test:run

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test

# Run with UI
npm run test:ui
```

## Common Installation Issues

### Issue: npm install fails with peer dependency errors

**Error:**
```
npm ERR! ERESOLVE could not resolve
npm ERR! peer react@"15 - 18" from react-joyride@2.9.3
```

**Solution:**
```bash
npm install --legacy-peer-deps
```

### Issue: 403 Forbidden on `/_spark/kv/*` endpoints

**Symptom:**
```
Failed to fetch KV key: Forbidden
GET http://localhost:5000/_spark/kv/notifications 403
```

**Cause:** The app is designed for GitHub Spark runtime, which provides KV storage endpoints.

**Solution:** This is expected in local development. Use Supabase for production, or ignore these errors for local UI testing.

### Issue: Supabase connection fails

**Symptom:** Login doesn't work, data doesn't load

**Solution:**
1. Verify your `.env` file has correct Supabase credentials
2. Check Supabase project is active
3. Ensure database migrations have been run
4. Check browser console for specific errors

### Issue: TypeScript errors

**Solution:**
```bash
npm run typecheck
```

The codebase should have 0 TypeScript errors. If you see errors, ensure you're on the latest commit.

### Issue: Build warnings about chunk size

**Symptom:**
```
(!) Some chunks are larger than 500 kB after minification
```

**Solution:** This is expected. The bundle includes D3.js, Recharts, and multiple UI components. Code splitting optimizes initial load time.

## Next Steps

- [Quick Start Guide](quick-start.md) - Learn the basics
- [Configuration Guide](configuration.md) - Configure Supabase and integrations
- [Troubleshooting](../development/troubleshooting.md) - Common issues and solutions

## Adding Dependencies

When adding new npm packages:

```bash
npm install package-name --legacy-peer-deps
```

Always use `--legacy-peer-deps` to maintain consistency.

## Updating Dependencies

```bash
# Update all dependencies
npm update --legacy-peer-deps

# Update specific package
npm install package-name@latest --legacy-peer-deps
```

## Development Tools

### Recommended VS Code Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

### Browser DevTools

- React Developer Tools
- Redux DevTools (for state inspection)

## System Requirements

### Minimum Requirements
- **OS**: Windows 10, macOS 10.15+, or Linux
- **RAM**: 4 GB
- **Node.js**: 18.0.0+
- **Disk Space**: 500 MB for dependencies

### Recommended Requirements
- **RAM**: 8 GB or more
- **Node.js**: 20.0.0+
- **SSD**: For faster builds

## Support

If you encounter issues not covered here:

1. Check [Troubleshooting Guide](../development/troubleshooting.md)
2. Search [GitHub Issues](https://github.com/lucasvrm/pipedesk-koa/issues)
3. Open a new issue with:
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Operating system
   - Error messages
   - Steps to reproduce

---

**Next:** [Quick Start Guide](quick-start.md)
