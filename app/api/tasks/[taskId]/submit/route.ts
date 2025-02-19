import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TaskProgress, { ITaskProgress } from '@/src/models/TaskProgress';
import Task, { ITask } from '@/src/models/Task';
import Project from '@/src/models/Project';

type TaskType = 'discord' | 'social';

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    console.log('Task submission endpoint called with taskId:', params.taskId);
    await dbConnect();
    
    // Get user email from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const userEmail = authHeader.split(' ')[1];
    if (!userEmail || !userEmail.includes('@')) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid authentication token'
      }, { status: 401 });
    }

    console.log('Authenticated user:', userEmail);

    const { link, description } = await request.json();
    if (!link || !description) {
      return NextResponse.json({ 
        success: false,
        error: 'Link and description are required'
      }, { status: 400 });
    }

    console.log('Submission data:', { link, description });

    // First, find the task in the Task collection
    const task = await Task.findById(params.taskId).lean();
    if (!task) {
      console.log('Task not found:', params.taskId);
      return NextResponse.json({ 
        success: false,
        error: 'Task not found'
      }, { status: 404 });
    }

    console.log('Found task:', task);

    // Find or create task progress for this user and project
    let taskProgress = await TaskProgress.findOne({
      userId: userEmail,
      projectId: task.projectId
    });

    if (!taskProgress) {
      console.log('Creating new task progress for user');
      taskProgress = new TaskProgress({
        userId: userEmail,
        projectId: task.projectId,
        tasks: [],
        totalPoints: 0,
        completedTasks: 0
      });
    }

    // Find if this task is already in the progress
    const taskIndex = taskProgress.tasks.findIndex(t => t.taskId === params.taskId);
    
    // Determine task type based on task platform
    const taskType: TaskType = (task as any).platform?.toLowerCase().includes('discord') ? 'discord' : 'social';

    // Create or update the task progress entry
    const now = new Date();
    const updatedTask = {
      taskId: params.taskId,
      type: taskType,
      status: 'pending_approval' as const,
      submission: link,
      completedAt: now,
      subtasks: [] // Initialize empty subtasks array
    };

    if (taskIndex === -1) {
      // Add new task
      taskProgress.tasks.push(updatedTask);
    } else {
      // Update existing task
      taskProgress.tasks[taskIndex] = updatedTask;
    }

    console.log('Saving task progress:', taskProgress);

    // Save changes
    await taskProgress.save();

    console.log('Task progress saved successfully');

    return NextResponse.json({ 
      success: true,
      task: updatedTask
    });

  } catch (error) {
    console.error('Error submitting task:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to submit task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
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