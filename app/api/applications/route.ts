import { NextRequest, NextResponse } from 'next/server';
import { userAuth, isAdmin } from '@/middleware/userAuth';
import dbConnect from '@/lib/db';
import Application from '@/src/models/Application';
import UserCollaboration from '@/src/models/UserCollaboration';
import Project from '@/src/models/Project';

interface AuthResult {
  user: {
    email: string;
    role: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user email from Bearer token
    const userEmail = authHeader.split(' ')[1];
    if (!userEmail || !userEmail.includes('@')) {
      return NextResponse.json({ 
        error: 'Invalid authentication token',
        received_email: userEmail
      }, { status: 401 });
    }

    await dbConnect();
    
    // Get all collaboration requests for the user
    const collaborations = await UserCollaboration.find({
      userId: userEmail,
      status: { $in: ['pending', 'approved'] }
    }).lean();

    // Get all project IDs from collaborations
    const projectIds = Array.from(new Set(collaborations.map(collab => collab.projectId)));

    // Get project details for all collaborations
    const projects = await Project.find({
      _id: { $in: projectIds }
    }).lean();

    // Transform collaborations with project details
    const transformedCollaborations = collaborations.map(collab => {
      const project = projects.find(p => p._id.toString() === collab.projectId.toString());
      return {
        id: collab._id,
        projectId: collab.projectId,
        projectName: project?.name || 'Unknown Project',
        projectImage: project?.coverImage,
        status: collab.status,
        about: collab.about,
        collaboration: collab.collaboration,
        submittedAt: collab.createdAt,
        updatedAt: collab.updatedAt
      };
    });

    return NextResponse.json({ 
      success: true,
      data: transformedCollaborations
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch applications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await userAuth(request);
    if (!('user' in authResult)) {
      return authResult as NextResponse;
    }

    const { user } = authResult as AuthResult;

    // Get request body
    const data = await request.json();

    // Validate required fields
    if (!data.projectId || !data.answers) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Connect to database
    await dbConnect();

    // Create application
    const application = await Application.create({
      userId: user.email,
      projectId: data.projectId,
      answers: data.answers,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: application._id,
        ...data
      }
    });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to submit application'
    }, { status: 500 });
  }
} 