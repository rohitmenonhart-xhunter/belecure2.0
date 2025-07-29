"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  Layers, 
  Lightbulb, 
  Home as HomeIcon,
  LogOut,
  Loader2,
  Eye,
  Clock,
  ExternalLink
} from 'lucide-react';

interface Project {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'draft' | 'blueprint_complete' | 'furniture_complete' | 'lighting_complete';
  metadata: {
    wallCount: number;
    roomCount: number;
    furnitureCount: number;
    lightingCount: number;
    isCalibrated: boolean;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects/save');
      const data = await response.json();
      
      if (response.ok) {
        setProjects(data.projects || []);
      } else {
        setError(data.error || 'Failed to load projects');
      }
    } catch (error) {
      setError('Network error while loading projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setDeletingProject(projectId);
    try {
      const response = await fetch(`/api/projects/delete?projectId=${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.projectId !== projectId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete project');
      }
    } catch (error) {
      alert('Network error while deleting project');
    } finally {
      setDeletingProject(null);
    }
  };

  const handleEditProject = async (projectId: string) => {
    try {
      // Store the project ID in localStorage for the lighting page to pick up
      localStorage.setItem('editingProjectId', projectId);
      router.push('/lighting');
    } catch (error) {
      alert('Error loading project for editing');
    }
  };

  const handlePreviewProject = (projectId: string) => {
    // Open preview in new tab
    window.open(`/preview/${projectId}`, '_blank');
  };

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

  const getStatusBadge = (status: Project['status']) => {
    const statusConfig = {
      draft: { label: 'Draft', color: 'bg-gray-500' },
      blueprint_complete: { label: 'Blueprint', color: 'bg-blue-500' },
      furniture_complete: { label: 'Furniture', color: 'bg-orange-500' },
      lighting_complete: { label: 'Complete', color: 'bg-green-500' }
    };
    
    const config = statusConfig[status];
    return (
      <Badge className={`${config.color} text-white hover:${config.color}/80`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-cyan-300">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-700 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <HomeIcon className="h-8 w-8 text-cyan-400" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  LightScape Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/floor-plan-editor')}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                className="border-red-600 text-red-400 hover:bg-red-900/20 hover:text-red-300 hover:border-red-500"
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {error && (
          <Alert className="mb-6 border-red-800 bg-red-900/20">
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-6">
              <Lightbulb className="h-12 w-12 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-200 mb-2">No Projects Yet</h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Start creating your first lighting design project. Design blueprints, add furniture, and create stunning lighting layouts.
            </p>
            <Button
              onClick={() => router.push('/floor-plan-editor')}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-200">Your Projects</h2>
                <p className="text-slate-400">Manage and edit your lighting design projects</p>
              </div>
              <div className="text-sm text-slate-400">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="bg-slate-900/60 border-slate-700 hover:bg-slate-900/80 transition-all duration-200 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-slate-200 text-lg mb-1 line-clamp-1">
                          {project.title}
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-sm line-clamp-2">
                          {project.description}
                        </CardDescription>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Project Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Layers className="h-4 w-4 text-blue-400" />
                          <span className="text-xs text-slate-400">Walls</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-200 mt-1">
                          {project.metadata.wallCount}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <HomeIcon className="h-4 w-4 text-green-400" />
                          <span className="text-xs text-slate-400">Rooms</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-200 mt-1">
                          {project.metadata.roomCount}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-orange-400" />
                          <span className="text-xs text-slate-400">Furniture</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-200 mt-1">
                          {project.metadata.furnitureCount}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Lightbulb className="h-4 w-4 text-yellow-400" />
                          <span className="text-xs text-slate-400">Lights</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-200 mt-1">
                          {project.metadata.lightingCount}
                        </p>
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>Created: {formatDate(project.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>Updated: {formatDate(project.updatedAt)}</span>
                      </div>
                      {project.completedAt && (
                        <div className="flex items-center space-x-2 text-xs text-green-500">
                          <Lightbulb className="h-3 w-3" />
                          <span>Completed: {formatDate(project.completedAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleEditProject(project.projectId)}
                        className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-sm"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handlePreviewProject(project.projectId)}
                        variant="outline"
                        className="border-green-600 text-green-400 hover:bg-green-900/20 hover:text-green-300 hover:border-green-500"
                        title="Open preview in new tab"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteProject(project.projectId)}
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-900/20 hover:text-red-300 hover:border-red-500"
                        disabled={deletingProject === project.projectId}
                      >
                        {deletingProject === project.projectId ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
