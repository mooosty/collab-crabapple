import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UserCollaboration from '@/src/models/UserCollaboration';
import Project from '@/src/models/Project';

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    console.log('Starting collaboration request...');
    await dbConnect();
    console.log('Database connected');
    
    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get email from Bearer token
    const userEmail = authHeader.split(' ')[1];
    if (!userEmail || !userEmail.includes('@')) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid authentication token'
      }, { status: 401 });
    }

    console.log('Authenticated user:', userEmail);

    // Get and validate request body
    const body = await request.json();
    console.log('Raw request body:', JSON.stringify(body, null, 2));
    
    const { about, collaboration } = body;
    console.log('Extracted fields:', { about, collaboration });
    
    // Strict validation for required fields
    if (!about || !collaboration) {
      console.log('Missing required fields:', { about, collaboration });
      return NextResponse.json({ 
        success: false,
        error: 'Both about and collaboration fields are required',
        receivedData: { about, collaboration }
      }, { status: 400 });
    }

    if (typeof about !== 'string' || typeof collaboration !== 'string') {
      console.log('Invalid field types:', {
        aboutType: typeof about,
        collaborationType: typeof collaboration,
        about,
        collaboration
      });
      return NextResponse.json({ 
        success: false,
        error: 'Both about and collaboration must be strings',
        receivedTypes: { aboutType: typeof about, collaborationType: typeof collaboration }
      }, { status: 400 });
    }

    const trimmedAbout = about.trim();
    const trimmedCollaboration = collaboration.trim();
    console.log('Trimmed values:', { trimmedAbout, trimmedCollaboration });

    if (!trimmedAbout || !trimmedCollaboration) {
      console.log('Empty fields after trim:', { 
        aboutLength: trimmedAbout.length, 
        collaborationLength: trimmedCollaboration.length,
        trimmedAbout,
        trimmedCollaboration
      });
      return NextResponse.json({ 
        success: false,
        error: 'Both about and collaboration information must not be empty',
        receivedData: { trimmedAbout, trimmedCollaboration }
      }, { status: 400 });
    }

    // Check if project exists and is enabled for collaboration
    console.log('Checking project:', params.projectId);
    const project = await Project.findById(params.projectId);
    if (!project) {
      console.log('Project not found:', params.projectId);
      return NextResponse.json({ 
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    if (!project.collaboration?.enabled) {
      console.log('Collaboration not enabled for project:', params.projectId);
      return NextResponse.json({ 
        success: false,
        error: 'Collaboration is not enabled for this project'
      }, { status: 400 });
    }

    // Check for existing collaboration request
    console.log('Checking for existing collaboration:', {
      userId: userEmail,
      projectId: params.projectId
    });

    const existingCollaboration = await UserCollaboration.findOne({
      userId: userEmail,
      projectId: params.projectId
    }).lean();

    console.log('Existing collaboration query result:', existingCollaboration);

    if (existingCollaboration) {
      console.log('Existing collaboration found:', JSON.stringify(existingCollaboration, null, 2));
      return NextResponse.json({ 
        success: false,
        error: 'You have already submitted a collaboration request for this project',
        status: existingCollaboration.status,
        existingData: existingCollaboration
      }, { status: 400 });
    }

    // Create collaboration request with explicit fields
    const collaborationData = {
      userId: userEmail,
      projectId: params.projectId,
      status: 'pending',
      about: trimmedAbout,
      collaboration: trimmedCollaboration
    };

    console.log('Creating collaboration with data:', JSON.stringify(collaborationData, null, 2));

    try {
      // Create a new document instance
      const newCollaboration = new UserCollaboration(collaborationData);
      
      // Validate the document
      const validationError = newCollaboration.validateSync();
      if (validationError) {
        console.error('Validation error:', validationError);
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          details: validationError.message,
          validationErrors: validationError.errors
        }, { status: 400 });
      }

      // Save the document
      const savedCollaboration = await newCollaboration.save();
      console.log('Saved collaboration:', JSON.stringify(savedCollaboration.toObject(), null, 2));

      // Verify the saved data
      const verifiedCollaboration = await UserCollaboration.findById(savedCollaboration._id)
        .select('userId projectId status about collaboration createdAt updatedAt')
        .lean();
        
      console.log('Verified saved collaboration:', JSON.stringify(verifiedCollaboration, null, 2));

      if (!verifiedCollaboration?.about || !verifiedCollaboration?.collaboration) {
        console.error('Required fields missing after save:', {
          savedFields: Object.keys(verifiedCollaboration || {}),
          about: verifiedCollaboration?.about,
          collaboration: verifiedCollaboration?.collaboration
        });
        
        // Delete the incomplete document
        await UserCollaboration.findByIdAndDelete(savedCollaboration._id);
        
        throw new Error('Required fields missing after save');
      }

      return NextResponse.json({ 
        success: true,
        data: verifiedCollaboration
      });
    } catch (error) {
      console.error('Error creating collaboration:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error as any).errors && { validationErrors: (error as any).errors }
        });
        
        if (error.name === 'ValidationError') {
          return NextResponse.json({ 
            success: false,
            error: 'Invalid collaboration data',
            details: error.message,
            validationErrors: (error as any).errors
          }, { status: 400 });
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in POST /api/projects/[projectId]/collaborate:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create collaboration request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    await dbConnect();
    
    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get email from Bearer token
    const userEmail = authHeader.split(' ')[1];
    if (!userEmail || !userEmail.includes('@')) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid authentication token'
      }, { status: 401 });
    }

    // Check for existing collaboration request
    const existingCollaboration = await UserCollaboration.findOne({
      userId: userEmail,
      projectId: params.projectId
    }).lean();

    return NextResponse.json({ 
      success: true,
      data: existingCollaboration || null
    });
  } catch (error) {
    console.error('Error checking collaboration status:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to check collaboration status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  });
} 