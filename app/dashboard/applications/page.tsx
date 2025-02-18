'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface Application {
  id: string;
  projectId: string;
  projectName: string;
  projectImage?: string;
  status: 'pending' | 'approved';
  about: string;
  collaboration: string;
  submittedAt: string;
  updatedAt: string;
}

export default function ApplicationsPage() {
  const { user } = useDynamicContext();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/applications', {
          headers: {
            'Authorization': `Bearer ${user.email}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }

        const data = await response.json();
        if (data.success) {
          setApplications(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch applications');
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-[#f5efdb] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5efdb] mx-auto mb-4"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="inline-block px-4 py-2 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[#f5efdb1a] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#f5efdb]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-display text-[#f5efdb]">No Applications Yet</h2>
            <p className="text-[#f5efdb99]">
              You haven't applied to collaborate on any projects yet. Browse our available projects and submit your first collaboration request to get started.
            </p>
          </div>

          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#f5efdb] text-[#2a2a28] hover:opacity-90 transition-all font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Browse Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-[#f5efdb] mb-2">My Applications</h1>
        <p className="text-[#f5efdb99]">
          Track the status of your collaboration requests
        </p>
      </div>

      <div className="grid gap-6">
        {applications.map((application) => (
          <div
            key={application.id}
            className="rounded-lg bg-[#2a2a2855] border border-[#f5efdb1a] p-6 hover:bg-[#2a2a2877] transition-colors"
          >
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Project Image */}
              {application.projectImage && (
                <div className="relative w-full sm:w-48 h-32 rounded-lg overflow-hidden">
                  <Image
                    src={application.projectImage}
                    alt={application.projectName}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              )}

              {/* Application Details */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/dashboard/projects/${application.projectId}`}
                      className="text-xl font-display text-[#f5efdb] hover:opacity-80 transition-opacity"
                    >
                      {application.projectName}
                    </Link>
                    <div className="mt-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                        application.status === 'approved'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-[#f5efdb66] text-sm">
                    Submitted {new Date(application.submittedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <h3 className="text-[#f5efdb99] text-sm mb-1">About</h3>
                    <p className="text-[#f5efdb]">{application.about}</p>
                  </div>
                  <div>
                    <h3 className="text-[#f5efdb99] text-sm mb-1">Collaboration Proposal</h3>
                    <p className="text-[#f5efdb]">{application.collaboration}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 