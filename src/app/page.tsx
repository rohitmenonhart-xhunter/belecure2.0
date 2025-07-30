"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
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
  ExternalLink,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  // Filter projects based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = projects.filter(project => 
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query)
      );
      setFilteredProjects(filtered);
    }
  }, [projects, searchQuery]);

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
      draft: { label: 'Draft', color: 'bg-amber-500' },
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
      <div className="min-h-screen premium-gradient-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="premium-text text-primary">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen premium-gradient-bg">
      {/* Header */}
      <header className="bg-card/80 border-b border-border backdrop-blur-xl warm-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Image
                  src="/lightscapelogo.png"
                  alt="Lightscape Logo"
                  width={40}
                  height={40}
                  className="warm-glow"
                />
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold warm-text">
                    Belecure Dashboard
                  </h1>
                  <p className="text-sm premium-text opacity-75">A Product of Lightscape</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/floor-plan-editor')}
                className="warm-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Projects Grid */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Your Projects</h2>
            <p className="premium-text">Manage and edit your lighting design projects</p>
          </div>
          <div className="text-sm premium-text">
            {searchQuery ? (
              `${filteredProjects.length} of ${projects.length} project${projects.length !== 1 ? 's' : ''}`
            ) : (
              `${projects.length} project${projects.length !== 1 ? 's' : ''}`
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search projects by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 warm-card border-border/50 focus:border-primary/50"
            />
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm premium-text">
              {filteredProjects.length === 0 ? (
                'No projects found matching your search.'
              ) : (
                `Found ${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''} matching "${searchQuery}"`
              )}
            </div>
          )}
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center rounded-full bg-primary/10">
              <Lightbulb className="h-12 w-12 text-primary" />
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
                <p className="premium-text mb-6">
                  No projects match your search for "{searchQuery}". Try a different search term.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')}
                  className="mr-4"
                >
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
                <p className="premium-text mb-6">
                  Start by creating your first lighting design project. Design beautiful spaces with our intuitive tools.
                </p>
              </>
            )}
            <Button 
              onClick={() => router.push('/floor-plan-editor')}
              className="premium-button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="warm-card hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-foreground text-lg mb-1 line-clamp-1">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="premium-text text-sm line-clamp-2">
                        {project.description}
                      </CardDescription>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Project Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-muted/50 rounded-lg p-3 warm-border">
                      <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-blue-500" />
                        <span className="text-xs premium-text">Walls</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground mt-1">
                        {project.metadata.wallCount}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 warm-border">
                      <div className="flex items-center space-x-2">
                        <HomeIcon className="h-4 w-4 text-green-500" />
                        <span className="text-xs premium-text">Rooms</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground mt-1">
                        {project.metadata.roomCount}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 warm-border">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-orange-500" />
                        <span className="text-xs premium-text">Furniture</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground mt-1">
                        {project.metadata.furnitureCount}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 warm-border">
                      <div className="flex items-center space-x-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs premium-text">Lights</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground mt-1">
                        {project.metadata.lightingCount}
                      </p>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center space-x-2 text-xs premium-text">
                      <Calendar className="h-3 w-3" />
                      <span>Created: {formatDate(project.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs premium-text">
                      <Clock className="h-3 w-3" />
                      <span>Updated: {formatDate(project.updatedAt)}</span>
                    </div>
                    {project.completedAt && (
                      <div className="flex items-center space-x-2 text-xs text-green-600">
                        <Lightbulb className="h-3 w-3" />
                        <span>Completed: {formatDate(project.completedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEditProject(project.projectId)}
                      className="flex-1 warm-button text-sm"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handlePreviewProject(project.projectId)}
                      variant="outline"
                      className="border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-400"
                      title="Open preview in new tab"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteProject(project.projectId)}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
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
        )}
      </main>
    </div>
  );
}
