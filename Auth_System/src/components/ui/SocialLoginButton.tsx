import { Github, Mail, Facebook, Linkedin } from 'lucide-react';
import { Button } from './Button';

interface SocialLoginButtonProps {
  provider: 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin';
  onClick: () => void;
  loading?: boolean;
}

const providerConfig = {
  google: {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
    name: 'Google',
  },
  github: {
    icon: <Github size={20} />,
    name: 'GitHub',
  },
  facebook: {
    icon: <Facebook size={20} />,
    name: 'Facebook',
  },
  twitter: {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.953 4.57a10 10 0 002.856-3.915 10.019 10.019 0 01-2.8.856 4.958 4.958 0 002.165-2.724c-.951.564-2.005.974-3.127 1.195a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
      </svg>
    ),
    name: 'Twitter',
  },
  linkedin: {
    icon: <Linkedin size={20} />,
    name: 'LinkedIn',
  },
};

export const SocialLoginButton = ({
  provider,
  onClick,
  loading = false,
}: SocialLoginButtonProps) => {
  const config = providerConfig[provider];

  return (
    <Button
      onClick={onClick}
      loading={loading}
      variant="outline"
      fullWidth
      icon={config.icon}
      title={`Sign in with ${config.name}`}
    >
      <span className="hidden sm:inline">{config.name}</span>
    </Button>
  );
};
