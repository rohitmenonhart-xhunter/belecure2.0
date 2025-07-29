import { Button } from "@/components/ui/button";
import { Save, Upload, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  onSave?: () => void;
}

export function Header({ onSave }: HeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 neon-border">
      <div className="container flex h-12 items-center">
        <div className="mr-6 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 mr-2 text-primary drop-shadow-[0_0_6px_hsl(var(--primary))]"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="font-headline premium-title text-primary neon-text">Belecure</span>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" className="h-8 px-3 premium-text hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/30">
            <Upload className="mr-1.5 h-3 w-3" />
            Load
          </Button>
          <Button onClick={onSave} className="h-8 px-3 neon-button text-background">
            <Save className="mr-1.5 h-3 w-3" />
            Save
          </Button>
          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            className="h-8 px-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 border border-transparent hover:border-red-700/50"
            disabled={isLoggingOut}
          >
            <LogOut className="mr-1.5 h-3 w-3" />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </div>
    </header>
  );
}
