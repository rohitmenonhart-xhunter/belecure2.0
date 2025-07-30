import { Button } from "@/components/ui/button";
import { Save, Upload, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 warm-border">
      <div className="container flex h-14 items-center">
        <div className="mr-6 flex items-center">
          <div className="flex items-center space-x-3">
            <Image
              src="/lightscapelogo.png"
              alt="Lightscape Logo"
              width={32}
              height={32}
              className="warm-glow"
            />
            <div className="flex flex-col">
              <span className="font-headline premium-title text-primary warm-text text-lg font-bold">Belecure</span>
              <span className="text-xs premium-text opacity-75">A Product of Lightscape</span>
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" className="h-8 px-3 premium-text hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/30 warm-border">
            <Upload className="mr-1.5 h-3 w-3" />
            Load
          </Button>
          <Button onClick={onSave} className="h-8 px-3 warm-button">
            <Save className="mr-1.5 h-3 w-3" />
            Save
          </Button>
          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            className="h-8 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-300"
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
