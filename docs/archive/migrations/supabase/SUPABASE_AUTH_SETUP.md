# Supabase Authentication Setup Guide

This document explains how to set up and use Supabase Authentication with Magic Links in the PipeDesk application.

## Overview

The application now uses Supabase Auth for user authentication with Magic Link (passwordless) login. This provides a secure, modern authentication experience without the need for users to remember passwords.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project or use an existing one
3. Note your project URL and anon key from the project settings

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project:
- Project Settings → API → Project URL
- Project Settings → API → Project API keys → anon/public

### 3. Set Up Database Schema

Create a `users` table in your Supabase database:

```sql
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'analyst', 'client', 'newbusiness')),
  avatar TEXT,
  client_entity TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role to insert new users
CREATE POLICY "Service role can insert users" ON users
  FOR INSERT WITH CHECK (true);
```

### 4. Configure Supabase Auth Settings

In your Supabase Dashboard:

1. Go to Authentication → Settings
2. Enable "Email" provider
3. Disable "Confirm email" (for magic links)
4. Set "Site URL" to your application URL (e.g., `http://localhost:5173` for development)
5. Add redirect URLs:
   - `http://localhost:5173/auth` (development)
   - Your production URL + `/auth` (production)

### 5. Set Up Email Templates (Optional)

Customize the magic link email template:

1. Go to Authentication → Email Templates
2. Select "Magic Link" template
3. Customize the email content and styling

## Usage

### Authentication Flow

1. **Login**: User enters their email address
2. **Magic Link Sent**: Supabase sends an email with a magic link
3. **Click Link**: User clicks the link in their email
4. **Authenticated**: User is redirected to the app and logged in

### Using the Auth Context

The `AuthProvider` is already set up in `src/main.tsx` and wraps the entire application.

To access authentication state in any component:

```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { 
    user,           // Supabase user object
    profile,        // User profile from database
    session,        // Current session
    loading,        // Loading state
    isAuthenticated,// Boolean authentication status
    signInWithMagicLink,  // Function to send magic link
    signOut         // Function to sign out
  } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>
  }

  return <div>Welcome, {profile?.name}!</div>
}
```

### Sending a Magic Link

```tsx
const handleLogin = async () => {
  const success = await signInWithMagicLink('user@example.com')
  if (success) {
    console.log('Magic link sent! Check your email.')
  }
}
```

### Signing Out

```tsx
const handleLogout = async () => {
  const success = await signOut()
  if (success) {
    console.log('Signed out successfully')
  }
}
```

## Protected Routes

The `App.tsx` component automatically handles authentication:

- If user is not authenticated → Shows login screen
- If user is authenticated → Shows the application

You don't need to add authentication checks to individual components.

## Session Management

Supabase handles session management automatically:

- Sessions are stored in browser's local storage
- Sessions persist across page refreshes
- Access tokens are automatically refreshed
- Logout clears the session across all tabs

## Security Considerations

1. **Row Level Security (RLS)**: Enable RLS on all tables and define appropriate policies
2. **Environment Variables**: Never commit `.env.local` to version control
3. **Email Verification**: Consider enabling email verification for production
4. **Rate Limiting**: Supabase has built-in rate limiting for auth endpoints

## Troubleshooting

### Magic Link Not Received

1. Check spam/junk folder
2. Verify email provider settings in Supabase
3. Check Supabase logs for errors
4. Ensure redirect URLs are properly configured

### Authentication Not Persisting

1. Check browser local storage for Supabase session
2. Verify environment variables are correctly set
3. Check browser console for errors
4. Ensure cookies are enabled

### Profile Not Loading

1. Verify `users` table exists in database
2. Check RLS policies allow user to read their profile
3. Verify user ID matches between auth.users and users table
4. Check browser console for database errors

## Migration Notes

This application was migrated from a legacy token-based authentication system to Supabase Auth. The migration includes:

1. **AuthProvider Context** (`src/contexts/AuthContext.tsx`): Centralized auth state
2. **Updated Components**: All components now use the `useAuth()` hook
3. **Removed Legacy Code**: Old useAuth hook and token validation removed
4. **Backward Compatibility**: Legacy functions kept in `src/lib/auth.ts` but not used

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Magic Link Authentication](https://supabase.com/docs/guides/auth/auth-magic-link)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
