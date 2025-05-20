import { Send } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

interface AppLogoProps {
  className?: string;
  iconOnly?: boolean;
}

export default function AppLogo({ className, iconOnly = false }: AppLogoProps) {
  return (
    <div className={`flex items-center gap-2 text-primary ${className}`}>
      <Send className="h-6 w-6" />
      {!iconOnly && <span className="font-semibold text-xl">{APP_NAME}</span>}
    </div>
  );
}
