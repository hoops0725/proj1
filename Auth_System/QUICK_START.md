# Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` in project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from Supabase → Project Settings → API

### 3. Run Development Server
```bash
npm run dev
```

Visit http://localhost:5173

### 4. Test the System
- **Login**: http://localhost:5173/login
- **Register**: http://localhost:5173/register
- **Test credentials**: Use any email/password combination

## Pages Available

| Path | Purpose |
|------|---------|
| `/login` | Sign in with email/password |
| `/register` | Create new account (3-step wizard) |
| `/forgot-password` | Request password reset |
| `/reset-password?token=...` | Set new password |
| `/auth/callback` | OAuth redirect (automatic) |
| `/dashboard` | Protected page (requires login) |

## Key Features to Test

### Registration Flow
1. Go to `/register`
2. Enter email and password
3. Watch password strength meter update in real-time
4. Proceed to verification step
5. Enter OTP code (6 digits)
6. Complete profile with username and bio
7. Account created!

### Login
1. Go to `/login`
2. Use credentials from registration
3. Check "Remember me" (optional)
4. Click "Sign In"
5. Redirected to dashboard

### Social Login
1. Go to `/login`
2. Click any social provider button
3. Approve access on provider's website
4. Automatically signed in

### Password Reset
1. Go to `/forgot-password`
2. Enter your email
3. Check email for reset link
4. Click link to reset password
5. Enter new password
6. Back to login!

## UI Components

### Glassmorphism Effects
- Frosted glass panels with backdrop blur
- Gradient backgrounds (blue → cyan → emerald)
- Glowing borders and shadows
- Smooth animations on interactions

### Form Elements
- **Input**: Email, password, text with icons
- **Button**: Primary (gradient), secondary (pink/amber), outline
- **Password Strength Meter**: Visual feedback on strength
- **Social Buttons**: Provider-specific styling

### Animations
- Page transitions: Fade in + slide up
- Input focus: Cyan glow effect
- Button click: Scale down to 98%
- Form validation: Success checkmark with scale + rotate

## Production Build

### Build for Production
```bash
npm run build
```

Creates optimized `dist/` folder ready to deploy.

### Deploy Options

**Vercel (Recommended)**
```bash
npm i -g vercel
vercel
```

**Netlify**
- Connect GitHub repo to Netlify
- Auto-deploys on push

**Self-hosted**
- Upload `dist/` folder to your server
- Configure environment variables

## Customization

### Change Colors
Edit gradient in `src/components/ui/AuthLayout.tsx`:
```tsx
background: 'linear-gradient(135deg, #0f172a, #1e3a8a, #06b6d4, #0c4a6e)'
```

### Change App Name
Replace "AuthFlow" with your name in:
- `src/components/ui/AuthLayout.tsx` (logoText prop)
- `tailwind.config.js` (if using for SEO)

### Add More OAuth Providers
1. Create OAuth app on provider's platform
2. Add credentials to Supabase
3. Update `SocialLoginButton.tsx` provider list

### Customize Email Flow
1. Supabase → Auth → Email Templates
2. Edit templates for your brand

## Database Setup (Optional)

### Create Tables for Profile Features

In Supabase SQL Editor:

```sql
-- User profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE,
  display_name text,
  bio text,
  created_at timestamptz DEFAULT now()
);

-- OAuth linked accounts
CREATE TABLE oauth_linked_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  provider text,
  provider_user_id text,
  created_at timestamptz DEFAULT now()
);
```

Then enable Row Level Security:
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_linked_accounts ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their profile
CREATE POLICY "Update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);
```

## Troubleshooting

### "Invalid Supabase URL or Key"
- Check `.env` file exists
- Verify values are copied correctly
- No extra spaces

### "OAuth redirect loop"
- Check redirect URLs in Supabase match your domain
- Clear browser cookies
- Try incognito window

### "Email already registered"
- Use different email address
- Or reset password if you forgot it

### Build errors
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## File Structure

```
src/
├── components/        # Reusable UI components
│   └── ui/           # Glassmorphism UI components
├── contexts/         # React context (auth state)
├── pages/            # Page components (routes)
├── services/         # API integration (Supabase)
├── lib/              # Utilities & configs
└── App.tsx           # Router setup
```

## Commands Reference

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Quality
npm run lint             # Check code style
npm run typecheck        # Check TypeScript types
```

## Learning Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [React Router Guide](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Next Steps

1. **Complete SETUP.md** for OAuth configuration
2. **Read AUTH_SYSTEM.md** for detailed architecture
3. **Customize** colors and branding
4. **Deploy** to production
5. **Monitor** user authentication in Supabase dashboard

## Support

If you encounter issues:

1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify environment variables
4. Review SETUP.md for OAuth setup
5. Check documentation links above

---

**You're all set!** The authentication system is ready to use. 🎉

Visit http://localhost:5173 to see it in action.
