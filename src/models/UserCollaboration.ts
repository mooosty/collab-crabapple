import mongoose, { Schema, Document } from 'mongoose';

export interface IUserCollaboration extends Document {
  userId: string;
  projectId: string;
  status: 'pending' | 'approved' | 'rejected';
  about: string;
  collaboration: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserCollaborationSchema: Schema = new Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    trim: true
  },
  projectId: {
    type: String,
    required: [true, 'Project ID is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: true
  },
  about: {
    type: String,
    required: [true, 'About information is required'],
    trim: true,
    minlength: [1, 'About information cannot be empty']
  },
  collaboration: {
    type: String,
    required: [true, 'Collaboration information is required'],
    trim: true,
    minlength: [1, 'Collaboration information cannot be empty']
  }
}, {
  timestamps: true,
  strict: true,
  strictQuery: true
});

// Create a compound index for userId and projectId
UserCollaborationSchema.index({ userId: 1, projectId: 1 }, { unique: true });

// Pre-save middleware to ensure required fields are present
UserCollaborationSchema.pre('save', function(next) {
  if (!this.about || !this.collaboration) {
    next(new Error('About and collaboration fields are required'));
  } else {
    next();
  }
});

// Clear existing models to prevent OverwriteModelError
Object.keys(mongoose.models).forEach(key => {
  delete mongoose.models[key];
});

// Create and export the model
const UserCollaboration = mongoose.model<IUserCollaboration>('UserCollaboration', UserCollaborationSchema);

export default UserCollaboration; 