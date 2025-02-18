import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import User from '@/src/models/User';

export async function POST(req: Request) {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    const data = await req.json();
    console.log('Received data:', data);
    
    const { email, ...userData } = data;
    
    if (!email) {
      console.error('No email provided');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('Finding/updating user with email:', email);
    
    // Find user by email and update or create if doesn't exist
    const user = await User.findOneAndUpdate(
      { email },
      { 
        ...userData,
        updatedAt: new Date(),
      },
      { 
        new: true, // Return updated document
        upsert: true, // Create if doesn't exist
        runValidators: true,
      }
    );

    console.log('Saved user:', user);
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error saving user data:', error);
    // Log the full error details
    console.error('Full error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    console.log('Connecting to MongoDB for GET...');
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    console.log('Searching for user with email:', email);

    if (!email) {
      console.error('No email provided in GET request');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    console.log('Found user:', user);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error fetching user data:', error);
    console.error('Full error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
} 