'use client';
 
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Dialog } from '@headlessui/react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  coverImage: string;
  status: 'COMING_SOON' | 'LIVE' | 'ENDED';
  tags: string[];
  overview: {
    description: string;
  };
  nftDetails: {
    title: string;
    description: string;
    features: string[];
  };
  mintDetails: {
    chain: string;
    supply: string;
    mintDate: string;
    phases: {
      name: string;
      duration: string;
      time: string;
    }[];
  };
  howToMint: {
    steps: string[];
  };
  importantLinks: {
    title: string;
    url: string;
    icon: string;
  }[];
  collaboration: {
    enabled: boolean;
    title: string;
    description: string;
    disabledMessage: string;
  };
  tasks: {
    discord: {
      title: string;
      description: string;
      tasks: {
        id: string;
        title: string;
        description: string;
        points: number;
        dueDate: string;
        subtasks?: {
          id: string;
          title: string;
          required: boolean;
        }[];
      }[];
      progress: number;
    };
    social: {
      title: string;
      description: string;
      tasks: {
        id: string;
        title: string;
        description: string;
        points: number;
        dueDate: string;
      }[];
      progress: number;
    };
  };
}

interface TaskProgress {
  userId: string;
  projectId: string;
  tasks: {
    taskId: string;
    type: 'discord' | 'social';
    status: 'pending' | 'pending_approval' | 'completed';
    completedAt?: string;
    submission?: string;
    subtasks?: {
      subtaskId: string;
      completed: boolean;
      completedAt?: string;
    }[];
  }[];
  totalPoints: number;
  completedTasks: number;
}

interface TaskProgressResponse {
  discord?: {
    tasks: Array<{
      id: string;
      progress?: {
        status: 'pending' | 'completed';
        completedAt?: string;
        submission?: string;
        subtasks?: Array<{
          subtaskId: string;
          completed: boolean;
          completedAt?: string;
        }>;
      };
      subtasks?: Array<{
        id: string;
      }>;
    }>;
  };
  social?: {
    tasks: Array<{
      id: string;
      progress?: {
        status: 'pending' | 'completed';
        completedAt?: string;
        submission?: string;
      };
    }>;
  };
  totalPoints: number;
  completedTasks: number;
}

interface TaskSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    type: 'discord' | 'social';
    points: number;
  };
}

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { about: string; collaboration: string }) => void;
  submitting: boolean;
}

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`rounded-lg px-6 py-4 shadow-lg backdrop-blur-md border ${
        type === 'success' 
          ? 'bg-green-500/10 border-green-500/20 text-green-400' 
          : 'bg-red-500/10 border-red-500/20 text-red-400'
      }`}>
        <div className="flex items-center gap-3">
          <span className={type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {type === 'success' ? '✓' : '✕'}
          </span>
          <p>{message}</p>
          <button 
            onClick={onClose}
            className="ml-4 opacity-60 hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskSubmissionModal = ({ isOpen, onClose, task, onTaskSubmitted }: TaskSubmissionModalProps & { onTaskSubmitted: (updatedProgress: TaskProgress) => void }) => {
  const [submission, setSubmission] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useDynamicContext();
  const params = useParams();
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/projects/${params.projectId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.email}`
        },
        body: JSON.stringify({
          taskId: task.id,
          type: task.type,
          submission: submission
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit task');
      }

      const data = await response.json();
      if (data.success) {
        onTaskSubmitted(data.data);
        onClose();
      } else {
        throw new Error(data.error || 'Failed to submit task');
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };
 
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
          <Dialog.Title className="text-xl font-display text-[#f5efdb] mb-4">
            Submit Task: {task.title}
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#f5efdb99] text-sm mb-2">
                {task.type === 'discord' ? 'Discord Username' : 'Post Link'}
              </label>
              <input
                type="text"
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                placeholder={task.type === 'discord' ? 'Enter your Discord username' : 'Paste your post link'}
                required
                disabled={submitting}
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-yellow-400 text-sm">+{task.points} pts</span>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#f5efdb] text-[#2a2a28] hover:opacity-90 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

const CollaborationModal = ({ isOpen, onClose, onSubmit, submitting }: CollaborationModalProps) => {
  const [about, setAbout] = useState('');
  const [collaboration, setCollaboration] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim values before validation
    const trimmedAbout = about.trim();
    const trimmedCollaboration = collaboration.trim();
    
    if (!trimmedAbout || !trimmedCollaboration) {
      setError('Please fill in both fields');
      return;
    }

    // Pass the trimmed values to onSubmit
    onSubmit({
      about: trimmedAbout,
      collaboration: trimmedCollaboration
    });
  };

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setAbout('');
      setCollaboration('');
      setError(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
          <Dialog.Title className="text-2xl font-display text-[#f5efdb] mb-6">
            Collaboration Request
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[#f5efdb] text-lg mb-2">
                Tell us about yourself
              </label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full h-32 px-4 py-3 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33] resize-none"
                placeholder="I am the owner of XYZ YouTube channel with 50k subscribers, focusing on NFT and Web3 content. I have been creating content for 2 years and have collaborated with projects like ABC and DEF."
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-[#f5efdb] text-lg mb-2">
                How would you like to collaborate with this project?
              </label>
              <textarea
                value={collaboration}
                onChange={(e) => setCollaboration(e.target.value)}
                className="w-full h-32 px-4 py-3 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33] resize-none"
                placeholder="I can create 3 detailed videos about the project over 2 weeks (1-2 videos per week), covering topics like project overview, unique features, and mint strategy. Each video will be 10-15 minutes long with high production quality."
                required
                disabled={submitting}
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-[#f5efdb] text-[#2a2a28] hover:opacity-90 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default function ProjectDetailsPage() {
  const { user } = useDynamicContext();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<null | {
    id: string;
    title: string;
    type: 'discord' | 'social';
    points: number;
  }>(null);
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [submittingCollaboration, setSubmittingCollaboration] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [existingCollaboration, setExistingCollaboration] = useState<{
    status: 'pending' | 'approved' | 'rejected';
    about: string;
    collaboration: string;
  } | null>(null);
 
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email || !params.projectId) return;

      try {
        setLoading(true);
        setError(null);
        
        // Fetch project details and task progress in parallel
        const [projectResponse, progressResponse, collaborationResponse] = await Promise.all([
          fetch(`/api/projects/${params.projectId}`, {
            headers: {
              'Authorization': `Bearer ${user.email}`
            }
          }),
          fetch(`/api/projects/${params.projectId}/progress`, {
            headers: {
              'Authorization': `Bearer ${user.email}`
            }
          }),
          fetch(`/api/projects/${params.projectId}/collaborate`, {
            headers: {
              'Authorization': `Bearer ${user.email}`
            }
          })
        ]);

        if (!projectResponse.ok) {
          throw new Error('Failed to fetch project details');
        }

        const projectData = await projectResponse.json();
        console.log('Project Data:', projectData);
        
        if (projectData.success) {
          setProject(projectData.data);
          
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            console.log('Progress Data:', progressData);
            
            if (progressData.success) {
              setTaskProgress(progressData.data);
            }
          }

          if (collaborationResponse.ok) {
            const collaborationData = await collaborationResponse.json();
            console.log('Collaboration Data:', collaborationData);
            
            if (collaborationData.success && collaborationData.data) {
              setExistingCollaboration(collaborationData.data);
            }
          }
        } else {
          throw new Error(projectData.error || 'Failed to fetch project details');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, params.projectId]);

  const handleTaskClick = (task: { 
    id: string;
    title: string; 
    type: 'discord' | 'social'; 
    points: number; 
  }) => {
    // Only allow clicking if task is in pending status
    const taskStatus = getTaskStatus(task.id);
    if (taskStatus === 'pending') {
      setSelectedTask(task);
    }
  };

  const getTaskStatus = (taskId: string) => {
    if (!taskProgress?.tasks) return 'pending';
    const task = taskProgress.tasks.find(t => t.taskId === taskId);
    return task?.status || 'pending';
  };

  const getSubtaskStatus = (taskId: string, subtaskId: string) => {
    if (!taskProgress) return false;
    const task = taskProgress.tasks?.find(t => t.taskId === taskId);
    return task?.subtasks?.find(st => st.subtaskId === subtaskId)?.completed || false;
  };

  const getTaskStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-green-500',
          size: 'w-3 h-3',
          tooltip: 'Completed'
        };
      case 'pending_approval':
        return {
          color: 'bg-yellow-500',
          size: 'w-3 h-3',
          tooltip: 'Pending Admin Approval'
        };
      case 'pending':
      default:
        return {
          color: 'bg-[#f5efdb33]',
          size: 'w-2 h-2',
          tooltip: 'Not Started'
        };
    }
  };

  const handleTaskSubmitted = (updatedProgress: TaskProgress) => {
    setTaskProgress(updatedProgress);
    // Update project progress percentages
    if (project && updatedProgress?.tasks) {
      const discordTasks = project.tasks.discord.tasks || [];
      const socialTasks = project.tasks.social.tasks || [];
      
      const discordCompleted = discordTasks.filter(task => 
        updatedProgress.tasks.some(t => t.taskId === task.id && t.status === 'completed')
      ).length;
      
      const socialCompleted = socialTasks.filter(task => 
        updatedProgress.tasks.some(t => t.taskId === task.id && t.status === 'completed')
      ).length;

      setProject({
        ...project,
        tasks: {
          ...project.tasks,
          discord: {
            ...project.tasks.discord,
            progress: discordTasks.length > 0 ? Math.round((discordCompleted / discordTasks.length) * 100) : 0
          },
          social: {
            ...project.tasks.social,
            progress: socialTasks.length > 0 ? Math.round((socialCompleted / socialTasks.length) * 100) : 0
          }
        }
      });
    }
  };

  const handleCollaborationSubmit = async (data: { about: string; collaboration: string }) => {
    try {
      if (!user?.email) {
        console.log('No user email found');
        setToast({
          message: 'Please sign in to submit a collaboration request',
          type: 'error'
        });
        return;
      }

      setSubmittingCollaboration(true);
      
      // Log the data being sent
      console.log('Submitting collaboration request:', {
        projectId: params.projectId,
        email: user.email,
        about: data.about,
        collaboration: data.collaboration
      });

      const response = await fetch(`/api/projects/${params.projectId}/collaborate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify({
          about: data.about,
          collaboration: data.collaboration
        })
      });

      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to submit collaboration request');
      }

      if (responseData.success) {
        console.log('Collaboration request successful:', responseData.data);
        setToast({
          message: 'Collaboration request submitted successfully! We will review your request and get back to you soon.',
          type: 'success'
        });
        setShowCollaborationModal(false);
      } else {
        throw new Error(responseData.error || 'Failed to submit collaboration request');
      }
    } catch (error) {
      console.error('Error submitting collaboration request:', error);
      setToast({
        message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again later.',
        type: 'error'
      });
    } finally {
      setSubmittingCollaboration(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
        <div className="text-[#f5efdb] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5efdb] mx-auto mb-4"></div>
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 mb-4">{error}</div>
          <Link
            href="/dashboard/projects"
            className="inline-block px-4 py-2 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-[#f5efdb] mb-4">Project not found</div>
          <Link
            href="/dashboard/projects"
            className="inline-block px-4 py-2 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-[#1a1a18]">
      <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
        {/* Project Header */}
        <div className="relative w-full h-[300px] rounded-xl overflow-hidden mb-8">
          <Image
            src={project.coverImage}
            alt={project.name}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8">
            <h1 className="text-4xl font-display text-[#f5efdb] mb-2">{project.name}</h1>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full text-sm text-[#f5efdb] bg-[#f5efdb1a] border border-[#f5efdb33]">
                {project.status.replace('_', ' ')}
              </span>
              {project.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 rounded-full text-sm text-purple-400 bg-purple-400/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
 
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Overview */}
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <h2 className="text-2xl font-display text-[#f5efdb] mb-4">Overview</h2>
              <p className="text-[#f5efdb99] leading-relaxed">
                {project.overview.description}
              </p>
            </div>
 
            {/* NFT Details */}
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <h2 className="text-2xl font-display text-[#f5efdb] mb-4">{project.nftDetails.title}</h2>
              <p className="text-[#f5efdb99] mb-4">
                {project.nftDetails.description}
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#f5efdb99]">
                {project.nftDetails.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
 
            {/* How to Mint */}
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <h2 className="text-2xl font-display text-[#f5efdb] mb-4">How to Mint</h2>
              <ol className="list-decimal list-inside space-y-2 text-[#f5efdb99]">
                {project.howToMint.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Tasks & Progress Section */}
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display text-[#f5efdb]">Tasks & Progress</h2>
                <span className="text-[#f5efdb99]">
                  {taskProgress ? (
                    `${taskProgress.completedTasks || 0}/${(project.tasks?.discord?.tasks?.length || 0) + (project.tasks?.social?.tasks?.length || 0)} Tasks Completed`
                  ) : '0/0 Tasks Completed'}
                </span>
              </div>

              {/* Discord Tasks */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">👾</span>
                    <h3 className="text-lg font-display text-[#f5efdb]">{project.tasks.discord.title}</h3>
                  </div>
                  <span className="text-[#f5efdb99]">{project.tasks.discord.progress}%</span>
                </div>

                {project.tasks.discord.tasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`rounded-lg bg-[#2a2a2855] border border-[#f5efdb1a] p-4 ${
                      getTaskStatus(task.id) === 'pending' 
                        ? 'cursor-pointer hover:bg-[#2a2a2877] transition-colors' 
                        : 'cursor-not-allowed opacity-75'
                    }`}
                    onClick={() => handleTaskClick({
                      id: task.id,
                      title: task.title,
                      type: 'discord',
                      points: task.points
                    })}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border border-[#f5efdb33] flex items-center justify-center group relative">
                          {(() => {
                            const status = getTaskStatus(task.id);
                            const statusDisplay = getTaskStatusDisplay(status);
                            return (
                              <>
                                <div className={`rounded-full ${statusDisplay.color} ${statusDisplay.size}`}></div>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#2a2a28] text-xs text-[#f5efdb] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                  {statusDisplay.tooltip}
                                  {status !== 'pending' && (
                                    <div className="mt-1 text-[#f5efdb99]">
                                      {status === 'pending_approval' ? 'Waiting for admin approval' : 'Task already completed'}
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        <div>
                          <h4 className="text-[#f5efdb] font-medium">{task.title}</h4>
                          <p className="text-[#f5efdb99] text-sm">{task.description}</p>
                          
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {task.subtasks.map((subtask) => (
                                <div key={subtask.id} className="flex items-center gap-2 text-sm">
                                  <div className="w-3 h-3 rounded-full border border-[#f5efdb33] flex items-center justify-center">
                                    {getSubtaskStatus(task.id, subtask.id) ? (
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    ) : (
                                      <div className="w-1 h-1 rounded-full bg-[#f5efdb33]"></div>
                                    )}
                                  </div>
                                  <span className={`${getSubtaskStatus(task.id, subtask.id) ? 'text-[#f5efdb99] line-through' : 'text-[#f5efdb]'}`}>
                                    {subtask.title}
                                  </span>
                                  {subtask.required && (
                                    <span className="text-[#f5efdb66]">(Required)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-yellow-400 text-sm">+{task.points} pts</span>
                        <span className="text-[#f5efdb66] text-sm">{task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Media Tasks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">🐦</span>
                    <h3 className="text-lg font-display text-[#f5efdb]">{project.tasks.social.title}</h3>
                  </div>
                  <span className="text-[#f5efdb99]">{project.tasks.social.progress}%</span>
                </div>

                {project.tasks.social.tasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`rounded-lg bg-[#2a2a2855] border border-[#f5efdb1a] p-4 ${
                      getTaskStatus(task.id) === 'pending' 
                        ? 'cursor-pointer hover:bg-[#2a2a2877] transition-colors' 
                        : 'cursor-not-allowed opacity-75'
                    }`}
                    onClick={() => handleTaskClick({
                      id: task.id,
                      title: task.title,
                      type: 'social',
                      points: task.points
                    })}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border border-[#f5efdb33] flex items-center justify-center group relative">
                          {(() => {
                            const status = getTaskStatus(task.id);
                            const statusDisplay = getTaskStatusDisplay(status);
                            return (
                              <>
                                <div className={`rounded-full ${statusDisplay.color} ${statusDisplay.size}`}></div>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#2a2a28] text-xs text-[#f5efdb] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                  {statusDisplay.tooltip}
                                  {status !== 'pending' && (
                                    <div className="mt-1 text-[#f5efdb99]">
                                      {status === 'pending_approval' ? 'Waiting for admin approval' : 'Task already completed'}
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        <div>
                          <h4 className="text-[#f5efdb] font-medium">{task.title}</h4>
                          <p className="text-[#f5efdb99] text-sm">{task.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-yellow-400 text-sm">+{task.points} pts</span>
                        <span className="text-[#f5efdb66] text-sm">{task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
 
          {/* Sidebar with Key Details */}
          <div className="lg:w-80 space-y-4">
            {/* Mint Details Card */}
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <h3 className="text-lg font-display text-[#f5efdb] mb-4">Mint Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[#f5efdb99] text-sm">Chain</p>
                  <p className="text-[#f5efdb]">{project.mintDetails.chain}</p>
                </div>
                <div>
                  <p className="text-[#f5efdb99] text-sm">Supply</p>
                  <p className="text-[#f5efdb]">{project.mintDetails.supply}</p>
                </div>
                <div>
                  <p className="text-[#f5efdb99] text-sm">Mint Date</p>
                  <p className="text-[#f5efdb]">{project.mintDetails.mintDate}</p>
                </div>
              </div>
            </div>
 
            {/* Mint Phases Card */}
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <h3 className="text-lg font-display text-[#f5efdb] mb-4">Mint Phases</h3>
              <div className="space-y-3">
                {project.mintDetails.phases.map((phase, index) => (
                  <div key={index}>
                    <p className="text-[#f5efdb99] text-sm">{phase.name}</p>
                    <p className="text-[#f5efdb]">{phase.duration} - {phase.time}</p>
                  </div>
                ))}
              </div>
            </div>
 
            {/* Links Card */}
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <h3 className="text-lg font-display text-[#f5efdb] mb-4">Important Links</h3>
              <div className="space-y-2">
                {project.importantLinks.map((link, index) => (
                  <a 
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[#f5efdb] hover:opacity-80"
                  >
                    {link.icon} {link.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Apply Button - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a18]/80 backdrop-blur-md border-t border-[#f5efdb1a] p-4 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div>
            <h3 className="text-[#f5efdb] font-display text-center sm:text-left">{project.collaboration.title}</h3>
            <p className="text-[#f5efdb99] text-center sm:text-left">{project.collaboration.description}</p>
          </div>
          <div className="relative group">
            <button 
              disabled={!project.collaboration.enabled || existingCollaboration !== null}
              onClick={() => setShowCollaborationModal(true)}
              className={`w-full sm:w-auto px-8 py-3 rounded-lg transition-all font-medium ${
                project.collaboration.enabled && !existingCollaboration
                  ? 'bg-[#f5efdb] text-[#2a2a28] hover:opacity-90'
                  : 'bg-[#f5efdb33] text-[#f5efdb66] cursor-not-allowed'
              }`}
            >
              {existingCollaboration 
                ? `Request ${existingCollaboration.status.charAt(0).toUpperCase() + existingCollaboration.status.slice(1)}`
                : 'Collaborate Now'
              }
            </button>
            {(!project.collaboration.enabled || existingCollaboration) && (
              <div className="absolute bottom-full mb-2 w-48 p-2 bg-[#2a2a28] border border-[#f5efdb1a] rounded-lg text-[#f5efdb99] text-sm text-center
                opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {existingCollaboration
                  ? `You have already submitted a collaboration request (${existingCollaboration.status})`
                  : project.collaboration.disabledMessage
                }
              </div>
            )}
          </div>
        </div>
      </div>
 
      {/* Task Submission Modal */}
      {selectedTask && (
        <TaskSubmissionModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          onTaskSubmitted={handleTaskSubmitted}
        />
      )}

      {/* Collaboration Modal */}
      <CollaborationModal
        isOpen={showCollaborationModal}
        onClose={() => setShowCollaborationModal(false)}
        onSubmit={handleCollaborationSubmit}
        submitting={submittingCollaboration}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
} 