import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const { 
      projectId, 
      title, 
      description,
      blueprintData, 
      furnitureData, 
      lightingData,
      status = 'lighting_complete'
    } = body;
    
    // Validate required fields
    if (!projectId || !title || !blueprintData) {
      return NextResponse.json(
        { error: 'Project ID, title, and blueprint data are required' },
        { status: 400 }
      );
    }
    
    // Calculate metadata
    const metadata = {
      wallCount: blueprintData.walls?.length || 0,
      roomCount: blueprintData.roomLabels?.length || 0,
      furnitureCount: furnitureData?.length || 0,
      lightingCount: lightingData?.lights?.length || 0,
      isCalibrated: blueprintData.calibration?.isCalibrated || false,
      canvasDimensions: {
        width: blueprintData.metadata?.canvasDimensions?.width || 1000,
        height: blueprintData.metadata?.canvasDimensions?.height || 700,
      },
    };
    
    // Check if project exists
    let project = await Project.findOne({ projectId });
    
    if (project) {
      // Update existing project
      project.title = title;
      project.description = description || project.description;
      project.blueprintData = blueprintData;
      project.furnitureData = furnitureData || project.furnitureData;
      project.lightingData = lightingData || project.lightingData;
      project.status = status;
      project.metadata = metadata;
      project.updatedAt = new Date();
      
      if (status === 'lighting_complete') {
        project.completedAt = new Date();
      }
      
      await project.save();
    } else {
      // Create new project
      project = new Project({
        projectId,
        title,
        description: description || '',
        userId: user._id,
        blueprintData,
        furnitureData: furnitureData || [],
        lightingData: lightingData || null,
        status,
        metadata,
        completedAt: status === 'lighting_complete' ? new Date() : undefined,
      });
      
      await project.save();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Project saved successfully',
      project: {
        id: project._id,
        projectId: project.projectId,
        title: project.title,
        description: project.description,
        status: project.status,
        metadata: project.metadata,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        completedAt: project.completedAt,
      }
    });
    
  } catch (error) {
    console.error('Save project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Get user's projects
    const projects = await Project.find({ userId: decoded.userId })
      .select('-blueprintData -furnitureData -lightingData') // Exclude large data fields
      .sort({ updatedAt: -1 });
    
    return NextResponse.json({
      success: true,
      projects: projects.map(project => ({
        id: project._id,
        projectId: project.projectId,
        title: project.title,
        description: project.description,
        status: project.status,
        metadata: project.metadata,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        completedAt: project.completedAt,
      }))
    });
    
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 