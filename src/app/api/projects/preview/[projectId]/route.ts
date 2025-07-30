import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/lib/models/Project';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await connectDB();
    
    const { projectId } = await params;
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    // Find the project - NO authentication required for preview
    const project = await Project.findOne({ projectId });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Only return data needed for preview
    return NextResponse.json({
      success: true,
      project: {
        id: project._id,
        projectId: project.projectId,
        title: project.title,
        description: project.description,
        blueprintData: project.blueprintData,
        furnitureData: project.furnitureData,
        lightingData: project.lightingData,
        status: project.status,
        metadata: project.metadata,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        completedAt: project.completedAt,
      }
    });
    
  } catch (error) {
    console.error('Preview project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 