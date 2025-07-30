"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, Lock, User, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify');
        if (response.ok) {
          router.push('/');
        }
      } catch (error) {
        // User not authenticated, stay on login page
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen premium-gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Lightscape Branding Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Image
              src="/lightscapelogo.png"
              alt="Lightscape Logo"
              width={48}
              height={48}
              className="warm-glow"
            />
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold warm-text text-primary">Belecure</h1>
              <p className="text-sm premium-text opacity-75">A Product of Lightscape</p>
            </div>
          </div>
          <p className="premium-text text-center max-w-sm mx-auto">
            Professional lighting design and floor plan creation platform
          </p>
        </div>

        <Card className="warm-card shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Lock className="h-5 w-5 text-primary warm-glow" />
              <CardTitle className="text-xl warm-text">Welcome Back</CardTitle>
            </div>
            <CardDescription className="premium-text">
              Sign in to access your lighting projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="premium-text">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 warm-input"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="premium-text">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 warm-input"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full warm-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-8 premium-text text-sm opacity-75">
                      © 2025 <span className="text-primary font-medium">Belecure</span> - A Product of <span className="text-primary font-medium">Lightscape</span>. All rights reserved.
        </div>
      </div>
    </div>
  );
} 