# Setup Guide - Glassmorphism Authentication System

## Prerequisites

- Node.js 16+ and npm
- Supabase account (free tier available)
- OAuth app credentials for each provider you want to enable

## Step 1: Supabase Project Setup

### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter project name, database password, and region
4. Click "Create new project" and wait for initialization

### Get Credentials

1. Go to Project Settings → API
2. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - Anon Public Key → `VITE_SUPABASE_ANON_KEY`

### Create Database Tables (Optional - for future profile features)

```sql
-- Run these in Supabase SQL Editor

-- Profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- OAuth linked accounts table
CREATE TABLE oauth_linked_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  email text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE oauth_linked_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their linked accounts"
  ON oauth_linked_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

## Step 2: OAuth Provider Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 Client ID (Web Application):
   - Authorized JavaScript origins: `http://localhost:5173`, `https://yourdomain.com`
   - Authorized redirect URIs: `https://gmilraogounbheuagpid.supabase.co/auth/v1/callback`
5. Copy Client ID and Secret
6. In Supabase: Auth → Providers → Google
   - Paste Client ID and Secret
   - Click Enable

### GitHub OAuth

1. Go to GitHub Settings → Developer Settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: Your app name
   - Homepage URL: `https://yourdomain.com`
   - Authorization callback URL: `https://gmilraogounbheuagpid.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret
5. In Supabase: Auth → Providers → GitHub
   - Paste credentials
   - Click Enable

### Facebook OAuth

1. Go to [Meta Developers](https://developers.facebook.com/)
2. Create new app
3. App Type: Consumer
4. Copy App ID and App Secret
5. In Products, add "Facebook Login"
6. Configure Valid OAuth Redirect URIs: `https://gmilraogounbheuagpid.supabase.co/auth/v1/callback`
7. In Supabase: Auth → Providers → Facebook
   - Paste credentials
   - Click Enable

### Twitter/X OAuth

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create new app
3. In App Settings:
   - Set Callback URL: `https://gmilraogounbheuagpid.supabase.co/auth/v1/callback`
   - Enable "Request email address from users"
4. Copy API Key and API Secret
5. In Supabase: Auth → Providers → Twitter
   - Paste credentials
   - Click Enable

### LinkedIn OAuth

1. Go to [LinkedIn Developer Console](https://www.linkedin.com/developers/apps)
2. Create new app
3. In Auth settings:
   - Add Authorized redirect URL: `https://gmilraogounbheuagpid.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret
5. In Supabase: Auth → Providers → LinkedIn
   - Paste credentials
   - Click Enable

### Update Redirect URLs in Supabase

Go to Auth → URL Configuration and add:
- Site URL: `https://yourdomain.com`
- Redirect URLs:
  ```
  https://yourdomain.com/auth/callback
  https://yourdomain.com/login
  https://yourdomain.com/reset-password
  ```

## Step 3: Local Environment

### Create .env File

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Visit http://localhost:5173

## Step 4: Test the Application

### Test Sign Up
1. Navigate to http://localhost:5173/register
2. Enter email and password
3. Verify password strength meter updates
4. Complete profile setup
5. Check you're logged in

### Test Login
1. Navigate to http://localhost:5173/login
2. Enter credentials
3. Click "Sign In"
4. Should redirect to dashboard

### Test OAuth
1. Click any social provider button
2. Should redirect to provider's login
3. Approve permissions
4. Should redirect back and authenticate

### Test Password Reset
1. Click "Forgot Password" on login
2. Enter email
3. Verify you receive reset email
4. Click link in email
5. Enter new password
6. Should redirect to login

## Step 5: Production Deployment

### Build for Production

```bash
npm run build
```

This creates optimized `dist/` folder.

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Follow prompts. Vercel will:
1. Build automatically
2. Set up environment variables
3. Deploy to production URL

### Configure Production URLs in Supabase

1. Get production URL from Vercel (e.g., `https://myapp.vercel.app`)
2. In Supabase Auth → URL Configuration:
   - Site URL: `https://myapp.vercel.app`
   - Add Redirect URLs:
     - `https://myapp.vercel.app/auth/callback`
     - `https://myapp.vercel.app/login`
     - `https://myapp.vercel.app/reset-password`
3. Update OAuth provider redirect URLs to include production URL

### Update Environment Variables in Vercel

1. Go to Vercel Project Settings
2. Go to Environment Variables
3. Add:
   ```
   VITE_SUPABASE_URL = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key
   ```
4. Click Save
5. Redeploy

## Step 6: Configure Email Settings (Optional)

### Custom Email Templates

1. In Supabase: Auth → Email Templates
2. Customize for:
   - Confirmation (if enabled)
   - Magic Link
   - Password Reset
   - Change Email

### SMTP Configuration (Optional)

For production, configure custom SMTP:
1. Supabase: Auth → Providers → Email
2. Configure SMTP credentials
3. Set From Email and From Name

## Common Issues & Solutions

### "Invalid Supabase URL or Key"
- Check `.env` file exists in project root
- Verify credentials are copied correctly
- No extra spaces or quotes

### OAuth Redirect Loop
- Check redirect URLs match exactly in Supabase
- Provider callback URL should be: `https://your-project.supabase.co/auth/v1/callback`
- Browser redirect URL should be: `https://yourdomain.com/auth/callback`

### "Email already registered"
- The email is already in use
- Use different email or reset password
- Check if email was used in earlier tests

### Password strength issues
- Requires 8+ characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number or special character

### Username not available check not working
- Ensure `profiles` table exists
- Check RLS policies on `profiles` table
- Verify database connection

## Next Steps

After setup:

1. **Customize Branding**
   - Update logo in `AuthLayout.tsx`
   - Update colors in gradient backgrounds
   - Change "AuthFlow" text to your app name

2. **Add User Profile Pages**
   - Create `/profile` page
   - Implement avatar upload to Supabase Storage
   - Add profile editing functionality

3. **Implement Security Features**
   - Add 2FA (Two-Factor Authentication)
   - Session management
   - Login audit logs

4. **Add Email Verification** (Optional)
   - Enable email confirmation in Supabase
   - Verify email before allowing login
   - Add resend verification button

5. **Performance Optimization**
   - Add image optimization
   - Set up CDN for assets
   - Enable caching headers

## Useful Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [React Router Documentation](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)

## Support & Debugging

### Enable Debug Logs

Add to any component to debug auth:
```typescript
import { useAuth } from './contexts/AuthContext';

export const DebugAuth = () => {
  const { session, user, loading } = useAuth();

  useEffect(() => {
    console.log('Auth State:', { session, user, loading });
  }, [session, user, loading]);

  return null;
};
```

### Check Browser Console

Look for error messages that indicate:
- Network errors (CORS issues)
- Invalid credentials
- Missing environment variables
- API configuration issues

### Verify Supabase Connection

In browser console:
```javascript
import { supabase } from './lib/supabase';
await supabase.auth.getSession();
```

Should return session object if logged in.
